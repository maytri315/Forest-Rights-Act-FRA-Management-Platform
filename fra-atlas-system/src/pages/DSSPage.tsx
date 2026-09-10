import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Assessment as AssessmentIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  AccountBalance as SchemeIcon,
  TrendingUp as TrendingUpIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

// Types for DSS API
interface FRAHolder {
  holder_id: string;
  name: string;
  family_size: number;
  land_area_hectares: number;
  annual_income?: number;
  social_category: 'ST' | 'SC' | 'OBC' | 'General';
  has_bank_account: boolean;
  aadhaar_linked: boolean;
  village_code: string;
  district: string;
  state: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  education_level: string;
  occupation: string;
  has_electricity: boolean;
  has_toilet: boolean;
  water_source: string;
  mobile_number?: string;
}

interface VillageProfile {
  village_code: string;
  village_name: string;
  block: string;
  district: string;
  state: string;
  total_households: number;
  st_households: number;
  sc_households: number;
  total_population: number;
  st_population: number;
  water_index: number;
  electricity_index: number;
  road_connectivity_index: number;
  health_facility_index: number;
  education_index: number;
  livelihood_index: number;
  forest_cover_percent: number;
  agricultural_land_percent: number;
  latitude?: number;
  longitude?: number;
}

interface SchemeEligibility {
  scheme: string;
  status: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'REQUIRES_VERIFICATION' | 'PENDING_DOCUMENTS';
  confidence_score: number;
  eligible_amount?: number;
  reasons: string[];
  required_documents: string[];
  timeline_months?: number;
}

interface InterventionRecommendation {
  village_code: string;
  intervention_type: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  estimated_beneficiaries: number;
  estimated_cost: number;
  implementing_ministry: string;
  timeline_months: number;
  success_probability: number;
  impact_score: number;
  reasoning: string;
}

interface PolicyRecommendations {
  summary: {
    total_villages_analyzed: number;
    total_fra_holders: number;
    high_priority_villages: number;
    estimated_total_investment: number;
  };
  coverage_gaps: any;
  priority_interventions: any;
  resource_allocation: Record<string, number>;
  implementation_timeline: Record<string, string[]>;
  key_recommendations: string[];
}

// API Service
class DSSAPIService {
  private baseURL = 'http://localhost:8000/api/dss';

  async assessIndividualEligibility(fraHolder: FRAHolder): Promise<SchemeEligibility[]> {
    const response = await fetch(`${this.baseURL}/eligibility/individual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fraHolder),
    });
    if (!response.ok) throw new Error('Failed to assess eligibility');
    return response.json();
  }

  async prioritizeVillageInterventions(village: VillageProfile): Promise<InterventionRecommendation[]> {
    const response = await fetch(`${this.baseURL}/interventions/village`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(village),
    });
    if (!response.ok) throw new Error('Failed to get village interventions');
    return response.json();
  }

  async generatePolicyRecommendations(villages: VillageProfile[], fraHolders: FRAHolder[]): Promise<PolicyRecommendations> {
    const response = await fetch(`${this.baseURL}/policy/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ villages, fra_holders: fraHolders }),
    });
    if (!response.ok) throw new Error('Failed to generate policy recommendations');
    return response.json();
  }

  async getSchemeInformation() {
    const response = await fetch(`${this.baseURL}/schemes/info`);
    if (!response.ok) throw new Error('Failed to get scheme information');
    return response.json();
  }

  async getAnalyticsSummary(state?: string, district?: string) {
    const params = new URLSearchParams();
    if (state) params.append('state', state);
    if (district) params.append('district', district);
    
    const response = await fetch(`${this.baseURL}/analytics/summary?${params}`);
    if (!response.ok) throw new Error('Failed to get analytics');
    return response.json();
  }
}

const dssAPI = new DSSAPIService();

// Main DSS Component
const DSSPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Eligibility Assessment State
  const [fraHolder, setFRAHolder] = useState<Partial<FRAHolder>>({
    social_category: 'ST',
    gender: 'Male',
    has_bank_account: false,
    aadhaar_linked: false,
    has_electricity: false,
    has_toilet: false,
    family_size: 1,
    education_level: 'Primary',
    occupation: 'Farmer',
    water_source: 'Well'
  });
  const [eligibilityResults, setEligibilityResults] = useState<SchemeEligibility[]>([]);

  // Village Intervention State
  const [village, setVillage] = useState<Partial<VillageProfile>>({
    total_households: 1,
    st_households: 0,
    sc_households: 0,
    total_population: 1,
    st_population: 0,
    water_index: 50.0,
    electricity_index: 50.0,
    road_connectivity_index: 50.0,
    health_facility_index: 50.0,
    education_index: 50.0,
    livelihood_index: 50.0,
    forest_cover_percent: 50.0,
    agricultural_land_percent: 50.0
  });
  const [interventionResults, setInterventionResults] = useState<InterventionRecommendation[]>([]);

  // Policy Recommendations State
  const [policyResults, setPolicyResults] = useState<PolicyRecommendations | null>(null);

  // Analytics State
  const [analytics, setAnalytics] = useState<any>(null);
  const [schemes, setSchemes] = useState<any>(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [analyticsData, schemeData] = await Promise.all([
        dssAPI.getAnalyticsSummary(),
        dssAPI.getSchemeInformation()
      ]);
      setAnalytics(analyticsData);
      setSchemes(schemeData);
    } catch (err) {
      setError('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleAssessEligibility = async () => {
    // Validate required fields
    const requiredFields = [
      'holder_id', 'name', 'family_size', 'land_area_hectares', 
      'social_category', 'village_code', 'district', 'state', 
      'age', 'gender', 'education_level', 'occupation', 'water_source'
    ];
    
    const missingFields = requiredFields.filter(field => !fraHolder[field as keyof FRAHolder]);
    
    if (missingFields.length > 0) {
      setError(`Please fill required fields: ${missingFields.join(', ')}`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const results = await dssAPI.assessIndividualEligibility(fraHolder as FRAHolder);
      setEligibilityResults(results);
    } catch (err: any) {
      console.error('DSS API Error:', err);
      setError(`Failed to assess eligibility: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVillageAnalysis = async () => {
    // Validate required village fields
    const requiredVillageFields = [
      'village_code', 'village_name', 'block', 'district', 'state',
      'total_households', 'st_households', 'sc_households', 
      'total_population', 'st_population', 'water_index', 
      'electricity_index', 'road_connectivity_index', 
      'health_facility_index', 'education_index', 'livelihood_index',
      'forest_cover_percent', 'agricultural_land_percent'
    ];
    
    const missingVillageFields = requiredVillageFields.filter(field => 
      village[field as keyof VillageProfile] === undefined || 
      village[field as keyof VillageProfile] === null || 
      village[field as keyof VillageProfile] === ''
    );
    
    if (missingVillageFields.length > 0) {
      setError(`Please fill required village fields: ${missingVillageFields.join(', ')}`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const results = await dssAPI.prioritizeVillageInterventions(village as VillageProfile);
      setInterventionResults(results);
    } catch (err: any) {
      console.error('Village Analysis Error:', err);
      setError(`Failed to analyze village interventions: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePolicy = async () => {
    // Use sample data for demonstration
    const sampleVillages: VillageProfile[] = [
      {
        village_code: 'V001',
        village_name: 'Sample Village 1',
        block: 'Sample Block',
        district: 'Sample District',
        state: 'Telangana',
        total_households: 250,
        st_households: 200,
        sc_households: 30,
        total_population: 1200,
        st_population: 950,
        water_index: 35,
        electricity_index: 45,
        road_connectivity_index: 25,
        health_facility_index: 30,
        education_index: 40,
        livelihood_index: 35,
        forest_cover_percent: 65,
        agricultural_land_percent: 25
      }
    ];

    const sampleFRAHolders: FRAHolder[] = [
      {
        holder_id: 'FRA001',
        name: 'Sample Holder',
        family_size: 5,
        land_area_hectares: 2.5,
        annual_income: 50000,
        social_category: 'ST',
        has_bank_account: true,
        aadhaar_linked: true,
        village_code: 'V001',
        district: 'Sample District',
        state: 'Telangana',
        age: 45,
        gender: 'Male',
        education_level: 'Primary',
        occupation: 'Farmer',
        has_electricity: false,
        has_toilet: false,
        water_source: 'Well'
      }
    ];

    try {
      setLoading(true);
      setError(null);
      const results = await dssAPI.generatePolicyRecommendations(sampleVillages, sampleFRAHolders);
      setPolicyResults(results);
    } catch (err) {
      setError('Failed to generate policy recommendations');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ELIGIBLE': return 'success';
      case 'NOT_ELIGIBLE': return 'error';
      case 'REQUIRES_VERIFICATION': return 'warning';
      case 'PENDING_DOCUMENTS': return 'info';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Paper elevation={3} sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)', color: 'white' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <AssessmentIcon sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h3" component="h1" fontWeight="bold">
              Decision Support System (DSS)
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              AI-Enhanced CSS Scheme Layering & Policy Formulation for FRA Management
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Quick Stats Dashboard */}
      {analytics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>Total Requests</Typography>
                    <Typography variant="h4">{analytics.requests_processed.total.toLocaleString()}</Typography>
                  </Box>
                  <AssessmentIcon color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>Villages Analyzed</Typography>
                    <Typography variant="h4">{analytics.requests_processed.village_interventions}</Typography>
                  </Box>
                  <LocationIcon color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignments="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>Eligibility Assessments</Typography>
                    <Typography variant="h4">{analytics.requests_processed.individual_eligibility}</Typography>
                  </Box>
                  <PeopleIcon color="info" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>Policy Reports</Typography>
                    <Typography variant="h4">{analytics.requests_processed.policy_recommendations}</Typography>
                  </Box>
                  <SchemeIcon color="warning" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Main Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} variant="scrollable">
          <Tab label="Individual Eligibility" icon={<PeopleIcon />} />
          <Tab label="Village Interventions" icon={<LocationIcon />} />
          <Tab label="Policy Recommendations" icon={<TrendingUpIcon />} />
          <Tab label="Scheme Information" icon={<SchemeIcon />} />
        </Tabs>

        {/* Tab 1: Individual Eligibility Assessment */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    FRA Holder Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Holder ID"
                        value={fraHolder.holder_id || ''}
                        onChange={(e) => setFRAHolder({ ...fraHolder, holder_id: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Name"
                        value={fraHolder.name || ''}
                        onChange={(e) => setFRAHolder({ ...fraHolder, name: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Land Area (hectares)"
                        type="number"
                        value={fraHolder.land_area_hectares || ''}
                        onChange={(e) => setFRAHolder({ ...fraHolder, land_area_hectares: parseFloat(e.target.value) })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Annual Income (₹)"
                        type="number"
                        value={fraHolder.annual_income || ''}
                        onChange={(e) => setFRAHolder({ ...fraHolder, annual_income: parseFloat(e.target.value) })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Social Category</InputLabel>
                        <Select
                          value={fraHolder.social_category || 'ST'}
                          onChange={(e) => setFRAHolder({ ...fraHolder, social_category: e.target.value as any })}
                        >
                          <MenuItem value="ST">Scheduled Tribe</MenuItem>
                          <MenuItem value="SC">Scheduled Caste</MenuItem>
                          <MenuItem value="OBC">Other Backward Class</MenuItem>
                          <MenuItem value="General">General</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Age"
                        type="number"
                        value={fraHolder.age || ''}
                        onChange={(e) => setFRAHolder({ ...fraHolder, age: parseInt(e.target.value) })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Family Size"
                        type="number"
                        value={fraHolder.family_size || ''}
                        onChange={(e) => setFRAHolder({ ...fraHolder, family_size: parseInt(e.target.value) })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Gender</InputLabel>
                        <Select
                          value={fraHolder.gender || 'Male'}
                          onChange={(e) => setFRAHolder({ ...fraHolder, gender: e.target.value as any })}
                        >
                          <MenuItem value="Male">Male</MenuItem>
                          <MenuItem value="Female">Female</MenuItem>
                          <MenuItem value="Other">Other</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Village Code"
                        value={fraHolder.village_code || ''}
                        onChange={(e) => setFRAHolder({ ...fraHolder, village_code: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="District"
                        value={fraHolder.district || ''}
                        onChange={(e) => setFRAHolder({ ...fraHolder, district: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="State"
                        value={fraHolder.state || ''}
                        onChange={(e) => setFRAHolder({ ...fraHolder, state: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Education Level"
                        value={fraHolder.education_level || ''}
                        onChange={(e) => setFRAHolder({ ...fraHolder, education_level: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Occupation"
                        value={fraHolder.occupation || ''}
                        onChange={(e) => setFRAHolder({ ...fraHolder, occupation: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Water Source"
                        value={fraHolder.water_source || ''}
                        onChange={(e) => setFRAHolder({ ...fraHolder, water_source: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={fraHolder.has_electricity || false}
                            onChange={(e) => setFRAHolder({ ...fraHolder, has_electricity: e.target.checked })}
                          />
                        }
                        label="Has Electricity"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={fraHolder.has_toilet || false}
                            onChange={(e) => setFRAHolder({ ...fraHolder, has_toilet: e.target.checked })}
                          />
                        }
                        label="Has Toilet"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={fraHolder.has_bank_account || false}
                            onChange={(e) => setFRAHolder({ ...fraHolder, has_bank_account: e.target.checked })}
                          />
                        }
                        label="Has Bank Account"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={fraHolder.aadhaar_linked || false}
                            onChange={(e) => setFRAHolder({ ...fraHolder, aadhaar_linked: e.target.checked })}
                          />
                        }
                        label="Aadhaar Linked"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Button
                        variant="outlined"
                        onClick={() => setFRAHolder({
                          holder_id: 'FRA/2024/MP/001/12345',
                          name: 'Ramesh Kumar Meena',
                          family_size: 5,
                          land_area_hectares: 1.5,
                          annual_income: 150000,
                          social_category: 'ST',
                          has_bank_account: true,
                          aadhaar_linked: true,
                          village_code: 'KHN001',
                          district: 'Bhopal',
                          state: 'Madhya Pradesh',
                          age: 45,
                          gender: 'Male',
                          education_level: 'Primary',
                          occupation: 'Farmer',
                          has_electricity: false,
                          has_toilet: false,
                          water_source: 'Well'
                        })}
                        fullWidth
                      >
                        Load Sample Data
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Button
                        variant="contained"
                        onClick={handleAssessEligibility}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <AssessmentIcon />}
                        fullWidth
                      >
                        Assess Scheme Eligibility
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Eligibility Results
                  </Typography>
                  {eligibilityResults.length > 0 ? (
                    <Box>
                      {eligibilityResults.map((result, index) => (
                        <Accordion key={index}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box display="flex" alignItems="center" gap={2} width="100%">
                              <Chip
                                label={result.status}
                                color={getStatusColor(result.status) as any}
                                size="small"
                              />
                              <Typography fontWeight="bold">{result.scheme}</Typography>
                              {result.eligible_amount && (
                                <Typography color="success.main" sx={{ ml: 'auto' }}>
                                  {formatCurrency(result.eligible_amount)}
                                </Typography>
                              )}
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Box>
                              <Typography variant="body2" color="textSecondary" gutterBottom>
                                Confidence: {(result.confidence_score * 100).toFixed(1)}%
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={result.confidence_score * 100}
                                sx={{ mb: 2 }}
                              />
                              <Typography variant="body2" gutterBottom>
                                <strong>Reasons:</strong>
                              </Typography>
                              <ul>
                                {result.reasons.map((reason, idx) => (
                                  <li key={idx}>
                                    <Typography variant="body2">{reason}</Typography>
                                  </li>
                                ))}
                              </ul>
                              {result.required_documents.length > 0 && (
                                <Box>
                                  <Typography variant="body2" gutterBottom>
                                    <strong>Required Documents:</strong>
                                  </Typography>
                                  <Box display="flex" gap={1} flexWrap="wrap">
                                    {result.required_documents.map((doc, idx) => (
                                      <Chip key={idx} label={doc} size="small" variant="outlined" />
                                    ))}
                                  </Box>
                                </Box>
                              )}
                            </Box>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                    </Box>
                  ) : (
                    <Alert severity="info">
                      Fill the FRA holder details and click "Assess Scheme Eligibility" to see results
                    </Alert>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Tab 2: Village Interventions */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Village Profile
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Village Code"
                        value={village.village_code || ''}
                        onChange={(e) => setVillage({ ...village, village_code: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Village Name"
                        value={village.village_name || ''}
                        onChange={(e) => setVillage({ ...village, village_name: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Total Households"
                        type="number"
                        value={village.total_households || ''}
                        onChange={(e) => setVillage({ ...village, total_households: parseInt(e.target.value) })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="ST Households"
                        type="number"
                        value={village.st_households || ''}
                        onChange={(e) => setVillage({ ...village, st_households: parseInt(e.target.value) })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Water Index (0-100)"
                        type="number"
                        value={village.water_index || ''}
                        onChange={(e) => setVillage({ ...village, water_index: parseFloat(e.target.value) })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Electricity Index (0-100)"
                        type="number"
                        value={village.electricity_index || ''}
                        onChange={(e) => setVillage({ ...village, electricity_index: parseFloat(e.target.value) })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Block"
                        value={village.block || ''}
                        onChange={(e) => setVillage({ ...village, block: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="District"
                        value={village.district || ''}
                        onChange={(e) => setVillage({ ...village, district: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="State"
                        value={village.state || ''}
                        onChange={(e) => setVillage({ ...village, state: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="SC Households"
                        type="number"
                        value={village.sc_households || ''}
                        onChange={(e) => setVillage({ ...village, sc_households: parseInt(e.target.value) })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Total Population"
                        type="number"
                        value={village.total_population || ''}
                        onChange={(e) => setVillage({ ...village, total_population: parseInt(e.target.value) })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="ST Population"
                        type="number"
                        value={village.st_population || ''}
                        onChange={(e) => setVillage({ ...village, st_population: parseInt(e.target.value) })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Road Connectivity Index (0-100)"
                        type="number"
                        value={village.road_connectivity_index || ''}
                        onChange={(e) => setVillage({ ...village, road_connectivity_index: parseFloat(e.target.value) })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Health Facility Index (0-100)"
                        type="number"
                        value={village.health_facility_index || ''}
                        onChange={(e) => setVillage({ ...village, health_facility_index: parseFloat(e.target.value) })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Education Index (0-100)"
                        type="number"
                        value={village.education_index || ''}
                        onChange={(e) => setVillage({ ...village, education_index: parseFloat(e.target.value) })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Livelihood Index (0-100)"
                        type="number"
                        value={village.livelihood_index || ''}
                        onChange={(e) => setVillage({ ...village, livelihood_index: parseFloat(e.target.value) })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Forest Cover (%)"
                        type="number"
                        value={village.forest_cover_percent || ''}
                        onChange={(e) => setVillage({ ...village, forest_cover_percent: parseFloat(e.target.value) })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Agricultural Land (%)"
                        type="number"
                        value={village.agricultural_land_percent || ''}
                        onChange={(e) => setVillage({ ...village, agricultural_land_percent: parseFloat(e.target.value) })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Button
                        variant="outlined"
                        onClick={() => setVillage({
                          village_code: 'KHN001',
                          village_name: 'Khandarwas',
                          block: 'Bhopal',
                          district: 'Bhopal',
                          state: 'Madhya Pradesh',
                          total_households: 450,
                          st_households: 280,
                          sc_households: 50,
                          total_population: 2100,
                          st_population: 1200,
                          water_index: 35.5,
                          electricity_index: 65.0,
                          road_connectivity_index: 45.0,
                          health_facility_index: 25.0,
                          education_index: 40.0,
                          livelihood_index: 30.0,
                          forest_cover_percent: 75.0,
                          agricultural_land_percent: 20.0
                        })}
                        fullWidth
                      >
                        Load Sample Village
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Button
                        variant="contained"
                        onClick={handleVillageAnalysis}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <LocationIcon />}
                        fullWidth
                      >
                        Analyze Village Interventions
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Intervention Recommendations
                  </Typography>
                  {interventionResults.length > 0 ? (
                    <Box>
                      {interventionResults.map((result, index) => (
                        <Card key={index} sx={{ mb: 2 }}>
                          <CardHeader
                            title={
                              <Box display="flex" alignItems="center" gap={2}>
                                <Chip
                                  label={result.priority}
                                  color={getPriorityColor(result.priority) as any}
                                  size="small"
                                />
                                <Typography variant="h6">{result.intervention_type.replace(/_/g, ' ')}</Typography>
                              </Box>
                            }
                            subheader={`${result.implementing_ministry} • ${result.timeline_months} months`}
                          />
                          <CardContent>
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary">Beneficiaries</Typography>
                                <Typography variant="h6">{result.estimated_beneficiaries}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary">Estimated Cost</Typography>
                                <Typography variant="h6">{formatCurrency(result.estimated_cost)}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary">Success Probability</Typography>
                                <Typography variant="h6">{(result.success_probability * 100).toFixed(1)}%</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary">Impact Score</Typography>
                                <Typography variant="h6">{(result.impact_score * 100).toFixed(1)}%</Typography>
                              </Grid>
                              <Grid item xs={12}>
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                  {result.reasoning}
                                </Typography>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  ) : (
                    <Alert severity="info">
                      Fill the village profile and click "Analyze Village Interventions" to see recommendations
                    </Alert>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Tab 3: Policy Recommendations */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Policy Recommendations</Typography>
              <Button
                variant="contained"
                onClick={handleGeneratePolicy}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <TrendingUpIcon />}
              >
                Generate Policy Report
              </Button>
            </Box>

            {policyResults && (
              <Grid container spacing={3}>
                {/* Summary Card */}
                <Grid item xs={12}>
                  <Card>
                    <CardHeader title="Executive Summary" />
                    <CardContent>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Box textAlign="center">
                            <Typography variant="h4" color="primary">{policyResults.summary.total_villages_analyzed}</Typography>
                            <Typography variant="body2">Villages Analyzed</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Box textAlign="center">
                            <Typography variant="h4" color="success.main">{policyResults.summary.total_fra_holders}</Typography>
                            <Typography variant="body2">FRA Holders</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Box textAlign="center">
                            <Typography variant="h4" color="warning.main">{policyResults.summary.high_priority_villages}</Typography>
                            <Typography variant="body2">High Priority Villages</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Box textAlign="center">
                            <Typography variant="h4" color="info.main">{formatCurrency(policyResults.summary.estimated_total_investment)}</Typography>
                            <Typography variant="body2">Estimated Investment</Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Resource Allocation */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Resource Allocation" />
                    <CardContent>
                      {Object.entries(policyResults.resource_allocation).map(([type, amount]) => (
                        <Box key={type} sx={{ mb: 2 }}>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2">{type.replace(/_/g, ' ')}</Typography>
                            <Typography variant="body2" fontWeight="bold">{formatCurrency(amount)}</Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={(amount / Math.max(...Object.values(policyResults.resource_allocation))) * 100} 
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Key Recommendations */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Key Recommendations" />
                    <CardContent>
                      {policyResults.key_recommendations.map((recommendation, index) => (
                        <Box key={index} display="flex" alignItems="flex-start" gap={1} sx={{ mb: 2 }}>
                          <CheckCircleIcon color="success" sx={{ mt: 0.5, fontSize: 16 }} />
                          <Typography variant="body2">{recommendation}</Typography>
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Implementation Timeline */}
                <Grid item xs={12}>
                  <Card>
                    <CardHeader title="Implementation Timeline" />
                    <CardContent>
                      <Grid container spacing={2}>
                        {Object.entries(policyResults.implementation_timeline).map(([phase, interventions]) => (
                          <Grid item xs={12} sm={6} md={3} key={phase}>
                            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                              <Typography variant="h6" gutterBottom color="primary">{phase}</Typography>
                              <Typography variant="body2" color="textSecondary" gutterBottom>
                                {interventions.length} interventions
                              </Typography>
                              {interventions.slice(0, 3).map((intervention, idx) => (
                                <Chip
                                  key={idx}
                                  label={intervention}
                                  size="small"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              ))}
                              {interventions.length > 3 && (
                                <Chip
                                  label={`+${interventions.length - 3} more`}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {!policyResults && !loading && (
              <Alert severity="info">
                Click "Generate Policy Report" to analyze sample data and see comprehensive policy recommendations
              </Alert>
            )}
          </Box>
        )}

        {/* Tab 4: Scheme Information */}
        {activeTab === 3 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Central Sector Schemes (CSS) Information
            </Typography>
            
            {schemes && (
              <Grid container spacing={3}>
                {Object.entries(schemes.schemes).map(([schemeKey, schemeData]: [string, any]) => (
                  <Grid item xs={12} md={6} lg={4} key={schemeKey}>
                    <Card>
                      <CardHeader
                        title={schemeData.name}
                        subheader={schemeData.implementing_ministry}
                        action={
                          <Tooltip title="Scheme Information">
                            <IconButton>
                              <InfoIcon />
                            </IconButton>
                          </Tooltip>
                        }
                      />
                      <CardContent>
                        {schemeData.annual_benefit && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="textSecondary">Annual Benefit</Typography>
                            <Typography variant="h6" color="success.main">
                              {formatCurrency(schemeData.annual_benefit)}
                            </Typography>
                          </Box>
                        )}
                        
                        {schemeData.coverage_amount && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="textSecondary">Coverage Amount</Typography>
                            <Typography variant="h6" color="success.main">
                              {formatCurrency(schemeData.coverage_amount)}
                            </Typography>
                          </Box>
                        )}
                        
                        {schemeData.assistance_amount && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="textSecondary">Assistance Amount</Typography>
                            <Typography variant="h6" color="success.main">
                              {formatCurrency(schemeData.assistance_amount)}
                            </Typography>
                          </Box>
                        )}
                        
                        {schemeData.guaranteed_days && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="textSecondary">Guaranteed Days</Typography>
                            <Typography variant="h6" color="info.main">
                              {schemeData.guaranteed_days} days
                            </Typography>
                          </Box>
                        )}

                        <Box>
                          <Typography variant="body2" color="textSecondary">Target Group</Typography>
                          <Typography variant="body2">{schemeData.target_group}</Typography>
                        </Box>

                        {schemeData.interventions && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="textSecondary">
                              {schemeData.interventions} Interventions
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default DSSPage;
