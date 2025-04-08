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
  IconButton
} from '@mui/material';
import { FilterOptions } from '../types';

const INCIDENT_TYPES = [
  'Scam',
  'Theft',
  'Crime',
  'Weather',
  'Public Disorder'
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
}

const FilterDrawer = ({
  open,
  onClose,
  filters,
  onFilterChange,
  resultCount,
  onApplyFilters,
  onClearFilters
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
    return `${value} ${value === 1 ? 'Day' : 'Days'}`;
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
            Time Range
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