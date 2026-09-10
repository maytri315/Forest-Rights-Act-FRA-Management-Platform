import { Box, Typography, Paper, Container } from '@mui/material';

const AtlasPage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          🗺️ FRA Atlas & Mapping
        </Typography>
        <Typography variant="body1" paragraph>
          Interactive WebGIS portal featuring:
        </Typography>
        <Box component="ul" sx={{ pl: 3 }}>
          <Typography component="li" variant="body1">
            Satellite-based Asset Mapping using Computer Vision
          </Typography>
          <Typography component="li" variant="body1">
            Village-wise FRA Visualization with interactive layers
          </Typography>
          <Typography component="li" variant="body1">
            Forest cover, water bodies, and agricultural land detection
          </Typography>
          <Typography component="li" variant="body1">
            Integration with PM Gati Shakti infrastructure data
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default AtlasPage;
