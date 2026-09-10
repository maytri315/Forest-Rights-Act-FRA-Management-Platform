from fastapi import APIRouter, HTTPException, BackgroundTasks
import httpx
from typing import List, Dict, Any
from app.models.schemas import ProcessingRequest, ProcessingResponse

router = APIRouter()

# Constants
DIGITIZATION_BACKEND_URL = "http://localhost:8001"
BACKEND_ERROR_MSG = "Digitization backend error"
BACKEND_TIMEOUT_MSG = "Digitization backend timeout"

async def handle_digitization_request(url: str, method: str = "GET", json_data=None, params=None, timeout: float = 60.0):
    """Generic handler for digitization backend requests"""
    try:
        async with httpx.AsyncClient() as client:
            if method == "POST":
                if json_data:
                    response = await client.post(url, json=json_data, timeout=timeout)
                else:
                    response = await client.post(url, timeout=timeout)
            else:
                response = await client.get(url, params=params, timeout=timeout)
            
            if response.status_code in [200, 201]:
                return response.json()
            else:
                raise HTTPException(status_code=response.status_code, detail=BACKEND_ERROR_MSG)
                
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail=BACKEND_TIMEOUT_MSG)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing backend error: {str(e)}")

@router.post("/start", response_model=ProcessingResponse)
async def start_processing(request: ProcessingRequest):
    """Proxy processing start request to digitization backend"""
    return await handle_digitization_request(
        f"{DIGITIZATION_BACKEND_URL}/api/processing/start",
        method="POST",
        json_data=request.dict(),
        timeout=120.0
    )

@router.get("/status/{processing_id}")
async def get_processing_status(processing_id: str):
    """Proxy processing status request to digitization backend"""
    return await handle_digitization_request(
        f"{DIGITIZATION_BACKEND_URL}/api/processing/status/{processing_id}",
        timeout=10.0
    )

@router.get("/jobs")
async def get_processing_jobs():
    """Proxy processing jobs request to digitization backend"""
    return await handle_digitization_request(
        f"{DIGITIZATION_BACKEND_URL}/api/processing/jobs",
        timeout=10.0
    )

@router.post("/reprocess/{file_id}")
async def reprocess_file(file_id: str):
    """Proxy file reprocessing request to digitization backend"""
    return await handle_digitization_request(
        f"{DIGITIZATION_BACKEND_URL}/api/processing/reprocess/{file_id}",
        method="POST",
        timeout=120.0
    )

@router.get("/status")
async def processing_status():
    """Check processing backend status"""
    try:
        result = await handle_digitization_request(f"{DIGITIZATION_BACKEND_URL}/", timeout=5.0)
        return {
            "status": "healthy",
            "backend_response": result,
            "message": "Processing backend is running"
        }
    except HTTPException as e:
        return {
            "status": "degraded" if e.status_code != 504 else "unavailable",
            "message": f"Processing backend issue: {e.detail}"
        }
    except Exception as e:
        return {
            "status": "unavailable",
            "message": f"Processing backend not reachable: {str(e)}"
        }