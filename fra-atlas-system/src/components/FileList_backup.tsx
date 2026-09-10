import React from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  Chip,
  Button,
  Divider,
  IconButton
} from '@mui/material';
import { Delete, Visibility, PlayArrow } from '@mui/icons-material';
import { type UploadedFile } from '../services/api';

interface FileListProps {
  files: UploadedFile[];
  onRemoveFile: (fileId: string) => void;
  onProcessFile: (fileId: string) => void;
  onViewFile: (fileId: string) => void;
}

const FileList: React.FC<FileListProps> = ({
  files,
  onRemoveFile,
  onProcessFile,
  onViewFile
}) => {
  const getStatusColor = (status: UploadedFile['status']) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'completed': return 'success';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: UploadedFile['status']) => {
    switch (status) {
      case 'pending': return 'Ready to Process';
      case 'processing': return 'Processing...';
      case 'completed': return 'Completed';
      case 'failed': return 'Failed';
      default: return 'Unknown';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (files.length === 0) {
    return (
      <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No files uploaded yet. Use the upload area above to add FRA documents.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ mt: 3 }}>
      <Box sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
        <Typography variant="h6" component="h3">
          📋 Uploaded Documents ({files.length})
        </Typography>
      </Box>
      
      <List sx={{ p: 0 }}>
        {files.map((file, index) => (
          <React.Fragment key={file.id}>
            <ListItem
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                py: 2,
                px: 3,
                backgroundColor: index % 2 === 0 ? '#fafafa' : 'white'
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 'medium',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {file.filename}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  {formatFileSize(file.size)} • {file.type}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  Uploaded: {new Date(file.uploaded_at).toLocaleDateString()}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={getStatusText(file.status)}
                  color={getStatusColor(file.status)}
                  size="small"
                />
                
                {file.confidence_score && (
                  <Chip
                    label={`${file.confidence_score}% confidence`}
                    variant="outlined"
                    size="small"
                  />
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                {file.status === 'pending' && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<PlayArrow />}
                    onClick={() => onProcessFile(file.id)}
                    sx={{ backgroundColor: '#4CAF50' }}
                  >
                    Process
                  </Button>
                )}
                
                <IconButton
                  size="small"
                  onClick={() => onViewFile(file.id)}
                  title="View Details"
                >
                  <Visibility />
                </IconButton>
                
                <IconButton
                  size="small"
                  onClick={() => onRemoveFile(file.id)}
                  color="error"
                  title="Delete File"
                >
                  <Delete />
                </IconButton>
              </Box>
            </ListItem>
            
            {index < files.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>

      {/* Summary */}
      <Box sx={{ p: 2, backgroundColor: '#f9f9f9', borderTop: '1px solid #e0e0e0' }}>
        <Typography variant="body2" color="text.secondary">
          Status Summary: {' '}
          {files.filter(f => f.status === 'pending').length} pending, {' '}
          {files.filter(f => f.status === 'processing').length} processing, {' '}
          {files.filter(f => f.status === 'completed').length} completed, {' '}
          {files.filter(f => f.status === 'failed').length} failed
        </Typography>
      </Box>
    </Paper>
  );
};

export default FileList;
