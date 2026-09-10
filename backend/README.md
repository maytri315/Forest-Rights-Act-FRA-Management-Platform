# FRA Atlas AI Backend

AI-powered backend for Forest Rights Act document processing using OCR and Named Entity Recognition.

## Features

- **Document Upload**: Support for PDF, JPEG, PNG, and TIFF files
- **OCR Processing**: Extract text from scanned FRA documents using Tesseract
- **Named Entity Recognition**: Identify village names, patta holders, coordinates, and claim status
- **RESTful API**: FastAPI-based endpoints for file upload and processing
- **Real-time Processing**: Background task processing with status tracking

## Tech Stack

- **FastAPI**: High-performance Python web framework
- **Tesseract OCR**: Open-source OCR engine
- **spaCy**: Industrial-strength NLP library
- **Transformers**: State-of-the-art NER models
- **OpenCV**: Computer vision for image preprocessing
- **SQLAlchemy**: Database ORM (planned)
- **PostgreSQL + PostGIS**: Spatial database (planned)

## Prerequisites

- Python 3.8 or higher
- Tesseract OCR installed and in PATH
- 4GB+ RAM (for NLP models)

## Quick Setup

### 1. Run Setup Script

```bash
cd backend
python setup.py
```

### 2. Manual Setup (Alternative)

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install spaCy English model
python -m spacy download en_core_web_sm
```

### 3. Install Tesseract OCR

**Windows:**
- Download from: https://github.com/UB-Mannheim/tesseract/wiki
- Add to system PATH

**macOS:**
```bash
brew install tesseract
```

**Ubuntu/Debian:**
```bash
sudo apt-get install tesseract-ocr
```

## Running the Server

```bash
# Activate virtual environment (if not already active)
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Start the FastAPI server
python main.py
```

The server will start at `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### File Management
- `POST /api/files/upload` - Upload files for processing
- `GET /api/files/` - Get all uploaded files
- `GET /api/files/{file_id}` - Get specific file
- `DELETE /api/files/{file_id}` - Delete file

### Processing
- `POST /api/processing/start` - Start AI processing
- `GET /api/processing/status/{processing_id}` - Get processing status
- `GET /api/processing/jobs` - Get all processing jobs
- `POST /api/processing/reprocess/{file_id}` - Reprocess a file

## Project Structure

```
backend/
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── setup.py               # Setup script
├── uploads/               # Uploaded files directory
└── app/
    ├── __init__.py
    ├── api/
    │   ├── __init__.py
    │   ├── files.py       # File management endpoints
    │   └── processing.py  # Processing endpoints
    ├── models/
    │   ├── __init__.py
    │   └── schemas.py     # Pydantic models
    └── services/
        ├── __init__.py
        ├── ocr_service.py # OCR text extraction
        └── ner_service.py # Named entity recognition
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
# Database (when implemented)
DATABASE_URL=postgresql://user:password@localhost/fra_atlas

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=uploads

# OCR Configuration
TESSERACT_CONFIG=--oem 3 --psm 6
```

## Development

### Testing the API

```bash
# Upload a file
curl -X POST "http://localhost:8000/api/files/upload" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "files=@your_document.pdf"

# Start processing
curl -X POST "http://localhost:8000/api/processing/start" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"file_ids": ["your-file-id"], "processing_type": "full"}'
```

### Adding New Features

1. **New API Endpoints**: Add to `app/api/`
2. **New Services**: Add to `app/services/`
3. **New Models**: Add to `app/models/schemas.py`
4. **Database Models**: Add to `app/models/database.py` (when implemented)

## FRA-Specific Entity Types

The NER service extracts:
- **Village Names**: Villages, grams, gaons, puras
- **Patta Holders**: Individual and community names
- **Coordinates**: GPS coordinates, lat/long
- **Land Areas**: Hectares, acres, square meters
- **Claim Status**: Approved, rejected, pending, under review
- **Document Types**: Patta, CFR, IFR, settlement records

## Performance Optimization

- **Batch Processing**: Process multiple files simultaneously
- **Image Preprocessing**: Enhance OCR accuracy
- **Model Caching**: Keep NLP models in memory
- **Async Processing**: Non-blocking file processing

## Troubleshooting

### Common Issues

1. **Tesseract not found**:
   - Ensure Tesseract is installed and in PATH
   - Windows: Add `C:\Program Files\Tesseract-OCR` to PATH

2. **spaCy model not found**:
   ```bash
   python -m spacy download en_core_web_sm
   ```

3. **Memory issues**:
   - Reduce batch size
   - Use smaller NLP models
   - Increase system RAM

4. **CORS errors**:
   - Check frontend URL in CORS middleware
   - Ensure ports match frontend configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Follow PEP 8 style guidelines
5. Submit a pull request

## License

This project is part of the FRA Atlas system for government use in monitoring Forest Rights Act implementation.
