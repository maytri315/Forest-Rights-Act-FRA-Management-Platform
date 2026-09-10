"""
DSS (Decision Support System) API Routes for CSS Scheme Eligibility and Prioritization

This module exposes REST API endpoints for:
1. Individual FRA holder scheme eligibility assessment
2. Village-level intervention prioritization
3. Policy recommendations and analytics
4. Resource allocation insights
"""

from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field
import logging
from datetime import datetime

from ..services.dss_service import (
    dss_engine, 
    FRAHolder, 
    VillageProfile, 
    SchemeEligibility, 
    InterventionRecommendation,
    SchemeType,
    EligibilityStatus,
    InterventionPriority
)

logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(prefix="/dss", tags=["Decision Support System"])

# Request/Response models
class FRAHolderRequest(BaseModel):
    """Request model for FRA holder data"""
    holder_id: str
    name: str
    family_size: int = Field(gt=0, le=20)
    land_area_hectares: float = Field(ge=0.0, le=100.0)
    annual_income: Optional[float] = Field(ge=0.0, le=10000000.0, default=None)
    social_category: str = Field(pattern="^(ST|SC|OBC|General)$")
    has_bank_account: bool
    aadhaar_linked: bool
    village_code: str
    district: str
    state: str
    age: int = Field(ge=0, le=120)
    gender: str = Field(pattern="^(Male|Female|Other)$")
    education_level: str
    occupation: str
    has_electricity: bool
    has_toilet: bool
    water_source: str
    mobile_number: Optional[str] = None

class VillageProfileRequest(BaseModel):
    """Request model for village profile data"""
    village_code: str
    village_name: str
    block: str
    district: str
    state: str
    total_households: int = Field(gt=0)
    st_households: int = Field(ge=0)
    sc_households: int = Field(ge=0)
    total_population: int = Field(gt=0)
    st_population: int = Field(ge=0)
    water_index: float = Field(ge=0.0, le=100.0)
    electricity_index: float = Field(ge=0.0, le=100.0)
    road_connectivity_index: float = Field(ge=0.0, le=100.0)
    health_facility_index: float = Field(ge=0.0, le=100.0)
    education_index: float = Field(ge=0.0, le=100.0)
    livelihood_index: float = Field(ge=0.0, le=100.0)
    forest_cover_percent: float = Field(ge=0.0, le=100.0)
    agricultural_land_percent: float = Field(ge=0.0, le=100.0)
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class SchemeEligibilityResponse(BaseModel):
    """Response model for scheme eligibility"""
    scheme: str
    status: str
    confidence_score: float = Field(ge=0.0, le=1.0)
    eligible_amount: Optional[float] = None
    reasons: List[str]
    required_documents: List[str]
    timeline_months: Optional[int] = None

class InterventionRecommendationResponse(BaseModel):
    """Response model for intervention recommendations"""
    village_code: str
    intervention_type: str
    priority: str
    estimated_beneficiaries: int
    estimated_cost: float
    implementing_ministry: str
    timeline_months: int
    success_probability: float = Field(ge=0.0, le=1.0)
    impact_score: float = Field(ge=0.0, le=1.0)
    reasoning: str

class PolicyRecommendationsResponse(BaseModel):
    """Response model for policy recommendations"""
    summary: Dict[str, Any]
    coverage_gaps: Dict[str, Any]
    priority_interventions: Dict[str, List[Dict]]
    resource_allocation: Dict[str, float]
    implementation_timeline: Dict[str, List[str]]
    key_recommendations: List[str]

class EligibilityAnalysisRequest(BaseModel):
    """Request for bulk eligibility analysis"""
    fra_holders: List[FRAHolderRequest]
    schemes_filter: Optional[List[str]] = None

class VillageAnalysisRequest(BaseModel):
    """Request for bulk village analysis"""
    villages: List[VillageProfileRequest]
    priority_filter: Optional[str] = None

# Helper functions
def convert_fra_holder_request(request: FRAHolderRequest) -> FRAHolder:
    """Convert request model to domain model"""
    return FRAHolder(
        holder_id=request.holder_id,
        name=request.name,
        family_size=request.family_size,
        land_area_hectares=request.land_area_hectares,
        annual_income=request.annual_income,
        social_category=request.social_category,
        has_bank_account=request.has_bank_account,
        aadhaar_linked=request.aadhaar_linked,
        village_code=request.village_code,
        district=request.district,
        state=request.state,
        age=request.age,
        gender=request.gender,
        education_level=request.education_level,
        occupation=request.occupation,
        has_electricity=request.has_electricity,
        has_toilet=request.has_toilet,
        water_source=request.water_source,
        mobile_number=request.mobile_number
    )

def convert_village_request(request: VillageProfileRequest) -> VillageProfile:
    """Convert request model to domain model"""
    return VillageProfile(
        village_code=request.village_code,
        village_name=request.village_name,
        block=request.block,
        district=request.district,
        state=request.state,
        total_households=request.total_households,
        st_households=request.st_households,
        sc_households=request.sc_households,
        total_population=request.total_population,
        st_population=request.st_population,
        water_index=request.water_index,
        electricity_index=request.electricity_index,
        road_connectivity_index=request.road_connectivity_index,
        health_facility_index=request.health_facility_index,
        education_index=request.education_index,
        livelihood_index=request.livelihood_index,
        forest_cover_percent=request.forest_cover_percent,
        agricultural_land_percent=request.agricultural_land_percent,
        latitude=request.latitude,
        longitude=request.longitude
    )

def convert_eligibility_response(eligibility: SchemeEligibility) -> SchemeEligibilityResponse:
    """Convert domain model to response model"""
    return SchemeEligibilityResponse(
        scheme=eligibility.scheme.value,
        status=eligibility.status.value,
        confidence_score=eligibility.confidence_score,
        eligible_amount=eligibility.eligible_amount,
        reasons=eligibility.reasons,
        required_documents=eligibility.required_documents,
        timeline_months=eligibility.timeline_months
    )

def convert_intervention_response(intervention: InterventionRecommendation) -> InterventionRecommendationResponse:
    """Convert domain model to response model"""
    return InterventionRecommendationResponse(
        village_code=intervention.village_code,
        intervention_type=intervention.intervention_type,
        priority=intervention.priority.value,
        estimated_beneficiaries=intervention.estimated_beneficiaries,
        estimated_cost=intervention.estimated_cost,
        implementing_ministry=intervention.implementing_ministry,
        timeline_months=intervention.timeline_months,
        success_probability=intervention.success_probability,
        impact_score=intervention.impact_score,
        reasoning=intervention.reasoning
    )

# API Endpoints

@router.get("/health")
async def health_check():
    """Health check endpoint for DSS service"""
    return {"status": "healthy", "service": "Decision Support System", "timestamp": datetime.now().isoformat()}

@router.post("/eligibility/individual", response_model=List[SchemeEligibilityResponse])
async def assess_individual_eligibility(fra_holder: FRAHolderRequest):
    """
    Assess CSS scheme eligibility for an individual FRA holder
    
    Returns eligibility status for all major schemes:
    - PM-KISAN
    - MGNREGA  
    - Jal Jeevan Mission
    - DAJGUA
    - PM Awas Gramin
    - Ayushman Bharat
    """
    try:
        # Convert request to domain model
        holder = convert_fra_holder_request(fra_holder)
        
        # Assess eligibility using DSS engine
        eligibilities = dss_engine.assess_individual_eligibility(holder)
        
        # Convert to response models
        response = [convert_eligibility_response(e) for e in eligibilities]
        
        logger.info(f"Assessed eligibility for FRA holder {fra_holder.holder_id}: {len(response)} schemes evaluated")
        return response
        
    except Exception as e:
        logger.error(f"Error assessing individual eligibility: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing eligibility assessment: {str(e)}")

@router.post("/eligibility/bulk", response_model=Dict[str, List[SchemeEligibilityResponse]])
async def assess_bulk_eligibility(request: EligibilityAnalysisRequest):
    """
    Assess CSS scheme eligibility for multiple FRA holders
    
    Optionally filter by specific schemes using schemes_filter parameter
    """
    try:
        results = {}
        
        for fra_holder_req in request.fra_holders:
            # Convert and assess
            holder = convert_fra_holder_request(fra_holder_req)
            eligibilities = dss_engine.assess_individual_eligibility(holder)
            
            # Filter by schemes if specified
            if request.schemes_filter:
                eligibilities = [e for e in eligibilities if e.scheme.value in request.schemes_filter]
            
            # Convert to response
            results[fra_holder_req.holder_id] = [convert_eligibility_response(e) for e in eligibilities]
        
        logger.info(f"Bulk eligibility assessment completed for {len(request.fra_holders)} FRA holders")
        return results
        
    except Exception as e:
        logger.error(f"Error in bulk eligibility assessment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing bulk assessment: {str(e)}")

@router.post("/interventions/village", response_model=List[InterventionRecommendationResponse])
async def prioritize_village_interventions(village: VillageProfileRequest):
    """
    Generate prioritized intervention recommendations for a village
    
    Returns ranked list of infrastructure and development interventions
    based on village indices and tribal population
    """
    try:
        # Convert request to domain model
        village_profile = convert_village_request(village)
        
        # Generate intervention recommendations
        interventions = dss_engine.prioritize_village_interventions(village_profile)
        
        # Convert to response models
        response = [convert_intervention_response(i) for i in interventions]
        
        logger.info(f"Generated {len(response)} intervention recommendations for village {village.village_code}")
        return response
        
    except Exception as e:
        logger.error(f"Error generating village interventions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing village interventions: {str(e)}")

@router.post("/interventions/bulk", response_model=Dict[str, List[InterventionRecommendationResponse]])
async def bulk_village_analysis(request: VillageAnalysisRequest):
    """
    Generate intervention recommendations for multiple villages
    
    Optionally filter by priority level using priority_filter parameter
    """
    try:
        results = {}
        
        for village_req in request.villages:
            # Convert and analyze
            village_profile = convert_village_request(village_req)
            interventions = dss_engine.prioritize_village_interventions(village_profile)
            
            # Filter by priority if specified
            if request.priority_filter:
                interventions = [i for i in interventions if i.priority.value == request.priority_filter]
            
            # Convert to response
            results[village_req.village_code] = [convert_intervention_response(i) for i in interventions]
        
        logger.info(f"Bulk village analysis completed for {len(request.villages)} villages")
        return results
        
    except Exception as e:
        logger.error(f"Error in bulk village analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing bulk village analysis: {str(e)}")

@router.post("/policy/recommendations", response_model=PolicyRecommendationsResponse)
async def generate_policy_recommendations(
    villages: List[VillageProfileRequest],
    fra_holders: List[FRAHolderRequest]
):
    """
    Generate comprehensive policy recommendations based on aggregate analysis
    
    Analyzes multiple villages and FRA holders to provide:
    - Coverage gap analysis
    - Resource allocation recommendations  
    - Implementation timeline
    - Key policy interventions
    """
    try:
        # Convert request models
        village_profiles = [convert_village_request(v) for v in villages]
        holder_profiles = [convert_fra_holder_request(h) for h in fra_holders]
        
        # Generate policy recommendations
        recommendations = dss_engine.generate_policy_recommendations(village_profiles, holder_profiles)
        
        # Convert to response model
        response = PolicyRecommendationsResponse(
            summary=recommendations["summary"],
            coverage_gaps=recommendations["coverage_gaps"],
            priority_interventions=recommendations["priority_interventions"],
            resource_allocation=recommendations["resource_allocation"],
            implementation_timeline=recommendations["implementation_timeline"],
            key_recommendations=recommendations["key_recommendations"]
        )
        
        logger.info(f"Generated policy recommendations for {len(villages)} villages and {len(fra_holders)} FRA holders")
        return response
        
    except Exception as e:
        logger.error(f"Error generating policy recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing policy recommendations: {str(e)}")

@router.get("/schemes/info")
async def get_scheme_information():
    """
    Get information about all supported CSS schemes
    
    Returns scheme details, eligibility criteria, and benefits
    """
    try:
        scheme_info = {
            "PM_KISAN": {
                "name": "PM Kisan Samman Nidhi",
                "annual_benefit": 6000,
                "installments": 3,
                "target_group": "Land holding farmers",
                "implementing_ministry": "Ministry of Agriculture and Farmers Welfare"
            },
            "JAL_JEEVAN_MISSION": {
                "name": "Jal Jeevan Mission (Har Ghar Jal)",
                "benefit_type": "Infrastructure",
                "target_group": "All rural households",
                "implementing_ministry": "Ministry of Jal Shakti"
            },
            "MGNREGA": {
                "name": "Mahatma Gandhi National Rural Employment Guarantee Act",
                "guaranteed_days": 100,
                "target_group": "Adult members of rural households",
                "implementing_ministry": "Ministry of Rural Development"
            },
            "DAJGUA": {
                "name": "Dharti Aaba Janjatiya Gram Utkarsh Abhiyan",
                "interventions": 25,
                "target_villages": 63843,
                "target_group": "Scheduled Tribe villages",
                "implementing_ministry": "Ministry of Tribal Affairs"
            },
            "PM_AWAS_GRAMIN": {
                "name": "PM Awas Yojana Gramin",
                "assistance_amount": 130000,
                "target_group": "Rural households without pucca houses",
                "implementing_ministry": "Ministry of Rural Development"
            },
            "AYUSHMAN_BHARAT": {
                "name": "Ayushman Bharat PM-JAY",
                "coverage_amount": 500000,
                "target_group": "Vulnerable families",
                "implementing_ministry": "Ministry of Health and Family Welfare"
            }
        }
        
        return {
            "schemes": scheme_info,
            "total_schemes": len(scheme_info),
            "last_updated": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error retrieving scheme information: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving scheme information: {str(e)}")

@router.get("/analytics/summary")
async def get_analytics_summary(
    state: Optional[str] = Query(None, description="Filter by state"),
    district: Optional[str] = Query(None, description="Filter by district")
):
    """
    Get summary analytics for DSS usage and recommendations
    
    Optionally filter by state or district
    """
    try:
        # Mock analytics data - in production, this would come from database
        analytics = {
            "requests_processed": {
                "individual_eligibility": 1250,
                "village_interventions": 850,
                "policy_recommendations": 45,
                "total": 2145
            },
            "scheme_eligibility_rates": {
                "PM_KISAN": 78.5,
                "MGNREGA": 92.3,
                "JAL_JEEVAN_MISSION": 100.0,
                "DAJGUA": 65.8,
                "PM_AWAS_GRAMIN": 45.2,
                "AYUSHMAN_BHARAT": 67.9
            },
            "intervention_priorities": {
                "CRITICAL": 125,
                "HIGH": 340,
                "MEDIUM": 285,
                "LOW": 100
            },
            "top_interventions": [
                {"type": "water_infrastructure", "villages": 245},
                {"type": "electricity_infrastructure", "villages": 189},
                {"type": "road_connectivity", "villages": 156},
                {"type": "health_infrastructure", "villages": 134},
                {"type": "education_infrastructure", "villages": 126}
            ],
            "filters": {
                "state": state,
                "district": district
            },
            "generated_at": datetime.now().isoformat()
        }
        
        return analytics
        
    except Exception as e:
        logger.error(f"Error generating analytics summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating analytics: {str(e)}")