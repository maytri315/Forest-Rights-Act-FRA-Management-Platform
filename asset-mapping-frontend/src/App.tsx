import React, { useState, useEffect } from 'react';

// Inline Overlay Renderer Component
interface Detection {
  type: string;
  bbox: number[];
  confidence: number;
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
  landCoverFilters 
}) => {
  if ((!showOverlay && !showHeatmap) || !detections || detections.length === 0) {
    return null;
  }

  // Filter detections based on land cover filters
  const filteredDetections = detections.filter((detection: Detection) => {
    if (!landCoverFilters) return true; // Show all if no filters provided
    
    switch (detection.type) {
      case 'forest_cover':
        return landCoverFilters.showForestCover;
      case 'agricultural_land':
        return landCoverFilters.showAgriculturalLand;
      case 'bare_soil':
        return landCoverFilters.showBareSoil;
      default:
        return true; // Show other types (water, urban, etc.) regardless of filters
    }
  });

  const getFeatureConfig = (type: string) => {
    const configs = {
      'water_body': { icon: '💧', color: '#2196F3', label: 'Water Body' },
      'forest_cover': { icon: '🌲', color: '#4CAF50', label: 'Forest' },
      'agricultural_land': { icon: '🌾', color: '#8BC34A', label: 'Agriculture' },
      'homestead': { icon: '🏠', color: '#FF5722', label: 'Homestead' },
      'urban_area': { icon: '🏙️', color: '#9E9E9E', label: 'Urban Area' },
      'bare_soil': { icon: '🟫', color: '#795548', label: 'Bare Soil' },
      'road': { icon: '🛣️', color: '#607D8B', label: 'Road' }
    };
    return configs[type as keyof typeof configs] || { icon: '📍', color: '#F44336', label: 'Unknown' };
  };

  return (
    <>
      {filteredDetections.map((detection, index) => {
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
        if (width < 15 || height < 15) {
          return null;
        }

        const config = getFeatureConfig(detection.type);
        const confidence = Math.round(detection.confidence * 100);

        return (
          <div key={`detection-${detection.type}-${index}-${x1}-${y1}`} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
            {/* Heatmap overlay (if enabled) */}
            {showHeatmap && (
              <div
                style={{
                  position: 'absolute',
                  left: `${x1}px`,
                  top: `${y1}px`,
                  width: `${width}px`,
                  height: `${height}px`,
                  backgroundColor: `${config.color}40`,
                  borderRadius: '4px',
                  zIndex: 50
                }}
              />
            )}

            {/* Main bounding box (if overlay enabled) */}
            {showOverlay && (
              <>
                <div
                  style={{
                    position: 'absolute',
                    left: `${x1}px`,
                    top: `${y1}px`,
                    width: `${width}px`,
                    height: `${height}px`,
                    border: `3px solid ${config.color}`,
                    backgroundColor: `${config.color}20`,
                    borderRadius: '6px',
                    zIndex: 100,
                    boxShadow: `0 0 10px ${config.color}50`
                  }}
                />

                {/* Feature label - conditional based on showOverlayText */}
                {showOverlayText && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${x1}px`,
                      top: `${Math.max(2, y1 - 30)}px`,
                      backgroundColor: config.color,
                      color: 'white',
                      padding: '4px 10px',
                      fontSize: '12px',
                      fontWeight: 'bold',
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
              </>
            )}
          </div>
        );
      })}
    </>
  );
};

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [availableLayers, setAvailableLayers] = useState<any[]>([]);
  const [layerData, setLayerData] = useState<any>({});
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
      // Create a URL for the selected image to display it
      const url = URL.createObjectURL(e.target.files[0]);
      setImageUrl(url);
      setImageLoaded(false);
      setResult(null); // Clear previous results
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await fetch('http://localhost:8002/upload-image/', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResult(data);
      
      // Fetch available layers
      const layersRes = await fetch('http://localhost:8002/layers/');
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
      // Layer data is now included in the main analysis result
      // No need to fetch separately as it's already available in result.layer_analysis
    }
  };

  const getAssetColor = (assetType: string) => {
    const colors: { [key: string]: string } = {
      'agricultural_land': '#32CD32',
      'forest_cover': '#228B22',
      'water_body': '#1E90FF',
      'homestead': '#FF6347',
      'urban_area': '#808080',
      'bare_soil': '#D2691E',
      'no_features_detected': '#FFD700'
    };
    return colors[assetType] || '#FF0000';
  };

  return (
    <div style={{ padding: 32 }}>
      <h2>AI Asset Mapping - Real CNN Model</h2>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!selectedFile || loading}>
        {loading ? 'Processing...' : 'Upload & Analyze'}
      </button>
      
      {availableLayers.length > 0 && (
        <div style={{ marginTop: 20, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
          <h3>Data Layers</h3>
          <p>Toggle data layers to view additional information:</p>
          {availableLayers.map((layer) => (
            <label key={layer.name} style={{ display: 'block', marginBottom: 8 }}>
              <input
                type="checkbox"
                checked={selectedLayers.includes(layer.name)}
                onChange={() => handleLayerToggle(layer.name)}
                style={{ marginRight: 8 }}
              />
              {layer.name.charAt(0).toUpperCase() + layer.name.slice(1)} - {layer.description}
            </label>
          ))}
        </div>
      )}
      
      {imageUrl && (
        <div style={{ marginTop: 24, position: 'relative', display: 'inline-block' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Analysis Results</h3>
            {result && result.results && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    onClick={() => setShowOverlay(!showOverlay)}
                    style={{
                      padding: '4px 12px',
                      backgroundColor: showOverlay ? '#28a745' : '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {showOverlay ? '🔍 Hide Overlays' : '🔍 Show Overlays'}
                  </button>
                  <button 
                    onClick={() => setShowHeatmap(!showHeatmap)}
                    style={{
                      padding: '4px 12px',
                      backgroundColor: showHeatmap ? '#17a2b8' : '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {showHeatmap ? '🗺️ Hide Heatmap' : '🗺️ Show Heatmap'}
                  </button>
                  <button 
                    onClick={() => setShowOverlayText(!showOverlayText)}
                    style={{
                      padding: '4px 12px',
                      backgroundColor: showOverlayText ? '#ffc107' : '#6c757d',
                      color: showOverlayText ? 'black' : 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {showOverlayText ? '📝 Hide Text' : '📝 Show Text'}
                  </button>
                </div>
                
                {/* Land Cover Type Toggles */}
                <div style={{ 
                  display: 'flex', 
                  gap: 8, 
                  flexWrap: 'wrap',
                  padding: '8px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  border: '1px solid #dee2e6'
                }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#495057' }}>
                    Land Cover Filters:
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '11px' }}>
                    <input
                      type="checkbox"
                      checked={showForestCover}
                      onChange={() => setShowForestCover(!showForestCover)}
                    />
                    🌲 Forest Cover
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '11px' }}>
                    <input
                      type="checkbox"
                      checked={showAgriculturalLand}
                      onChange={() => setShowAgriculturalLand(!showAgriculturalLand)}
                    />
                    🌾 Agricultural Land
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '11px' }}>
                    <input
                      type="checkbox"
                      checked={showBareSoil}
                      onChange={() => setShowBareSoil(!showBareSoil)}
                    />
                    🟫 Bare Soil
                  </label>
                </div>
              </div>
            )}
          </div>
          <div 
            style={{ 
              position: 'relative', 
              display: 'inline-block',
              border: '2px solid #000',
              margin: '10px 0'
            }}
            ref={(el) => {
              if (el && imageUrl) {
                // Force overlay re-render when container is ready
                setTimeout(() => {
                  setImageLoaded(true);
                  console.log('Container ready, overlays should render');
                }, 200);
              }
            }}
          >
            <img 
              id="analysis-image"
              src={imageUrl} 
              alt="Uploaded satellite image" 
              style={{ 
                width: '600px',
                height: 'auto',
                display: 'block'
              }}
              onLoad={(e) => {
                const img = e.target as HTMLImageElement;
                console.log('✅ Image loaded:', img.clientWidth, 'x', img.clientHeight);
                console.log('📐 Natural size:', img.naturalWidth, 'x', img.naturalHeight);
                setImageLoaded(true);
              }}
            />
            
            {/* Enhanced Overlay System with Heatmap Support */}
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
            
            {/* Debug overlay to test positioning */}

            
            {/* Old overlay code removed - using OverlayRenderer component above */}
          </div>
        </div>
      )}

      {result && (
        <div style={{ marginTop: 24 }}>
          <h3>Detection Results</h3>
          {result.model_info && (
            <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#e8f5e8', borderRadius: 4 }}>
              <strong>Model:</strong> {result.model_info.type}<br/>
              <strong>Classes:</strong> {result.model_info.classes.join(', ')}<br/>
              <strong>Total Detections:</strong> {result.model_info.total_detections}<br/>
              <strong>Overlays:</strong> {showOverlay ? 'Enabled' : 'Disabled'} | 
              <strong>Image Loaded:</strong> {imageLoaded ? 'Yes' : 'No'}
            </div>
          )}
          
          {result.results && result.results.length > 0 ? (
            <div>
              <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
                <h4 style={{ margin: '0 0 8px 0' }}>Coverage Summary</h4>
                {(() => {
                  const typeCounts = result.results.reduce((acc: any, asset: any) => {
                    acc[asset.type] = (acc[asset.type] || 0) + 1;
                    return acc;
                  }, {});
                  return Object.entries(typeCounts).map(([type, count]) => (
                    <span key={type} style={{ 
                      display: 'inline-block', 
                      margin: '2px 8px 2px 0', 
                      padding: '2px 8px', 
                      backgroundColor: getAssetColor(type as string), 
                      color: 'white', 
                      borderRadius: 12,
                      fontSize: '0.8em'
                    }}>
                      {type.replace('_', ' ')}: {count as number}
                    </span>
                  ));
                })()}
              </div>
              {result.results.map((asset: any, index: number) => (
                <div key={`asset-${asset.type}-${index}`} style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                  <div 
                    style={{ 
                      width: 20, 
                      height: 20, 
                      backgroundColor: getAssetColor(asset.type),
                      marginRight: 10,
                      border: '1px solid #000'
                    }}
                  />
                  <span style={{ textTransform: 'capitalize' }}>
                    {asset.type.replace('_', ' ')}: {(asset.confidence * 100).toFixed(1)}%
                    {asset.features && (
                      <small style={{ display: 'block', color: '#666', fontSize: '0.8em' }}>
                        Brightness: {asset.features.brightness}, Texture: {asset.features.texture_complexity}
                      </small>
                    )}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p>No assets detected in this image.</p>
          )}
        </div>
      )}

      {result && result.layer_analysis && (
        <div style={{ marginTop: 24 }}>
          <h3>AI Layer Analysis</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            
            {/* Forest Analysis */}
            <div style={{ backgroundColor: '#e8f5e8', padding: 16, borderRadius: 8 }}>
              <h4>🌲 Forest Analysis</h4>
              <p><strong>Forest Coverage:</strong> {result.layer_analysis.forest_analysis.forest_cover_percentage}%</p>
              <p><strong>Dense Forest:</strong> {result.layer_analysis.forest_analysis.dense_forest_percentage}%</p>
              <p><strong>Density:</strong> {result.layer_analysis.forest_analysis.forest_density}</p>
              <p><em>Method: {result.layer_analysis.forest_analysis.analysis_method}</em></p>
            </div>

            {/* Groundwater Analysis */}
            <div style={{ backgroundColor: '#e8f4fd', padding: 16, borderRadius: 8 }}>
              <h4>💧 Water Resources</h4>
              <p><strong>Water Bodies:</strong> {result.layer_analysis.groundwater_analysis.water_body_coverage}%</p>
              <p><strong>Moisture Indicators:</strong> {result.layer_analysis.groundwater_analysis.moisture_indicators}%</p>
              <p><strong>Groundwater Potential:</strong> {result.layer_analysis.groundwater_analysis.groundwater_potential}</p>
              <p><em>Method: {result.layer_analysis.groundwater_analysis.analysis_method}</em></p>
            </div>

            {/* Infrastructure Analysis */}
            <div style={{ backgroundColor: '#fff5e6', padding: 16, borderRadius: 8 }}>
              <h4>🏗️ Infrastructure</h4>
              <p><strong>Linear Features:</strong> {result.layer_analysis.infrastructure_analysis.linear_feature_density}%</p>
              <p><strong>Built-up Areas:</strong> {result.layer_analysis.infrastructure_analysis.built_up_percentage}%</p>
              <p><strong>Infrastructure Score:</strong> {result.layer_analysis.infrastructure_analysis.infrastructure_score}</p>
              <p><em>Method: {result.layer_analysis.infrastructure_analysis.analysis_method}</em></p>
            </div>

            {/* Agricultural Analysis */}
            <div style={{ backgroundColor: '#f0f8e8', padding: 16, borderRadius: 8 }}>
              <h4>🌾 Agriculture</h4>
              <p><strong>Healthy Vegetation:</strong> {result.layer_analysis.agricultural_analysis.healthy_vegetation_percentage}%</p>
              <p><strong>Moderate Vegetation:</strong> {result.layer_analysis.agricultural_analysis.moderate_vegetation_percentage}%</p>
              <p><strong>Field Regularity:</strong> {result.layer_analysis.agricultural_analysis.field_regularity_score}</p>
              <p><strong>Crop Health:</strong> {result.layer_analysis.agricultural_analysis.crop_health}</p>
              <p><em>Method: {result.layer_analysis.agricultural_analysis.analysis_method}</em></p>
            </div>
          </div>
        </div>
      )}

      {selectedLayers.length > 0 && result && result.layer_analysis && (
        <div style={{ marginTop: 24 }}>
          <h3>Selected Layer Details</h3>
          {selectedLayers.map((layerName) => {
            const layerKey = `${layerName}_analysis`;
            const data = result.layer_analysis[layerKey];
            
            if (!data) return null;
            
            return (
              <details key={layerName} style={{ marginBottom: 16 }} open>
                <summary style={{ fontWeight: 'bold', cursor: 'pointer', padding: 8, backgroundColor: '#f8f9fa' }}>
                  {layerName.charAt(0).toUpperCase() + layerName.slice(1)} Analysis Details
                </summary>
                <div style={{ padding: 16, backgroundColor: '#f0f8ff', marginTop: 8, borderRadius: 4 }}>
                  {layerName === 'forest' && (
                    <div>
                      <p><strong>🌲 Forest Coverage:</strong> {data.forest_cover_percentage}%</p>
                      <p><strong>🌳 Dense Forest:</strong> {data.dense_forest_percentage}%</p>
                      <p><strong>📊 Forest Density:</strong> {data.forest_density}</p>
                      <p><em>Analysis Method: {data.analysis_method}</em></p>
                    </div>
                  )}
                  
                  {layerName === 'groundwater' && (
                    <div>
                      <p><strong>💧 Water Body Coverage:</strong> {data.water_body_coverage}%</p>
                      <p><strong>🌊 Moisture Indicators:</strong> {data.moisture_indicators}%</p>
                      <p><strong>🏞️ Groundwater Potential:</strong> {data.groundwater_potential}</p>
                      <p><em>Analysis Method: {data.analysis_method}</em></p>
                    </div>
                  )}
                  
                  {layerName === 'infrastructure' && (
                    <div>
                      <p><strong>🛣️ Linear Features:</strong> {data.linear_feature_density}%</p>
                      <p><strong>🏢 Built-up Areas:</strong> {data.built_up_percentage}%</p>
                      <p><strong>📈 Infrastructure Score:</strong> {data.infrastructure_score}</p>
                      <p><em>Analysis Method: {data.analysis_method}</em></p>
                    </div>
                  )}
                  
                  {layerName === 'agricultural' && (
                    <div>
                      <p><strong>🌱 Healthy Vegetation:</strong> {data.healthy_vegetation_percentage}%</p>
                      <p><strong>🌿 Moderate Vegetation:</strong> {data.moderate_vegetation_percentage}%</p>
                      <p><strong>📏 Field Regularity:</strong> {data.field_regularity_score}</p>
                      <p><strong>🩺 Crop Health:</strong> {data.crop_health}</p>
                      <p><em>Analysis Method: {data.analysis_method}</em></p>
                    </div>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      )}

      {result && (
        <details style={{ marginTop: 16 }}>
          <summary>Raw Detection Response</summary>
          <pre style={{ backgroundColor: '#f5f5f5', padding: 10, fontSize: 12 }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};

export default App;
