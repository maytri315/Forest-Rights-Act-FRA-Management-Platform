import google.generativeai as genai
import os
from typing import Dict, Any
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        """Initialize Gemini AI service"""
        try:
            # Configure Gemini API with provided API key
            api_key = os.getenv('GEMINI_API_KEY', 'AIzaSyC-B6bmF23ye6nqImQVQAHTXEOhLeWu0-M')
            genai.configure(api_key=api_key)
            
            # Initialize the model
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            self.available = True
            
        except Exception as e:
            logger.error(f"Error initializing Gemini service: {str(e)}")
            self.available = False
            self.model = None
    
    def structure_fra_data(self, raw_ocr_text: str) -> Dict[str, Any]:
        """
        Use Gemini AI to structure raw OCR text into FRA-specific data
        """
        if not self.available or not self.model:
            return {"error": "Gemini service not available"}
        
        try:
            prompt = f"""
            You are an expert at analyzing Forest Rights Act (FRA) documents from India. 
            Please analyze the following OCR-extracted text and structure it into JSON format.
            
            IMPORTANT: Respond with ONLY valid JSON, no additional text or explanation.
            
            Extract the following information if available:
            - village_name: Name of the village/gram
            - patta_holder: Name of the person holding the patta/title
            - claim_status: Status of the claim (approved/pending/rejected/etc.)
            - coordinates: Any latitude/longitude or GPS coordinates
            - land_area: Area of land in hectares/acres
            - document_type: Type of FRA document (title certificate, claim form, etc.)
            - survey_number: Survey/plot number if mentioned
            - district: District name
            - state: State name
            - issue_date: Date of issue/approval
            - authority: Issuing authority
            - remarks: Any additional important information
            
            Raw OCR Text:
            {raw_ocr_text}
            
            Respond with valid JSON only:
            {{
                "village_name": null,
                "patta_holder": null,
                "claim_status": null,
                "coordinates": null,
                "land_area": null,
                "document_type": null,
                "survey_number": null,
                "district": null,
                "state": null,
                "issue_date": null,
                "authority": null,
                "remarks": null,
                "confidence": 0.85,
                "processing_method": "gemini_ai"
            }}
            
            Replace null values with extracted information or keep as null if not found.
            """
            
            # Generate response
            response = self.model.generate_content(prompt)
            
            # Parse JSON response with improved error handling
            try:
                response_text = response.text.strip()
                logger.info(f"Gemini raw response: {response_text[:200]}...")
                
                # Remove markdown formatting if present
                if response_text.startswith("```json"):
                    response_text = response_text[7:]
                if response_text.startswith("```"):
                    response_text = response_text[3:]
                if response_text.endswith("```"):
                    response_text = response_text[:-3]
                
                # Try to find JSON within the response
                import re
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    json_str = json_match.group()
                    structured_data = json.loads(json_str)
                else:
                    # Try parsing the whole cleaned response
                    structured_data = json.loads(response_text.strip())
                
                structured_data["raw_text"] = raw_ocr_text
                structured_data["processing_successful"] = True
                return structured_data
                
            except (json.JSONDecodeError, AttributeError) as e:
                # If Gemini doesn't return valid JSON, provide fallback
                logger.warning(f"Gemini JSON parsing failed: {str(e)}")
                logger.warning(f"Raw response: {response.text}")
                return {
                    "village_name": "Could not extract",
                    "patta_holder": "Could not extract",
                    "claim_status": "Could not extract",
                    "coordinates": "Could not extract",
                    "land_area": "Could not extract",
                    "document_type": "Could not extract",
                    "survey_number": "Could not extract",
                    "district": "Could not extract",
                    "state": "Could not extract",
                    "issue_date": "Could not extract",
                    "authority": "Could not extract",
                    "remarks": "Could not parse Gemini response as JSON",
                    "confidence": 0.0,
                    "processing_method": "gemini_ai_failed",
                    "error": "Could not parse Gemini response as JSON",
                    "raw_response": response.text,
                    "raw_text": raw_ocr_text,
                    "processing_successful": False
                }
                
        except Exception as e:
            logger.error(f"Error in Gemini structuring: {str(e)}")
            return {
                "error": str(e),
                "raw_text": raw_ocr_text,
                "processing_successful": False
            }

# Create singleton instance
gemini_service = GeminiService()
