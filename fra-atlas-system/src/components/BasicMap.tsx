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

const BasicMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    console.log('BasicMap: useEffect called');
    
    // Cleanup function
    const cleanup = () => {
      if (mapInstance.current) {
        console.log('BasicMap: Cleaning up existing map');
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
        console.log('BasicMap: Initializing map');
        
        if (!mapRef.current) {
          throw new Error('Map container not found');
        }

        if (mapInstance.current) {
          console.log('BasicMap: Map already exists, cleaning up');
          cleanup();
        }

        console.log('BasicMap: Creating new map instance');
        mapInstance.current = L.map(mapRef.current).setView([23.0, 78.0], 6);

        // Listen for fullscreen changes
        document.addEventListener('fullscreenchange', handleResize);
        window.addEventListener('resize', handleResize);

        console.log('BasicMap: Adding tile layer');
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstance.current);

        console.log('BasicMap: Adding test marker');
        // Add sample FRA claims markers
        const fraClaimsData = [
          { lat: 23.0, lng: 78.0, name: 'IFR Claim - Ramesh Patel', status: 'Approved', area: '2.5 hectares' },
          { lat: 23.2, lng: 78.3, name: 'CFR Claim - Village Council', status: 'Pending', area: '15.0 hectares' },
          { lat: 22.8, lng: 77.8, name: 'IFR Claim - Sita Devi', status: 'Under Review', area: '1.8 hectares' }
        ];

        fraClaimsData.forEach(claim => {
          let color = '#2196F3'; // Default: Under Review
          if (claim.status === 'Approved') {
            color = '#4CAF50';
          } else if (claim.status === 'Pending') {
            color = '#FF9800';
          }
          
          L.circleMarker([claim.lat, claim.lng], {
            radius: 8,
            fillColor: color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
          })
          .addTo(mapInstance.current!)
          .bindPopup(`
            <div style="min-width: 200px;">
              <h4 style="margin: 0 0 8px 0; color: ${color};">${claim.name}</h4>
              <p style="margin: 4px 0;"><strong>Status:</strong> ${claim.status}</p>
              <p style="margin: 4px 0;"><strong>Area:</strong> ${claim.area}</p>
            </div>
          `);
        });

        // Map loaded successfully - no popup needed

        setStatus('success');
        setError('');
        console.log('BasicMap: Map initialized successfully');
      } catch (err) {
        console.error('BasicMap: Error initializing map:', err);
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
  }, []);

  if (status === 'error') {
    return (
      <Alert severity="error">
        <Typography variant="h6">Map Loading Failed</Typography>
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
          <Typography>Initializing map...</Typography>
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
              ✅ Map component loaded successfully! Check console for detailed logs.
            </Typography>
          </Alert>
        </Box>
      )}
    </Box>
  );
};

export default BasicMap;