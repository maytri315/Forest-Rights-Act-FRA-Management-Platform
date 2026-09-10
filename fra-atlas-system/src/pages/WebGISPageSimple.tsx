import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  Button,
  Alert
} from '@mui/material';
import WebGISMapFixed from '../components/WebGISMapFixed';
import BasicMap from '../components/BasicMap';
import WebGISFilters from '../components/WebGISFilters';
import FRAProgressDashboard from '../components/FRAProgressDashboard';

// WebGIS Page with multiple map component options for testing

const WebGISPage: React.FC = () => {
  console.log('WebGIS Page is loading successfully!');
  const [showMapTest, setShowMapTest] = useState(false);
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [mapComponent, setMapComponent] = useState<'basic' | 'webgis' | 'simple'>('basic');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Filter state management
  const [filterValues, setFilterValues] = useState({
    selectedStates: [],
    selectedDistricts: [],
    selectedTribalGroups: [],
    selectedClaimStatuses: [],
    selectedAssetTypes: [],
    activeLayers: ['ifr', 'cfr', 'assets', 'boundaries']
  });

  const filterOptions = {
    states: [
      { id: '1', name: 'Madhya Pradesh', code: 'MP' },
      { id: '2', name: 'Tripura', code: 'TR' },
      { id: '3', name: 'Odisha', code: 'OR' },
      { id: '4', name: 'Telangana', code: 'TG' }
    ],
    districts: [
      { id: '1', name: 'Bhopal', state_id: '1' },
      { id: '2', name: 'Indore', state_id: '1' },
      { id: '3', name: 'Raipur', state_id: '2' }
    ],
    tribalGroups: [
      { id: '1', name: 'Gond' },
      { id: '2', name: 'Bhil' },
      { id: '3', name: 'Santhal' }
    ],
    claimStatuses: ['Approved', 'Pending', 'Rejected'],
    assetTypes: ['Forest', 'Agricultural', 'Water Bodies', 'Grazing Land']
  };

  const handleLoadMapTest = async () => {
    setMapLoadError(null);
    if (showMapTest) {
      setShowMapTest(false);
      return;
    }
    
    try {
      setMapKey(prev => prev + 1); // Force re-render with new key
      setShowMapTest(true);
      console.log(`Map component ready to render: ${mapComponent}`);
    } catch (error) {
      setMapLoadError(`Error: ${error}`);
    }
  };

  const handleFilterChange = (filters: any) => {
    setFilterValues(filters);
    console.log('Filters updated:', filters);
  };

  const handleClearFilters = () => {
    setFilterValues({
      selectedStates: [],
      selectedDistricts: [],
      selectedTribalGroups: [],
      selectedClaimStatuses: [],
      selectedAssetTypes: [],
      activeLayers: ['states', 'districts']
    });
  };

  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleToggleDashboard = () => {
    setShowDashboard(!showDashboard);
  };

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      
      // Force map resize when fullscreen changes
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    };

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyPress);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isFullscreen]);

  return (
    <Container maxWidth="lg" sx={{ py: isFullscreen ? 0 : 4 }}>
      {!isFullscreen && (
        <>
          <Typography variant="h2" component="h1" gutterBottom align="center" color="primary">
            🌍 WebGIS Integration System
          </Typography>
          
          <Typography variant="h5" align="center" sx={{ mb: 4, color: 'text.secondary' }}>
            Complete Interactive Forest Rights Act Mapping & Analytics Platform
          </Typography>
        </>
      )}



      <Paper elevation={3} sx={{ 
        p: isFullscreen ? 0 : 3, 
        mb: isFullscreen ? 0 : 3, 
        display: showMapTest ? 'block' : 'none',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        width: isFullscreen ? '100vw' : 'auto',
        height: isFullscreen ? '100vh' : 'auto',
        zIndex: isFullscreen ? 9998 : 'auto'
      }}>
        {!isFullscreen && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" color="primary">
              🗺️ Interactive WebGIS Map
            </Typography>
            <Button
              variant={isFullscreen ? "contained" : "outlined"}
              size="small"
            onClick={async () => {
              try {
                const mapContainer = document.getElementById('webgis-map-container');
                if (!mapContainer) {
                  console.error('Map container not found');
                  return;
                }

                if (document.fullscreenElement) {
                  await document.exitFullscreen();
                } else {
                  await mapContainer.requestFullscreen();
                }
                
                // Force map resize after fullscreen change and re-render maps
                setTimeout(() => {
                  setMapKey(prev => prev + 1); // Force re-render of maps
                  window.dispatchEvent(new Event('resize'));
                  // Force invalidateSize on Leaflet maps
                  const mapElements = mapContainer.getElementsByClassName('leaflet-container');
                  Array.from(mapElements).forEach((element) => {
                    const leafletMap = (element as any)?._leaflet_map;
                    leafletMap?.invalidateSize?.();
                  });
                }, 200);
              } catch (error) {
                console.error('Fullscreen error:', error);
                // Fallback for browsers that don't support fullscreen
                const mapContainer = document.getElementById('webgis-map-container');
                if (mapContainer) {
                  if (isFullscreen) {
                    mapContainer.style.position = 'relative';
                    mapContainer.style.width = '100%';
                    mapContainer.style.height = '500px';
                    mapContainer.style.zIndex = 'auto';
                    setIsFullscreen(false);
                  } else {
                    mapContainer.style.position = 'fixed';
                    mapContainer.style.top = '0';
                    mapContainer.style.left = '0';
                    mapContainer.style.width = '100vw';
                    mapContainer.style.height = '100vh';
                    mapContainer.style.zIndex = '9999';
                    mapContainer.style.backgroundColor = '#000';
                    setIsFullscreen(true);
                  }
                }
              }
            }}
            sx={{ minWidth: 'auto', px: 2 }}
          >
            {isFullscreen ? '🔲 Exit Fullscreen' : '⛶ Fullscreen'}
          </Button>
          </Box>
        )}
        <Box 
          id="webgis-map-container"
          sx={{ 
            height: isFullscreen ? '100vh' : '500px',
            width: isFullscreen ? '100vw' : '100%',
            border: isFullscreen ? 'none' : '1px solid #ddd', 
            borderRadius: isFullscreen ? 0 : 1, 
            position: isFullscreen ? 'fixed' : 'relative',
            top: isFullscreen ? 0 : 'auto',
            left: isFullscreen ? 0 : 'auto',
            zIndex: isFullscreen ? 9999 : 'auto',
            backgroundColor: '#f5f5f5',
            transition: 'all 0.3s ease',
            overflow: 'hidden',
            '&:fullscreen': {
              height: '100vh !important',
              width: '100vw !important',
              borderRadius: '0 !important',
              border: 'none !important',
              backgroundColor: '#f5f5f5 !important',
              padding: '0 !important',
              margin: '0 !important',
              position: 'fixed !important',
              top: '0 !important',
              left: '0 !important',
              zIndex: '9999 !important',
              overflow: 'hidden !important'
            },
            // Additional CSS for when container is programmatically fullscreen
            ...(isFullscreen ? {
              '& > *': {
                height: '100% !important',
                width: '100% !important'
              }
            } : {})
          }}
        >
          {showMapTest && mapComponent === 'basic' && (
            <BasicMap key={`${mapKey}-${isFullscreen}`} />
          )}
          {showMapTest && mapComponent === 'webgis' && (
            <WebGISMapFixed 
              key={`${mapKey}-${isFullscreen}`}
              selectedState=""
              selectedDistrict=""
              activeLayers={filterValues.activeLayers}
              onFeatureClick={(feature) => console.log('Feature clicked:', feature)}
            />
          )}
        </Box>
      </Paper>

      {showFilters && !isFullscreen && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            🔍 WebGIS Filters
          </Typography>
          <WebGISFilters
            filterOptions={filterOptions}
            filterValues={filterValues}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </Paper>
      )}

      {showDashboard && !isFullscreen && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            📊 FRA Progress Dashboard
          </Typography>
          <FRAProgressDashboard />
        </Paper>
      )}

      {!isFullscreen && (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          🔧 Map Controls
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Map Type:</Typography>
          <Button 
            variant={mapComponent === 'basic' ? 'contained' : 'outlined'}
            onClick={() => {
              setMapComponent('basic');
              setMapKey(prev => prev + 1);
            }}
            sx={{ mr: 1, mb: 1 }}
            size="small"
          >
            Basic Map
          </Button>
          <Button 
            variant={mapComponent === 'webgis' ? 'contained' : 'outlined'}
            onClick={() => {
              setMapComponent('webgis');
              setMapKey(prev => prev + 1);
            }}
            sx={{ mr: 1, mb: 1 }}
            size="small"
          >
            WebGIS Map
          </Button>
        </Box>

        <Button 
          variant="contained" 
          onClick={handleLoadMapTest}
          sx={{ mr: 2 }}
          color={showMapTest ? 'secondary' : 'primary'}
        >
          {showMapTest ? 'Hide Map' : 'Load Map'} ({mapComponent})
        </Button>

        <Button 
          variant="outlined"
          color="secondary"
          onClick={() => {
            setShowMapTest(false);
            setMapKey(prev => prev + 1);
            setMapLoadError(null);
          }}
          sx={{ mr: 2 }}
        >
          Reset Map
        </Button>

        <Button 
          variant="outlined" 
          onClick={handleToggleFilters}
          sx={{ mr: 2 }}
        >
          {showFilters ? 'Hide' : 'Show'} Filters
        </Button>

        <Button 
          variant="outlined"
          color="secondary"
          onClick={handleToggleDashboard}
          sx={{ mr: 2 }}
        >
          {showDashboard ? 'Hide' : 'Show'} Dashboard
        </Button>

        <Button 
          variant="outlined"
          size="small"
          onClick={() => {
            console.log('Fullscreen test:');
            console.log('- Current fullscreen state:', isFullscreen);
            console.log('- Document fullscreen element:', !!document.fullscreenElement);
            console.log('- Map container exists:', !!document.getElementById('webgis-map-container'));
            console.log('- Fullscreen API available:', !!document.documentElement.requestFullscreen);
          }}
          sx={{ mr: 2 }}
        >
          🔍 Test Fullscreen
        </Button>        {mapLoadError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Error:</strong> {mapLoadError}
            </Typography>
          </Alert>
        )}



        {!showMapTest && !mapLoadError && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Click the button above to test loading the WebGIS map component dynamically.
            </Typography>
          </Alert>
        )}
      </Paper>
      )}
    </Container>
  );
};

export default WebGISPage;