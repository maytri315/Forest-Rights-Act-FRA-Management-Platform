from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.api import files, processing, test, dss_routes, asset_mapping

# Create FastAPI app
app = FastAPI(
    title="FRA Atlas AI Backend with DSS",
    description="AI-powered backend for Forest Rights Act document processing and Decision Support System",
    version="2.0.0"
)

# Add CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploaded documents
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include API routers
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(processing.router, prefix="/api/processing", tags=["processing"])
app.include_router(test.router, prefix="/api/test", tags=["testing"])
app.include_router(dss_routes.router, prefix="/api", tags=["Decision Support System"])
app.include_router(asset_mapping.router, prefix="/api/asset-mapping", tags=["Asset Mapping"])

@app.get("/")
async def root():
    return {
        "message": "FRA Atlas AI Backend",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "FRA Atlas AI Backend"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
