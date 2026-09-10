from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import List
import uuid
import os
import aiofiles
from datetime import datetime
import json

from app.models.schemas import ProcessedFile, ProcessingStatus, ExtractedData
from app.services.ocr_service_simple import ocr_service
from app.services.ner_service_simple import ner_service
from app.services.gemini_service import gemini_service

router = APIRouter()

# In-memory storage for demo (replace with database in production)
processed_files = {}

UPLOAD_DIR = "uploads"
ALLOWED_TYPES = ["image/jpeg", "image/png", "image/tiff", "application/pdf"]
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

@router.post("/upload", response_model=List[ProcessedFile])
async def upload_files(files: List[UploadFile] = File(...)):
    """
    Upload multiple files and create processing records
    """
    uploaded_files = []
    
    for file in files:
        # Validate file type
        if file.content_type not in ALLOWED_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"File type {file.content_type} not allowed. Allowed types: {ALLOWED_TYPES}"
            )
        
        # Read file content to check size
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File {file.filename} too large. Maximum size: {MAX_FILE_SIZE/1024/1024}MB"
            )
        
        # Reset file pointer
        await file.seek(0)
        
        # Generate unique ID and filename
        file_id = str(uuid.uuid4())
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{file_id}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        # Create processing record
        processed_file = ProcessedFile(
            id=file_id,
            filename=file.filename,
            size=len(content),
            type=file.content_type,
            status=ProcessingStatus.PENDING,
            uploaded_at=datetime.now().isoformat()
        )
        
        processed_files[file_id] = processed_file
        uploaded_files.append(processed_file)
    
    return uploaded_files

@router.get("/", response_model=List[ProcessedFile])
async def get_files():
    """
    Get all uploaded files
    """
    return list(processed_files.values())

@router.get("/{file_id}", response_model=ProcessedFile)
async def get_file(file_id: str):
    """
    Get specific file by ID
    """
    if file_id not in processed_files:
        raise HTTPException(status_code=404, detail="File not found")
    
    return processed_files[file_id]

@router.delete("/{file_id}")
async def delete_file(file_id: str):
    """
    Delete a file and its processing record
    """
    if file_id not in processed_files:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Remove file from disk
    file_record = processed_files[file_id]
    file_extension = os.path.splitext(file_record.filename)[1]
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}{file_extension}")
    
    if os.path.exists(file_path):
        os.remove(file_path)
    
    # Remove from memory
    del processed_files[file_id]
    
    return {"message": "File deleted successfully"}

@router.get("/{file_id}/download")
async def download_file(file_id: str):
    """
    Download original file
    """
    if file_id not in processed_files:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_record = processed_files[file_id]
    file_extension = os.path.splitext(file_record.filename)[1]
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}{file_extension}")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    return JSONResponse({
        "download_url": f"/uploads/{file_id}{file_extension}",
        "filename": file_record.filename
    })

@router.get("/{file_id}/raw-text")
async def get_file_raw_text(file_id: str):
    if file_id not in processed_files:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_record = processed_files[file_id]
    
    if not file_record.raw_ocr_text:
        raise HTTPException(status_code=404, detail="Raw OCR text not available")
    
    return JSONResponse({
        "file_id": file_id,
        "filename": file_record.filename,
        "raw_ocr_text": file_record.raw_ocr_text,
        "ocr_confidence": file_record.ocr_confidence
    })

@router.post("/{file_id}/structure-with-gemini")
async def structure_file_with_gemini(file_id: str):
    if file_id not in processed_files:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_record = processed_files[file_id]
    
    if not file_record.raw_ocr_text:
        raise HTTPException(status_code=400, detail="No raw OCR text available for structuring")
    
    try:
        from ..services.gemini_service import GeminiService
        gemini_service = GeminiService()
        
        structured_data = gemini_service.structure_fra_data(file_record.raw_ocr_text)
        
        return JSONResponse({
            "file_id": file_id,
            "filename": file_record.filename,
            "structured_data": structured_data,
            "raw_ocr_text": file_record.raw_ocr_text
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error structuring data with Gemini: {str(e)}")
