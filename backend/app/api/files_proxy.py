from fastapi import APIRouter, UploadFile, File, HTTPException, Query
import httpx
from typing import List
import io

router = APIRouter()

# Constants
DIGITIZATION_BACKEND_URL = "http://localhost:8001"
BACKEND_ERROR_MSG = "Digitization backend error"
BACKEND_TIMEOUT_MSG = "Digitization backend timeout"

async def handle_digitization_request(url: str, method: str = "GET", files=None, params=None, data=None, timeout: float = 60.0):
    """Generic handler for digitization backend requests"""
    try:
        async with httpx.AsyncClient() as client:
            if method == "POST":
                if files:
                    response = await client.post(url, files=files, timeout=timeout)
                elif data:
                    response = await client.post(url, json=data, timeout=timeout)
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
        raise HTTPException(status_code=500, detail=f"Digitization backend error: {str(e)}")

@router.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    """Proxy file upload to digitization backend"""
    file_data = []
    
    for file in files:
        contents = await file.read()
        file_data.append(("files", (file.filename, io.BytesIO(contents), file.content_type)))
    
    return await handle_digitization_request(
        f"{DIGITIZATION_BACKEND_URL}/api/files/upload",
        method="POST",
        files=file_data,
        timeout=60.0
    )

@router.get("/")
async def get_files():
    """Proxy get files request to digitization backend"""
    return await handle_digitization_request(
        f"{DIGITIZATION_BACKEND_URL}/api/files/",
        timeout=10.0
    )

@router.get("/{file_id}")
async def get_file(file_id: str):
    """Proxy get single file request to digitization backend"""
    return await handle_digitization_request(
        f"{DIGITIZATION_BACKEND_URL}/api/files/{file_id}",
        timeout=10.0
    )

@router.get("/{file_id}/raw-text")
async def get_file_raw_text(file_id: str):
    """Proxy get file raw text request to digitization backend"""
    return await handle_digitization_request(
        f"{DIGITIZATION_BACKEND_URL}/api/files/{file_id}/raw-text",
        timeout=10.0
    )

@router.post("/{file_id}/process")
async def process_file(file_id: str):
    """Proxy file processing request to digitization backend"""
    return await handle_digitization_request(
        f"{DIGITIZATION_BACKEND_URL}/api/files/{file_id}/process",
        method="POST",
        timeout=120.0
    )

@router.post("/{file_id}/structure-with-gemini")
async def structure_with_gemini(file_id: str):
    """Proxy Gemini structure request to digitization backend"""
    return await handle_digitization_request(
        f"{DIGITIZATION_BACKEND_URL}/api/files/{file_id}/structure-with-gemini",
        method="POST",
        timeout=120.0
    )

@router.get("/status")
async def files_status():
    """Check digitization backend status"""
    try:
        result = await handle_digitization_request(f"{DIGITIZATION_BACKEND_URL}/", timeout=5.0)
        return {
            "status": "healthy",
            "backend_response": result,
            "message": "Digitization backend is running"
        }
    except HTTPException as e:
        return {
            "status": "degraded" if e.status_code != 504 else "unavailable",
            "message": f"Digitization backend issue: {e.detail}"
        }
    except Exception as e:
        return {
            "status": "unavailable",
            "message": f"Digitization backend not reachable: {str(e)}"
        }