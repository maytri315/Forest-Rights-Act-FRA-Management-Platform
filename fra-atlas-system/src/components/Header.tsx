import { 
  AppBar,
  Toolbar,
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { states } from '../utils/constants';

interface HeaderProps {
  selectedState?: string;
  onStateChange: (stateId: string) => void;
  userRole?: string;
}

const Header: React.FC<HeaderProps> = ({
  selectedState = '',
  onStateChange,
  userRole = 'admin'
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <AppBar position="static" sx={{ backgroundColor: '#2e7d32' }}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          {!isHomePage && (
            <Button
              color="inherit"
              onClick={() => navigate('/')}
              sx={{ mr: 2, textTransform: 'none' }}
            >
              ← Back to Home
            </Button>
          )}
          
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/')}
          >
            🌲 FRA Atlas System
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ color: 'white' }}>State</InputLabel>
            <Select
              value={selectedState}
              onChange={(e) => onStateChange(e.target.value)}
              label="State"
              sx={{ 
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'white'
                },
                '& .MuiSvgIcon-root': {
                  color: 'white'
                }
              }}
            >
              <MenuItem value="">
                <em>All States</em>
              </MenuItem>
              {states.map((state) => (
                <MenuItem key={state.id} value={state.id}>
                  {state.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
            Role: {userRole.toUpperCase()}
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
