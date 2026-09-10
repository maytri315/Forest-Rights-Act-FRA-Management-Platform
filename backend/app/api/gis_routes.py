"""
GIS and spatial data API endpoints for FRA WebGIS system
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime
import geojson

# from ..database import get_db
# from ..models.gis_models import State, District, Block, Village, FRAClaim, FRAProgress, VillageAsset

router = APIRouter(prefix="/gis", tags=["GIS"])

# Pydantic models for API responses
class StateInfo(BaseModel):
    id: str
    name: str
    code: str
    population: Optional[int]
    forest_area: Optional[float]

class DistrictInfo(BaseModel):
    id: str
    name: str
    code: str
    state_id: str
    population: Optional[int]
    tribal_population: Optional[int]
    forest_area: Optional[float]

class VillageInfo(BaseModel):
    id: str
    name: str
    code: str
    block_id: str
    population: Optional[int]
    tribal_population: Optional[int]
    fra_applicable: bool
    has_cfr: bool
    has_ifr: bool

class FRAProgressInfo(BaseModel):
    level: str
    total_villages: int
    eligible_villages: int
    villages_with_claims: int
    villages_with_approvals: int
    total_ifr_claims: int
    approved_ifr_claims: int
    total_cfr_claims: int
    approved_cfr_claims: int
    ifr_approval_rate: float
    cfr_approval_rate: float

class AssetInfo(BaseModel):
    id: str
    asset_type: str
    name: Optional[str]
    condition: Optional[str]
    detection_method: str
    confidence_score: Optional[float]
    verified: bool

class GISLayerResponse(BaseModel):
    type: str = "FeatureCollection"
    features: List[Dict[str, Any]]

# Administrative boundary endpoints
@router.get("/states", response_model=List[StateInfo])
async def get_states():
    """Get all states"""
    # Mock data - replace with actual database queries
    mock_states = [
        {"id": "1", "name": "Madhya Pradesh", "code": "MP", "population": 72597565, "forest_area": 77700},
        {"id": "2", "name": "Tripura", "code": "TR", "population": 3673032, "forest_area": 8073},
        {"id": "3", "name": "Odisha", "code": "OR", "population": 42010000, "forest_area": 51619},
        {"id": "4", "name": "Telangana", "code": "TG", "population": 35193978, "forest_area": 24295},
    ]
    return mock_states

@router.get("/states/{state_id}/districts", response_model=List[DistrictInfo])
async def get_districts_by_state(state_id: str):
    """Get districts in a state"""
    # Mock data based on state
    if state_id == "1":  # Madhya Pradesh
        return [
            {"id": "101", "name": "Balaghat", "code": "BLG", "state_id": "1", "population": 1701698, "tribal_population": 493456, "forest_area": 4135},
            {"id": "102", "name": "Dindori", "code": "DIN", "state_id": "1", "population": 704524, "tribal_population": 518786, "forest_area": 3947},
            {"id": "103", "name": "Mandla", "code": "MND", "state_id": "1", "population": 1054905, "tribal_population": 590366, "forest_area": 4316},
        ]
    return []

@router.get("/districts/{district_id}/villages", response_model=List[VillageInfo])
async def get_villages_by_district(
    district_id: str,
    fra_applicable: Optional[bool] = Query(None, description="Filter by FRA applicability"),
    has_claims: Optional[bool] = Query(None, description="Filter villages with FRA claims")
):
    """Get villages in a district with optional filters"""
    # Mock data
    mock_villages = [
        {"id": "1001", "name": "Ghughri", "code": "V001", "block_id": "B001", "population": 1250, "tribal_population": 980, "fra_applicable": True, "has_cfr": True, "has_ifr": True},
        {"id": "1002", "name": "Bamhni Banjar", "code": "V002", "block_id": "B001", "population": 870, "tribal_population": 650, "fra_applicable": True, "has_cfr": False, "has_ifr": True},
        {"id": "1003", "name": "Majhgawan", "code": "V003", "block_id": "B002", "population": 1450, "tribal_population": 1200, "fra_applicable": True, "has_cfr": True, "has_ifr": False},
    ]
    
    # Apply filters
    filtered_villages = mock_villages
    if fra_applicable is not None:
        filtered_villages = [v for v in filtered_villages if v["fra_applicable"] == fra_applicable]
    if has_claims is not None:
        filtered_villages = [v for v in filtered_villages if (v["has_cfr"] or v["has_ifr"]) == has_claims]
    
    return filtered_villages

# GeoJSON endpoints for map layers
@router.get("/layers/states", response_model=GISLayerResponse)
async def get_states_geojson():
    """Get states as GeoJSON for mapping"""
    # Mock GeoJSON - replace with actual spatial queries
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "id": "1",
                    "name": "Madhya Pradesh",
                    "code": "MP",
                    "population": 72597565,
                    "forest_area": 77700
                },
                "geometry": {
                    "type": "MultiPolygon",
                    "coordinates": [[[77.0, 22.0], [82.0, 22.0], [82.0, 26.0], [77.0, 26.0], [77.0, 22.0]]]
                }
            }
        ]
    }

@router.get("/layers/districts/{state_id}", response_model=GISLayerResponse)
async def get_districts_geojson(state_id: str):
    """Get districts as GeoJSON for a state"""
    # Mock GeoJSON for districts
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "id": "101",
                    "name": "Balaghat",
                    "state_id": state_id,
                    "tribal_population": 493456,
                    "fra_progress": 65.5
                },
                "geometry": {
                    "type": "MultiPolygon",
                    "coordinates": [[[80.0, 21.5], [81.0, 21.5], [81.0, 22.5], [80.0, 22.5], [80.0, 21.5]]]
                }
            }
        ]
    }

@router.get("/layers/villages/{district_id}", response_model=GISLayerResponse)
async def get_villages_geojson(
    district_id: str,
    layer_type: Optional[str] = Query("boundaries", description="Layer type: boundaries, ifr, cfr, assets")
):
    """Get villages as GeoJSON with different layer types"""
    
    if layer_type == "ifr":
        # IFR claims layer
        return {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "id": "IFR001",
                        "village_name": "Ghughri",
                        "claimant_name": "Ramesh Patel",
                        "area_hectares": 2.5,
                        "status": "Approved",
                        "claim_type": "IFR"
                    },
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[80.1, 21.6], [80.2, 21.6], [80.2, 21.7], [80.1, 21.7], [80.1, 21.6]]]
                    }
                }
            ]
        }
    
    elif layer_type == "cfr":
        # CFR claims layer
        return {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "id": "CFR001",
                        "village_name": "Majhgawan",
                        "area_hectares": 150.0,
                        "status": "Under Review",
                        "claim_type": "CFR",
                        "households_benefited": 45
                    },
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[80.3, 21.8], [80.5, 21.8], [80.5, 22.0], [80.3, 22.0], [80.3, 21.8]]]
                    }
                }
            ]
        }
    
    elif layer_type == "assets":
        # Village assets layer
        return {
            "type": "FeatureCollection", 
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "id": "ASSET001",
                        "asset_type": "School",
                        "name": "Government Primary School",
                        "village": "Ghughri",
                        "condition": "Good",
                        "detection_method": "AI Detection"
                    },
                    "geometry": {
                        "type": "Point",
                        "coordinates": [80.15, 21.65]
                    }
                }
            ]
        }
    
    else:
        # Village boundaries
        return {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "id": "1001",
                        "name": "Ghughri",
                        "population": 1250,
                        "tribal_population": 980,
                        "fra_applicable": True
                    },
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[80.1, 21.6], [80.2, 21.6], [80.2, 21.7], [80.1, 21.7], [80.1, 21.6]]]
                    }
                }
            ]
        }

# FRA Progress tracking endpoints
@router.get("/fra-progress/{level}", response_model=List[FRAProgressInfo])
async def get_fra_progress(
    level: str = Query(..., description="Administrative level: state, district, block, village"),
    state_id: Optional[str] = Query(None),
    district_id: Optional[str] = Query(None),
    block_id: Optional[str] = Query(None)
):
    """Get FRA implementation progress at different administrative levels"""
    
    if level == "state":
        # State-level progress
        return [
            {
                "level": "state",
                "total_villages": 15000,
                "eligible_villages": 8500,
                "villages_with_claims": 5200,
                "villages_with_approvals": 3100,
                "total_ifr_claims": 45000,
                "approved_ifr_claims": 28000,
                "total_cfr_claims": 1200,
                "approved_cfr_claims": 750,
                "ifr_approval_rate": 62.2,
                "cfr_approval_rate": 62.5
            }
        ]
    
    elif level == "district":
        # District-level progress
        return [
            {
                "level": "district",
                "total_villages": 1200,
                "eligible_villages": 850,
                "villages_with_claims": 520,
                "villages_with_approvals": 310,
                "total_ifr_claims": 4500,
                "approved_ifr_claims": 2800,
                "total_cfr_claims": 120,
                "approved_cfr_claims": 75,
                "ifr_approval_rate": 62.2,
                "cfr_approval_rate": 62.5
            }
        ]
    
    return []

@router.get("/assets/village/{village_id}", response_model=List[AssetInfo])
async def get_village_assets(
    village_id: str,
    asset_type: Optional[str] = Query(None, description="Filter by asset type")
):
    """Get assets detected in a village"""
    
    # Mock asset data
    assets = [
        {"id": "A001", "asset_type": "School", "name": "Government Primary School", "condition": "Good", "detection_method": "AI Detection", "confidence_score": 0.95, "verified": True},
        {"id": "A002", "asset_type": "Health Center", "name": "Primary Health Center", "condition": "Fair", "detection_method": "Manual Entry", "confidence_score": None, "verified": True},
        {"id": "A003", "asset_type": "Road", "name": "Village Access Road", "condition": "Poor", "detection_method": "AI Detection", "confidence_score": 0.87, "verified": False},
        {"id": "A004", "asset_type": "Water Tank", "name": "Community Water Tank", "condition": "Good", "detection_method": "Survey", "confidence_score": None, "verified": True},
    ]
    
    if asset_type:
        assets = [a for a in assets if a["asset_type"].lower() == asset_type.lower()]
    
    return assets

# Filtering and search endpoints
@router.get("/search/villages")
async def search_villages(
    q: str = Query(..., description="Search query"),
    state_id: Optional[str] = Query(None),
    tribal_group: Optional[str] = Query(None),
    fra_status: Optional[str] = Query(None, description="FRA status: with_claims, approved, pending")
):
    """Search villages with advanced filters"""
    
    # Mock search results
    results = [
        {
            "id": "1001",
            "name": "Ghughri",
            "state": "Madhya Pradesh",
            "district": "Balaghat", 
            "block": "Baihar",
            "tribal_groups": ["Gond", "Baiga"],
            "fra_status": "approved",
            "match_score": 0.95
        }
    ]
    
    return results

@router.get("/statistics/overview")
async def get_overview_statistics():
    """Get overall FRA implementation statistics"""
    
    return {
        "total_states_covered": 18,
        "total_districts": 450,
        "total_villages_eligible": 125000,
        "total_villages_with_claims": 78000,
        "total_ifr_claims_filed": 650000,
        "total_ifr_claims_approved": 420000,
        "total_cfr_claims_filed": 25000,
        "total_cfr_claims_approved": 15600,
        "total_area_under_ifr_hectares": 1250000,
        "total_area_under_cfr_hectares": 890000,
        "beneficiary_families": 385000,
        "last_updated": "2025-09-15T10:30:00Z"
    }

# Tribal groups endpoint
@router.get("/tribal-groups")
async def get_tribal_groups(state_id: Optional[str] = Query(None)):
    """Get tribal groups, optionally filtered by state"""
    
    tribal_groups = [
        {"id": "TG001", "name": "Gond", "classification": "ST", "states": ["MP", "CG", "MH", "AP"]},
        {"id": "TG002", "name": "Baiga", "classification": "PVTG", "states": ["MP", "CG"]},
        {"id": "TG003", "name": "Bhil", "classification": "ST", "states": ["MP", "RJ", "GJ", "MH"]},
        {"id": "TG004", "name": "Korku", "classification": "ST", "states": ["MP", "MH"]},
        {"id": "TG005", "name": "Sahariya", "classification": "PVTG", "states": ["MP", "RJ"]},
    ]
    
    if state_id:
        tribal_groups = [tg for tg in tribal_groups if state_id in tg["states"]]
    
    return tribal_groups