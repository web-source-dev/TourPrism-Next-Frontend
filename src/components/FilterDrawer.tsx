'use client';

import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Divider,
  Slider,
  SelectChangeEvent,
  IconButton,
  CircularProgress
} from '@mui/material';
import { FilterOptions } from '../types';

const INCIDENT_TYPES = [
  "Rain",
  "Strike",
  "Protest",
  "Cyber Attack",
  "Fire",
  "Fog",
  "Data Breach",
  "Storm",
  "Flood"
];

const SORT_OPTIONS = [
  { value: 'relevant', label: 'Most Relevant' },
  { value: 'reported', label: 'Most Reported' },
  { value: 'newest', label: 'Newest (24h)' },
  { value: 'oldest', label: 'Oldest' },
];

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  resultCount?: number;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  currentCity?: string | null;
  isUsingCurrentLocation?: boolean;
  onUseMyLocation?: () => Promise<void>;
  onResetLocation?: () => void;
  locationLoading?: boolean;
  locationAccuracy?: number | null;
}

const FilterDrawer = ({
  open,
  onClose,
  filters,
  onFilterChange,
  resultCount,
  onApplyFilters,
  onClearFilters,
  currentCity = 'Edinburgh',
  isUsingCurrentLocation = false,
  onUseMyLocation = () => Promise.resolve(),
  onResetLocation = () => {},
  locationLoading = false,
  locationAccuracy = null
}: FilterDrawerProps) => {
  const handleTimeRangeChange = (_event: Event, newValue: number | number[]) => {
    onFilterChange({
      ...filters,
      timeRange: newValue as number
    });
  };

  const handleDistanceChange = (_event: Event, newValue: number | number[]) => {
    onFilterChange({
      ...filters,
      distance: newValue as number
    });
  };
  
  const handleSortChange = (event: SelectChangeEvent) => {
    onFilterChange({
      ...filters,
      sortBy: event.target.value
    });
  };

  const handleIncidentTypeChange = (type: string) => {
    const updatedTypes = filters.incidentTypes.includes(type)
      ? filters.incidentTypes.filter(t => t !== type)
      : [...filters.incidentTypes, type];
    
    onFilterChange({
      ...filters,
      incidentTypes: updatedTypes
    });
  };

  const getTimeRangeLabel = (value: number) => {
    if (value === 0) return 'All Time';
    return `Next ${value} ${value === 1 ? 'Day' : 'Days'}`;
  };

  const handleApplyFiltersClick = () => {
    // Log filters being applied for debugging
    console.log('Applying filters:', filters);
    onApplyFilters();
  };

  const handleClearFiltersClick = () => {
    onClearFilters();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 360 }, backgroundColor: 'white', color: 'black' },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Sort By
            </Typography>
            <IconButton onClick={onClose}>
              <Typography sx={{ fontSize: '16px', fontWeight: 'bold' }}>X</Typography>
            </IconButton>
          </Box>
          <FormControl fullWidth size="small">
            <Select
              value={filters.sortBy}
              onChange={handleSortChange}
              displayEmpty
              sx={{ color: 'black', backgroundColor: 'white', 
                  borderRadius: 2,
                  mt: 2,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#555',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#555',
                  },
              }}
            >
              {SORT_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}
                sx={{
                    '&.MuiMenuItem-root': {
                      color: 'black',
                      backgroundColor: 'white',
                      borderBottom: '1px solid #ccc',
                    },
                }}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Divider sx={{ my: 2, bgcolor: '#eee' }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" mb={3} gutterBottom sx={{fontWeight:'bold'}}>
            Filter By
          </Typography>
          
          <Typography variant="body1" gutterBottom sx={{fontWeight:'bold'}}>
            Location
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M8 3.83331C6.61929 3.83331 5.5 4.9526 5.5 6.33331C5.5 7.71403 6.61929 8.83331 8 8.83331C9.38071 8.83331 10.5 7.71403 10.5 6.33331C10.5 4.9526 9.38071 3.83331 8 3.83331ZM6.5 6.33331C6.5 5.50489 7.17157 4.83331 8 4.83331C8.82843 4.83331 9.5 5.50489 9.5 6.33331C9.5 7.16174 8.82843 7.83331 8 7.83331C7.17157 7.83331 6.5 7.16174 6.5 6.33331Z" fill="black"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M8 0.833313C5.01483 0.833313 2.5 3.34569 2.5 6.39125C2.5 9.51138 5.07168 11.5963 7.21805 12.9515L7.22668 12.957L7.23551 12.9621C7.46811 13.096 7.73159 13.1666 8 13.1666C8.26841 13.1666 8.53189 13.096 8.76449 12.9621L8.7722 12.9576L8.77974 12.9529C10.9345 11.608 13.5 9.50085 13.5 6.39125C13.5 3.3457 10.9852 0.833313 8 0.833313ZM3.5 6.39125C3.5 3.89164 5.57344 1.83331 8 1.83331C10.4266 1.83331 12.5 3.89164 12.5 6.39125C12.5 8.9117 10.4082 10.7563 8.259 12.0992C8.17936 12.1435 8.09028 12.1666 8 12.1666C7.91008 12.1666 7.82136 12.1437 7.74197 12.0997C5.59283 10.7411 3.5 8.92014 3.5 6.39125Z" fill="black"/>
                </svg>
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {currentCity || 'Edinburgh'}
                </Typography>
                {locationAccuracy && (
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    (±{Math.round(locationAccuracy)}m)
                  </Typography>
                )}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              {isUsingCurrentLocation ? (
                <Button
                  variant="outlined"
                  onClick={onResetLocation}
                  size="small"
                  sx={{ 
                    color: '#d32f2f', 
                    borderColor: '#d32f2f',
                    '&:hover': {
                      borderColor: '#b71c1c',
                      bgcolor: 'rgba(211, 47, 47, 0.04)'
                    },
                    textTransform: 'none',
                    fontSize: '0.8rem'
                  }}
                >
                  Reset to Edinburgh
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  onClick={onUseMyLocation}
                  size="small"
                  disabled={locationLoading}
                  startIcon={
                    locationLoading ? (
                      <CircularProgress size={16} />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 8C9.79 8 8 9.79 8 12C8 14.21 9.79 16 12 16C14.21 16 16 14.21 16 12C16 9.79 14.21 8 12 8ZM20.94 11C20.48 6.83 17.17 3.52 13 3.06V1H11V3.06C6.83 3.52 3.52 6.83 3.06 11H1V13H3.06C3.52 17.17 6.83 20.48 11 20.94V23H13V20.94C17.17 20.48 20.48 17.17 20.94 13H23V11H20.94ZM12 19C8.13 19 5 15.87 5 12C5 8.13 8.13 5 12 5C15.87 5 19 8.13 19 12C19 15.87 15.87 19 12 19Z"
                          fill="black"
                        />
                      </svg>
                    )
                  }
                  sx={{ 
                    color: 'black', 
                    borderColor: 'black',
                    '&:hover': {
                      borderColor: '#555',
                      bgcolor: 'rgba(0, 0, 0, 0.04)'
                    },
                    textTransform: 'none',
                    fontSize: '0.8rem'
                  }}
                >
                  Use my location
                </Button>
              )}
            </Box>
          </Box>
          <Divider sx={{ my: 2, bgcolor: '#eee' }} />
          
          <Typography variant="body1" gutterBottom sx={{fontWeight:'bold'}}>
            Alert Type
          </Typography>
          <FormGroup>
            {INCIDENT_TYPES.map((type) => (
              <FormControlLabel
                key={type}
                control={
                  <Checkbox
                    checked={filters.incidentTypes.includes(type)}
                    onChange={() => handleIncidentTypeChange(type)}
                    size="small"
                    sx={{ color: 'black' }}
                  />
                }
                label={type}
                sx={{ color: 'black' }}
              />
            ))}
          </FormGroup>
        </Box>
        <Divider sx={{ my: 2, bgcolor: '#eee' }} />
        <Box sx={{ mb: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Time Horizon
          </Typography>
          <Box sx={{ px: 1 }}>
            <Slider
              value={filters.timeRange || 0}
              onChange={handleTimeRangeChange}
              min={0}
              max={30}
              step={1}
              marks={[{ value: 0, label: 'All' }, { value: 30, label: '30d' }]}
              valueLabelDisplay="auto"
              valueLabelFormat={getTimeRangeLabel}
              sx={{ color: 'black'}}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2, bgcolor: '#eee' }} />

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Distance (km)
          </Typography>
          <Box sx={{ px: 1 }}>
            <Slider
              value={filters.distance || 0}
              onChange={handleDistanceChange}
              min={2}
              max={100}
              step={1}
              marks={[{ value: 2, label: '2' }, { value: 100, label: '100km' }]}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value}km`}
              sx={{ color: 'black' }}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2, bgcolor: '#eee' }} />

        <Box sx={{ mt: 5 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              onClick={handleApplyFiltersClick} 
              fullWidth 
              sx={{ flex: 2, backgroundColor: 'black', borderRadius: '25px', color: 'white' }}
            >
              Show Results {resultCount ? `(${resultCount})` : ''}
            </Button>
            <Button 
              variant="outlined" 
              onClick={handleClearFiltersClick} 
              fullWidth 
              sx={{ flex: 1, color: 'black', borderRadius: '25px', borderColor: 'black' }}
            >
              Clear All
            </Button>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default FilterDrawer; 