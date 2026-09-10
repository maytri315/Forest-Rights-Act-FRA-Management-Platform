import React, { useEffect, useRef, useState } from 'react';
import { Alert, Box, Typography } from '@mui/material';

const TestMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    let mapInstance: any = null;

    const loadMap = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const L = await import('leaflet');
        await import('leaflet/dist/leaflet.css');
        
        // Fix leaflet default markers
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        if (mapRef.current && !mapInstance) {
          // Small delay to ensure DOM is ready
          await new Promise(resolve => setTimeout(resolve, 100));
          
          mapInstance = L.map(mapRef.current, {
            center: [23.0, 78.0],
            zoom: 6,
          });

          // Add tile layer
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(mapInstance);

          // Add a test marker
          L.marker([23.0, 78.0])
            .addTo(mapInstance)
            .bindPopup('Test marker - Map loaded successfully!')
            .openPopup();

          setMapLoaded(true);
          setMapError(null);
        }
      } catch (error) {
        console.error('Map loading error:', error);
        setMapError(`Failed to load map: ${error}`);
      }
    };

    loadMap();

    // Cleanup
    return () => {
      if (mapInstance) {
        try {
          mapInstance.remove();
        } catch (e) {
          console.warn('Error removing map:', e);
        }
      }
    };
  }, []);

  if (mapError) {
    return (
      <Alert severity="error">
        <Typography variant="h6">Map Loading Error</Typography>
        <Typography variant="body2">{mapError}</Typography>
      </Alert>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {!mapLoaded && (
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
          <Typography>Loading map...</Typography>
        </Box>
      )}
      <div
        ref={mapRef}
        style={{ 
          height: '500px', 
          width: '100%',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}
      />
    </Box>
  );
};

export default TestMap;