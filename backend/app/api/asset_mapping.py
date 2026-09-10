from fastapi import APIRouter, UploadFile, File, HTTPException, Query
import httpx
import io

router = APIRouter()

# Constants
BACKEND_ERROR_MSG = "Asset mapping backend error"
BACKEND_TIMEOUT_MSG = "Asset mapping backend timeout"
ASSET_MAPPING_BACKEND_URL = "http://localhost:8002"

async def handle_backend_request(url: str, method: str = "GET", files=None, params=None, timeout: float = 30.0):
    """Generic handler for asset mapping backend requests"""
    try:
        async with httpx.AsyncClient() as client:
            if method == "POST":
                response = await client.post(url, files=files, timeout=timeout)
            else:
                response = await client.get(url, params=params, timeout=timeout)
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(status_code=response.status_code, detail=BACKEND_ERROR_MSG)
                
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail=BACKEND_TIMEOUT_MSG)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Asset mapping error: {str(e)}")

@router.post("/upload-image/")
async def upload_image(file: UploadFile = File(...)):
    """Proxy asset mapping image upload to dedicated backend"""
    contents = await file.read()
    files = {"file": (file.filename, io.BytesIO(contents), file.content_type)}
    
    return await handle_backend_request(
        f"{ASSET_MAPPING_BACKEND_URL}/upload-image/",
        method="POST",
        files=files,
        timeout=30.0
    )

@router.get("/layers/")
async def get_available_layers():
    """Proxy layer information request"""
    return await handle_backend_request(f"{ASSET_MAPPING_BACKEND_URL}/layers/", timeout=10.0)

@router.get("/layers/{layer_type}")
async def get_layer_data(
    layer_type: str,
    bbox: str = Query(..., description="Bounding box as 'lng1,lat1,lng2,lat2'")
):
    """Proxy layer data request"""
    return await handle_backend_request(
        f"{ASSET_MAPPING_BACKEND_URL}/layers/{layer_type}",
        params={"bbox": bbox},
        timeout=10.0
    )

@router.get("/geospatial-context/")
async def get_geospatial_context(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude")
):
    """Proxy geospatial context request"""
    return await handle_backend_request(
        f"{ASSET_MAPPING_BACKEND_URL}/geospatial-context/",
        params={"lat": lat, "lng": lng},
        timeout=10.0
    )

@router.get("/status")
async def asset_mapping_status():
    """Check asset mapping backend status"""
    try:
        result = await handle_backend_request(f"{ASSET_MAPPING_BACKEND_URL}/", timeout=5.0)
        return {
            "status": "healthy",
            "backend_response": result,
            "message": "Asset mapping backend is running"
        }
    except HTTPException as e:
        return {
            "status": "degraded" if e.status_code != 504 else "unavailable",
            "message": f"Asset mapping backend issue: {e.detail}"
        }
    except Exception as e:
        return {
            "status": "unavailable",
            "message": f"Asset mapping backend not reachable: {str(e)}"
        }