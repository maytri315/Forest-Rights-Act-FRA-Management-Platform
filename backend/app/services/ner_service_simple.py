import spacy
import re
from typing import Dict, List, Any, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NERService:
    def __init__(self):
        """Initialize NER service with spaCy and custom patterns"""
        try:
            # Load spaCy model (download with: python -m spacy download en_core_web_sm)
            self.nlp = spacy.load("en_core_web_sm")
            
            # Add custom patterns for FRA-specific entities
            self._add_custom_patterns()
            
        except Exception as e:
            logger.error(f"Error initializing NER service: {str(e)}")
            self.nlp = None
    
    def _add_custom_patterns(self):
        """Add custom patterns for FRA-specific entities"""
        # Patterns for Indian village names
        village_patterns = [
            [{"LOWER": {"REGEX": r"village|gram|gaon|pura|pur|nagar|town"}}, {"IS_ALPHA": True}],
            [{"IS_ALPHA": True}, {"LOWER": {"REGEX": r"village|gram|gaon|pura|pur"}}],
        ]
        
        # Patterns for coordinates
        coordinate_patterns = [
            [{"LIKE_NUM": True}, {"LOWER": "°"}, {"LIKE_NUM": True}, {"LOWER": "'"}, {"LIKE_NUM": True}, {"LOWER": '"'}],
            [{"SHAPE": "dd.dddd"}, {"LOWER": ","}, {"SHAPE": "dd.dddd"}],
        ]
        
        # Add patterns to entity ruler
        ruler = self.nlp.add_pipe("entity_ruler", before="ner")
        patterns = []
        
        for pattern in village_patterns:
            patterns.append({"label": "VILLAGE", "pattern": pattern})
        
        for pattern in coordinate_patterns:
            patterns.append({"label": "COORDINATES", "pattern": pattern})
        
        ruler.add_patterns(patterns)
    
    def extract_entities(self, text: str) -> Dict[str, Any]:
        """
        Extract FRA-specific entities from text
        """
        if not self.nlp:
            return {"error": "NER service not initialized"}
        
        try:
            # Process text with spaCy
            doc = self.nlp(text)
            
            # Extract entities
            entities = {
                "village_names": [],
                "person_names": [],
                "coordinates": [],
                "land_areas": [],
                "claim_status": [],
                "document_types": [],
                "dates": []
            }
            
            # Extract using spaCy
            for ent in doc.ents:
                if ent.label_ == "PERSON":
                    entities["person_names"].append({
                        "text": ent.text,
                        "confidence": 0.8,
                        "start": ent.start_char,
                        "end": ent.end_char
                    })
                elif ent.label_ == "GPE":  # Geopolitical entity
                    entities["village_names"].append({
                        "text": ent.text,
                        "confidence": 0.7,
                        "start": ent.start_char,
                        "end": ent.end_char
                    })
                elif ent.label_ == "VILLAGE":
                    entities["village_names"].append({
                        "text": ent.text,
                        "confidence": 0.9,
                        "start": ent.start_char,
                        "end": ent.end_char
                    })
                elif ent.label_ == "COORDINATES":
                    entities["coordinates"].append({
                        "text": ent.text,
                        "confidence": 0.9,
                        "start": ent.start_char,
                        "end": ent.end_char
                    })
                elif ent.label_ == "DATE":
                    entities["dates"].append({
                        "text": ent.text,
                        "confidence": 0.8,
                        "start": ent.start_char,
                        "end": ent.end_char
                    })
            
            # Extract using regex patterns
            regex_entities = self._extract_with_regex(text)
            
            # Merge regex results
            for key, values in regex_entities.items():
                if key in entities:
                    entities[key].extend(values)
            
            # Remove duplicates and sort by confidence
            for key in entities:
                entities[key] = self._deduplicate_entities(entities[key])
            
            return entities
            
        except Exception as e:
            logger.error(f"Error extracting entities: {str(e)}")
            return {"error": str(e)}
    
    def _extract_with_regex(self, text: str) -> Dict[str, List[Dict]]:
        """Extract entities using regex patterns"""
        entities = {
            "coordinates": [],
            "land_areas": [],
            "claim_status": [],
            "document_types": []
        }
        
        # Coordinate patterns
        coord_patterns = [
            r'(\d{1,3}\.?\d*)[°\s]+(\d{1,2}\.?\d*)[\'′\s]*(\d{1,2}\.?\d*)[\"″\s]*[NS]\s*,?\s*(\d{1,3}\.?\d*)[°\s]+(\d{1,2}\.?\d*)[\'′\s]*(\d{1,2}\.?\d*)[\"″\s]*[EW]',
            r'(\d{1,3}\.\d+),\s*(\d{1,3}\.\d+)',
            r'Lat[itude]*[:\s]*(\d{1,3}\.\d+).*?Lon[gitude]*[:\s]*(\d{1,3}\.\d+)'
        ]
        
        for pattern in coord_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                entities["coordinates"].append({
                    "text": match.group(0),
                    "confidence": 0.8,
                    "start": match.start(),
                    "end": match.end()
                })
        
        # Land area patterns
        area_patterns = [
            r'(\d+\.?\d*)\s*(hectare|acre|sq\.?\s*m|square\s*meter)s?',
            r'(\d+\.?\d*)\s*(ha|ac)\b'
        ]
        
        for pattern in area_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                entities["land_areas"].append({
                    "text": match.group(0),
                    "confidence": 0.9,
                    "start": match.start(),
                    "end": match.end()
                })
        
        # Claim status patterns
        status_patterns = [
            r'(approved|rejected|pending|under\s+review|verified|sanctioned)',
            r'(claim\s+status|status)[:\s]*(approved|rejected|pending|under\s+review)'
        ]
        
        for pattern in status_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                entities["claim_status"].append({
                    "text": match.group(0),
                    "confidence": 0.8,
                    "start": match.start(),
                    "end": match.end()
                })
        
        # Document type patterns
        doc_patterns = [
            r'(patta|title\s+deed|community\s+forest\s+resource|cfr|individual\s+forest\s+right|ifr)',
            r'(forest\s+right\s+claim|claim\s+form|settlement\s+record)'
        ]
        
        for pattern in doc_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                entities["document_types"].append({
                    "text": match.group(0),
                    "confidence": 0.9,
                    "start": match.start(),
                    "end": match.end()
                })
        
        return entities
    
    def _deduplicate_entities(self, entities: List[Dict]) -> List[Dict]:
        """Remove duplicate entities and sort by confidence"""
        seen = set()
        unique_entities = []
        
        for entity in entities:
            text_lower = entity['text'].lower().strip()
            if text_lower not in seen:
                seen.add(text_lower)
                unique_entities.append(entity)
        
        # Sort by confidence (highest first)
        return sorted(unique_entities, key=lambda x: x['confidence'], reverse=True)
    
    def extract_structured_data(self, text: str) -> Dict[str, Optional[str]]:
        """
        Extract structured data from text for database storage
        """
        entities = self.extract_entities(text)
        
        structured_data = {
            "village_name": self._get_best_entity(entities.get("village_names", [])),
            "patta_holder": self._get_best_entity(entities.get("person_names", [])),
            "claim_status": self._get_best_entity(entities.get("claim_status", [])),
            "coordinates": self._get_best_entity(entities.get("coordinates", [])),
            "land_area": self._get_best_entity(entities.get("land_areas", [])),
            "document_type": self._get_best_entity(entities.get("document_types", []))
        }
        
        return structured_data
    
    def _get_best_entity(self, entities: List[Dict]) -> Optional[str]:
        """Get the entity with highest confidence"""
        if not entities:
            return None
        return entities[0]['text'] if entities[0]['confidence'] > 0.5 else None

# Global NER service instance
ner_service = NERService()
