from pydantic import BaseModel
from typing import List, Optional
from enum import Enum

class ProcessingStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class ExtractedData(BaseModel):
    village_name: Optional[str] = None
    patta_holder: Optional[str] = None
    claim_status: Optional[str] = None
    coordinates: Optional[str] = None
    land_area: Optional[str] = None
    document_type: Optional[str] = None
    raw_ocr_text: Optional[str] = None
    ocr_confidence: Optional[float] = None

class FileUpload(BaseModel):
    filename: str
    size: int
    type: str

class ProcessedFile(BaseModel):
    id: str
    filename: str
    size: int
    type: str
    status: ProcessingStatus
    uploaded_at: str
    processed_at: Optional[str] = None
    extracted_data: Optional[ExtractedData] = None
    confidence_score: Optional[float] = None
    ocr_text: Optional[str] = None
    raw_ocr_text: Optional[str] = None
    ocr_confidence: Optional[float] = None

class ProcessingRequest(BaseModel):
    file_ids: List[str]
    processing_type: str = "full"  # "ocr_only", "ner_only", "full"

class ProcessingResponse(BaseModel):
    message: str
    processing_id: str
    files_count: int
    estimated_time: int  # in seconds
