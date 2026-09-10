import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const DebugMap: React.FC = () => {
  return (
    <Paper 
      elevation={2} 
      sx={{ 
        height: '500px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        bgcolor: '#f5f5f5',
        border: '2px dashed #ccc'
      }}
    >
      <Typography variant="h6" color="primary" gutterBottom>
        🗺️ Map Component Debug Mode
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        This is a placeholder map component.
      </Typography>
      <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid #ddd' }}>
        <Typography variant="caption" color="text.secondary">
          If you see this, React components are rendering correctly.
          The issue is likely with Leaflet initialization or CSS loading.
        </Typography>
      </Box>
    </Paper>
  );
};

export default DebugMap;