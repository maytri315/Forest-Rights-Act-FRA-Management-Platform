from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import List, Dict, Any
import asyncio
import os
from datetime import datetime

from app.models.schemas import ProcessingRequest, ProcessingResponse, ProcessedFile, ProcessingStatus, ExtractedData
from app.services.ocr_service_simple import ocr_service
from app.services.ner_service_simple import ner_service
from app.api.files import processed_files

router = APIRouter()

# In-memory storage for processing jobs
processing_jobs = {}

@router.post("/start", response_model=ProcessingResponse)
async def start_processing(request: ProcessingRequest, background_tasks: BackgroundTasks):
    """
    Start AI processing for uploaded files
    """
    # Validate file IDs
    valid_files = []
    for file_id in request.file_ids:
        if file_id not in processed_files:
            raise HTTPException(status_code=404, detail=f"File {file_id} not found")
        
        file_record = processed_files[file_id]
        if file_record.status != ProcessingStatus.PENDING:
            raise HTTPException(
                status_code=400, 
                detail=f"File {file_id} is not in pending status"
            )
        
        valid_files.append(file_record)
    
    # Generate processing job ID
    processing_id = f"proc_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{len(valid_files)}"
    
    # Update file statuses
    for file_record in valid_files:
        file_record.status = ProcessingStatus.PROCESSING
        processed_files[file_record.id] = file_record
    
    # Start background processing
    background_tasks.add_task(
        process_files_background, 
        processing_id, 
        request.file_ids, 
        request.processing_type
    )
    
    # Store processing job
    processing_jobs[processing_id] = {
        "id": processing_id,
        "file_ids": request.file_ids,
        "processing_type": request.processing_type,
        "status": "processing",
        "started_at": datetime.now().isoformat(),
        "files_count": len(valid_files)
    }
    
    return ProcessingResponse(
        message="Processing started successfully",
        processing_id=processing_id,
        files_count=len(valid_files),
        estimated_time=len(valid_files) * 30  # 30 seconds per file estimate
    )

@router.get("/status/{processing_id}")
async def get_processing_status(processing_id: str):
    """
    Get processing job status
    """
    if processing_id not in processing_jobs:
        raise HTTPException(status_code=404, detail="Processing job not found")
    
    job = processing_jobs[processing_id]
    
    # Get current status of files in this job
    file_statuses = {}
    completed_count = 0
    failed_count = 0
    
    for file_id in job["file_ids"]:
        if file_id in processed_files:
            file_record = processed_files[file_id]
            file_statuses[file_id] = {
                "filename": file_record.filename,
                "status": file_record.status,
                "processed_at": file_record.processed_at
            }
            
            if file_record.status == ProcessingStatus.COMPLETED:
                completed_count += 1
            elif file_record.status == ProcessingStatus.FAILED:
                failed_count += 1
    
    # Update job status based on file statuses
    if completed_count + failed_count == len(job["file_ids"]):
        job["status"] = "completed"
        job["completed_at"] = datetime.now().isoformat()
    
    return {
        "processing_id": processing_id,
        "status": job["status"],
        "started_at": job["started_at"],
        "completed_at": job.get("completed_at"),
        "files_count": job["files_count"],
        "completed_count": completed_count,
        "failed_count": failed_count,
        "file_statuses": file_statuses
    }

@router.get("/jobs")
async def get_processing_jobs():
    """
    Get all processing jobs
    """
    return list(processing_jobs.values())

@router.post("/reprocess/{file_id}")
async def reprocess_file(file_id: str, background_tasks: BackgroundTasks):
    """
    Reprocess a single file
    """
    if file_id not in processed_files:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_record = processed_files[file_id]
    file_record.status = ProcessingStatus.PROCESSING
    file_record.extracted_data = None
    file_record.confidence_score = None
    file_record.ocr_text = None
    processed_files[file_id] = file_record
    
    # Start background processing for single file
    background_tasks.add_task(process_single_file, file_id)
    
    return {"message": "Reprocessing started", "file_id": file_id}

async def process_files_background(processing_id: str, file_ids: List[str], processing_type: str):
    """
    Background task to process files
    """
    for file_id in file_ids:
        try:
            await process_single_file(file_id, processing_type)
        except Exception as e:
            # Mark file as failed
            if file_id in processed_files:
                file_record = processed_files[file_id]
                file_record.status = ProcessingStatus.FAILED
                processed_files[file_id] = file_record
            print(f"Error processing file {file_id}: {str(e)}")

async def process_single_file(file_id: str, processing_type: str = "full"):
    """
    Process a single file with OCR and NER
    """
    if file_id not in processed_files:
        return
    
    file_record = processed_files[file_id]
    
    try:
        # Get file path
        file_extension = os.path.splitext(file_record.filename)[1]
        file_path = os.path.join("uploads", f"{file_id}{file_extension}")
        
        if not os.path.exists(file_path):
            raise Exception("File not found on disk")
        
        # Read file
        with open(file_path, 'rb') as f:
            file_content = f.read()
        
        extracted_data = ExtractedData()
        ocr_text = ""
        confidence_score = 0
        
        # OCR Processing
        if processing_type in ["ocr_only", "full"]:
            ocr_result = ocr_service.extract_text(file_content, file_record.type)
            
            if ocr_result.get("processing_successful"):
                ocr_text = ocr_result["text"]
                confidence_score = ocr_result["confidence"]
        
        # NER Processing
        if processing_type in ["ner_only", "full"] and ocr_text:
            structured_data = ner_service.extract_structured_data(ocr_text)
            
            extracted_data = ExtractedData(
                village_name=structured_data.get("village_name"),
                patta_holder=structured_data.get("patta_holder"),
                claim_status=structured_data.get("claim_status"),
                coordinates=structured_data.get("coordinates"),
                land_area=structured_data.get("land_area"),
                document_type=structured_data.get("document_type")
            )
        
        # Update file record
        file_record.status = ProcessingStatus.COMPLETED
        file_record.processed_at = datetime.now().isoformat()
        file_record.extracted_data = extracted_data
        file_record.confidence_score = confidence_score
        file_record.ocr_text = ocr_text
        file_record.raw_ocr_text = ocr_text  # Store raw OCR text for Gemini processing
        file_record.ocr_confidence = confidence_score
        processed_files[file_id] = file_record
        
        # Simulate processing time
        await asyncio.sleep(2)
        
    except Exception as e:
        # Mark as failed
        file_record.status = ProcessingStatus.FAILED
        processed_files[file_id] = file_record
        print(f"Error processing file {file_id}: {str(e)}")
