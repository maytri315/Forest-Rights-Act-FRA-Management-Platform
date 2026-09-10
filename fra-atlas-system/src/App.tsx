import { useState } from 'react';
import {
  Box,
  ThemeProvider,
  createTheme,
  CssBaseline
} from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import FRADataPage from './pages/FRADataPage';
import AtlasPage from './pages/AtlasPage';
import AIProcessingPage from './pages/AIProcessingPage';
import AssetMappingPage from './pages/AssetMappingPage';
import DSSPage from './pages/DSSPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AdminPage from './pages/AdminPage';
import WebGISPage from './pages/WebGISPageSimple';

// Government-friendly theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32', // Forest green for government
    },
    secondary: {
      main: '#1976d2', // Blue for trust
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
  },
});

function App() {
  const [selectedState, setSelectedState] = useState<string>('');
  const [userRole] = useState<string>('admin'); // In real app, this would come from auth

  const handleStateChange = (stateId: string) => {
    setSelectedState(stateId);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
          <Header
            selectedState={selectedState}
            onStateChange={handleStateChange}
            userRole={userRole}
          />
          
          <Routes>
            <Route path="/" element={<HomePage userRole={userRole} />} />
            <Route path="/fra-data" element={<FRADataPage />} />
            <Route path="/atlas" element={<AtlasPage />} />
            <Route path="/webgis" element={<WebGISPage />} />
            <Route path="/ai-processing" element={<AIProcessingPage />} />
            <Route path="/asset-mapping" element={<AssetMappingPage />} />
            <Route path="/dss" element={<DSSPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
