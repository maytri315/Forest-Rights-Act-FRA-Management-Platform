import React, { useCallback, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  LinearProgress,
  Alert
} from '@mui/material';

interface FileUploadZoneProps {
  onFilesAdded: (files: File[]) => void;
  acceptedTypes?: string[];
  maxFileSize?: number; // in MB
  maxFiles?: number;
  disabled?: boolean;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFilesAdded,
  acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
  maxFileSize = 10, // 10MB default
  maxFiles = 20
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported. Please upload PDF, JPEG, or PNG files.`;
    }
    
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB.`;
    }
    
    return null;
  };

  const processFiles = useCallback(async (fileList: FileList) => {
    setError(null);
    setIsUploading(true);

    const files = Array.from(fileList);
    
    if (files.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed at once.`);
      setIsUploading(false);
      return;
    }

    const validatedFiles: File[] = [];
    const errors: string[] = [];

    files.forEach((file) => {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
      } else {
        validatedFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }

    if (validatedFiles.length > 0) {
      onFilesAdded(validatedFiles);
    }

    setIsUploading(false);
  }, [onFilesAdded, maxFileSize, maxFiles, acceptedTypes]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      processFiles(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [processFiles]);

  return (
    <Box>
      <Paper
        elevation={isDragOver ? 8 : 2}
        sx={{
          p: 4,
          border: `2px dashed ${isDragOver ? '#2e7d32' : '#ccc'}`,
          backgroundColor: isDragOver ? '#f1f8e9' : '#fafafa',
          transition: 'all 0.3s ease',
          textAlign: 'center',
          minHeight: 200,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: '#f5f5f5',
            borderColor: '#2e7d32'
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <Typography variant="h6" component="div" sx={{ mb: 2, color: '#2e7d32' }}>
          📁 Upload FRA Documents
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 2 }}>
          Drag and drop your documents here, or click to browse
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Supported formats: PDF, JPEG, PNG (Max {maxFileSize}MB per file)
        </Typography>
        
        <Button
          variant="contained"
          sx={{ backgroundColor: '#2e7d32', '&:hover': { backgroundColor: '#1b5e20' } }}
          disabled={isUploading}
        >
          {isUploading ? 'Processing...' : 'Choose Files'}
        </Button>

        {isUploading && (
          <Box sx={{ width: '100%', mt: 2 }}>
            <LinearProgress sx={{ backgroundColor: '#c8e6c9' }} />
          </Box>
        )}
      </Paper>

      <input
        id="file-input"
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography component="pre" sx={{ whiteSpace: 'pre-line' }}>
            {error}
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default FileUploadZone;
