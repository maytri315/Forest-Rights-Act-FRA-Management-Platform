import React from 'react';
import {
  Box,
  Typography,
  Paper
} from '@mui/material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`webgis-tabpanel-${index}`}
      aria-labelledby={`webgis-tab-${index}`}
      {...other}
    >
      {value === index && children}
    </div>
  );
}

const WebGISIntegrationPage: React.FC = () => {
  console.log('WebGIS Integration Page Loading...');
  
  const [tabValue, setTabValue] = useState(0);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(true);
  
  // Filter state
  const [filterValues, setFilterValues] = useState({
    selectedState: '',
    selectedDistricts: [],
    selectedTribalGroups: [],
    selectedClaimStatuses: [],
    selectedAssetTypes: [],
    activeLayers: ['boundaries', 'ifr', 'cfr']
  });

  // Mock filter options - replace with API calls
  const filterOptions = {
    states: [
      { id: '1', name: 'Madhya Pradesh', code: 'MP' },
      { id: '2', name: 'Tripura', code: 'TR' },
      { id: '3', name: 'Odisha', code: 'OD' },
      { id: '4', name: 'Telangana', code: 'TG' }
    ],
    districts: [
      { id: '101', name: 'Balaghat', state_id: '1' },
      { id: '102', name: 'Dindori', state_id: '1' },
      { id: '103', name: 'Mandla', state_id: '1' },
      { id: '201', name: 'Raigarh', state_id: '2' },
      { id: '202', name: 'Surguja', state_id: '2' }
    ],
    tribalGroups: [
      { id: '1', name: 'Gond' },
      { id: '2', name: 'Baiga' },
      { id: '3', name: 'Korku' },
      { id: '4', name: 'Bhil' },
      { id: '5', name: 'Sahariya' }
    ],
    claimStatuses: ['Approved', 'Pending', 'Under Review', 'Rejected', 'Resubmitted'],
    assetTypes: ['School', 'Hospital', 'Road', 'Water Tank', 'Community Center', 'Market']
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilterValues(newFilters);
  };

  const handleClearFilters = () => {
    setFilterValues({
      selectedState: '',
      selectedDistricts: [],
      selectedTribalGroups: [],
      selectedClaimStatuses: [],
      selectedAssetTypes: [],
      activeLayers: ['boundaries']
    });
  };

  const handleFeatureClick = (feature: any) => {
    console.log('Feature clicked:', feature);
    // Handle feature click - could show details modal, etc.
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: 2 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        🌍 WebGIS Integration System
      </Typography>
      
      <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
        Interactive Mapping & FRA Progress Tracking
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
        <Typography variant="body1">
          ✅ WebGIS Page is Loading Successfully!
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          This confirms the routing and basic component structure are working.
        </Typography>
      </Paper>

      
      <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          🗺️ Map Integration Status
        </Typography>
        <Typography variant="body2">
          Leaflet components will be loaded here. If you see this message, the basic page structure is working.
        </Typography>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          📊 Dashboard Components
        </Typography>
        <Typography variant="body2">
          FRA Progress tracking and analytics will be displayed here.
        </Typography>
      </Paper>
    </Box>
  );
};

export default WebGISIntegrationPage;