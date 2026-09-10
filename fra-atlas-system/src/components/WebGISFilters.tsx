import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Typography,
  Stack,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';

interface FilterOptions {
  states: Array<{ id: string; name: string; code: string }>;
  districts: Array<{ id: string; name: string; state_id: string }>;
  tribalGroups: Array<{ id: string; name: string }>;
  claimStatuses: string[];
  assetTypes: string[];
}

interface FilterValues {
  selectedState?: string;
  selectedDistricts: string[];
  selectedTribalGroups: string[];
  selectedClaimStatuses: string[];
  selectedAssetTypes: string[];
  activeLayers: string[];
  dateRange?: { start: Date; end: Date };
}

interface WebGISFiltersProps {
  filterOptions: FilterOptions;
  filterValues: FilterValues;
  onFilterChange: (filters: FilterValues) => void;
  onClearFilters: () => void;
}

const WebGISFilters: React.FC<WebGISFiltersProps> = ({
  filterOptions,
  filterValues,
  onFilterChange,
  onClearFilters
}) => {
  const [localFilters, setLocalFilters] = useState<FilterValues>(filterValues);

  useEffect(() => {
    setLocalFilters(filterValues);
  }, [filterValues]);

  const handleStateChange = (event: SelectChangeEvent) => {
    const stateId = event.target.value;
    const updatedFilters = {
      ...localFilters,
      selectedState: stateId,
      selectedDistricts: [] // Clear districts when state changes
    };
    setLocalFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleMultiSelectChange = (
    field: keyof FilterValues,
    event: SelectChangeEvent<string[]>
  ) => {
    const value = event.target.value as string[];
    const updatedFilters = {
      ...localFilters,
      [field]: value
    };
    setLocalFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleLayerToggle = (layerName: string) => {
    const currentLayers = localFilters.activeLayers || [];
    const updatedLayers = currentLayers.includes(layerName)
      ? currentLayers.filter(layer => layer !== layerName)
      : [...currentLayers, layerName];
    
    const updatedFilters = {
      ...localFilters,
      activeLayers: updatedLayers
    };
    setLocalFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleClearAll = () => {
    setLocalFilters({
      selectedDistricts: [],
      selectedTribalGroups: [],
      selectedClaimStatuses: [],
      selectedAssetTypes: [],
      activeLayers: []
    });
    onClearFilters();
  };

  const getFilteredDistricts = () => {
    if (!localFilters.selectedState) return [];
    return filterOptions.districts.filter(
      district => district.state_id === localFilters.selectedState
    );
  };

  const renderMultiSelect = (
    label: string,
    value: string[],
    options: Array<{ id: string; name: string }> | string[],
    field: keyof FilterValues
  ) => (
    <FormControl fullWidth size="small">
      <InputLabel>{label}</InputLabel>
      <Select
        multiple
        value={value}
        onChange={(event) => handleMultiSelectChange(field, event)}
        input={<OutlinedInput label={label} />}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {(selected as string[]).map((val) => {
              const option = Array.isArray(options) && typeof options[0] === 'object'
                ? (options as Array<{ id: string; name: string }>).find(opt => opt.id === val)
                : null;
              return (
                <Chip
                  key={val}
                  label={option ? option.name : val}
                  size="small"
                  variant="outlined"
                />
              );
            })}
          </Box>
        )}
      >
        {Array.isArray(options) && typeof options[0] === 'object'
          ? (options as Array<{ id: string; name: string }>).map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.name}
              </MenuItem>
            ))
          : (options as string[]).map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
      </Select>
    </FormControl>
  );

  const layerOptions = [
    { key: 'ifr', label: 'IFR Claims', color: '#4CAF50' },
    { key: 'cfr', label: 'CFR Claims', color: '#8BC34A' },
    { key: 'assets', label: 'Village Assets', color: '#FF9800' },
    { key: 'boundaries', label: 'Administrative Boundaries', color: '#2196F3' },
    { key: 'forest', label: 'Forest Cover', color: '#2E7D32' },
    { key: 'tribal', label: 'Tribal Areas', color: '#9C27B0' }
  ];

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FilterListIcon sx={{ mr: 1 }} />
            <Typography variant="h6" component="h3">
              WebGIS Filters
            </Typography>
            <Button
              startIcon={<ClearIcon />}
              onClick={handleClearAll}
              size="small"
              sx={{ ml: 'auto' }}
            >
              Clear All
            </Button>
          </Box>

          <Stack spacing={2}>
            {/* Geographic Filters */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Geographic Filters</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>State</InputLabel>
                      <Select
                        value={localFilters.selectedState || ''}
                        onChange={handleStateChange}
                        input={<OutlinedInput label="State" />}
                      >
                        <MenuItem value="">
                          <em>All States</em>
                        </MenuItem>
                        {filterOptions.states.map((state) => (
                          <MenuItem key={state.id} value={state.id}>
                            {state.name} ({state.code})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    {renderMultiSelect(
                      'Districts',
                      localFilters.selectedDistricts,
                      getFilteredDistricts(),
                      'selectedDistricts'
                    )}
                  </Stack>
                  
                  {renderMultiSelect(
                    'Tribal Groups',
                    localFilters.selectedTribalGroups,
                    filterOptions.tribalGroups,
                    'selectedTribalGroups'
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* FRA Filters */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">FRA Claim Filters</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {renderMultiSelect(
                  'Claim Status',
                  localFilters.selectedClaimStatuses,
                  filterOptions.claimStatuses,
                  'selectedClaimStatuses'
                )}
              </AccordionDetails>
            </Accordion>

            {/* Asset Filters */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Asset Filters</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {renderMultiSelect(
                  'Asset Types',
                  localFilters.selectedAssetTypes,
                  filterOptions.assetTypes,
                  'selectedAssetTypes'
                )}
              </AccordionDetails>
            </Accordion>

            {/* Layer Controls */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Map Layers</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={1}>
                  {layerOptions.map((layer) => (
                    <FormControlLabel
                      key={layer.key}
                      control={
                        <Switch
                          checked={localFilters.activeLayers?.includes(layer.key) || false}
                          onChange={() => handleLayerToggle(layer.key)}
                          size="small"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              backgroundColor: layer.color,
                              borderRadius: '2px'
                            }}
                          />
                          <Typography variant="body2">{layer.label}</Typography>
                        </Box>
                      }
                    />
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default WebGISFilters;