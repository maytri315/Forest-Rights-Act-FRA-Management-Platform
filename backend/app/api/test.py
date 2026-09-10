from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import tempfile
import os
import logging

from app.services.ocr_service_simple import ocr_service
from app.services.ner_service_simple import ner_service
from app.services.gemini_service import gemini_service

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/test-ocr")
async def test_ocr(file: UploadFile = File(...)):
    """
    Test OCR functionality with an uploaded file
    """
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Please upload an image file")
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Test OCR
        ocr_result = ocr_service.extract_text(file_content)
        
        # Test NER on the extracted text
        ner_result = {}
        if ocr_result.get("processing_successful") and ocr_result.get("text"):
            ner_result = ner_service.extract_structured_data(ocr_result["text"])
        
        return JSONResponse({
            "success": True,
            "ocr_result": ocr_result,
            "ner_result": ner_result,
            "file_info": {
                "filename": file.filename,
                "content_type": file.content_type,
                "size": len(file_content)
            }
        })
        
    except Exception as e:
        logger.error(f"Error in test OCR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")

@router.get("/test-status")
async def test_status():
    """
    Test if OCR and NER services are available
    """
    return JSONResponse({
        "ocr_available": hasattr(ocr_service, 'extract_text'),
        "ner_available": hasattr(ner_service, 'extract_structured_data'),
        "gemini_available": gemini_service.available,
        "tesseract_available": True,  # Will be tested when OCR is called
    })

@router.post("/structure-with-gemini")
async def structure_with_gemini(file: UploadFile = File(...)):
    """
    Extract text with OCR and structure it using Gemini AI
    """
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Please upload an image file")
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Extract raw text with OCR
        ocr_result = ocr_service.extract_text(file_content)
        
        if not ocr_result.get("processing_successful"):
            raise HTTPException(status_code=400, detail="OCR processing failed")
        
        raw_text = ocr_result.get("text", "")
        
        # Structure with Gemini
        gemini_result = gemini_service.structure_fra_data(raw_text)
        
        return JSONResponse({
            "success": True,
            "raw_ocr_text": raw_text,
            "ocr_confidence": ocr_result.get("confidence", 0),
            "structured_data": gemini_result,
            "file_info": {
                "filename": file.filename,
                "content_type": file.content_type,
                "size": len(file_content)
            }
        })
        
    except Exception as e:
        logger.error(f"Error in Gemini structuring: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")
