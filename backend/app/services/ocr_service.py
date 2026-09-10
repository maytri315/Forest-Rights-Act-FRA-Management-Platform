import pytesseract
import cv2
import numpy as np
from PIL import Image
import io
from typing import Dict, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OCRService:
    def __init__(self):
        """Initialize OCR service with Tesseract configuration"""
        # Configure Tesseract for better accuracy with government documents
        self.tesseract_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,()-/:@#&*+='
        
    def preprocess_image(self, image_bytes: bytes) -> np.ndarray:
        """
        Preprocess image for better OCR accuracy
        """
        try:
            # Convert bytes to PIL Image
            image = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Convert to OpenCV format
            opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            
            # Convert to grayscale
            gray = cv2.cvtColor(opencv_image, cv2.COLOR_BGR2GRAY)
            
            # Apply denoising
            denoised = cv2.fastNlMeansDenoising(gray)
            
            # Apply adaptive thresholding
            thresh = cv2.adaptiveThreshold(
                denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
            )
            
            # Morphological operations to clean up
            kernel = np.ones((1, 1), np.uint8)
            cleaned = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
            
            return cleaned
            
        except Exception as e:
            logger.error(f"Error preprocessing image: {str(e)}")
            raise
    
    def extract_text(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Extract text from image using OCR
        """
        try:
            # Preprocess the image
            processed_image = self.preprocess_image(image_bytes)
            
            # Extract text using Tesseract
            extracted_text = pytesseract.image_to_string(
                processed_image, config=self.tesseract_config
            )
            
            # Get confidence scores
            confidence_data = pytesseract.image_to_data(
                processed_image, config=self.tesseract_config, output_type=pytesseract.Output.DICT
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
            
        except Exception as e:
            logger.error(f"Error extracting text: {str(e)}")
            return {
                "text": "",
                "confidence": 0,
                "word_count": 0,
                "processing_successful": False,
                "error": str(e)
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
