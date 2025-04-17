'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Paper,
  Autocomplete,
  Chip,
  InputAdornment,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { User } from '@/types';
import { updateCompanyInfo, getCompanySuggestions } from '@/services/api';

// Google Maps Places API Script
import { useLoadScript } from '@react-google-maps/api';
import { Libraries } from '@react-google-maps/api/dist/utils/make-load-script-url';

// Predefined company types
const COMPANY_TYPES = [
  "Travel Agency",
  "Tour Operator",
  "Hotel/Accommodation",
  "Transportation",
  "Restaurant/Food Service",
  "Entertainment Venue",
  "Tourism Board",
  "Educational Institution",
  "Technology Provider",
  "Media/Publishing",
  "Consulting",
  "Financial Services",
  "Healthcare",
  "Non-profit Organization",
];

interface CompanyInfoTabProps {
  user: User;
  onUpdate: (updatedUser: User) => void;
}

export default function CompanyInfoTab({ user, onUpdate }: CompanyInfoTabProps) {
  // Form state
  const [companyName, setCompanyName] = useState(user.company?.name || '');
  
  // Change from string to array for multiple types
  const [companyTypes, setCompanyTypes] = useState<string[]>(
    user.company?.type ? user.company.type.split(', ').filter(Boolean) : []
  );
  
  const [operatingRegions, setOperatingRegions] = useState<string[]>(
    user.company?.MainOperatingRegions || []
  );
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [regionSearch, setRegionSearch] = useState('');
  const [regionSuggestions, setRegionSuggestions] = useState<string[]>([]);
  
  // Company name suggestions
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  
  // Google Maps Places API
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'] as Libraries,
  });
  
  // Initialize Google Places Autocomplete service
  const [placesService, setPlacesService] = useState<google.maps.places.AutocompleteService | null>(null);

  // Update form fields when user prop changes
  useEffect(() => {
    setCompanyName(user.company?.name || '');
    setCompanyTypes(user.company?.type ? user.company.type.split(', ').filter(Boolean) : []);
    setOperatingRegions(user.company?.MainOperatingRegions || []);
  }, [user]);
  
  useEffect(() => {
    // Initialize Places service when the API is loaded
    if (isLoaded && !placesService) {
      try {
        if (window.google && window.google.maps && window.google.maps.places) {
          console.log('Initializing Google Places service');
          const service = new window.google.maps.places.AutocompleteService();
          setPlacesService(service);
        } else {
          console.error('Google Maps Places API not available');
        }
      } catch (error) {
        console.error('Failed to initialize Google Places service:', error);
      }
    }
  }, [isLoaded, placesService]);

  // Log any Google Maps loading errors
  useEffect(() => {
    if (loadError) {
      console.error('Error loading Google Maps API:', loadError);
    }
  }, [loadError]);
  
  // Fetch company name suggestions
  const fetchCompanySuggestions = async (query: string) => {
    if (query.length > 1) {
      try {
        const suggestions = await getCompanySuggestions(query);
        setNameSuggestions(suggestions);
      } catch (error) {
        console.error('Error fetching company suggestions:', error);
      }
    } else {
      setNameSuggestions([]);
    }
  };
  useEffect(() => {
    if (regionSearch && regionSearch.length > 1 && placesService) {
      const delayDebounce = setTimeout(() => {
        try {
          placesService.getPlacePredictions(
            {
              input: regionSearch,
              types: ['(regions)'],
            },
            (predictions, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                console.log('Google Places predictions:', predictions);
                setRegionSuggestions(
                  predictions.map((prediction) => prediction.description)
                );
              } else {
                console.warn('Google Places API returned status:', status);
                setRegionSuggestions([]);
              }
            }
          );
        } catch (error) {
          console.error('Error getting place predictions:', error);
          setRegionSuggestions([]);
        }
      }, 300);
      
      return () => clearTimeout(delayDebounce);
    } else {
      setRegionSuggestions([]);
    }
  }, [regionSearch, placesService]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Validate form
    if (!companyName.trim()) {
      setError('Company name is required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Log current state before submitting
      console.log('Current company name before submit:', companyName);
      
      const updateData = {
        companyName: companyName.trim(),
        companyType: companyTypes.join(', '),
        mainOperatingRegions: operatingRegions,
      };
      
      console.log('Updating company info with data:', updateData);
      
      const updatedUser = await updateCompanyInfo(updateData);
      console.log('Updated user from server:', updatedUser);
      console.log('Updated company name from server:', updatedUser.company?.name);
      
      if (updatedUser.company?.name !== undefined) {
        setCompanyName(updatedUser.company.name);
      }
      
      onUpdate(updatedUser);
      setSuccess('Company information updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update company information');
    } finally {
      setIsSubmitting(false);
    }
  };
  // Handle removing a company type
  const handleRemoveType = (typeToRemove: string) => {
    setCompanyTypes(companyTypes.filter(type => type !== typeToRemove));
  };
  
  // Add a region to the selected regions
  const handleAddRegion = () => {
    if (regionSearch && !operatingRegions.includes(regionSearch)) {
      setOperatingRegions([...operatingRegions, regionSearch]);
      setRegionSearch('');
    }
  };
  
  // Remove a region from the selected regions
  const handleDeleteRegion = (region: string) => {
    setOperatingRegions(operatingRegions.filter((r) => r !== region));
  };
  
  return (
    <Paper elevation={0} sx={{ p: 2 }}>
      <Box component="form" noValidate>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Company Information
        </Typography>
        
        <Divider sx={{ mb: 3 }} />
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}
        
        <Stack spacing={3} sx={{ mb: 4 }}>
          {/* Company Name with Autocomplete */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Company Name<span style={{ color: 'red' }}>*</span>
            </Typography>
            <Autocomplete
              freeSolo
              value={companyName}
              options={nameSuggestions}
              onInputChange={(event, newInputValue) => {
                // Update company name directly as user types
                setCompanyName(newInputValue);
                // Also fetch suggestions
                fetchCompanySuggestions(newInputValue);
              }}
              onChange={(event, newValue) => {
                // This handles selection from dropdown
                if (newValue) {
                  setCompanyName(newValue);
                }
              }}
              blurOnSelect
              selectOnFocus
              clearOnBlur={false}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Company Name"
                  required
                  fullWidth
                  disabled={isSubmitting}
                  helperText="Start typing to get suggestions from existing companies"
                />
              )}
            />
            {/* Debug display - remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Current value: {companyName || '(empty)'}
              </Typography>
            )}
          </Box>
          
          {/* Company Types Selection - Multiple Types */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Company Types
            </Typography>
            
            <Autocomplete
              multiple
              fullWidth
              freeSolo
              options={COMPANY_TYPES.filter(type => !companyTypes.includes(type))}
              value={companyTypes}
              onChange={(event, newValue) => {
                setCompanyTypes(newValue);
              }}
              renderTags={() => null}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Company Types"
                  placeholder={companyTypes.length > 0 ? "Add more types" : "Select or type company types"}
                  disabled={isSubmitting}
                  helperText="Select from list or type a custom type and press Enter"
                />
              )}
            />
            
            {/* Display selected company types as chips outside the input */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
              {companyTypes.map((type) => (
                <Chip
                  key={type}
                  label={type}
                  onDelete={() => handleRemoveType(type)}
                  color="primary"
                  variant="outlined"
                />
              ))}
              {companyTypes.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No company types selected
                </Typography>
              )}
            </Box>
          </Box>
          
          {/* Operating Regions */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Main Operating Regions
            </Typography>
            
            <TextField
              fullWidth
              label="Add Operating Region"
              placeholder="Start typing a city, state, or country"
              value={regionSearch}
              onChange={(e) => setRegionSearch(e.target.value)}
              disabled={isSubmitting || (!isLoaded || !!loadError)}
              helperText={
                loadError 
                  ? "Google Places API could not be loaded. Please check your connection." 
                  : !isLoaded 
                    ? "Loading Google Places..." 
                    : "Type to search for locations"
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton 
                      edge="end" 
                      onClick={handleAddRegion}
                      disabled={!regionSearch || isSubmitting}
                    >
                      <AddIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            {/* Region Suggestions */}
            {regionSearch && regionSuggestions.length > 0 && (
              <Paper elevation={3} sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                <Stack>
                  {regionSuggestions.map((suggestion) => (
                    <Box
                      key={suggestion}
                      sx={{
                        p: 1.5,
                        '&:hover': { backgroundColor: 'action.hover', cursor: 'pointer' },
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      }}
                      onClick={() => {
                        if (suggestion && !operatingRegions.includes(suggestion)) {
                          setOperatingRegions([...operatingRegions, suggestion]);
                          setRegionSearch('');
                          setRegionSuggestions([]);
                        }
                      }}
                    >
                      <Typography variant="body2">
                        <SearchIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                        {suggestion}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            )}
            
            {/* Message when no suggestions found */}
            {regionSearch && regionSearch.length > 1 && regionSuggestions.length === 0 && !loadError && isLoaded && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                No locations found. You can still add this location manually by clicking the + button.
              </Typography>
            )}
            
            {/* Selected Regions */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
              {operatingRegions.map((region) => (
                <Chip
                  key={region}
                  label={region}
                  onDelete={() => handleDeleteRegion(region)}
                  color="primary"
                  variant="outlined"
                />
              ))}
              {operatingRegions.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No operating regions selected
                </Typography>
              )}
            </Box>
          </Box>
        </Stack>
        
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isSubmitting ? 'Saving...' : 'Save Changes '}
        </Button>
      </Box>
    </Paper>
  );
} 