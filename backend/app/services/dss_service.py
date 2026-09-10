"""
Decision Support System (DSS) Service for Central Sector Scheme (CSS) Eligibility and Prioritization

This module implements a rule-based + AI-enhanced DSS engine that:
1. Cross-links FRA holders with eligibility for CSS schemes (PM-KISAN, Jal Jeevan Mission, MGNREGA, DAJGUA, etc.)
2. Prioritizes interventions based on village-level indices (water, asset, poverty, etc.)
3. Generates policy recommendations for decision-makers
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum
import logging
from datetime import datetime, date
import numpy as np

logger = logging.getLogger(__name__)

class SchemeType(str, Enum):
    PM_KISAN = "PM_KISAN"
    JAL_JEEVAN_MISSION = "JAL_JEEVAN_MISSION" 
    MGNREGA = "MGNREGA"
    DAJGUA = "DAJGUA"
    PM_AWAS_GRAMIN = "PM_AWAS_GRAMIN"
    AYUSHMAN_BHARAT = "AYUSHMAN_BHARAT"
    PRADHAN_MANTRI_UJJWALA_YOJANA = "PRADHAN_MANTRI_UJJWALA_YOJANA"

class EligibilityStatus(str, Enum):
    ELIGIBLE = "ELIGIBLE"
    NOT_ELIGIBLE = "NOT_ELIGIBLE"
    REQUIRES_VERIFICATION = "REQUIRES_VERIFICATION"
    PENDING_DOCUMENTS = "PENDING_DOCUMENTS"

class InterventionPriority(str, Enum):
    CRITICAL = "CRITICAL"  # Immediate intervention required
    HIGH = "HIGH"         # Urgent within 6 months
    MEDIUM = "MEDIUM"     # Within 1 year
    LOW = "LOW"          # Within 2-3 years

@dataclass
class FRAHolder:
    """FRA Patta Holder Information"""
    holder_id: str
    name: str
    family_size: int
    land_area_hectares: float
    annual_income: Optional[float]
    social_category: str  # ST, SC, OBC, General
    has_bank_account: bool
    aadhaar_linked: bool
    village_code: str
    district: str
    state: str
    age: int
    gender: str
    education_level: str
    occupation: str
    has_electricity: bool
    has_toilet: bool
    water_source: str
    mobile_number: Optional[str]
    
@dataclass 
class VillageProfile:
    """Village-level demographic and infrastructure data"""
    village_code: str
    village_name: str
    block: str
    district: str
    state: str
    total_households: int
    st_households: int
    sc_households: int
    total_population: int
    st_population: int
    # Infrastructure indices (0-100 scale)
    water_index: float
    electricity_index: float
    road_connectivity_index: float
    health_facility_index: float
    education_index: float
    livelihood_index: float
    # Geographic data
    forest_cover_percent: float
    agricultural_land_percent: float
    latitude: Optional[float]
    longitude: Optional[float]
    
@dataclass
class SchemeEligibility:
    """Individual scheme eligibility result"""
    scheme: SchemeType
    status: EligibilityStatus
    confidence_score: float  # 0-1
    eligible_amount: Optional[float]
    reasons: List[str]
    required_documents: List[str]
    timeline_months: Optional[int]

@dataclass
class InterventionRecommendation:
    """Village-level intervention recommendation"""
    village_code: str
    intervention_type: str
    priority: InterventionPriority
    estimated_beneficiaries: int
    estimated_cost: float
    implementing_ministry: str
    timeline_months: int
    success_probability: float
    impact_score: float
    reasoning: str

class DSSEngine:
    """Decision Support System Engine for CSS Scheme Layering"""
    
    def __init__(self):
        self.scheme_rules = self._initialize_scheme_rules()
        self.intervention_rules = self._initialize_intervention_rules()
        
    def _initialize_scheme_rules(self) -> Dict[SchemeType, Dict]:
        """Initialize eligibility rules for each scheme"""
        return {
            SchemeType.PM_KISAN: {
                "max_annual_income": 200000,  # Approximate threshold
                "requires_land_ownership": True,
                "min_land_area": 0.01,  # hectares
                "excluded_occupations": ["doctor", "engineer", "lawyer", "chartered_accountant", "architect"],
                "excluded_if_income_tax_payer": True,
                "excluded_if_pension_above": 10000,  # monthly
                "annual_benefit": 6000,
                "installments": 3
            },
            SchemeType.JAL_JEEVAN_MISSION: {
                "universal_coverage": True,
                "village_level_scheme": True,
                "requires_community_participation": True,
                "priority_villages": ["water_index < 50"]
            },
            SchemeType.MGNREGA: {
                "universal_for_rural": True,
                "guaranteed_days": 100,
                "adult_members_eligible": True,
                "daily_wage_varies_by_state": True,
                "priority_for_st_sc": True
            },
            SchemeType.DAJGUA: {
                "st_villages_only": True,
                "total_interventions": 25,
                "implementing_ministries": 17,
                "target_villages": 63843,
                "timeline_years": 5,
                "priority_infrastructure_gaps": True
            },
            SchemeType.PM_AWAS_GRAMIN: {
                "max_annual_income": 120000,
                "priority_for_st_sc": True,
                "requires_no_pucca_house": True,
                "assistance_amount": 130000  # Plain areas
            },
            SchemeType.AYUSHMAN_BHARAT: {
                "coverage_amount": 500000,
                "family_based": True,
                "priority_for_vulnerable": True,
                "excludes_income_tax_payers": True
            }
        }
    
    def _initialize_intervention_rules(self) -> Dict[str, Dict]:
        """Initialize intervention prioritization rules"""
        return {
            "water_infrastructure": {
                "trigger_conditions": ["water_index < 40"],
                "interventions": ["borewell", "hand_pump", "water_treatment_plant"],
                "implementing_ministry": "Ministry of Jal Shakti",
                "average_cost_per_village": 500000,
                "timeline_months": 6
            },
            "electricity_infrastructure": {
                "trigger_conditions": ["electricity_index < 50"],
                "interventions": ["solar_power", "grid_connection", "micro_grid"],
                "implementing_ministry": "Ministry of Power",
                "average_cost_per_village": 800000,
                "timeline_months": 8
            },
            "road_connectivity": {
                "trigger_conditions": ["road_connectivity_index < 30"],
                "interventions": ["all_weather_road", "bridge_construction"],
                "implementing_ministry": "Ministry of Rural Development",
                "average_cost_per_village": 2000000,
                "timeline_months": 12
            },
            "health_infrastructure": {
                "trigger_conditions": ["health_facility_index < 40"],
                "interventions": ["sub_center", "phc_upgrade", "ambulance"],
                "implementing_ministry": "Ministry of Health and Family Welfare",
                "average_cost_per_village": 1500000,
                "timeline_months": 10
            },
            "education_infrastructure": {
                "trigger_conditions": ["education_index < 50"],
                "interventions": ["anganwadi_center", "school_building", "digital_classroom"],
                "implementing_ministry": "Ministry of Education",
                "average_cost_per_village": 1000000,
                "timeline_months": 8
            }
        }
    
    def assess_individual_eligibility(self, fra_holder: FRAHolder) -> List[SchemeEligibility]:
        """Assess individual FRA holder eligibility for all CSS schemes"""
        eligibilities = []
        
        for scheme_type in SchemeType:
            eligibility = self._check_scheme_eligibility(fra_holder, scheme_type)
            eligibilities.append(eligibility)
            
        return eligibilities
    
    def _check_scheme_eligibility(self, fra_holder: FRAHolder, scheme: SchemeType) -> SchemeEligibility:
        """Check eligibility for a specific scheme"""
        rules = self.scheme_rules.get(scheme, {})
        
        # Delegate to scheme-specific handlers
        if scheme == SchemeType.PM_KISAN:
            return self._check_pm_kisan_eligibility(fra_holder, rules)
        elif scheme == SchemeType.MGNREGA:
            return self._check_mgnrega_eligibility(fra_holder, rules)
        elif scheme == SchemeType.DAJGUA:
            return self._check_dajgua_eligibility(fra_holder, rules)
        elif scheme == SchemeType.JAL_JEEVAN_MISSION:
            return self._check_jjm_eligibility(fra_holder, rules)
        elif scheme == SchemeType.PM_AWAS_GRAMIN:
            return self._check_housing_eligibility(fra_holder, rules)
        elif scheme == SchemeType.AYUSHMAN_BHARAT:
            return self._check_health_eligibility(fra_holder, rules)
        else:
            return SchemeEligibility(
                scheme=scheme,
                status=EligibilityStatus.REQUIRES_VERIFICATION,
                confidence_score=0.5,
                eligible_amount=None,
                reasons=["Scheme rules not implemented"],
                required_documents=[],
                timeline_months=6
            )
    
    def _check_pm_kisan_eligibility(self, fra_holder: FRAHolder, rules: Dict) -> SchemeEligibility:
        """Check PM-KISAN eligibility"""
        reasons = []
        status = EligibilityStatus.ELIGIBLE
        confidence = 1.0
        required_docs = []
        
        if not fra_holder.has_bank_account:
            status = EligibilityStatus.PENDING_DOCUMENTS
            reasons.append("Bank account required")
            required_docs.append("Bank account details")
            confidence *= 0.8
            
        if not fra_holder.aadhaar_linked:
            status = EligibilityStatus.PENDING_DOCUMENTS
            reasons.append("Aadhaar linking required")
            required_docs.append("Aadhaar card")
            confidence *= 0.8
            
        if fra_holder.occupation.lower() in rules.get("excluded_occupations", []):
            status = EligibilityStatus.NOT_ELIGIBLE
            reasons.append(f"Excluded occupation: {fra_holder.occupation}")
            confidence = 0.0
            
        if fra_holder.annual_income and fra_holder.annual_income > rules.get("max_annual_income", 200000):
            status = EligibilityStatus.REQUIRES_VERIFICATION
            reasons.append("Income verification needed")
            confidence *= 0.6
            
        eligible_amount = None
        if fra_holder.land_area_hectares < rules.get("min_land_area", 0.01):
            status = EligibilityStatus.NOT_ELIGIBLE
            reasons.append("Insufficient land holding")
            confidence = 0.0
        else:
            eligible_amount = rules.get("annual_benefit", 6000)
            reasons.append("Land ownership verified")
        
        return SchemeEligibility(
            scheme=SchemeType.PM_KISAN,
            status=status,
            confidence_score=confidence,
            eligible_amount=eligible_amount,
            reasons=reasons,
            required_documents=required_docs,
            timeline_months=3 if status == EligibilityStatus.ELIGIBLE else 6
        )
    
    def _check_mgnrega_eligibility(self, fra_holder: FRAHolder, rules: Dict) -> SchemeEligibility:  # noqa: ARG002
        """Check MGNREGA eligibility"""
        if fra_holder.age >= 18:
            return SchemeEligibility(
                scheme=SchemeType.MGNREGA,
                status=EligibilityStatus.ELIGIBLE,
                confidence_score=1.0,
                eligible_amount=100 * 200,  # 100 days * avg daily wage
                reasons=["Adult member eligible for 100 days employment"],
                required_documents=["Job card application"],
                timeline_months=1
            )
        else:
            return SchemeEligibility(
                scheme=SchemeType.MGNREGA,
                status=EligibilityStatus.NOT_ELIGIBLE,
                confidence_score=0.0,
                eligible_amount=None,
                reasons=["Below 18 years age"],
                required_documents=[],
                timeline_months=0
            )
    
    def _check_dajgua_eligibility(self, fra_holder: FRAHolder, rules: Dict) -> SchemeEligibility:  # noqa: ARG002
        """Check DAJGUA eligibility"""
        if fra_holder.social_category == "ST":
            return SchemeEligibility(
                scheme=SchemeType.DAJGUA,
                status=EligibilityStatus.ELIGIBLE,
                confidence_score=1.0,
                eligible_amount=None,  # Village-level scheme
                reasons=["ST community eligible for village-level interventions"],
                required_documents=["Community certificate"],
                timeline_months=6
            )
        else:
            return SchemeEligibility(
                scheme=SchemeType.DAJGUA,
                status=EligibilityStatus.NOT_ELIGIBLE,
                confidence_score=0.0,
                eligible_amount=None,
                reasons=["Only for Scheduled Tribe communities"],
                required_documents=[],
                timeline_months=0
            )
    
    def _check_jjm_eligibility(self, fra_holder: FRAHolder, rules: Dict) -> SchemeEligibility:  # noqa: ARG002
        """Check Jal Jeevan Mission eligibility"""
        return SchemeEligibility(
            scheme=SchemeType.JAL_JEEVAN_MISSION,
            status=EligibilityStatus.ELIGIBLE,
            confidence_score=1.0,
            eligible_amount=None,  # Village-level scheme
            reasons=["Universal household tap connection eligible"],
            required_documents=["Village enrollment"],
            timeline_months=12
        )
    
    def _check_housing_eligibility(self, fra_holder: FRAHolder, rules: Dict) -> SchemeEligibility:
        """Check PM Awas Gramin eligibility"""
        if not fra_holder.has_toilet:  # Proxy for housing condition
            return SchemeEligibility(
                scheme=SchemeType.PM_AWAS_GRAMIN,
                status=EligibilityStatus.ELIGIBLE,
                confidence_score=0.8,
                eligible_amount=rules.get("assistance_amount", 130000),
                reasons=["Eligible for housing assistance"],
                required_documents=["Housing assessment", "Income certificate"],
                timeline_months=6
            )
        else:
            return SchemeEligibility(
                scheme=SchemeType.PM_AWAS_GRAMIN,
                status=EligibilityStatus.REQUIRES_VERIFICATION,
                confidence_score=0.7,
                eligible_amount=None,
                reasons=["Housing condition verification needed"],
                required_documents=["Detailed housing assessment"],
                timeline_months=3
            )
    
    def _check_health_eligibility(self, fra_holder: FRAHolder, rules: Dict) -> SchemeEligibility:
        """Check Ayushman Bharat eligibility"""
        if fra_holder.annual_income and fra_holder.annual_income < 250000:
            return SchemeEligibility(
                scheme=SchemeType.AYUSHMAN_BHARAT,
                status=EligibilityStatus.ELIGIBLE,
                confidence_score=0.9,
                eligible_amount=rules.get("coverage_amount", 500000),
                reasons=["Eligible for health insurance coverage"],
                required_documents=["Income certificate", "Family card"],
                timeline_months=2
            )
        else:
            return SchemeEligibility(
                scheme=SchemeType.AYUSHMAN_BHARAT,
                status=EligibilityStatus.REQUIRES_VERIFICATION,
                confidence_score=0.6,
                eligible_amount=None,
                reasons=["Income verification for health insurance"],
                required_documents=["Income verification documents"],
                timeline_months=4
            )
    
    def prioritize_village_interventions(self, village: VillageProfile) -> List[InterventionRecommendation]:
        """Generate prioritized intervention recommendations for a village"""
        recommendations = []
        
        for intervention_type, rules in self.intervention_rules.items():
            priority = self._calculate_intervention_priority(village, intervention_type, rules)
            if priority:
                recommendations.append(priority)
                
        # Sort by priority and impact score
        recommendations.sort(key=lambda x: (x.priority.value, -x.impact_score))
        
        return recommendations
    
    def _calculate_intervention_priority(self, village: VillageProfile, intervention_type: str, rules: Dict) -> Optional[InterventionRecommendation]:
        """Calculate priority for a specific intervention"""
        triggers = rules.get("trigger_conditions", [])
        
        # Check if intervention is needed
        needs_intervention, impact_factors = self._check_intervention_triggers(village, intervention_type, triggers)
        if not needs_intervention:
            return None
            
        # Calculate priority metrics
        priority_score = self._calculate_priority_score(village, impact_factors)
        priority = self._get_priority_level(priority_score)
        
        # Estimate intervention details
        estimated_beneficiaries = min(village.st_households, village.total_households)
        success_probability = float(self._calculate_success_probability(village))
        
        return InterventionRecommendation(
            village_code=village.village_code,
            intervention_type=intervention_type,
            priority=priority,
            estimated_beneficiaries=estimated_beneficiaries,
            estimated_cost=float(rules.get("average_cost_per_village", 500000)),
            implementing_ministry=rules.get("implementing_ministry", "Ministry of Rural Development"),
            timeline_months=rules.get("timeline_months", 6),
            success_probability=success_probability,
            impact_score=float(priority_score),
            reasoning=f"Village {village.village_name} requires {intervention_type} intervention due to low infrastructure indices. Priority: {priority.value}, Expected impact: {priority_score:.2f}"
        )
    
    def _check_intervention_triggers(self, village: VillageProfile, intervention_type: str, triggers: List[str]) -> tuple[bool, List[float]]:
        """Check if intervention triggers are met"""
        needs_intervention = False
        impact_factors = []
        
        trigger_checks = {
            "water_infrastructure": lambda: self._check_water_trigger(village, triggers, impact_factors),
            "electricity_infrastructure": lambda: self._check_electricity_trigger(village, triggers, impact_factors),
            "road_connectivity": lambda: self._check_road_trigger(village, triggers, impact_factors),
            "health_infrastructure": lambda: self._check_health_trigger(village, triggers, impact_factors),
            "education_infrastructure": lambda: self._check_education_trigger(village, triggers, impact_factors)
        }
        
        if intervention_type in trigger_checks:
            needs_intervention = trigger_checks[intervention_type]()
        
        return needs_intervention, impact_factors
    
    def _check_water_trigger(self, village: VillageProfile, triggers: List[str], impact_factors: List[float]) -> bool:
        """Check water infrastructure triggers"""
        for condition in triggers:
            if "water_index" in condition:
                threshold = float(condition.split("<")[1].strip())
                if village.water_index < threshold:
                    impact_factors.append((100 - village.water_index) / 100)
                    return True
        return False
    
    def _check_electricity_trigger(self, village: VillageProfile, triggers: List[str], impact_factors: List[float]) -> bool:
        """Check electricity infrastructure triggers"""
        for condition in triggers:
            if "electricity_index" in condition:
                threshold = float(condition.split("<")[1].strip())
                if village.electricity_index < threshold:
                    impact_factors.append((100 - village.electricity_index) / 100)
                    return True
        return False
    
    def _check_road_trigger(self, village: VillageProfile, triggers: List[str], impact_factors: List[float]) -> bool:
        """Check road connectivity triggers"""
        for condition in triggers:
            if "road_connectivity_index" in condition:
                threshold = float(condition.split("<")[1].strip())
                if village.road_connectivity_index < threshold:
                    impact_factors.append((100 - village.road_connectivity_index) / 100)
                    return True
        return False
    
    def _check_health_trigger(self, village: VillageProfile, triggers: List[str], impact_factors: List[float]) -> bool:
        """Check health infrastructure triggers"""
        for condition in triggers:
            if "health_facility_index" in condition:
                threshold = float(condition.split("<")[1].strip())
                if village.health_facility_index < threshold:
                    impact_factors.append((100 - village.health_facility_index) / 100)
                    return True
        return False
    
    def _check_education_trigger(self, village: VillageProfile, triggers: List[str], impact_factors: List[float]) -> bool:
        """Check education infrastructure triggers"""
        for condition in triggers:
            if "education_index" in condition:
                threshold = float(condition.split("<")[1].strip())
                if village.education_index < threshold:
                    impact_factors.append((100 - village.education_index) / 100)
                    return True
        return False
    
    def _calculate_priority_score(self, village: VillageProfile, impact_factors: List[float]) -> float:
        """Calculate intervention priority score"""
        avg_impact = float(np.mean(impact_factors)) if impact_factors else 0.5
        st_population_factor = village.st_population / village.total_population if village.total_population > 0 else 0
        return avg_impact * 0.6 + st_population_factor * 0.4
    
    def _get_priority_level(self, priority_score: float) -> InterventionPriority:
        """Get priority level based on score"""
        if priority_score >= 0.8:
            return InterventionPriority.CRITICAL
        elif priority_score >= 0.6:
            return InterventionPriority.HIGH
        elif priority_score >= 0.4:
            return InterventionPriority.MEDIUM
        else:
            return InterventionPriority.LOW
    
    def _calculate_success_probability(self, village: VillageProfile) -> float:
        """Calculate intervention success probability"""
        success_factors = [
            village.road_connectivity_index / 100,
            1.0 if village.electricity_index > 50 else 0.5,
            0.8  # General implementation success rate
        ]
        return float(np.mean(success_factors))
    
    def generate_policy_recommendations(self, villages: List[VillageProfile], fra_holders: List[FRAHolder]) -> Dict[str, Any]:
        """Generate high-level policy recommendations based on aggregate analysis"""
        
        # Aggregate statistics
        total_villages = len(villages)
        total_fra_holders = len(fra_holders)
        
        # Calculate coverage gaps
        coverage_gaps = self._analyze_coverage_gaps(villages, fra_holders)
        
        # Priority interventions by state/district
        priority_interventions = self._prioritize_interventions_by_region(villages)
        
        # Resource allocation recommendations
        resource_allocation = self._recommend_resource_allocation(villages, fra_holders)
        
        # Timeline recommendations
        implementation_timeline = self._create_implementation_timeline(villages)
        
        return {
            "summary": {
                "total_villages_analyzed": total_villages,
                "total_fra_holders": total_fra_holders,
                "high_priority_villages": len([v for v in villages if self._is_high_priority_village(v)]),
                "estimated_total_investment": sum(resource_allocation.values())
            },
            "coverage_gaps": coverage_gaps,
            "priority_interventions": priority_interventions,
            "resource_allocation": resource_allocation,
            "implementation_timeline": implementation_timeline,
            "key_recommendations": self._generate_key_policy_points(coverage_gaps, priority_interventions)
        }
    
    def _analyze_coverage_gaps(self, villages: List[VillageProfile], fra_holders: List[FRAHolder]) -> Dict[str, Any]:
        """Analyze gaps in scheme coverage and infrastructure"""
        
        # Infrastructure gaps by type
        water_gap_villages = [v for v in villages if v.water_index < 50]
        electricity_gap_villages = [v for v in villages if v.electricity_index < 50]
        road_gap_villages = [v for v in villages if v.road_connectivity_index < 40]
        health_gap_villages = [v for v in villages if v.health_facility_index < 50]
        education_gap_villages = [v for v in villages if v.education_index < 50]
        
        # FRA holder eligibility gaps
        no_bank_account = [h for h in fra_holders if not h.has_bank_account]
        no_aadhaar = [h for h in fra_holders if not h.aadhaar_linked]
        
        return {
            "infrastructure_gaps": {
                "water": {
                    "villages_affected": len(water_gap_villages),
                    "percentage": len(water_gap_villages) / len(villages) * 100 if villages else 0,
                    "priority_states": self._get_top_states([v.state for v in water_gap_villages])
                },
                "electricity": {
                    "villages_affected": len(electricity_gap_villages),
                    "percentage": len(electricity_gap_villages) / len(villages) * 100 if villages else 0
                },
                "roads": {
                    "villages_affected": len(road_gap_villages),
                    "percentage": len(road_gap_villages) / len(villages) * 100 if villages else 0
                },
                "health": {
                    "villages_affected": len(health_gap_villages),
                    "percentage": len(health_gap_villages) / len(villages) * 100 if villages else 0
                },
                "education": {
                    "villages_affected": len(education_gap_villages),
                    "percentage": len(education_gap_villages) / len(villages) * 100 if villages else 0
                }
            },
            "eligibility_gaps": {
                "banking": {
                    "holders_without_accounts": len(no_bank_account),
                    "percentage": len(no_bank_account) / len(fra_holders) * 100 if fra_holders else 0
                },
                "aadhaar": {
                    "holders_without_aadhaar": len(no_aadhaar),
                    "percentage": len(no_aadhaar) / len(fra_holders) * 100 if fra_holders else 0
                }
            }
        }
    
    def _prioritize_interventions_by_region(self, villages: List[VillageProfile]) -> Dict[str, List[Dict]]:
        """Prioritize interventions by state and district"""
        state_priorities = {}
        
        for village in villages:
            if village.state not in state_priorities:
                state_priorities[village.state] = []
            
            # Generate interventions for this village
            interventions = self.prioritize_village_interventions(village)
            for intervention in interventions:
                if intervention.priority in [InterventionPriority.CRITICAL, InterventionPriority.HIGH]:
                    state_priorities[village.state].append({
                        "village": village.village_name,
                        "district": village.district,
                        "intervention": intervention.intervention_type,
                        "priority": intervention.priority.value,
                        "cost": intervention.estimated_cost,
                        "beneficiaries": intervention.estimated_beneficiaries
                    })
        
        return state_priorities
    
    def _recommend_resource_allocation(self, villages: List[VillageProfile], fra_holders: List[FRAHolder]) -> Dict[str, float]:
        """Recommend budget allocation across different intervention types"""
        
        allocation: Dict[str, float] = {
            "water_infrastructure": 0.0,
            "electricity_infrastructure": 0.0,
            "road_connectivity": 0.0,
            "health_infrastructure": 0.0,
            "education_infrastructure": 0.0,
            "individual_benefits": 0.0
        }
        
        for village in villages:
            interventions = self.prioritize_village_interventions(village)
            for intervention in interventions:
                if intervention.priority in [InterventionPriority.CRITICAL, InterventionPriority.HIGH]:
                    allocation[intervention.intervention_type] += intervention.estimated_cost
        
        # Individual scheme benefits
        for holder in fra_holders:
            eligibilities = self.assess_individual_eligibility(holder)
            for eligibility in eligibilities:
                if eligibility.status == EligibilityStatus.ELIGIBLE and eligibility.eligible_amount:
                    allocation["individual_benefits"] += eligibility.eligible_amount
        
        return allocation
    
    def _create_implementation_timeline(self, villages: List[VillageProfile]) -> Dict[str, List[str]]:
        """Create phased implementation timeline"""
        timeline = {
            "Phase 1 (0-6 months)": [],
            "Phase 2 (6-12 months)": [],
            "Phase 3 (12-24 months)": [],
            "Phase 4 (24+ months)": []
        }
        
        for village in villages:
            interventions = self.prioritize_village_interventions(village)
            for intervention in interventions:
                village_intervention = f"{village.village_name}: {intervention.intervention_type}"
                
                if intervention.priority == InterventionPriority.CRITICAL:
                    timeline["Phase 1 (0-6 months)"].append(village_intervention)
                elif intervention.priority == InterventionPriority.HIGH:
                    timeline["Phase 2 (6-12 months)"].append(village_intervention)
                elif intervention.priority == InterventionPriority.MEDIUM:
                    timeline["Phase 3 (12-24 months)"].append(village_intervention)
                else:
                    timeline["Phase 4 (24+ months)"].append(village_intervention)
        
        return timeline
    
    def _generate_key_policy_points(self, coverage_gaps: Dict, priority_interventions: Dict) -> List[str]:  # noqa: ARG002
        """Generate key policy recommendations"""
        recommendations = []
        
        # Infrastructure recommendations
        infra_gaps = coverage_gaps.get("infrastructure_gaps", {})
        
        if infra_gaps.get("water", {}).get("percentage", 0) > 30:
            recommendations.append("Accelerate Jal Jeevan Mission implementation in tribal areas - 30%+ villages lack adequate water infrastructure")
        
        if infra_gaps.get("electricity", {}).get("percentage", 0) > 25:
            recommendations.append("Prioritize solar power and grid connectivity under DAJGUA for tribal villages with <50% electricity access")
        
        if infra_gaps.get("roads", {}).get("percentage", 0) > 40:
            recommendations.append("Focus on all-weather road connectivity as prerequisite for other interventions")
        
        # Eligibility recommendations
        eligibility_gaps = coverage_gaps.get("eligibility_gaps", {})
        
        if eligibility_gaps.get("banking", {}).get("percentage", 0) > 20:
            recommendations.append("Conduct targeted banking camp in tribal villages - 20%+ FRA holders lack bank accounts")
        
        if eligibility_gaps.get("aadhaar", {}).get("percentage", 0) > 15:
            recommendations.append("Organize Aadhaar enrollment drives to ensure scheme eligibility compliance")
        
        # Convergence recommendations
        recommendations.append("Implement integrated approach: Link MGNREGA employment with infrastructure development")
        recommendations.append("Use PM-KISAN beneficiary database to identify eligible families for housing and health schemes")
        recommendations.append("Establish village-level coordination committees for multi-scheme implementation")
        
        return recommendations
    
    def _is_high_priority_village(self, village: VillageProfile) -> bool:
        """Check if a village requires high-priority intervention"""
        critical_indices = [
            village.water_index < 40,
            village.electricity_index < 30,
            village.road_connectivity_index < 25,
            village.health_facility_index < 35
        ]
        
        return sum(critical_indices) >= 2
    
    def _get_top_states(self, state_list: List[str], top_n: int = 5) -> List[str]:
        """Get top N states by frequency"""
        from collections import Counter
        state_counts = Counter(state_list)
        return [state for state, count in state_counts.most_common(top_n)]

# Initialize global DSS engine instance
dss_engine = DSSEngine()