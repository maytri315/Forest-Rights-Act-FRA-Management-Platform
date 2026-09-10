import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import L from 'leaflet';

// Fix leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface WebGISMapProps {
  selectedState?: string;
  selectedDistrict?: string;
  activeLayers: string[];
  onFeatureClick?: (feature: any) => void;
}

const WebGISMapFixed: React.FC<WebGISMapProps> = ({
  selectedState,
  selectedDistrict,
  activeLayers,
  onFeatureClick
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    console.log('WebGISMapFixed: useEffect called');
    
    // Cleanup function
    const cleanup = () => {
      if (mapInstance.current) {
        console.log('WebGISMapFixed: Cleaning up existing map');
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };

    // Handle fullscreen resize
    const handleResize = () => {
      if (mapInstance.current) {
        setTimeout(() => {
          mapInstance.current!.invalidateSize();
        }, 100);
      }
    };

    // Initialize map
    const initMap = () => {
      try {
        console.log('WebGISMapFixed: Initializing advanced WebGIS map');
        
        if (!mapRef.current) {
          throw new Error('Map container not found');
        }

        if (mapInstance.current) {
          cleanup();
        }

        // Create map with layer control
        mapInstance.current = L.map(mapRef.current).setView([23.0, 78.0], 6);

        // Listen for fullscreen changes
        document.addEventListener('fullscreenchange', handleResize);
        window.addEventListener('resize', handleResize);

        // Base layers
        const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        });

        const satellite = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
          attribution: '© Google'
        });

        // Add base layer
        osm.addTo(mapInstance.current);

        // Create layer control
        const baseLayers = {
          'OpenStreetMap': osm,
          'Satellite': satellite
        };

        const overlayLayers: Record<string, L.LayerGroup> = {};

        // State boundaries removed - inaccurate mock data

        // Add IFR claims layer if active
        if (activeLayers.includes('ifr')) {
          const ifrLayer = L.layerGroup();
          
          const ifrClaims = [
            // Madhya Pradesh
            { lat: 23.2, lng: 78.5, name: 'IFR-001: Ramesh Patel', status: 'Approved', area: '2.5 ha', state: 'Madhya Pradesh', district: 'Bhopal' },
            { lat: 24.0, lng: 79.0, name: 'IFR-002: Sita Devi', status: 'Pending', area: '1.8 ha', state: 'Madhya Pradesh', district: 'Jabalpur' },
            { lat: 22.5, lng: 77.5, name: 'IFR-003: Kumar Singh', status: 'Under Review', area: '3.2 ha', state: 'Madhya Pradesh', district: 'Indore' },
            // Odisha
            { lat: 20.2, lng: 85.8, name: 'IFR-004: Arjun Majhi', status: 'Approved', area: '1.9 ha', state: 'Odisha', district: 'Bhubaneswar' },
            { lat: 21.5, lng: 84.0, name: 'IFR-005: Kamala Sahu', status: 'Pending', area: '2.8 ha', state: 'Odisha', district: 'Sambalpur' },
            // Telangana
            { lat: 17.4, lng: 78.5, name: 'IFR-006: Ravi Goud', status: 'Approved', area: '2.2 ha', state: 'Telangana', district: 'Hyderabad' },
            { lat: 18.1, lng: 79.1, name: 'IFR-007: Lakshmi Reddy', status: 'Under Review', area: '3.0 ha', state: 'Telangana', district: 'Warangal' },
            // Tripura
            { lat: 23.8, lng: 91.3, name: 'IFR-008: Biplab Debbarma', status: 'Approved', area: '1.5 ha', state: 'Tripura', district: 'Agartala' },
            { lat: 24.2, lng: 92.0, name: 'IFR-009: Sukla Tripura', status: 'Pending', area: '2.1 ha', state: 'Tripura', district: 'Dharmanagar' }
          ];

          const getStatusColor = (status: string) => {
            if (status === 'Approved') return '#4CAF50';
            if (status === 'Pending') return '#FF9800';
            return '#2196F3';
          };

          ifrClaims.forEach(claim => {
            const color = getStatusColor(claim.status);
            
            L.circleMarker([claim.lat, claim.lng], {
              radius: 10,
              fillColor: color,
              color: '#fff',
              weight: 3,
              opacity: 1,
              fillOpacity: 0.8
            })
            .bindPopup(`
              <div style="min-width: 200px;">
                <h4 style="margin: 0 0 8px 0; color: ${color};">Individual Forest Rights</h4>
                <p style="margin: 4px 0;"><strong>Claim:</strong> ${claim.name}</p>
                <p style="margin: 4px 0;"><strong>Status:</strong> ${claim.status}</p>
                <p style="margin: 4px 0;"><strong>Area:</strong> ${claim.area}</p>
                <p style="margin: 4px 0;"><strong>State:</strong> ${claim.state}</p>
                <p style="margin: 4px 0;"><strong>District:</strong> ${claim.district}</p>
              </div>
            `)
            .addTo(ifrLayer);
          });
          
          overlayLayers['IFR Claims'] = ifrLayer;
          ifrLayer.addTo(mapInstance.current);
        }

        // Add CFR claims layer if active
        if (activeLayers.includes('cfr')) {
          const cfrLayer = L.layerGroup();
          
          const cfrClaims = [
            // Madhya Pradesh
            { lat: 23.5, lng: 78.2, name: 'CFR-001: Ghughri Village Council', status: 'Approved', area: '15.0 ha', state: 'Madhya Pradesh', district: 'Balaghat' },
            { lat: 24.2, lng: 79.5, name: 'CFR-002: Majhgawan Community Forest', status: 'Pending', area: '28.5 ha', state: 'Madhya Pradesh', district: 'Satna' },
            // Odisha
            { lat: 20.8, lng: 85.2, name: 'CFR-003: Similipal Community Reserve', status: 'Approved', area: '45.2 ha', state: 'Odisha', district: 'Mayurbhanj' },
            { lat: 19.3, lng: 84.8, name: 'CFR-004: Koraput Tribal Council', status: 'Under Review', area: '32.1 ha', state: 'Odisha', district: 'Koraput' },
            // Telangana
            { lat: 17.8, lng: 78.8, name: 'CFR-005: Medak Forest Committee', status: 'Approved', area: '22.3 ha', state: 'Telangana', district: 'Medak' },
            { lat: 18.5, lng: 79.8, name: 'CFR-006: Adilabad Community Forest', status: 'Pending', area: '38.7 ha', state: 'Telangana', district: 'Adilabad' },
            // Tripura
            { lat: 23.6, lng: 91.6, name: 'CFR-007: Khowai Tribal Area', status: 'Approved', area: '18.9 ha', state: 'Tripura', district: 'Khowai' },
            { lat: 24.0, lng: 91.9, name: 'CFR-008: Dhalai Community Reserve', status: 'Under Review', area: '25.4 ha', state: 'Tripura', district: 'Dhalai' }
          ];

          cfrClaims.forEach(claim => {
            const color = claim.status === 'Approved' ? '#8BC34A' : '#FFC107';
            
            L.marker([claim.lat, claim.lng], {
              icon: L.divIcon({
                html: `<div style="background: ${color}; border: 3px solid white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 10px;">C</div>`,
                className: 'custom-div-icon',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              })
            })
            .bindPopup(`
              <div style="min-width: 200px;">
                <h4 style="margin: 0 0 8px 0; color: ${color};">Community Forest Rights</h4>
                <p style="margin: 4px 0;"><strong>Claim:</strong> ${claim.name}</p>
                <p style="margin: 4px 0;"><strong>Status:</strong> ${claim.status}</p>
                <p style="margin: 4px 0;"><strong>Area:</strong> ${claim.area}</p>
                <p style="margin: 4px 0;"><strong>State:</strong> ${claim.state}</p>
                <p style="margin: 4px 0;"><strong>District:</strong> ${claim.district}</p>
              </div>
            `)
            .addTo(cfrLayer);
          });
          
          overlayLayers['CFR Claims'] = cfrLayer;
          cfrLayer.addTo(mapInstance.current);
        }

        // Add Village Assets layer if active
        if (activeLayers.includes('assets')) {
          const assetsLayer = L.layerGroup();
          
          const villageAssets = [
            // Madhya Pradesh
            { lat: 23.3, lng: 78.3, name: 'Primary School', type: 'School', condition: 'Good', state: 'Madhya Pradesh', village: 'Ghughri' },
            { lat: 23.4, lng: 78.6, name: 'Community Health Center', type: 'Hospital', condition: 'Fair', state: 'Madhya Pradesh', village: 'Majhgawan' },
            { lat: 24.1, lng: 79.2, name: 'Village Water Tank', type: 'Water', condition: 'Good', state: 'Madhya Pradesh', village: 'Satna Village' },
            // Odisha
            { lat: 20.3, lng: 85.9, name: 'Anganwadi Center', type: 'School', condition: 'Good', state: 'Odisha', village: 'Bhuban' },
            { lat: 21.6, lng: 84.1, name: 'Primary Health Center', type: 'Hospital', condition: 'Poor', state: 'Odisha', village: 'Sambalpur Rural' },
            { lat: 19.4, lng: 84.9, name: 'Hand Pump', type: 'Water', condition: 'Fair', state: 'Odisha', village: 'Koraput Village' },
            // Telangana
            { lat: 17.5, lng: 78.6, name: 'Government School', type: 'School', condition: 'Excellent', state: 'Telangana', village: 'Medak Village' },
            { lat: 18.2, lng: 79.2, name: 'Rural Hospital', type: 'Hospital', condition: 'Good', state: 'Telangana', village: 'Warangal Rural' },
            { lat: 17.9, lng: 78.9, name: 'Borewell', type: 'Water', condition: 'Good', state: 'Telangana', village: 'Nizamabad Village' },
            // Tripura
            { lat: 23.9, lng: 91.4, name: 'Tribal School', type: 'School', condition: 'Fair', state: 'Tripura', village: 'Agartala Rural' },
            { lat: 24.3, lng: 92.1, name: 'Sub-Health Center', type: 'Hospital', condition: 'Poor', state: 'Tripura', village: 'Dharmanagar Village' },
            { lat: 23.7, lng: 91.7, name: 'Community Well', type: 'Water', condition: 'Good', state: 'Tripura', village: 'Khowai Village' }
          ];

          const assetIcons: Record<string, string> = {
            'School': '🏫',
            'Hospital': '🏥',
            'Water': '🚰',
            'Road': '🛣️'
          };

          villageAssets.forEach(asset => {
            const conditionColor = asset.condition === 'Excellent' ? '#4CAF50' : 
                                  asset.condition === 'Good' ? '#8BC34A' :
                                  asset.condition === 'Fair' ? '#FF9800' : '#F44336';
            
            L.marker([asset.lat, asset.lng], {
              icon: L.divIcon({
                html: `<div style="background: ${conditionColor}; border: 2px solid white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${assetIcons[asset.type] || '📍'}</div>`,
                className: 'custom-asset-icon',
                iconSize: [25, 25],
                iconAnchor: [12, 12]
              })
            })
            .bindPopup(`
              <div style="min-width: 200px;">
                <h4 style="margin: 0 0 8px 0; color: ${conditionColor};">Village Asset</h4>
                <p style="margin: 4px 0;"><strong>Asset:</strong> ${asset.name}</p>
                <p style="margin: 4px 0;"><strong>Type:</strong> ${asset.type}</p>
                <p style="margin: 4px 0;"><strong>Condition:</strong> ${asset.condition}</p>
                <p style="margin: 4px 0;"><strong>Village:</strong> ${asset.village}</p>
                <p style="margin: 4px 0;"><strong>State:</strong> ${asset.state}</p>
              </div>
            `)
            .addTo(assetsLayer);
          });
          
          overlayLayers['Village Assets'] = assetsLayer;
          if (activeLayers.includes('assets')) assetsLayer.addTo(mapInstance.current);
        }

        // Add Forest Cover layer if active
        if (activeLayers.includes('forest')) {
          const forestLayer = L.layerGroup();
          
          const forestAreas = [
            // Madhya Pradesh
            { lat: 23.1, lng: 78.1, name: 'Kanha National Park Buffer', density: 'Dense Forest', area: '125 ha', state: 'Madhya Pradesh' },
            { lat: 24.3, lng: 79.3, name: 'Bandhavgarh Reserve', density: 'Very Dense Forest', area: '89 ha', state: 'Madhya Pradesh' },
            { lat: 22.4, lng: 77.4, name: 'Satpura Hills Forest', density: 'Open Forest', area: '156 ha', state: 'Madhya Pradesh' },
            // Odisha
            { lat: 20.9, lng: 85.1, name: 'Similipal Forest Reserve', density: 'Very Dense Forest', area: '234 ha', state: 'Odisha' },
            { lat: 19.2, lng: 84.7, name: 'Eastern Ghats Forest', density: 'Dense Forest', area: '178 ha', state: 'Odisha' },
            { lat: 21.4, lng: 83.9, name: 'Mahanadi Forest', density: 'Open Forest', area: '98 ha', state: 'Odisha' },
            // Telangana
            { lat: 17.7, lng: 78.7, name: 'Nallamala Forest', density: 'Dense Forest', area: '145 ha', state: 'Telangana' },
            { lat: 18.4, lng: 79.7, name: 'Kawal Wildlife Sanctuary', density: 'Very Dense Forest', area: '112 ha', state: 'Telangana' },
            // Tripura
            { lat: 23.5, lng: 91.5, name: 'Trishna Wildlife Sanctuary', density: 'Dense Forest', area: '67 ha', state: 'Tripura' },
            { lat: 24.1, lng: 91.8, name: 'Sepahijala Forest', density: 'Open Forest', area: '45 ha', state: 'Tripura' }
          ];

          forestAreas.forEach(forest => {
            const densityColor = forest.density === 'Very Dense Forest' ? '#1B5E20' : 
                               forest.density === 'Dense Forest' ? '#2E7D32' : '#66BB6A';
            
            L.circle([forest.lat, forest.lng], {
              radius: 2000,
              fillColor: densityColor,
              color: '#4CAF50',
              weight: 2,
              opacity: 0.8,
              fillOpacity: 0.4
            })
            .bindPopup(`
              <div style="min-width: 200px;">
                <h4 style="margin: 0 0 8px 0; color: ${densityColor};">Forest Cover</h4>
                <p style="margin: 4px 0;"><strong>Area:</strong> ${forest.name}</p>
                <p style="margin: 4px 0;"><strong>Density:</strong> ${forest.density}</p>
                <p style="margin: 4px 0;"><strong>Coverage:</strong> ${forest.area}</p>
                <p style="margin: 4px 0;"><strong>State:</strong> ${forest.state}</p>
              </div>
            `)
            .addTo(forestLayer);
          });
          
          overlayLayers['Forest Cover'] = forestLayer;
          if (activeLayers.includes('forest')) forestLayer.addTo(mapInstance.current);
        }

        // Add Tribal Areas layer if active
        if (activeLayers.includes('tribal')) {
          const tribalLayer = L.layerGroup();
          
          const tribalAreas = [
            // Madhya Pradesh
            { lat: 23.0, lng: 78.0, name: 'Gond Tribal Area', population: 1250, households: 285, tribe: 'Gond', state: 'Madhya Pradesh' },
            { lat: 24.0, lng: 79.0, name: 'Bhil Community', population: 980, households: 220, tribe: 'Bhil', state: 'Madhya Pradesh' },
            { lat: 22.6, lng: 77.6, name: 'Korku Settlement', population: 750, households: 165, tribe: 'Korku', state: 'Madhya Pradesh' },
            // Odisha
            { lat: 20.1, lng: 85.7, name: 'Santhal Village', population: 1100, households: 245, tribe: 'Santhal', state: 'Odisha' },
            { lat: 21.3, lng: 84.2, name: 'Kondh Community', population: 850, households: 190, tribe: 'Kondh', state: 'Odisha' },
            { lat: 19.5, lng: 84.6, name: 'Ho Tribal Area', population: 650, households: 145, tribe: 'Ho', state: 'Odisha' },
            // Telangana
            { lat: 17.6, lng: 78.4, name: 'Lambadi Settlement', population: 920, households: 205, tribe: 'Lambadi', state: 'Telangana' },
            { lat: 18.3, lng: 79.4, name: 'Gond Community', population: 1180, households: 260, tribe: 'Gond', state: 'Telangana' },
            // Tripura
            { lat: 23.8, lng: 91.2, name: 'Tripuri Village', population: 580, households: 125, tribe: 'Tripuri', state: 'Tripura' },
            { lat: 24.2, lng: 91.9, name: 'Reang Settlement', population: 420, households: 95, tribe: 'Reang', state: 'Tripura' }
          ];

          tribalAreas.forEach(area => {
            L.circleMarker([area.lat, area.lng], {
              radius: 15,
              fillColor: '#9C27B0',
              color: '#fff',
              weight: 3,
              opacity: 1,
              fillOpacity: 0.7
            })
            .bindPopup(`
              <div style="min-width: 200px;">
                <h4 style="margin: 0 0 8px 0; color: #9C27B0;">Tribal Area</h4>
                <p style="margin: 4px 0;"><strong>Community:</strong> ${area.name}</p>
                <p style="margin: 4px 0;"><strong>Tribe:</strong> ${area.tribe}</p>
                <p style="margin: 4px 0;"><strong>Population:</strong> ${area.population}</p>
                <p style="margin: 4px 0;"><strong>Households:</strong> ${area.households}</p>
                <p style="margin: 4px 0;"><strong>State:</strong> ${area.state}</p>
              </div>
            `)
            .addTo(tribalLayer);
          });
          
          overlayLayers['Tribal Areas'] = tribalLayer;
          if (activeLayers.includes('tribal')) tribalLayer.addTo(mapInstance.current);
        }

        // Add Administrative Boundaries layer if active (districts)
        if (activeLayers.includes('boundaries')) {
          const boundariesLayer = L.layerGroup();
          
          const districts = [
            // Madhya Pradesh districts
            { name: 'Bhopal', lat: 23.2599, lng: 77.4126, state: 'Madhya Pradesh', population: 2368145, area: '2772 sq km' },
            { name: 'Indore', lat: 22.7196, lng: 75.8577, state: 'Madhya Pradesh', population: 3276697, area: '3898 sq km' },
            { name: 'Jabalpur', lat: 23.1815, lng: 79.9864, state: 'Madhya Pradesh', population: 2463289, area: '5211 sq km' },
            // Odisha districts  
            { name: 'Bhubaneswar', lat: 20.2961, lng: 85.8245, state: 'Odisha', population: 1648032, area: '2788 sq km' },
            { name: 'Cuttack', lat: 20.4625, lng: 85.8828, state: 'Odisha', population: 2624470, area: '3932 sq km' },
            { name: 'Sambalpur', lat: 21.4669, lng: 83.9812, state: 'Odisha', population: 1041099, area: '6657 sq km' },
            // Telangana districts
            { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, state: 'Telangana', population: 6809970, area: '650 sq km' },
            { name: 'Warangal', lat: 17.9689, lng: 79.5941, state: 'Telangana', population: 1197814, area: '12846 sq km' },
            { name: 'Nizamabad', lat: 18.6725, lng: 78.0941, state: 'Telangana', population: 2551335, area: '7956 sq km' },
            // Tripura districts
            { name: 'Agartala', lat: 23.8315, lng: 91.2868, state: 'Tripura', population: 1205025, area: '3084 sq km' },
            { name: 'Dharmanagar', lat: 24.3697, lng: 92.1693, state: 'Tripura', population: 418880, area: '2799 sq km' }
          ];

          districts.forEach(district => {
            L.marker([district.lat, district.lng], {
              icon: L.divIcon({
                html: `<div style="background: #FF5722; border: 2px solid white; border-radius: 4px; padding: 2px 6px; color: white; font-weight: bold; font-size: 10px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${district.name}</div>`,
                className: 'district-label',
                iconSize: [80, 20],
                iconAnchor: [40, 10]
              })
            })
            .bindPopup(`
              <div style="min-width: 200px;">
                <h4 style="margin: 0 0 8px 0; color: #FF5722;">District Headquarters</h4>
                <p style="margin: 4px 0;"><strong>District:</strong> ${district.name}</p>
                <p style="margin: 4px 0;"><strong>State:</strong> ${district.state}</p>
                <p style="margin: 4px 0;"><strong>Population:</strong> ${district.population.toLocaleString()}</p>
                <p style="margin: 4px 0;"><strong>Area:</strong> ${district.area}</p>
              </div>
            `)
            .addTo(boundariesLayer);
          });
          
          overlayLayers['Administrative Boundaries'] = boundariesLayer;
          if (activeLayers.includes('boundaries')) boundariesLayer.addTo(mapInstance.current);
        }

        // Add layer control
        L.control.layers(baseLayers, overlayLayers).addTo(mapInstance.current);

        // WebGIS system ready - no popup needed

        setStatus('success');
        setError('');
        console.log('WebGISMapFixed: Advanced map initialized successfully');
      } catch (err) {
        console.error('WebGISMapFixed: Error initializing map:', err);
        setStatus('error');
        setError(String(err));
      }
    };

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(initMap, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('fullscreenchange', handleResize);
      window.removeEventListener('resize', handleResize);
      cleanup();
    };
  }, [activeLayers, onFeatureClick]); // Re-run when activeLayers changes

  if (status === 'error') {
    return (
      <Alert severity="error">
        <Typography variant="h6">Advanced WebGIS Map Loading Failed</Typography>
        <Typography variant="body2">{error}</Typography>
      </Alert>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {status === 'loading' && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            bgcolor: 'background.paper',
            p: 2,
            borderRadius: 1,
            boxShadow: 2
          }}
        >
          <Typography>Loading advanced WebGIS system...</Typography>
        </Box>
      )}
      
      <div
        ref={mapRef}
        style={{ 
          height: '100%', 
          width: '100%',
          minHeight: document.fullscreenElement ? '100vh' : '500px',
          border: 'none',
          borderRadius: '0',
          backgroundColor: '#f5f5f5',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
      />
      
      {status === 'success' && (
        <Box sx={{ mt: 1 }}>
          <Alert severity="success">
            <Typography variant="body2">
              ✅ Advanced WebGIS map loaded! Active layers: {activeLayers.join(', ')}
            </Typography>
          </Alert>
        </Box>
      )}
    </Box>
  );
};

export default WebGISMapFixed;