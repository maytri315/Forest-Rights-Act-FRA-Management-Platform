import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip
} from '@mui/material';
import { type UploadedFile } from '../services/api';

interface ProcessingDashboardProps {
  files: UploadedFile[];
}

const ProcessingDashboard: React.FC<ProcessingDashboardProps> = ({ files }) => {
  const stats = React.useMemo(() => {
    const total = files.length;
    const pending = files.filter(f => f.status === 'pending').length;
    const processing = files.filter(f => f.status === 'processing').length;
    const completed = files.filter(f => f.status === 'completed').length;
    const failed = files.filter(f => f.status === 'failed').length;
    
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    
    return {
      total,
      pending,
      processing,
      completed,
      failed,
      totalSize,
      completionRate
    };
  }, [files]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" component="h3" sx={{ mb: 3, color: '#2e7d32' }}>
        📊 Processing Dashboard
      </Typography>
      
      <Box 
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)'
          },
          gap: 3,
          mb: 3
        }}
      >
        <Card elevation={1}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" component="div" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
              {stats.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Documents
            </Typography>
          </CardContent>
        </Card>
        
        <Card elevation={1}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" component="div" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
              {stats.completed}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Processed
            </Typography>
          </CardContent>
        </Card>
        
        <Card elevation={1}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" component="div" sx={{ color: '#f57c00', fontWeight: 'bold' }}>
              {stats.processing}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              In Progress
            </Typography>
          </CardContent>
        </Card>
        
        <Card elevation={1}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" component="div" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
              {stats.failed}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Failed
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
            Overall Progress
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {stats.completionRate.toFixed(1)}% Complete
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={stats.completionRate}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: '#e0e0e0',
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#2e7d32'
            }
          }}
        />
      </Box>

      <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Total Size: {formatFileSize(stats.totalSize)}
        </Typography>
        
        {stats.pending > 0 && (
          <Chip 
            label={`${stats.pending} Ready to Process`} 
            color="warning" 
            size="small" 
          />
        )}
        
        {stats.processing > 0 && (
          <Chip 
            label={`${stats.processing} Processing`} 
            color="info" 
            size="small" 
          />
        )}
        
        {stats.failed > 0 && (
          <Chip 
            label={`${stats.failed} Failed`} 
            color="error" 
            size="small" 
          />
        )}
      </Box>
    </Paper>
  );
};

export default ProcessingDashboard;
