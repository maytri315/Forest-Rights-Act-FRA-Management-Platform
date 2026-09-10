import pytesseract
from PIL import Image
import io
from typing import Dict, Any
import logging
import fitz  # PyMuPDF

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OCRService:
    def __init__(self):
        """Initialize OCR service with Tesseract configuration"""
        # Configure Tesseract for better accuracy with government documents
        self.tesseract_config = r'--oem 3 --psm 6'
        
    def extract_text(self, file_bytes: bytes, file_type: str = None) -> Dict[str, Any]:
        """
        Extract text from image or PDF using OCR
        """
        try:
            # Try to detect if it's a PDF first
            if file_bytes.startswith(b'%PDF') or (file_type and 'pdf' in file_type.lower()):
                return self._extract_from_pdf(file_bytes)
            else:
                return self._extract_from_image(file_bytes)
                
        except Exception as e:
            logger.error(f"Error extracting text: {str(e)}")
            return {
                "text": "",
                "confidence": 0,
                "word_count": 0,
                "processing_successful": False,
                "error": str(e)
            }
    
    def _extract_from_image(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Extract text from image using OCR
        """
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Extract text using Tesseract
        extracted_text = pytesseract.image_to_string(
            image, config=self.tesseract_config
        )
        
        # Get confidence scores
        confidence_data = pytesseract.image_to_data(
            image, config=self.tesseract_config, output_type=pytesseract.Output.DICT
        )
        
        # Calculate average confidence (excluding -1 values)
        confidences = [int(conf) for conf in confidence_data['conf'] if int(conf) > 0]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0
        
        # Clean up extracted text
        cleaned_text = self._clean_text(extracted_text)
        
        return {
            "text": cleaned_text,
            "confidence": round(avg_confidence, 2),
            "word_count": len(cleaned_text.split()),
            "processing_successful": True
        }
    
    def _extract_from_pdf(self, pdf_bytes: bytes) -> Dict[str, Any]:
        """
        Extract text from PDF using OCR
        """
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        all_text = ""
        total_confidence = 0
        page_count = 0
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            
            # First try to extract text directly (for text-based PDFs)
            page_text = page.get_text()
            
            if page_text.strip():
                # If text is found, use it directly
                all_text += page_text + "\n"
                total_confidence += 95  # High confidence for direct text extraction
            else:
                # If no text found, convert page to image and OCR it
                pix = page.get_pixmap()
                img_bytes = pix.tobytes("png")
                
                # OCR the image
                ocr_result = self._extract_from_image(img_bytes)
                if ocr_result["processing_successful"]:
                    all_text += ocr_result["text"] + "\n"
                    total_confidence += ocr_result["confidence"]
            
            page_count += 1
        
        doc.close()
        
        avg_confidence = total_confidence / page_count if page_count > 0 else 0
        cleaned_text = self._clean_text(all_text)
        
        return {
            "text": cleaned_text,
            "confidence": round(avg_confidence, 2),
            "word_count": len(cleaned_text.split()),
            "processing_successful": True,
            "pages_processed": page_count
        }
    
    def _clean_text(self, text: str) -> str:
        """
        Clean and normalize extracted text
        """
        # Remove extra whitespace and normalize
        cleaned = ' '.join(text.split())
        
        # Remove common OCR artifacts
        artifacts = ['|', '_', '~', '`', '^']
        for artifact in artifacts:
            cleaned = cleaned.replace(artifact, '')
        
        return cleaned.strip()
    
    def extract_from_pdf_page(self, page_image: bytes) -> Dict[str, Any]:
        """
        Extract text from a PDF page converted to image
        """
        return self.extract_text(page_image)

# Global OCR service instance
ocr_service = OCRService()
