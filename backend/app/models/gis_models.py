"""
GIS and spatial data models for FRA WebGIS system
"""
from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
import uuid
from datetime import datetime

Base = declarative_base()

class State(Base):
    """Indian States"""
    __tablename__ = "states"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    code = Column(String(10), unique=True, nullable=False)  # State code (e.g., MH, UP)
    geom = Column(Geometry('MULTIPOLYGON', srid=4326))
    population = Column(Integer)
    forest_area = Column(Float)  # in sq km
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    districts = relationship("District", back_populates="state")
    fra_progress = relationship("FRAProgress", back_populates="state")

class District(Base):
    """Districts within states"""
    __tablename__ = "districts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    code = Column(String(10), nullable=False)
    state_id = Column(UUID(as_uuid=True), ForeignKey('states.id'), nullable=False)
    geom = Column(Geometry('MULTIPOLYGON', srid=4326))
    population = Column(Integer)
    tribal_population = Column(Integer)
    forest_area = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    state = relationship("State", back_populates="districts")
    blocks = relationship("Block", back_populates="district")
    fra_progress = relationship("FRAProgress", back_populates="district")

class Block(Base):
    """Blocks within districts"""
    __tablename__ = "blocks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    code = Column(String(10), nullable=False)
    district_id = Column(UUID(as_uuid=True), ForeignKey('districts.id'), nullable=False)
    geom = Column(Geometry('MULTIPOLYGON', srid=4326))
    population = Column(Integer)
    tribal_population = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    district = relationship("District", back_populates="blocks")
    villages = relationship("Village", back_populates="block")
    fra_progress = relationship("FRAProgress", back_populates="block")

class Village(Base):
    """Villages with FRA relevance"""
    __tablename__ = "villages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    code = Column(String(15), nullable=False)  # Village code
    block_id = Column(UUID(as_uuid=True), ForeignKey('blocks.id'), nullable=False)
    geom = Column(Geometry('MULTIPOLYGON', srid=4326))
    centroid = Column(Geometry('POINT', srid=4326))
    
    # Demographics
    population = Column(Integer)
    tribal_population = Column(Integer)
    households = Column(Integer)
    tribal_households = Column(Integer)
    
    # Forest and land data
    forest_area = Column(Float)  # in hectares
    cultivated_area = Column(Float)
    revenue_village = Column(Boolean, default=True)
    
    # FRA specific
    fra_applicable = Column(Boolean, default=False)
    has_cfr = Column(Boolean, default=False)
    has_ifr = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    block = relationship("Block", back_populates="villages")
    tribal_groups = relationship("VillageTribalGroup", back_populates="village")
    fra_claims = relationship("FRAClaim", back_populates="village")
    assets = relationship("VillageAsset", back_populates="village")

class TribalGroup(Base):
    """Scheduled Tribes and tribal groups"""
    __tablename__ = "tribal_groups"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    classification = Column(String(50))  # ST, PVTG, etc.
    traditional_occupation = Column(String(200))
    population_estimate = Column(Integer)
    states_present = Column(JSONB)  # Array of state codes
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    villages = relationship("VillageTribalGroup", back_populates="tribal_group")

class VillageTribalGroup(Base):
    """Many-to-many relationship between villages and tribal groups"""
    __tablename__ = "village_tribal_groups"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    village_id = Column(UUID(as_uuid=True), ForeignKey('villages.id'), nullable=False)
    tribal_group_id = Column(UUID(as_uuid=True), ForeignKey('tribal_groups.id'), nullable=False)
    population = Column(Integer)  # Population of this tribal group in this village
    households = Column(Integer)
    
    # Relationships
    village = relationship("Village", back_populates="tribal_groups")
    tribal_group = relationship("TribalGroup", back_populates="villages")

class FRAClaim(Base):
    """Individual and Community Forest Rights claims"""
    __tablename__ = "fra_claims"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    village_id = Column(UUID(as_uuid=True), ForeignKey('villages.id'), nullable=False)
    claim_type = Column(String(20), nullable=False)  # IFR, CFR
    claim_number = Column(String(50))
    
    # Spatial data
    geom = Column(Geometry('MULTIPOLYGON', srid=4326))
    area_hectares = Column(Float)
    
    # Claim details
    claimant_name = Column(String(200))
    claimant_type = Column(String(50))  # Individual, Community, SHG
    purpose = Column(String(200))  # Agriculture, Dwelling, etc.
    
    # Status tracking
    status = Column(String(50), nullable=False)  # Filed, Verified, Approved, Rejected
    date_filed = Column(DateTime)
    date_approved = Column(DateTime)
    surveyed = Column(Boolean, default=False)
    survey_date = Column(DateTime)
    
    # Additional data
    remarks = Column(Text)
    documents = Column(JSONB)  # Array of document references
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    village = relationship("Village", back_populates="fra_claims")

class VillageAsset(Base):
    """Assets detected/mapped in villages"""
    __tablename__ = "village_assets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    village_id = Column(UUID(as_uuid=True), ForeignKey('villages.id'), nullable=False)
    
    # Asset classification
    asset_type = Column(String(50), nullable=False)  # School, Hospital, Road, etc.
    asset_subtype = Column(String(100))
    
    # Spatial data
    geom = Column(Geometry('POINT', srid=4326))  # Point or polygon
    
    # Asset details
    name = Column(String(200))
    description = Column(Text)
    condition = Column(String(50))  # Good, Fair, Poor, Under Construction
    accessibility = Column(String(100))  # Road connectivity, distance, etc.
    
    # Metadata
    detection_method = Column(String(50))  # AI Detection, Manual Entry, Survey
    confidence_score = Column(Float)
    verified = Column(Boolean, default=False)
    verification_date = Column(DateTime)
    verified_by = Column(String(100))
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    village = relationship("Village", back_populates="assets")

class FRAProgress(Base):
    """FRA implementation progress tracking at different administrative levels"""
    __tablename__ = "fra_progress"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Administrative level
    level = Column(String(20), nullable=False)  # State, District, Block, Village
    state_id = Column(UUID(as_uuid=True), ForeignKey('states.id'))
    district_id = Column(UUID(as_uuid=True), ForeignKey('districts.id'))
    block_id = Column(UUID(as_uuid=True), ForeignKey('blocks.id'))
    village_id = Column(UUID(as_uuid=True), ForeignKey('villages.id'))
    
    # Progress metrics
    total_villages = Column(Integer, default=0)
    eligible_villages = Column(Integer, default=0)
    villages_with_claims = Column(Integer, default=0)
    villages_with_approvals = Column(Integer, default=0)
    
    # Claim statistics
    total_ifr_claims = Column(Integer, default=0)
    approved_ifr_claims = Column(Integer, default=0)
    total_cfr_claims = Column(Integer, default=0)
    approved_cfr_claims = Column(Integer, default=0)
    
    # Area statistics (in hectares)
    total_ifr_area_claimed = Column(Float, default=0.0)
    total_ifr_area_approved = Column(Float, default=0.0)
    total_cfr_area_claimed = Column(Float, default=0.0)
    total_cfr_area_approved = Column(Float, default=0.0)
    
    # Committee formation
    gram_sabhas_formed = Column(Integer, default=0)
    fra_committees_formed = Column(Integer, default=0)
    
    # Reporting period
    reporting_month = Column(Integer)
    reporting_year = Column(Integer)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    state = relationship("State", back_populates="fra_progress")
    district = relationship("District", back_populates="fra_progress")
    block = relationship("Block", back_populates="fra_progress")

class LandUseLayer(Base):
    """Land use classification data"""
    __tablename__ = "land_use_layers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    layer_type = Column(String(50), nullable=False)  # Forest, Agriculture, Water, etc.
    geom = Column(Geometry('MULTIPOLYGON', srid=4326))
    area_hectares = Column(Float)
    
    # Classification details
    classification_system = Column(String(100))  # LULC, Forest Survey, etc.
    classification_date = Column(DateTime)
    data_source = Column(String(200))  # Satellite imagery source
    accuracy = Column(Float)  # Classification accuracy percentage
    
    # Administrative linkage
    state_id = Column(UUID(as_uuid=True), ForeignKey('states.id'))
    district_id = Column(UUID(as_uuid=True), ForeignKey('districts.id'))
    
    created_at = Column(DateTime, default=datetime.utcnow)