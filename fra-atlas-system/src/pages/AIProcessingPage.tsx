import { Box, Typography, Paper, Container } from '@mui/material';

const AIProcessingPage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          🤖 AI Processing Center
        </Typography>
        <Typography variant="body1" paragraph>
          Advanced AI/ML capabilities including:
        </Typography>
        <Box component="ul" sx={{ pl: 3 }}>
          <Typography component="li" variant="body1">
            OCR Document Processing with Tesseract and custom models
          </Typography>
          <Typography component="li" variant="body1">
            Named Entity Recognition for extracting structured data
          </Typography>
          <Typography component="li" variant="body1">
            Satellite Image Analysis using CNN and Computer Vision
          </Typography>
          <Typography component="li" variant="body1">
            Asset Detection Results and land-use classification
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default AIProcessingPage;
