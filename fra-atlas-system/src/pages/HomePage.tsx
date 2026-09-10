import {
  Container,
  Box,
  Typography,
  Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import NavigationModules from '../components/NavigationModules';
import type { NavigationModule } from '../types';

interface HomePageProps {
  userRole?: string;
}

const HomePage: React.FC<HomePageProps> = ({ userRole = 'admin' }) => {
  const navigate = useNavigate();

  const handleModuleClick = (module: NavigationModule) => {
    // Navigate to the appropriate route
    navigate(module.route);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero Section */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          mb: 4, 
          background: 'linear-gradient(135deg, #2e7d32 0%, #388e3c 100%)',
          color: 'white',
          textAlign: 'center'
        }}
      >
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Forest Rights Act (FRA) Atlas
        </Typography>
        <Typography variant="h6" sx={{ mb: 2 }}>
          AI-Powered Decision Support System for Integrated Monitoring
        </Typography>
        <Typography variant="body1" sx={{ maxWidth: '800px', mx: 'auto' }}>
          Digitizing and standardizing FRA implementation across Madhya Pradesh, Tripura, 
          Odisha, and Telangana with advanced WebGIS and AI-powered analytics.
        </Typography>
      </Paper>

      {/* Navigation Modules */}
      <NavigationModules 
        onModuleClick={handleModuleClick}
        userRole={userRole}
      />

      {/* Footer Info */}
      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Developed for Smart India Hackathon 2025 | Ministry of Tribal Affairs
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Target States: Madhya Pradesh, Tripura, Odisha, Telangana
        </Typography>
      </Box>
    </Container>
  );
};

export default HomePage;
