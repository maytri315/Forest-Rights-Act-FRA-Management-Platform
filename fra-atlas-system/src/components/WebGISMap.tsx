import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, LayersControl } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapLayerProps {
  selectedState?: string;
  selectedDistrict?: string;
  activeLayers: string[];
  onFeatureClick?: (feature: any) => void;
}

interface GISFeature {
  type: string;
  features: any[];
}

const WebGISMap: React.FC<MapLayerProps> = ({
  selectedState,
  selectedDistrict,
  activeLayers,
  onFeatureClick
}) => {
  const [statesData, setStatesData] = useState<GISFeature | null>(null);
  const [districtsData, setDistrictsData] = useState<GISFeature | null>(null);
  const [villagesData, setVillagesData] = useState<GISFeature | null>(null);
  const [ifrData, setIfrData] = useState<GISFeature | null>(null);
  const [cfrData, setCfrData] = useState<GISFeature | null>(null);
  const [assetsData, setAssetsData] = useState<GISFeature | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLngExpression>([23.0, 78.0]);
  const [mapZoom, setMapZoom] = useState(5);
  const mapRef = useRef<L.Map | null>(null);
  const containerKey = useRef(Math.random().toString(36));

  // Mock API calls - replace with actual API endpoints
  const fetchGISData = useCallback(async (endpoint: string): Promise<GISFeature> => {
    // Mock data - replace with actual API calls
    const mockData: Record<string, GISFeature> = {
      '/gis/layers/states': {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              id: '1',
              name: 'Madhya Pradesh',
              code: 'MP',
              population: 72597565,
              forest_area: 77700
            },
            geometry: {
              type: 'MultiPolygon',
              coordinates: [[[[77.0, 22.0], [82.0, 22.0], [82.0, 26.0], [77.0, 26.0], [77.0, 22.0]]]]
            }
          },
          {
            type: 'Feature', 
            properties: {
              id: '2',
              name: 'Tripura',
              code: 'TR',
              population: 3673032,
              forest_area: 8073
            },
            geometry: {
              type: 'MultiPolygon',
              coordinates: [[[[91.0, 23.0], [92.5, 23.0], [92.5, 24.5], [91.0, 24.5], [91.0, 23.0]]]]
            }
          },
          {
            type: 'Feature', 
            properties: {
              id: '3',
              name: 'Odisha',
              code: 'OR',
              population: 42009962,
              forest_area: 51619
            },
            geometry: {
              type: 'MultiPolygon',
              coordinates: [[[[83.0, 17.5], [87.5, 17.5], [87.5, 22.5], [83.0, 22.5], [83.0, 17.5]]]]
            }
          },
          {
            type: 'Feature', 
            properties: {
              id: '4',
              name: 'Telangana',
              code: 'TG',
              population: 35193978,
              forest_area: 24295
            },
            geometry: {
              type: 'MultiPolygon',
              coordinates: [[[[77.0, 15.5], [81.0, 15.5], [81.0, 19.5], [77.0, 19.5], [77.0, 15.5]]]]
            }
          }
        ]
      },
      '/gis/layers/districts/1': {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              id: '101',
              name: 'Balaghat',
              state_id: '1',
              tribal_population: 493456,
              fra_progress: 65.5
            },
            geometry: {
              type: 'MultiPolygon',
              coordinates: [[[[80.0, 21.5], [81.0, 21.5], [81.0, 22.5], [80.0, 22.5], [80.0, 21.5]]]]
            }
          }
        ]
      },
      '/gis/layers/villages/101?layer_type=boundaries': {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              id: '1001',
              name: 'Ghughri',
              population: 1250,
              tribal_population: 980,
              fra_applicable: true
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[[80.1, 21.6], [80.2, 21.6], [80.2, 21.7], [80.1, 21.7], [80.1, 21.6]]]
            }
          }
        ]
      },
      '/gis/layers/villages/101?layer_type=ifr': {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              id: 'IFR001',
              village_name: 'Ghughri',
              claimant_name: 'Ramesh Patel',
              area_hectares: 2.5,
              status: 'Approved',
              claim_type: 'IFR'
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[[80.1, 21.6], [80.15, 21.6], [80.15, 21.65], [80.1, 21.65], [80.1, 21.6]]]
            }
          }
        ]
      },
      '/gis/layers/villages/101?layer_type=cfr': {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              id: 'CFR001',
              village_name: 'Majhgawan',
              area_hectares: 150.0,
              status: 'Under Review',
              claim_type: 'CFR',
              households_benefited: 45
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[[80.3, 21.8], [80.5, 21.8], [80.5, 22.0], [80.3, 22.0], [80.3, 21.8]]]
            }
          }
        ]
      },
      '/gis/layers/villages/101?layer_type=assets': {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              id: 'ASSET001',
              asset_type: 'School',
              name: 'Government Primary School',
              village: 'Ghughri',
              condition: 'Good',
              detection_method: 'AI Detection'
            },
            geometry: {
              type: 'Point',
              coordinates: [80.15, 21.65]
            }
          }
        ]
      }
    };

    return mockData[endpoint] || { type: 'FeatureCollection', features: [] };
  }, []);

  // Load states data
  useEffect(() => {
    fetchGISData('/gis/layers/states').then(setStatesData);
  }, [fetchGISData]);

  // Load districts data when state is selected
  useEffect(() => {
    if (selectedState) {
      fetchGISData(`/gis/layers/districts/${selectedState}`).then(setDistrictsData);
      setMapCenter([23.0, 79.0]);
      setMapZoom(7);
    } else {
      setDistrictsData(null);
    }
  }, [selectedState, fetchGISData]);

  // Load village data when district is selected
  useEffect(() => {
    if (selectedDistrict) {
      fetchGISData(`/gis/layers/villages/${selectedDistrict}?layer_type=boundaries`).then(setVillagesData);
      setMapCenter([21.8, 80.2]);
      setMapZoom(10);
    } else {
      setVillagesData(null);
    }
  }, [selectedDistrict, fetchGISData]);

  // Load layer-specific data
  useEffect(() => {
    if (selectedDistrict && activeLayers.includes('ifr')) {
      fetchGISData(`/gis/layers/villages/${selectedDistrict}?layer_type=ifr`).then(setIfrData);
    } else {
      setIfrData(null);
    }

    if (selectedDistrict && activeLayers.includes('cfr')) {
      fetchGISData(`/gis/layers/villages/${selectedDistrict}?layer_type=cfr`).then(setCfrData);
    } else {
      setCfrData(null);
    }

    if (selectedDistrict && activeLayers.includes('assets')) {
      fetchGISData(`/gis/layers/villages/${selectedDistrict}?layer_type=assets`).then(setAssetsData);
    } else {
      setAssetsData(null);
    }
  }, [selectedDistrict, activeLayers, fetchGISData]);

  // Style functions for different layer types
  const getStateStyle = () => ({
    fillColor: '#4CAF50',
    weight: 2,
    opacity: 1,
    color: '#2E7D32',
    dashArray: '',
    fillOpacity: 0.3
  });

  const getDistrictStyle = () => ({
    fillColor: '#2196F3',
    weight: 2,
    opacity: 1,
    color: '#1565C0',
    dashArray: '',
    fillOpacity: 0.4
  });

  const getVillageStyle = (feature: any) => ({
    fillColor: feature.properties.fra_applicable ? '#FF9800' : '#9E9E9E',
    weight: 1,
    opacity: 1,
    color: '#F57C00',
    dashArray: '',
    fillOpacity: 0.5
  });

  const getIfrStyle = (feature: any) => {
    const statusColors: Record<string, string> = {
      'Approved': '#4CAF50',
      'Under Review': '#FF9800',
      'Rejected': '#F44336',
      'Pending': '#9E9E9E'
    };
    return {
      fillColor: statusColors[feature.properties.status] || '#9E9E9E',
      weight: 2,
      opacity: 1,
      color: '#2E7D32',
      dashArray: '5,5',
      fillOpacity: 0.6
    };
  };

  const getCfrStyle = (feature: any) => {
    const statusColors: Record<string, string> = {
      'Approved': '#8BC34A',
      'Under Review': '#FFC107',
      'Rejected': '#E91E63',
      'Pending': '#607D8B'
    };
    return {
      fillColor: statusColors[feature.properties.status] || '#607D8B',
      weight: 2,
      opacity: 1,
      color: '#388E3C',
      dashArray: '10,5',
      fillOpacity: 0.6
    };
  };

  // Event handlers
  const onEachFeature = (feature: any, layer: any) => {
    layer.on({
      click: () => {
        if (onFeatureClick) {
          onFeatureClick(feature);
        }
      }
    });
  };

  // Custom popup content
  const getPopupContent = (feature: any) => {
    const props = feature.properties;
    
    if (props.claim_type) {
      // IFR/CFR claim popup
      return `
        <div>
          <h4>${props.claim_type} Claim</h4>
          <p><strong>Village:</strong> ${props.village_name}</p>
          <p><strong>Claimant:</strong> ${props.claimant_name || 'Community'}</p>
          <p><strong>Area:</strong> ${props.area_hectares} hectares</p>
          <p><strong>Status:</strong> ${props.status}</p>
          ${props.households_benefited ? `<p><strong>Households:</strong> ${props.households_benefited}</p>` : ''}
        </div>
      `;
    } else if (props.asset_type) {
      // Asset popup
      return `
        <div>
          <h4>${props.asset_type}</h4>
          <p><strong>Name:</strong> ${props.name}</p>
          <p><strong>Village:</strong> ${props.village}</p>
          <p><strong>Condition:</strong> ${props.condition}</p>
          <p><strong>Detection:</strong> ${props.detection_method}</p>
        </div>
      `;
    } else {
      // Administrative boundary popup
      return `
        <div>
          <h4>${props.name}</h4>
          ${props.population ? `<p><strong>Population:</strong> ${props.population.toLocaleString()}</p>` : ''}
          ${props.tribal_population ? `<p><strong>Tribal Population:</strong> ${props.tribal_population.toLocaleString()}</p>` : ''}
          ${props.forest_area ? `<p><strong>Forest Area:</strong> ${props.forest_area} sq km</p>` : ''}
          ${props.fra_progress ? `<p><strong>FRA Progress:</strong> ${props.fra_progress}%</p>` : ''}
        </div>
      `;
    }
  };

  return (
    <MapContainer
      key={containerKey.current}
      center={mapCenter}
      zoom={mapZoom}
      style={{ height: '600px', width: '100%' }}
      ref={mapRef}
    >
      <LayersControl position="topright">
        {/* Base layers */}
        <LayersControl.BaseLayer checked name="OpenStreetMap">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
        
        <LayersControl.BaseLayer name="Satellite">
          <TileLayer
            attribution='&copy; <a href="https://www.google.com/maps">Google</a>'
            url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
          />
        </LayersControl.BaseLayer>

        {/* Administrative layers */}
        {statesData && (
          <LayersControl.Overlay checked name="States">
            <GeoJSON
              data={statesData as any}
              style={getStateStyle}
              onEachFeature={(feature, layer) => {
                onEachFeature(feature, layer);
                layer.bindPopup(getPopupContent(feature));
              }}
            />
          </LayersControl.Overlay>
        )}

        {districtsData && (
          <LayersControl.Overlay checked name="Districts">
            <GeoJSON
              data={districtsData as any}
              style={getDistrictStyle}
              onEachFeature={(feature: any, layer: any) => {
                onEachFeature(feature, layer);
                layer.bindPopup(getPopupContent(feature));
              }}
            />
          </LayersControl.Overlay>
        )}

        {villagesData && (
          <LayersControl.Overlay checked name="Villages">
            <GeoJSON
              data={villagesData as any}
              style={getVillageStyle}
              onEachFeature={(feature: any, layer: any) => {
                onEachFeature(feature, layer);
                layer.bindPopup(getPopupContent(feature));
              }}
            />
          </LayersControl.Overlay>
        )}

        {/* FRA layers */}
        {ifrData && (
          <LayersControl.Overlay checked name="IFR Claims">
            <GeoJSON
              data={ifrData as any}
              style={getIfrStyle}
              onEachFeature={(feature: any, layer: any) => {
                onEachFeature(feature, layer);
                layer.bindPopup(getPopupContent(feature));
              }}
            />
          </LayersControl.Overlay>
        )}

        {cfrData && (
          <LayersControl.Overlay checked name="CFR Claims">
            <GeoJSON
              data={cfrData as any}
              style={getCfrStyle}
              onEachFeature={(feature: any, layer: any) => {
                onEachFeature(feature, layer);
                layer.bindPopup(getPopupContent(feature));
              }}
            />
          </LayersControl.Overlay>
        )}

        {/* Assets layer */}
        {assetsData && (
          <LayersControl.Overlay name="Village Assets">
            <GeoJSON
              data={assetsData as any}
              pointToLayer={(feature: any, latlng: any) => {
                const assetIcons: Record<string, string> = {
                  'School': '🏫',
                  'Hospital': '🏥',
                  'Road': '🛣️',
                  'Water Tank': '🚰'
                };
                
                return L.marker(latlng, {
                  icon: L.divIcon({
                    html: `<div style="background: white; border-radius: 50%; padding: 2px; font-size: 16px;">
                            ${assetIcons[feature.properties.asset_type] || '📍'}
                           </div>`,
                    className: 'custom-div-icon',
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                  })
                });
              }}
              onEachFeature={(feature: any, layer: any) => {
                onEachFeature(feature, layer);
                layer.bindPopup(getPopupContent(feature));
              }}
            />
          </LayersControl.Overlay>
        )}
      </LayersControl>
    </MapContainer>
  );
};

export default WebGISMap;