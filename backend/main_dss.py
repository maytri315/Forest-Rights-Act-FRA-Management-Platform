from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import dss_routes, asset_mapping, files_proxy, processing_proxy

# Create FastAPI app for DSS functionality only
app = FastAPI(
    title="FRA Atlas DSS Backend",
    description="Decision Support System for CSS scheme layering and policy formulation",
    version="2.0.0"
)

# Add CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include DSS routes
app.include_router(dss_routes.router, prefix="/api", tags=["DSS"])
app.include_router(asset_mapping.router, prefix="/api/asset-mapping", tags=["Asset Mapping"])
app.include_router(files_proxy.router, prefix="/api/files", tags=["File Processing"])
app.include_router(processing_proxy.router, prefix="/api/processing", tags=["Document Processing"])

# Health check endpoint
@app.get("/")
async def root():
    return {"message": "FRA Atlas DSS Backend is running", "version": "2.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "DSS Backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main_dss:app", host="0.0.0.0", port=8000, reload=True)