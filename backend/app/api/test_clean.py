from fastapi import APIRouter
from fastapi.responses import JSONResponse
from datetime import datetime

from app.models.schemas import ProcessedFile, ProcessingStatus, ExtractedData
from app.api.files import processed_files

router = APIRouter()

@router.post("/create-sample-data")
async def create_sample_data():
    """
    Create sample data for testing raw text and Gemini functionality
    """
    # Sample OCR text
    sample_ocr_text = """Forest Rights Act Document
    
Village Name: Panchayat Raj
Patta Holder: Rajesh Kumar Singh
Claim Status: Approved
Land Area: 2.5 acres
Survey Number: 123/1
District: Bhopal
State: Madhya Pradesh
Issue Date: 15/08/2024
Authority: Forest Department, Udaipur

GPS Coordinates: 24.5854° N, 73.7125° E

This document certifies that the above mentioned person
has been granted forest rights as per the Forest Rights Act 2006."""
    
    # Create sample file record
    file_id = "sample-test-file-123"
    
    extracted_data = ExtractedData(
        village_name="Panchayat Raj",
        patta_holder="Rajesh Kumar Singh", 
        claim_status="Approved",
        coordinates="24.5854° N, 73.7125° E",
        land_area="2.5 acres",
        document_type="Forest Rights Certificate"
    )
    
    file_record = ProcessedFile(
        id=file_id,
        filename="sample_fra_document.jpg",
        size=156789,
        type="image/jpeg",
        status=ProcessingStatus.COMPLETED,
        uploaded_at=datetime.now().isoformat(),
        processed_at=datetime.now().isoformat(),
        extracted_data=extracted_data,
        confidence_score=85.5,
        ocr_text=sample_ocr_text.strip(),
        raw_ocr_text=sample_ocr_text.strip(),
        ocr_confidence=85.5
    )
    
    # Store in memory
    processed_files[file_id] = file_record
    
    return JSONResponse({
        "success": True,
        "message": "Sample data created successfully",
        "file_id": file_id,
        "sample_data": {
            "filename": file_record.filename,
            "status": file_record.status,
            "raw_text_length": len(sample_ocr_text.strip())
        }
    })
