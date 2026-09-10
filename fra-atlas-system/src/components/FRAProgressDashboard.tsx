import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import RefreshIcon from '@mui/icons-material/Refresh';
import GetAppIcon from '@mui/icons-material/GetApp';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableViewIcon from '@mui/icons-material/TableView';

interface FRAProgressData {
  level: 'state' | 'district' | 'block' | 'village';
  name: string;
  totalClaims: number;
  approvedClaims: number;
  pendingClaims: number;
  rejectedClaims: number;
  areaDistributed: number; // in hectares
  householdsApproved: number;
  progressPercentage: number;
  lastUpdated: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: Readonly<TabPanelProps>) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`fra-tabpanel-${index}`}
      aria-labelledby={`fra-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const FRAProgressDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState<'state' | 'district' | 'block' | 'village'>('state');
  const [progressData, setProgressData] = useState<FRAProgressData[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock data - replace with actual API calls
  const mockProgressData: Record<string, FRAProgressData[]> = {
    state: [
      {
        level: 'state',
        name: 'Madhya Pradesh',
        totalClaims: 125450,
        approvedClaims: 82200,
        pendingClaims: 35150,
        rejectedClaims: 8100,
        areaDistributed: 245600,
        householdsApproved: 78500,
        progressPercentage: 65.5,
        lastUpdated: '2024-12-01'
      },
      {
        level: 'state',
        name: 'Tripura',
        totalClaims: 18750,
        approvedClaims: 14200,
        pendingClaims: 3100,
        rejectedClaims: 1450,
        areaDistributed: 28300,
        householdsApproved: 13900,
        progressPercentage: 75.7,
        lastUpdated: '2024-12-01'
      },
      {
        level: 'state',
        name: 'Odisha',
        totalClaims: 125400,
        approvedClaims: 89200,
        pendingClaims: 28500,
        rejectedClaims: 7700,
        areaDistributed: 234800,
        householdsApproved: 85600,
        progressPercentage: 71.1,
        lastUpdated: '2024-12-01'
      },
      {
        level: 'state',
        name: 'Telangana',
        totalClaims: 67890,
        approvedClaims: 48200,
        pendingClaims: 15500,
        rejectedClaims: 4190,
        areaDistributed: 156800,
        householdsApproved: 45600,
        progressPercentage: 71.0,
        lastUpdated: '2024-12-01'
      }
    ],
    district: [
      {
        level: 'district',
        name: 'Balaghat',
        totalClaims: 8950,
        approvedClaims: 6200,
        pendingClaims: 2100,
        rejectedClaims: 650,
        areaDistributed: 18500,
        householdsApproved: 5890,
        progressPercentage: 69.3,
        lastUpdated: '2024-12-01'
      },
      {
        level: 'district',
        name: 'Dindori',
        totalClaims: 7200,
        approvedClaims: 4800,
        pendingClaims: 1900,
        rejectedClaims: 500,
        areaDistributed: 15200,
        householdsApproved: 4650,
        progressPercentage: 66.7,
        lastUpdated: '2024-12-01'
      }
    ],
    block: [
      {
        level: 'block',
        name: 'Balaghat Block',
        totalClaims: 1250,
        approvedClaims: 890,
        pendingClaims: 280,
        rejectedClaims: 80,
        areaDistributed: 2850,
        householdsApproved: 820,
        progressPercentage: 71.2,
        lastUpdated: '2024-12-01'
      }
    ],
    village: [
      {
        level: 'village',
        name: 'Ghughri',
        totalClaims: 45,
        approvedClaims: 32,
        pendingClaims: 10,
        rejectedClaims: 3,
        areaDistributed: 125,
        householdsApproved: 28,
        progressPercentage: 71.1,
        lastUpdated: '2024-12-01'
      }
    ]
  };

  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setProgressData(mockProgressData[selectedLevel] || []);
      setLoading(false);
    }, 500);
  }, [selectedLevel]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setProgressData(mockProgressData[selectedLevel] || []);
      setLoading(false);
    }, 1000);
  };

  // Export functions
  const exportToCSV = () => {
    const headers = ['Name', 'Total Claims', 'Approved', 'Pending', 'Rejected', 'Progress %'];
    const csvContent = [
      headers.join(','),
      ...progressData.map(item => [
        item.name,
        item.totalClaims,
        item.approvedClaims,
        item.pendingClaims,
        item.rejectedClaims,
        item.progressPercentage.toFixed(1) + '%'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FRA_Progress_${selectedLevel}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    // For now, show alert - in production would use jsPDF or similar
    alert(`PDF export functionality would generate a comprehensive report for ${selectedLevel} level data. This would include charts, tables, and summary statistics.`);
  };

  const exportToExcel = () => {
    // For now, show alert - in production would use xlsx library
    alert(`Excel export functionality would create a detailed spreadsheet with multiple tabs for ${selectedLevel} level analysis, including pivot tables and charts.`);
  };

  // Prepare chart data
  const chartData = progressData.map(item => ({
    name: item.name,
    approved: item.approvedClaims,
    pending: item.pendingClaims,
    rejected: item.rejectedClaims,
    progress: item.progressPercentage
  }));

  const pieData = progressData.length > 0 ? [
    { name: 'Approved', value: progressData.reduce((sum, item) => sum + item.approvedClaims, 0), color: '#4CAF50' },
    { name: 'Pending', value: progressData.reduce((sum, item) => sum + item.pendingClaims, 0), color: '#FF9800' },
    { name: 'Rejected', value: progressData.reduce((sum, item) => sum + item.rejectedClaims, 0), color: '#F44336' }
  ] : [];

  const getStatusColor = (percentage: number): string => {
    if (percentage >= 80) return '#4CAF50';
    if (percentage >= 60) return '#FF9800';
    return '#F44336';
  };

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon fontSize="large" />
          FRA Progress Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Level</InputLabel>
            <Select
              value={selectedLevel}
              label="Level"
              onChange={(e) => setSelectedLevel(e.target.value as any)}
            >
              <MenuItem value="state">State</MenuItem>
              <MenuItem value="district">District</MenuItem>
              <MenuItem value="block">Block</MenuItem>
              <MenuItem value="village">Village</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh Data">
            <IconButton onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Export to CSV">
            <IconButton onClick={exportToCSV} disabled={loading || progressData.length === 0}>
              <TableViewIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Export to PDF">
            <IconButton onClick={exportToPDF} disabled={loading || progressData.length === 0}>
              <PictureAsPdfIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Export to Excel">
            <IconButton onClick={exportToExcel} disabled={loading || progressData.length === 0}>
              <GetAppIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Overview" />
          <Tab label="Detailed View" />
          <Tab label="Analytics" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {/* Overview Tab */}
        <Grid container spacing={3}>
          {/* Summary Cards */}
          {progressData.map((item) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={item.name}>
              <Card>
                <CardContent>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {item.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <TrendingUpIcon sx={{ color: getStatusColor(item.progressPercentage) }} />
                    <Typography variant="h4" component="span" sx={{ color: getStatusColor(item.progressPercentage) }}>
                      {item.progressPercentage}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={item.progressPercentage}
                    sx={{ mb: 2, height: 8, borderRadius: 4 }}
                  />
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip label={`${item.approvedClaims} Approved`} color="success" size="small" />
                    <Chip label={`${item.pendingClaims} Pending`} color="warning" size="small" />
                    <Chip label={`${item.rejectedClaims} Rejected`} color="error" size="small" />
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Area Distributed: {item.areaDistributed.toLocaleString()} hectares
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Households: {item.householdsApproved.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Charts */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom>
                  Claims Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="approved" stackId="a" fill="#4CAF50" name="Approved" />
                    <Bar dataKey="pending" stackId="a" fill="#FF9800" name="Pending" />
                    <Bar dataKey="rejected" stackId="a" fill="#F44336" name="Rejected" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom>
                  Overall Status
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Detailed View Tab */}
        <Card>
          <CardContent>
            <Typography variant="h6" component="h3" gutterBottom>
              Detailed Progress Report
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell align="right">Total Claims</TableCell>
                    <TableCell align="right">Approved</TableCell>
                    <TableCell align="right">Pending</TableCell>
                    <TableCell align="right">Rejected</TableCell>
                    <TableCell align="right">Progress</TableCell>
                    <TableCell align="right">Area (Ha)</TableCell>
                    <TableCell align="right">Households</TableCell>
                    <TableCell align="right">Last Updated</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {progressData.map((row) => (
                    <TableRow key={row.name}>
                      <TableCell component="th" scope="row">
                        {row.name}
                      </TableCell>
                      <TableCell align="right">{row.totalClaims.toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ color: '#4CAF50' }}>
                        {row.approvedClaims.toLocaleString()}
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#FF9800' }}>
                        {row.pendingClaims.toLocaleString()}
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#F44336' }}>
                        {row.rejectedClaims.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={row.progressPercentage}
                            sx={{ flexGrow: 1, height: 6 }}
                          />
                          <Typography variant="body2">
                            {row.progressPercentage}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">{row.areaDistributed.toLocaleString()}</TableCell>
                      <TableCell align="right">{row.householdsApproved.toLocaleString()}</TableCell>
                      <TableCell align="right">{row.lastUpdated}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Analytics Tab */}
        <Grid container spacing={3}>
          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom>
                  Progress Trend Analysis
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="progress"
                      stroke="#2196F3"
                      strokeWidth={3}
                      name="Progress %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom>
                  Performance Metrics
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Average Progress Rate
                    </Typography>
                    <Typography variant="h4">
                      {progressData.length > 0
                        ? (progressData.reduce((sum, item) => sum + item.progressPercentage, 0) / progressData.length).toFixed(1)
                        : 0}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Total Area Distributed
                    </Typography>
                    <Typography variant="h4">
                      {progressData.reduce((sum, item) => sum + item.areaDistributed, 0).toLocaleString()} Ha
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Total Households Benefited
                    </Typography>
                    <Typography variant="h4">
                      {progressData.reduce((sum, item) => sum + item.householdsApproved, 0).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom>
                  Quick Statistics
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Success Rate</Typography>
                    <Chip
                      label={`${progressData.length > 0
                        ? ((progressData.reduce((sum, item) => sum + item.approvedClaims, 0) /
                           progressData.reduce((sum, item) => sum + item.totalClaims, 0)) * 100).toFixed(1)
                        : 0}%`}
                      color="success"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Pending Rate</Typography>
                    <Chip
                      label={`${progressData.length > 0
                        ? ((progressData.reduce((sum, item) => sum + item.pendingClaims, 0) /
                           progressData.reduce((sum, item) => sum + item.totalClaims, 0)) * 100).toFixed(1)
                        : 0}%`}
                      color="warning"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Rejection Rate</Typography>
                    <Chip
                      label={`${progressData.length > 0
                        ? ((progressData.reduce((sum, item) => sum + item.rejectedClaims, 0) /
                           progressData.reduce((sum, item) => sum + item.totalClaims, 0)) * 100).toFixed(1)
                        : 0}%`}
                      color="error"
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {loading && (
        <Box sx={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <LinearProgress />
        </Box>
      )}
    </Box>
  );
};

export default FRAProgressDashboard;