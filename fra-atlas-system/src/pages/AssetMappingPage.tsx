import React, { useState } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  Button,
  Card,
  CardContent,

  Chip,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';
import {
  CloudUpload,
  Assessment,
  Map,
  ExpandMore,
  Layers
} from '@mui/icons-material';

interface Detection {
  type: string;
  bbox: number[];
  confidence: number;
}

interface LayerAnalysis {
  forest_analysis: any;
  groundwater_analysis: any;
  infrastructure_analysis: any;
  agricultural_analysis: any;
}

interface AssetMappingResult {
  filename: string;
  status: string;
  results: Detection[];
  layer_analysis: LayerAnalysis;
  model_info: {
    type: string;
    classes: string[];
    total_detections: number;
    analysis_methods: string[];
  };
}

interface OverlayRendererProps {
  detections: Detection[];
  imageId: string;
  showOverlay: boolean;
  showHeatmap?: boolean;
  showOverlayText?: boolean;
  landCoverFilters?: {
    showForestCover: boolean;
    showAgriculturalLand: boolean;
    showBareSoil: boolean;
  };
}

const OverlayRenderer: React.FC<OverlayRendererProps> = ({ 
  detections, 
  imageId, 
  showOverlay, 
  showHeatmap = false,
  showOverlayText = true,
  landCoverFilters = {
    showForestCover: true,
    showAgriculturalLand: true,
    showBareSoil: true
  }
}) => {
  if ((!showOverlay && !showHeatmap) || !detections || detections.length === 0) {
    return null;
  }

  const getFeatureConfig = (type: string) => {
    const configs = {
      'water_body': { icon: '💧', color: '#2196F3', label: 'Water Body' },
      'forest_cover': { icon: '🌲', color: '#4CAF50', label: 'Forest' },
      'agricultural_land': { icon: '🌾', color: '#8BC34A', label: 'Agriculture' },
      'homestead': { icon: '🏠', color: '#FF5722', label: 'Homestead' },
      'urban_area': { icon: '🏙️', color: '#9E9E9E', label: 'Urban Area' },
      'bare_soil': { icon: '🟫', color: '#795548', label: 'Bare Soil' },
      'road_infrastructure': { icon: '🛣️', color: '#607D8B', label: 'Roads' },
      'building_infrastructure': { icon: '🏢', color: '#FF9800', label: 'Buildings' }
    };
    return configs[type as keyof typeof configs] || { icon: '📍', color: '#F44336', label: 'Unknown' };
  };

  // Filter detections based on land cover filters
  const filteredDetections = detections.filter(detection => {
    if (detection.type === 'forest_cover' && !landCoverFilters.showForestCover) return false;
    if (detection.type === 'agricultural_land' && !landCoverFilters.showAgriculturalLand) return false;
    if (detection.type === 'bare_soil' && !landCoverFilters.showBareSoil) return false;
    return true;
  });

  // Get unique categories for legend
  const uniqueCategories = Array.from(new Set(filteredDetections.map((d: Detection) => d.type)))
    .map((type: string) => getFeatureConfig(type))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <>
      {/* Legend */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        zIndex: 1000,
        minWidth: '150px',
        maxHeight: '300px',
        overflowY: 'auto'
      }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
          Detected Features
        </Typography>
        {uniqueCategories.map((config) => (
          <Box key={config.label} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Box sx={{
              width: 12,
              height: 12,
              backgroundColor: config.color,
              mr: 1,
              borderRadius: 0.5,
              opacity: 0.8
            }} />
            <Typography variant="caption">{config.label}</Typography>
          </Box>
        ))}
      </div>

      {/* Overlay regions */}
      {filteredDetections.map((detection) => {
        const img = document.getElementById(imageId) as HTMLImageElement;
        if (!img || !img.naturalWidth || !img.clientWidth) {
          return null;
        }

        // Calculate scaling
        const scaleX = img.clientWidth / img.naturalWidth;
        const scaleY = img.clientHeight / img.naturalHeight;

        // Scale bounding box
        const x1 = Math.round(detection.bbox[0] * scaleX);
        const y1 = Math.round(detection.bbox[1] * scaleY);
        const x2 = Math.round(detection.bbox[2] * scaleX);
        const y2 = Math.round(detection.bbox[3] * scaleY);

        const width = x2 - x1;
        const height = y2 - y1;

        // Skip very small detections
        if (width < 15 || height < 15) return null;

        const config = getFeatureConfig(detection.type);
        const confidence = Math.round(detection.confidence * 100);

        return (
          <div key={`${detection.type}-${detection.bbox.join('-')}`}>
            {showOverlay && (
              <div
                style={{
                  position: 'absolute',
                  left: x1,
                  top: y1,
                  width: width,
                  height: height,
                  border: `2px solid ${config.color}`,
                  backgroundColor: `${config.color}20`,
                  pointerEvents: 'none',
                  zIndex: 100
                }}
              />
            )}
            
            {showOverlayText && showOverlay && (
              <div
                style={{
                  position: 'absolute',
                  left: x1 + 4,
                  top: y1 + 4,
                  backgroundColor: config.color,
                  color: 'white',
                  padding: '2px 6px',
                  fontSize: '10px',
                  borderRadius: '12px',
                  zIndex: 101,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  minWidth: '80px',
                  textAlign: 'center'
                }}
              >
                {config.icon} {config.label} ({confidence}%)
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

const AssetMappingPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<AssetMappingResult | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [availableLayers, setAvailableLayers] = useState<any[]>([]);
  const [selectedLayers, setSelectedLayers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showOverlayText, setShowOverlayText] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Individual land cover toggles
  const [showForestCover, setShowForestCover] = useState(true);
  const [showAgriculturalLand, setShowAgriculturalLand] = useState(true);
  const [showBareSoil, setShowBareSoil] = useState(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      const url = URL.createObjectURL(e.target.files[0]);
      setImageUrl(url);
      setImageLoaded(false);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Use the unified backend API
      const res = await fetch('http://localhost:8000/api/asset-mapping/upload-image/', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResult(data);
      
      // Fetch available layers
      const layersRes = await fetch('http://localhost:8000/api/asset-mapping/layers/');
      const layersData = await layersRes.json();
      setAvailableLayers(layersData.layers || []);
      
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLayerToggle = (layerName: string) => {
    if (selectedLayers.includes(layerName)) {
      setSelectedLayers(selectedLayers.filter(l => l !== layerName));
    } else {
      setSelectedLayers([...selectedLayers, layerName]);
    }
  };

  const getAssetStats = () => {
    if (!result?.results) return {};
    
    const stats: { [key: string]: number } = {};
    result.results.forEach(detection => {
      stats[detection.type] = (stats[detection.type] || 0) + 1;
    });
    return stats;
  };

  const assetStats = getAssetStats();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #f57c00 0%, #ff9800 100%)', color: 'white' }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          🤖 AI Asset Mapping & Detection
        </Typography>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Advanced Satellite Image Analysis for FRA Implementation
        </Typography>
        <Typography variant="body1">
          Upload satellite imagery to detect forest cover, agricultural land, water bodies, 
          infrastructure, and other geographical assets using AI-powered computer vision.
        </Typography>
      </Paper>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 3 }}>
        {/* Upload Section */}
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <CloudUpload sx={{ mr: 1 }} />
                Image Upload
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUpload />}
                    sx={{ mb: 2 }}
                  >
                    Select Satellite Image
                  </Button>
                </label>
                
                {selectedFile && (
                  <Typography variant="body2" color="textSecondary">
                    Selected: {selectedFile.name}
                  </Typography>
                )}
              </Box>

              <Button
                variant="contained"
                onClick={handleUpload}
                disabled={!selectedFile || loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Assessment />}
                fullWidth
              >
                {loading ? 'Analyzing...' : 'Analyze Image'}
              </Button>
            </CardContent>
          </Card>

          {/* Analysis Results Summary */}
          {result && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Assessment sx={{ mr: 1 }} />
                  Detection Summary
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Total Detections: {result.model_info.total_detections}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Model: {result.model_info.type}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(assetStats).map(([type, count]) => (
                    <Chip
                      key={type}
                      label={`${type.replace('_', ' ')}: ${count}`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Data Layers Section */}
        <Box sx={{ flex: 1 }}>
          {availableLayers.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Layers sx={{ mr: 1 }} />
                  Data Layers
                </Typography>
                
                {availableLayers.map((layer) => (
                  <FormControlLabel
                    key={layer.name}
                    control={
                      <Checkbox
                        checked={selectedLayers.includes(layer.name)}
                        onChange={() => handleLayerToggle(layer.name)}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {layer.name.charAt(0).toUpperCase() + layer.name.slice(1)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {layer.description}
                        </Typography>
                      </Box>
                    }
                    sx={{ display: 'block', mb: 1 }}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Visualization Controls */}
          {result && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Map sx={{ mr: 1 }} />
                  Visualization Controls
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={showOverlay}
                        onChange={(e) => setShowOverlay(e.target.checked)}
                      />
                    }
                    label="Show Detection Overlays"
                  />
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={showHeatmap}
                        onChange={(e) => setShowHeatmap(e.target.checked)}
                      />
                    }
                    label="Show Heatmap View"
                  />
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={showOverlayText}
                        onChange={(e) => setShowOverlayText(e.target.checked)}
                      />
                    }
                    label="Show Detection Labels"
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Land Cover Filters:
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={showForestCover}
                        onChange={(e) => setShowForestCover(e.target.checked)}
                      />
                    }
                    label="🌲 Forest Cover"
                  />
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={showAgriculturalLand}
                        onChange={(e) => setShowAgriculturalLand(e.target.checked)}
                      />
                    }
                    label="🌾 Agricultural Land"
                  />
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={showBareSoil}
                        onChange={(e) => setShowBareSoil(e.target.checked)}
                      />
                    }
                    label="🟫 Bare Soil"
                  />
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>

        {/* Image Analysis Display */}
        {imageUrl && (
          <Box sx={{ mb: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Analysis Results
                </Typography>
                
                <Box sx={{ position: 'relative', display: 'inline-block', border: '2px solid #ddd' }}>
                  <img 
                    id="analysis-image"
                    src={imageUrl} 
                    alt="Analysis result" 
                    style={{ 
                      width: '100%',
                      maxWidth: '800px',
                      height: 'auto',
                      display: 'block'
                    }}
                    onLoad={() => setImageLoaded(true)}
                  />
                  
                  {imageLoaded && result && result.results && (
                    <OverlayRenderer 
                      detections={result.results}
                      imageId="analysis-image"
                      showOverlay={showOverlay}
                      showHeatmap={showHeatmap}
                      showOverlayText={showOverlayText}
                      landCoverFilters={{
                        showForestCover,
                        showAgriculturalLand,
                        showBareSoil
                      }}
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Layer Analysis Details */}
        {result && result.layer_analysis && (
          <Box sx={{ mb: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Detailed Layer Analysis
                </Typography>
                
                {Object.entries(result.layer_analysis).map(([layerName, analysis]) => (
                  <Accordion key={layerName}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle1">
                        {layerName.replace('_', ' ').toUpperCase()}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <pre style={{ fontSize: '12px', backgroundColor: '#f5f5f5', padding: '10px' }}>
                        {JSON.stringify(analysis, null, 2)}
                      </pre>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </CardContent>
            </Card>
          </Box>
        )}
    </Container>
  );
};

export default AssetMappingPage;