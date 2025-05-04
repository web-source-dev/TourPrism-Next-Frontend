'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Stack,
  Tooltip,
  Chip,
  Card,
  CardContent,
} from '@mui/material';
import { 
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, parseISO, addDays } from 'date-fns';

// Google Places Autocomplete
import { useLoadScript } from '@react-google-maps/api';

// Import LocationSearchInput component
import LocationSearchInput from '@/components/alert-summary/LocationSearchInput';

// Import the summaryService
import { 
  generateSummary, 
  getSavedSummaries, 
  deleteSummary, 
  Summary,
  SummaryLocation 
} from '@/services/summaryService';
import Layout from '@/components/Layout';

// Define the category-type mapping to match admin create page
const ALERT_TYPE_MAP = {
  "Weather": ["Flood", "Rain", "Heat Warning", "Storm", "Snow", "Fog", "Other"],
  "Transport": ["Strike", "Delay", "Cancellation", "Infrastructure Issue", "Traffic", "Other"],
  "Health": ["Outbreak", "Epidemic", "Pandemic", "Contamination", "Other"],
  "Civil Unrest": ["Protest", "Riot", "Strike", "Demonstration", "Other"],
  "General Safety": ["Terrorism", "Crime", "Cyber Attack", "Data Breach", "Other"],
  "Natural Disaster": ["Earthquake", "Tsunami", "Volcanic Activity", "Wildfire", "Landslide", "Other"]
};

// Convert the map to the format needed for the dropdown
const ALERT_TYPES = Object.keys(ALERT_TYPE_MAP).map(category => ({
  value: category,
  label: `${category} Events`,
}));

const IMPACT_LEVELS = [
  { value: 'Minor', label: 'Minor' },
  { value: 'Moderate', label: 'Moderate' },
  { value: 'Severe', label: 'Severe' },
];

export default function DisruptionForecast() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('weekly');
  const [savedForecasts, setSavedForecasts] = useState<Summary[]>([]);
  
  // Form state for custom forecast
  const [alertCategory, setAlertCategory] = useState('');
  const [location, setLocation] = useState<SummaryLocation | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(addDays(new Date(), 7));
  const [impact, setImpact] = useState('');
  
  // Google Maps API script loading
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });

  useEffect(() => {
    loadSavedForecasts();
  }, []);

  const loadSavedForecasts = async () => {
    try {
      const response = await getSavedSummaries();
      if (response.success) {
        setSavedForecasts(response.summaries);
      }
    } catch (error) {
      console.error('Error loading saved forecasts:', error);
      setError('Failed to load saved forecasts. Please try again.');
    }
  };

  const handleDeleteForecast = async (id: string) => {
    try {
      setLoading(true);
      const response = await deleteSummary(id);
      if (response.success) {
        // Update the list after deletion
        setSavedForecasts(savedForecasts.filter(forecast => forecast._id !== id));
      }
    } catch (error) {
      console.error('Error deleting forecast:', error);
      setError('Failed to delete forecast. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateForecast = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!location) {
        setError('Please select a location');
        setLoading(false);
        return;
      }

      // Prepare locations array
      const locations = location ? [location] : [];
      
      // Get all subcategory alert types for the selected category
      const alertTypes = alertCategory ? 
        [alertCategory, ...(ALERT_TYPE_MAP[alertCategory as keyof typeof ALERT_TYPE_MAP] || [])] : 
        [];
      
      const data = {
        title: `Disruption Forecast for ${location?.city || 'Selected Location'}`,
        description: `Custom forecast for ${format(startDate || new Date(), 'dd MMM yyyy')} to ${format(endDate || new Date(), 'dd MMM yyyy')}`,
        startDate: startDate ? startDate.toISOString() : undefined,
        endDate: endDate ? endDate.toISOString() : undefined,
        locations,
        alertTypes,
        alertCategory, // Add the category explicitly 
        includeDuplicates: false,
        generatePDF: true,
        autoSave: true,
        impact: impact || undefined,
      };

      const response = await generateSummary(data);
      
      if (response.success && response.summary.savedSummaryId) {
        // Navigate to the detailed view
        router.push(`/alerts-summary/${response.summary.savedSummaryId}`);
      } else {
        setError('Failed to generate forecast. Please try again with different parameters.');
      }
    } catch (error) {
      console.error('Error generating forecast:', error);
      setError('An error occurred while generating the forecast. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewWeeklyForecast = () => {
    // Navigate to the weekly forecast generation page
    router.push('/alerts-summary/weekly');
  };

  const handleViewSavedForecast = (id: string) => {
    router.push(`/alerts-summary/${id}`);
  };

  return (
    <Layout isFooter={false}>
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ px: 3, py: 2, maxWidth: '1200px', mx: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Weekly Forecast Section */}
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 2,
            border: activeSection === 'weekly' ? '2px solid #3f51b5' : 'none'
          }}
        >
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Your Weekly Disruption Forecast
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            A quick forecast of disruptions that could impact your business this week.
          </Typography>

          <Button 
            variant="contained" 
            size="large"
            fullWidth 
            onClick={handleViewWeeklyForecast}
            sx={{ 
              py: 1.5, 
              backgroundColor: '#000',
              '&:hover': {
                backgroundColor: '#333',
              }
            }}
          >
            View Forecast
          </Button>
        </Paper>

        {/* Custom Forecast Section */}
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 2,
            border: activeSection === 'custom' ? '2px solid #3f51b5' : 'none' 
          }}
          onClick={() => setActiveSection('custom')}
        >
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Customize Your Disruption Forecast
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Filter upcoming disruptions to create a custom forecast for your business.
          </Typography>

          <Box sx={{ width: '100%', mb: 3 }}>
            <FormControl fullWidth>
              <InputLabel id="alert-type-label">Alert Category</InputLabel>
              <Select
                labelId="alert-type-label"
                id="alert-type"
                value={alertCategory}
                label="Alert Category"
                onChange={(e) => setAlertCategory(e.target.value)}
              >
                {ALERT_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {alertCategory && (
              <Box sx={{ mt: 2, mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Will include all {alertCategory.toLowerCase()} types: 
                  {ALERT_TYPE_MAP[alertCategory as keyof typeof ALERT_TYPE_MAP]?.map((subtype) => (
                    <Chip 
                      key={subtype} 
                      label={subtype}
                      size="small"
                      sx={{ ml: 0.5, mb: 0.5, mt: 0.5 }}
                    />
                  ))}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Date Range */}
          <Box sx={{ width: '100%', mb: 3 }}>
            <FormControl fullWidth>
              <Stack direction="row" spacing={2}>
                <Box sx={{ width: '50%' }}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(newValue) => setStartDate(newValue)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Box>
                <Box sx={{ width: '50%' }}>
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={(newValue) => setEndDate(newValue)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Box>
              </Stack>
            </FormControl>
          </Box>

          {/* Location */}
          <Box sx={{ width: '100%', mb: 3 }}>
            {isLoaded ? (
              <LocationSearchInput 
                setValue={setLocation} 
                value={location}
                label="Location" 
              />
            ) : (
              <TextField
                label="Location"
                fullWidth
                disabled
                placeholder="Loading location search..."
              />
            )}
          </Box>

          {/* Impact */}
          <Box sx={{ width: '100%', mb: 3 }}>
            <FormControl fullWidth>
              <InputLabel id="impact-label">Impact</InputLabel>
              <Select
                labelId="impact-label"
                id="impact"
                value={impact}
                label="Impact"
                onChange={(e) => setImpact(e.target.value)}
              >
                {IMPACT_LEVELS.map((level) => (
                  <MenuItem key={level.value} value={level.value}>
                    {level.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Button 
              variant="contained" 
              fullWidth 
              onClick={handleGenerateForecast}
              disabled={loading}
              sx={{ 
                py: 1.5,
                backgroundColor: '#000',
                '&:hover': {
                  backgroundColor: '#333',
                }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Generate Forecast'}
            </Button>
          </Box>
        </Paper>

        {/* Saved Forecasts Section */}
        {savedForecasts.length > 0 && (
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Your Saved Forecasts
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Access or manage your previously generated disruption forecasts.
            </Typography>

            <Stack spacing={2}>
              {savedForecasts.map((forecast) => (
                <Card 
                  key={forecast._id} 
                  variant="outlined"
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 2 }
                  }}
                >
                  <CardContent sx={{ pb: '16px !important' }}>
                    <Stack 
                      direction="row" 
                      alignItems="center" 
                      spacing={1}
                      justifyContent="space-between"
                    >
                      <Box 
                        sx={{ flex: '0 0 66.666%' }} 
                        onClick={() => handleViewSavedForecast(forecast._id)}
                      >
                        <Typography variant="subtitle1" fontWeight="medium">
                          {forecast.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Saved on {format(parseISO(forecast.createdAt), 'd MMM yyyy')}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ flex: '0 0 25%', textAlign: 'right' }}>
                        <Chip 
                          label={`${Math.round((new TextEncoder().encode(forecast.htmlContent || "").length / 1024))} KB`}
                          size="small" 
                          sx={{ mr: 1 }}
                        />
                      </Box>
                      
                      <Box sx={{ flex: '0 0 8.333%', textAlign: 'right' }}>
                        <Tooltip title="Delete forecast">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteForecast(forecast._id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Paper>
        )}
      </Box>
    </LocalizationProvider>
    </Layout>
  );
}
