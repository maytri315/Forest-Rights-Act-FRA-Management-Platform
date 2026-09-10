import React from 'react';
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box
} from '@mui/material';
import { navigationModules } from '../utils/constants';
import type { NavigationModule } from '../types';

interface NavigationModulesProps {
  onModuleClick: (module: NavigationModule) => void;
  userRole?: string;
}

const NavigationModules: React.FC<NavigationModulesProps> = ({ 
  onModuleClick, 
  userRole = 'admin' 
}) => {
  const filteredModules = navigationModules.filter(module => 
    module.userRoles.includes(userRole)
  );

  const getIconComponent = (iconName: string, moduleId?: string) => {
    // Use text emojis instead of Material Icons for now
    const iconMap: { [key: string]: string } = {
      'description': '📋',
      'map': moduleId === 'webgis-integration' ? '🌍' : '🗺️',
      'psychology': '🤖', 
      'satellite': '🛰️',
      'analytics': '📊',
      'assessment': '📈',
      'adminpanelsettings': '⚙️'
    };
    return <Typography sx={{ fontSize: 48 }}>{iconMap[iconName.toLowerCase()] || '📋'}</Typography>;
  };

  return (
    <Box sx={{ py: 4 }}>
      <Typography 
        variant="h4" 
        component="h2" 
        align="center" 
        gutterBottom
        sx={{ mb: 4, fontWeight: 'bold', color: '#2e7d32' }}
      >
        FRA Atlas System Modules
      </Typography>
      
      <Box 
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)'
          },
          gap: 3
        }}
      >
        {filteredModules.map((module) => (
          <Box key={module.id}>
            <Card
              sx={{
                height: '100%',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
                border: '1px solid #e0e0e0'
              }}
            >
              <CardActionArea
                onClick={() => onModuleClick(module)}
                sx={{ height: '100%', p: 2 }}
              >
                <CardContent sx={{ textAlign: 'center', height: '100%' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%'
                    }}
                  >
                    <Box
                      sx={{
                        backgroundColor: module.color,
                        color: 'white',
                        borderRadius: '50%',
                        width: 80,
                        height: 80,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2
                      }}
                    >
                      {getIconComponent(module.icon, module.id)}
                    </Box>
                    
                    <Typography 
                      variant="h6" 
                      component="h3" 
                      gutterBottom
                      sx={{ 
                        fontWeight: 'bold',
                        color: module.color,
                        textAlign: 'center'
                      }}
                    >
                      {module.title}
                    </Typography>
                    
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        flexGrow: 1,
                        display: 'flex',
                        alignItems: 'center',
                        textAlign: 'center',
                        lineHeight: 1.4
                      }}
                    >
                      {module.description}
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default NavigationModules;
