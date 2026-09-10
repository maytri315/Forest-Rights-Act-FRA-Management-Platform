import React from 'react';

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
}

const OverlayRenderer: React.FC<OverlayRendererProps> = ({ detections, imageId, showOverlay, showHeatmap = false }) => {
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

  // Get unique categories for legend
  const uniqueCategories = Array.from(new Set(detections.map((d: Detection) => d.type)))
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
        <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 'bold', color: '#333' }}>
          Detected Features
        </h4>
        {uniqueCategories.map((config, idx) => (
          <div key={idx} style={{
            display: 'flex',
            alignItems: 'center',
            margin: '4px 0',
            fontSize: '11px'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: config.color,
              marginRight: '6px',
              borderRadius: '2px',
              opacity: 0.8
            }} />
            <span style={{ color: '#555' }}>{config.label}</span>
          </div>
        ))}
      </div>

      {/* Overlay regions */}
      {detections.map((detection, index) => {
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
            {/* Subtle transparent overlay - no intrusive text/boxes */}
            {(showOverlay || showHeatmap) && (
              <div
                style={{
                  position: 'absolute',
                  left: `${x1}px`,
                  top: `${y1}px`,
                  width: `${width}px`,
                  height: `${height}px`,
                  backgroundColor: `${config.color}25`, // Very subtle transparency (15%)
                  border: showOverlay ? `1px solid ${config.color}60` : 'none', // Thin border if overlay mode
                  borderRadius: '3px',
                  zIndex: 50,
                  transition: 'opacity 0.3s ease',
                  opacity: showHeatmap ? 0.6 : 0.4, // Slightly more visible for heatmap
                  pointerEvents: 'none'
                }}
                title={`${config.label} (${confidence}%)`} // Tooltip on hover
              />
            )}
          </div>
        );
      })}
    </>
  );
};

export default OverlayRenderer;
