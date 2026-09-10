import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';

interface HomePageProps {
  userRole?: string;
}

const HomePage: React.FC<HomePageProps> = ({ userRole = 'admin' }) => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        FRA Atlas & Decision Support System
      </Typography>
      
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Welcome to the Forest Rights Act Atlas
        </Typography>
        <Typography variant="body1" paragraph>
          This comprehensive system provides AI-powered document processing and 
          WebGIS-based decision support for Forest Rights Act implementation 
          monitoring across multiple states.
        </Typography>
        
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            Key Features:
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
            <li>AI-powered FRA document processing with OCR and NER</li>
            <li>Real-time processing status and analytics dashboard</li>
            <li>Interactive WebGIS mapping and spatial analysis</li>
            <li>Multi-state data integration and comparison</li>
            <li>Comprehensive reporting and export capabilities</li>
          </Typography>
        </Box>
      </Paper>
      
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="body2" color="textSecondary" align="center">
          System Status: Online | User Role: {userRole}
        </Typography>
      </Paper>
    </Container>
  );
};

export default HomePage;
