import { Box, Typography, Paper, Container } from '@mui/material';

const AdminPage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          ⚙️ Admin Panel
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          System administration features:
        </Typography>
        <Box component="ul" sx={{ pl: 3 }}>
          <Typography component="li" variant="body1">
            User Management and Role-based Access Control
          </Typography>
          <Typography component="li" variant="body1">
            System Configuration and Settings
          </Typography>
          <Typography component="li" variant="body1">
            Data Import/Export utilities
          </Typography>
          <Typography component="li" variant="body1">
            System monitoring and maintenance tools
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminPage;
