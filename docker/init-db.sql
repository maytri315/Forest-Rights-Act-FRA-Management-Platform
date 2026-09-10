-- Initialize SIH Database with GIS support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "postgis_topology";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create files table
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_by UUID REFERENCES users(id),
    upload_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT false,
    processing_status VARCHAR(50) DEFAULT 'pending'
);

-- Create processing_results table
CREATE TABLE IF NOT EXISTS processing_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID REFERENCES files(id),
    result_type VARCHAR(50) NOT NULL,
    result_data JSONB NOT NULL,
    confidence_score FLOAT,
    processing_time INTERVAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial data table for asset mapping
CREATE TABLE IF NOT EXISTS asset_detections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID REFERENCES files(id),
    detection_type VARCHAR(100) NOT NULL,
    confidence FLOAT NOT NULL,
    bounding_box JSONB NOT NULL,
    geom GEOMETRY(POINT, 4326),
    properties JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_upload_time ON files(upload_time);
CREATE INDEX IF NOT EXISTS idx_processing_results_file_id ON processing_results(file_id);
CREATE INDEX IF NOT EXISTS idx_asset_detections_file_id ON asset_detections(file_id);
CREATE INDEX IF NOT EXISTS idx_asset_detections_geom ON asset_detections USING GIST(geom);

-- GIS and spatial data tables for FRA WebGIS

-- States table
CREATE TABLE IF NOT EXISTS states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    geom GEOMETRY(MULTIPOLYGON, 4326),
    population INTEGER,
    forest_area FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Districts table  
CREATE TABLE IF NOT EXISTS districts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL,
    state_id UUID REFERENCES states(id) NOT NULL,
    geom GEOMETRY(MULTIPOLYGON, 4326),
    population INTEGER,
    tribal_population INTEGER,
    forest_area FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Blocks table
CREATE TABLE IF NOT EXISTS blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL,
    district_id UUID REFERENCES districts(id) NOT NULL,
    geom GEOMETRY(MULTIPOLYGON, 4326),
    population INTEGER,
    tribal_population INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Villages table
CREATE TABLE IF NOT EXISTS villages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(15) NOT NULL,
    block_id UUID REFERENCES blocks(id) NOT NULL,
    geom GEOMETRY(MULTIPOLYGON, 4326),
    centroid GEOMETRY(POINT, 4326),
    population INTEGER,
    tribal_population INTEGER,
    households INTEGER,
    tribal_households INTEGER,
    forest_area FLOAT,
    cultivated_area FLOAT,
    revenue_village BOOLEAN DEFAULT true,
    fra_applicable BOOLEAN DEFAULT false,
    has_cfr BOOLEAN DEFAULT false,
    has_ifr BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tribal groups
CREATE TABLE IF NOT EXISTS tribal_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    classification VARCHAR(50),
    traditional_occupation VARCHAR(200),
    population_estimate INTEGER,
    states_present JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Village-Tribal group mapping
CREATE TABLE IF NOT EXISTS village_tribal_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    village_id UUID REFERENCES villages(id) NOT NULL,
    tribal_group_id UUID REFERENCES tribal_groups(id) NOT NULL,
    population INTEGER,
    households INTEGER
);

-- FRA Claims
CREATE TABLE IF NOT EXISTS fra_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    village_id UUID REFERENCES villages(id) NOT NULL,
    claim_type VARCHAR(20) NOT NULL,
    claim_number VARCHAR(50),
    geom GEOMETRY(MULTIPOLYGON, 4326),
    area_hectares FLOAT,
    claimant_name VARCHAR(200),
    claimant_type VARCHAR(50),
    purpose VARCHAR(200),
    status VARCHAR(50) NOT NULL,
    date_filed TIMESTAMP WITH TIME ZONE,
    date_approved TIMESTAMP WITH TIME ZONE,
    surveyed BOOLEAN DEFAULT false,
    survey_date TIMESTAMP WITH TIME ZONE,
    remarks TEXT,
    documents JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Village assets
CREATE TABLE IF NOT EXISTS village_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    village_id UUID REFERENCES villages(id) NOT NULL,
    asset_type VARCHAR(50) NOT NULL,
    asset_subtype VARCHAR(100),
    geom GEOMETRY(POINT, 4326),
    name VARCHAR(200),
    description TEXT,
    condition VARCHAR(50),
    accessibility VARCHAR(100),
    detection_method VARCHAR(50),
    confidence_score FLOAT,
    verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMP WITH TIME ZONE,
    verified_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- FRA Progress tracking
CREATE TABLE IF NOT EXISTS fra_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR(20) NOT NULL,
    state_id UUID REFERENCES states(id),
    district_id UUID REFERENCES districts(id),
    block_id UUID REFERENCES blocks(id),
    village_id UUID REFERENCES villages(id),
    total_villages INTEGER DEFAULT 0,
    eligible_villages INTEGER DEFAULT 0,
    villages_with_claims INTEGER DEFAULT 0,
    villages_with_approvals INTEGER DEFAULT 0,
    total_ifr_claims INTEGER DEFAULT 0,
    approved_ifr_claims INTEGER DEFAULT 0,
    total_cfr_claims INTEGER DEFAULT 0,
    approved_cfr_claims INTEGER DEFAULT 0,
    total_ifr_area_claimed FLOAT DEFAULT 0.0,
    total_ifr_area_approved FLOAT DEFAULT 0.0,
    total_cfr_area_claimed FLOAT DEFAULT 0.0,
    total_cfr_area_approved FLOAT DEFAULT 0.0,
    gram_sabhas_formed INTEGER DEFAULT 0,
    fra_committees_formed INTEGER DEFAULT 0,
    reporting_month INTEGER,
    reporting_year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Land use layers
CREATE TABLE IF NOT EXISTS land_use_layers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    layer_type VARCHAR(50) NOT NULL,
    geom GEOMETRY(MULTIPOLYGON, 4326),
    area_hectares FLOAT,
    classification_system VARCHAR(100),
    classification_date TIMESTAMP WITH TIME ZONE,
    data_source VARCHAR(200),
    accuracy FLOAT,
    state_id UUID REFERENCES states(id),
    district_id UUID REFERENCES districts(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial indexes for better performance
CREATE INDEX IF NOT EXISTS idx_states_geom ON states USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_districts_geom ON districts USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_districts_state_id ON districts(state_id);
CREATE INDEX IF NOT EXISTS idx_blocks_geom ON blocks USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_blocks_district_id ON blocks(district_id);
CREATE INDEX IF NOT EXISTS idx_villages_geom ON villages USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_villages_centroid ON villages USING GIST(centroid);
CREATE INDEX IF NOT EXISTS idx_villages_block_id ON villages(block_id);
CREATE INDEX IF NOT EXISTS idx_villages_fra_applicable ON villages(fra_applicable);
CREATE INDEX IF NOT EXISTS idx_fra_claims_geom ON fra_claims USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_fra_claims_village_id ON fra_claims(village_id);
CREATE INDEX IF NOT EXISTS idx_fra_claims_status ON fra_claims(status);
CREATE INDEX IF NOT EXISTS idx_village_assets_geom ON village_assets USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_village_assets_village_id ON village_assets(village_id);
CREATE INDEX IF NOT EXISTS idx_village_assets_type ON village_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_land_use_geom ON land_use_layers USING GIST(geom);

-- Insert sample data for development

-- Sample states
INSERT INTO states (name, code, population, forest_area) VALUES 
('Madhya Pradesh', 'MP', 72597565, 77700),
('Tripura', 'TR', 3673917, 8073),
('Odisha', 'OR', 42010000, 51619),
('Telangana', 'TG', 35003674, 26904)
ON CONFLICT (code) DO NOTHING;

-- Sample tribal groups
INSERT INTO tribal_groups (name, classification, states_present) VALUES
('Gond', 'ST', '["MP", "CG", "MH", "AP"]'),
('Baiga', 'PVTG', '["MP", "CG"]'),
('Bhil', 'ST', '["MP", "RJ", "GJ", "MH"]'),
('Korku', 'ST', '["MP", "MH"]'),
('Sahariya', 'PVTG', '["MP", "RJ"]')
ON CONFLICT DO NOTHING;

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, is_admin) 
VALUES (
    'admin', 
    'admin@sih.com', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewuhyJ5KK95lFewO',
    true
) ON CONFLICT (username) DO NOTHING;