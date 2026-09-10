import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Container, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Chip
} from '@mui/material';
import FileUploadZone from '../components/FileUploadZone';
// import FileList from '../components/FileList';
import ProcessingDashboard from '../components/ProcessingDashboard';
import { apiService, type UploadedFile } from '../services/api';
import GoogleMapView from '../components/GoogleMapView';
import { extractLatLng } from '../components/extractLatLng';

const FRADataPage = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rawText, setRawText] = useState<string>('');
  const [isLoadingRawText, setIsLoadingRawText] = useState(false);
  const [geminiData, setGeminiData] = useState<any>(null);
  const [isProcessingGemini, setIsProcessingGemini] = useState(false);

  const fetchFiles = async () => {
    try {
      const response = await apiService.getFiles();
      setFiles(response);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileUpload = async (files: File[]) => {
    setIsProcessing(true);
    try {
      await apiService.uploadFiles(files);
      await fetchFiles();
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveFile = async (fileId: string) => {
    try {
      await apiService.deleteFile(fileId);
      await fetchFiles();
    } catch (error) {
      console.error('Error removing file:', error);
    }
  };

  const handleViewFile = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      setSelectedFile(file);
      setViewDialogOpen(true);
      setRawText('');
      setGeminiData(null);
    }
  };

  const handleLoadRawText = async (fileId: string) => {
    setIsLoadingRawText(true);
    try {
      const rawTextResponse = await apiService.getFileRawText(fileId);
      setRawText(rawTextResponse.raw_ocr_text);
    } catch (error) {
      console.error('Error loading raw text:', error);
      setRawText('Error loading raw text');
    } finally {
      setIsLoadingRawText(false);
    }
  };

  const handleStructureWithGemini = async (fileId: string) => {
    setIsProcessingGemini(true);
    try {
      const geminiResponse = await apiService.structureWithGemini(fileId);
      setGeminiData(geminiResponse.structured_data);
    } catch (error) {
      console.error('Error structuring with Gemini:', error);
      setGeminiData({ error: 'Failed to structure data with Gemini AI' });
    } finally {
      setIsProcessingGemini(false);
    }
  };

  const handleProcessFile = async (fileId: string) => {
    setIsProcessing(true);
    try {
      await apiService.startProcessing([fileId]);
      await fetchFiles();
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessAll = async () => {
    setIsProcessing(true);
    try {
      const pendingFiles = files.filter(f => f.status === 'pending');
      const fileIds = pendingFiles.map(f => f.id);
      if (fileIds.length > 0) {
        await apiService.startProcessing(fileIds);
      }
      await fetchFiles();
    } catch (error) {
      console.error('Error processing files:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefresh = () => {
    fetchFiles();
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        FRA Document Management & AI Processing
      </Typography>

      {/* Upload Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          📄 Upload FRA Documents
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Upload PDF or image files containing FRA documents for AI processing
        </Typography>
        <FileUploadZone
          onFilesAdded={handleFileUpload}
          disabled={isProcessing}
        />
      </Paper>

      {/* OCR Test Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center">
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            🧪 Test OCR & AI Processing
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => window.open('http://localhost:8000/docs', '_blank')}
          >
            API Documentation
          </Button>
        </Box>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          You can test the OCR functionality by uploading files above or using the API documentation.
        </Typography>
      </Paper>

      {/* Processing Controls */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center">
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            🤖 AI Processing Controls
          </Typography>
          <Button
            variant="contained"
            onClick={handleProcessAll}
            disabled={isProcessing || files.filter(f => f.status === 'pending').length === 0}
          >
            Process All Pending ({files.filter(f => f.status === 'pending').length})
          </Button>
          <Button
            variant="outlined"
            onClick={handleRefresh}
            disabled={isProcessing}
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Dashboard */}
      <ProcessingDashboard files={files} />

      {/* File List */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          📁 Uploaded Files ({files.length})
        </Typography>
        
        {files.length === 0 ? (
          <Typography variant="body1" color="textSecondary" align="center">
            No files uploaded yet. Upload some documents to get started.
          </Typography>
        ) : (
          <Box>
            {files.map((file) => (
              <Box key={file.id} sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1, mb: 1 }}>
                <Typography variant="subtitle1">{file.filename}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Status: {file.status} | Size: {(file.size / 1024).toFixed(1)} KB
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Button 
                    size="small" 
                    onClick={() => handleViewFile(file.id)}
                    sx={{ mr: 1 }}
                  >
                    View
                  </Button>
                  {file.status === 'pending' && (
                    <Button 
                      size="small" 
                      variant="outlined"
                      onClick={() => handleProcessFile(file.id)}
                      sx={{ mr: 1 }}
                    >
                      Process
                    </Button>
                  )}
                  <Button 
                    size="small" 
                    color="error"
                    onClick={() => handleRemoveFile(file.id)}
                  >
                    Delete
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      {/* File Details Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          File Details: {selectedFile?.filename}
        </DialogTitle>
        <DialogContent>
          {selectedFile && (
            <Box>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Filename:</strong> {selectedFile.filename}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Size:</strong> {(selectedFile.size / 1024).toFixed(1)} KB
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Type:</strong> {selectedFile.type}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Status:</strong> {' '}
                <Chip 
                  label={selectedFile.status} 
                  color={
                    selectedFile.status === 'completed' ? 'success' :
                    selectedFile.status === 'processing' ? 'info' :
                    selectedFile.status === 'failed' ? 'error' : 'warning'
                  }
                  size="small"
                />
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Uploaded:</strong> {new Date(selectedFile.uploaded_at).toLocaleString()}
              </Typography>
              {selectedFile.processed_at && (
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Processed:</strong> {new Date(selectedFile.processed_at).toLocaleString()}
                </Typography>
              )}
              
              {selectedFile.extracted_data && (
                <Box mt={3}>
                  <Typography variant="h6" gutterBottom>
                    🤖 AI Extracted Data
                  </Typography>
                  {selectedFile.extracted_data.village_name && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Village Name:</strong> {selectedFile.extracted_data.village_name}
                    </Typography>
                  )}
                  {selectedFile.extracted_data.patta_holder && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Patta Holder:</strong> {selectedFile.extracted_data.patta_holder}
                    </Typography>
                  )}
                  {selectedFile.extracted_data.claim_status && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Claim Status:</strong> {selectedFile.extracted_data.claim_status}
                    </Typography>
                  )}
                  {selectedFile.extracted_data.coordinates && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Coordinates:</strong> {selectedFile.extracted_data.coordinates}
                    </Typography>
                  )}
                  {selectedFile.extracted_data.land_area && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Land Area:</strong> {selectedFile.extracted_data.land_area}
                    </Typography>
                  )}
                </Box>
              )}

              {/* Gemini AI Structure Section */}
              {rawText && (
                <Box mt={3}>
                  <Typography variant="h6" gutterBottom>
                    🧠 Gemini AI Structured Data
                  </Typography>
                  {geminiData ? (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      {geminiData.error ? (
                        <Typography color="error">{geminiData.error}</Typography>
                      ) : (
                        <Box>
                          {Object.entries(geminiData).map(([key, value]) => {
                            if (key === 'raw_text' || key === 'processing_timestamp') return null;
                            return (
                              <Typography key={key} variant="body2" sx={{ mb: 1 }}>
                                <strong>{key.replace(/_/g, ' ').toUpperCase()}:</strong> {' '}
                                {Array.isArray(value) 
                                  ? value.join(', ') || 'None' 
                                  : String(value) || 'None'
                                }
                              </Typography>
                            );
                          })}
                        </Box>
                      )}
                    </Paper>
                  ) : (
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={() => handleStructureWithGemini(selectedFile.id)}
                      disabled={isProcessingGemini}
                    >
                      {isProcessingGemini ? 'Processing with Gemini...' : 'Structure with Gemini AI'}
                    </Button>
                  )}
                </Box>
              )}

              {/* Map Section: Show if coordinates are present */}
              {((geminiData && geminiData.coordinates) || (selectedFile?.extracted_data?.coordinates)) && (
                (() => {
                  const coordString = geminiData?.coordinates || selectedFile?.extracted_data?.coordinates;
                  const latLng = extractLatLng(coordString);
                  if (!latLng) return null;
                  return (
                    <Box mt={3}>
                      <Typography variant="h6" gutterBottom>
                        🗺️ Location on Map
                      </Typography>
                      <GoogleMapView lat={latLng.lat} lng={latLng.lng} height="300px" width="100%" />
                    </Box>
                  );
                })()
              )}

              {/* Raw OCR Text Section */}
              <Box mt={3}>
                <Typography variant="h6" gutterBottom>
                  📄 Raw OCR Text
                </Typography>
                {rawText ? (
                  <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                    <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                      {rawText}
                    </Typography>
                  </Paper>
                ) : (
                  <Button 
                    variant="outlined" 
                    onClick={() => handleLoadRawText(selectedFile.id)}
                    disabled={isLoadingRawText}
                  >
                    {isLoadingRawText ? 'Loading...' : 'Load Raw OCR Text'}
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          {selectedFile?.status === 'pending' && (
            <Button 
              variant="contained" 
              onClick={() => {
                handleProcessFile(selectedFile.id);
                setViewDialogOpen(false);
              }}
            >
              Process Now
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default FRADataPage;
