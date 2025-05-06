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
  Stack,
  Tooltip,
  Chip,
  Card,
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  Download as DownloadIcon,
  BookmarkBorder as BookmarkBorderIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, parseISO, addDays } from 'date-fns';
import { useAuth } from '@/context/AuthContext';

// Google Places Autocomplete
import { useLoadScript } from '@react-google-maps/api';

// Import LocationSearchInput component
import LocationSearchInput from '@/components/alert-summary/LocationSearchInput';

// Import the summaryService
import { 
  generateSummary, 
  getSavedSummaries, 
  deleteSummary, 
  getSummaryById,
  Summary,
  SummaryLocation,
  downloadPdf,
  generatePdfOnDemand,
  getUpcomingForecasts,
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
  
  // Weekly forecast date range (for display)

  
const { isCollaboratorViewer } = useAuth();

const isViewOnly = () => {
  return isCollaboratorViewer;
};


  const weeklyStartDate = new Date()
  const weeklyEndDate = addDays(new Date(), 7)
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
        summaryType: 'forecast' as const, // Use type assertion
        startDate: startDate ? startDate.toISOString() : undefined,
        endDate: endDate ? endDate.toISOString() : undefined,
        locations,
        alertTypes,
        alertCategory, // Add the category explicitly 
        includeDuplicates: false,
        generatePDF: true,
        autoSave: true, // Don't auto-save - let user decide if they want to save
        impact: impact || undefined,
      };

      const response = await generateSummary(data);
      
      if (response.success) {
        if (response.summary.savedSummaryId) {
          // Navigate to the saved summary if we have an ID
          router.push(`/alerts-summary/${response.summary.savedSummaryId}`);
        } else if (response.summary.pdfUrl) {
          // Create a temporary ID for viewing this unsaved summary
          router.push(`/alerts-summary/${response.summary.savedSummaryId || 'custom-forecast'}?pdf=${encodeURIComponent(response.summary.pdfUrl)}`);
        } else {
          setError('Failed to generate forecast. Please try again with different parameters.');
        }
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

  const handleGenerateWeeklyForecast = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get the forecast with proper MainOperatingRegions
      const response = await getUpcomingForecasts(7);
      
      if (response.success && response.forecast?.pdfUrl) {
        // Download the PDF using the URL from the forecast
        await downloadPdf(
          response.forecast.pdfUrl,
          `Weekly_Forecast_${format(new Date(), 'yyyy-MM-dd')}.pdf`
        );
      } else {
        setError('Failed to generate the weekly forecast PDF. Please try again.');
      }
    } catch (error) {
      console.error('Error generating weekly forecast:', error);
      setError('Failed to generate weekly forecast. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWeeklyForecast = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get the forecast with proper MainOperatingRegions
      const forecastResponse = await getUpcomingForecasts(7);
      
      if (!forecastResponse.success || !forecastResponse.forecast) {
        setError('Failed to generate weekly forecast. Please try again.');
        return;
      }

      // Now save the forecast with the data we got, including MainOperatingRegions
      const data = {
        title: forecastResponse.forecast.title,
        description: forecastResponse.forecast.description || `Weekly forecast for ${format(new Date(), 'dd MMM yyyy')}`,
        summaryType: 'forecast' as const,
        startDate: forecastResponse.forecast.timeRange.startDate,
        endDate: forecastResponse.forecast.timeRange.endDate,
        generatePDF: true,
        autoSave: true,
        locations: forecastResponse.forecast.userRegions || [], // Use userRegions for locations
        alertCategory: forecastResponse.forecast.alertCategory,
        impact: forecastResponse.forecast.impact,
        includedAlerts: forecastResponse.forecast.alerts || [] // Include the alerts from the forecast
      };

      const response = await generateSummary(data);
      
      if (response.success && response.summary.savedSummaryId) {
        // Navigate to the saved forecast view
        router.push(`/alerts-summary/${response.summary.savedSummaryId}`);
      } else {
        setError('Failed to save the weekly forecast. Please try again.');
      }
    } catch (error) {
      console.error('Error saving weekly forecast:', error);
      setError('Failed to save weekly forecast. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewSavedForecast = (id: string) => {
    router.push(`/alerts-summary/${id}`);
  };

  const handleDownloadForecast = async (id: string) => {
    try {
      setLoading(true);
      setError('');
      
      // Get the summary details to access the PDF URL
      const response = await getSummaryById(id);
      
      if (response.success) {
        if (response.summary.pdfUrl) {
          // Use the downloadPdf utility
          await downloadPdf(
            response.summary.pdfUrl,
            `${response.summary.title.replace(/\s+/g, '_')}.pdf`
          );
        } else {
          // No PDF available, generate one
          const pdfUrl = await generatePdfOnDemand(id);
          
          if (pdfUrl) {
            await downloadPdf(
              pdfUrl,
              `${response.summary.title.replace(/\s+/g, '_')}.pdf`
            );
          } else {
            setError('Failed to generate PDF. Please try again.');
          }
        }
      } else {
        setError('Failed to retrieve forecast details. Please try again.');
      }
    } catch (error) {
      console.error('Error downloading forecast:', error);
      setError('Failed to download forecast. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShareForecast = async (id: string) => {
    try {
      // Create the share URL for the forecast
      const shareUrl = `${window.location.origin}/alerts-summary/${id}`;
      
      // Use the Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: 'TourPrism Disruption Forecast',
          text: 'Check out this disruption forecast from TourPrism',
          url: shareUrl
        });
      } else {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing forecast:', error);
    }
  };

  const handleShareWeeklyForecast = async () => {
    try {
      // Create the share URL for the weekly forecast
      const shareUrl = `${window.location.origin}/alerts-summary/weekly`;
      
      // Use the Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: 'TourPrism Weekly Disruption Forecast',
          text: 'Check out this weekly disruption forecast from TourPrism',
          url: shareUrl
        });
      } else {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(shareUrl);
        alert('Weekly forecast link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing weekly forecast:', error);
    }
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
          elevation={1} 
          sx={{ 
            p: 0, 
            mb: 4, 
            borderRadius: 4,
            overflow: 'hidden',
            border: activeSection === 'weekly' ? '1px solid #e0e0e0' : 'none'
          }}
        >
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              This Week&apos;s Forecast
            </Typography>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {format(weeklyStartDate, 'dd MMM')} – {format(weeklyEndDate, 'dd MMM yyyy')}
            </Typography>

            <Typography variant="body1" fontWeight="medium" sx={{ mb: 2 }}>
              Multiple Alerts for this Week.
            </Typography>

            <Button 
              variant="contained" 
              fullWidth 
              onClick={handleViewWeeklyForecast}
              sx={{ 
                py: 1.5, 
                backgroundColor: '#f5f5f5',
                color: '#000',
                boxShadow: 'none',
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: '#e0e0e0',
                  boxShadow: 'none'
                }
              }}
            >
              View Full Report
            </Button>
          </Box>

          <Box sx={{ 
            display: 'flex', 
            borderTop: '1px solid #f0f0f0',
            '& > *': {
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              py: 1.5,
              color: '#666',
              cursor: 'pointer',
              '&:hover': {
                color: '#333'
              }
            }
          }}>
            <Box onClick={() => handleGenerateWeeklyForecast()}>
              <Tooltip title="Download Report">
                <DownloadIcon fontSize="small" />
              </Tooltip>
            </Box>
            <Box sx={{ borderLeft: '1px solid #f0f0f0', borderRight: '1px solid #f0f0f0' }} onClick={() => handleShareWeeklyForecast()}>
              <Tooltip title="Share Report">
                <ArrowForwardIcon fontSize="small" />
              </Tooltip>
            </Box>
            <Box onClick={() => isViewOnly() ? null : handleSaveWeeklyForecast()}
              sx={{
                opacity: isViewOnly() ? 0.5 : 1,
                cursor: isViewOnly() ? 'not-allowed' : 'pointer'
              }}
            >
              <Tooltip title="Save Report">
                <BookmarkBorderIcon fontSize="small" />
              </Tooltip>
            </Box>
          </Box>
        </Paper>

        {/* Custom Forecast Section */}
        <Paper 
          elevation={1} 
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 4,
            overflow: 'hidden',
            border: activeSection === 'custom' ? '1px solid #e0e0e0' : 'none' 
          }}
          onClick={() => setActiveSection('custom')}
        >
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Create Custom Forecast
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create custom disruption forecasts
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
                disabled={isViewOnly()}
                sx={{
                  opacity: isViewOnly() ? 0.5 : 1,
                  cursor: isViewOnly() ? 'not-allowed' : 'pointer'
                }}
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
                    disabled={isViewOnly()}
                    sx={{
                      opacity: isViewOnly() ? 0.5 : 1,
                      cursor: isViewOnly() ? 'not-allowed' : 'pointer'
                    }}
                  />
                </Box>
                <Box sx={{ width: '50%' }}>
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={(newValue) => setEndDate(newValue)}
                    slotProps={{ textField: { fullWidth: true } }}
                    disabled={isViewOnly()}
                    sx={{
                      opacity: isViewOnly() ? 0.5 : 1,
                      cursor: isViewOnly() ? 'not-allowed' : 'pointer'
                    }}
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
                disabled={isViewOnly()}
                placeholder="Loading location search..."
                sx={{
                  opacity: isViewOnly() ? 0.5 : 1,
                  cursor: isViewOnly() ? 'not-allowed' : 'pointer'
                }}
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
                disabled={isViewOnly()}
                sx={{
                  opacity: isViewOnly() ? 0.5 : 1,
                  cursor: isViewOnly() ? 'not-allowed' : 'pointer'
                }}
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
              disabled={loading || isViewOnly()}
              sx={{ 
                py: 1.5,
                opacity: isViewOnly() ? 0.5 : 1,
                cursor: isViewOnly() ? 'not-allowed' : 'pointer',
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
          <Paper elevation={1} sx={{ p: 3, borderRadius: 4, overflow: 'hidden' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Saved Reports
            </Typography>
            
            <Stack spacing={2}>
              {savedForecasts.map((forecast) => (
                <Card 
                  key={forecast._id} 
                  variant="outlined"
                  sx={{ 
                    borderRadius: 4,
                    overflow: 'hidden',
                    border: '1px solid #f0f0f0',
                    boxShadow: 'none',
                    mb: 2
                  }}
                >
                  <Box sx={{ p: 3 }} onClick={() => handleViewSavedForecast(forecast._id)}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {forecast.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {format(parseISO(forecast.createdAt), 'MMM d, yyyy')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Saved {format(parseISO(forecast.createdAt), 'MMM d, yyyy')}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    borderTop: '1px solid #f0f0f0',
                    '& > *': {
                      flex: 1,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      py: 1.5,
                      color: '#666',
                      cursor: 'pointer',
                      '&:hover': {
                        color: '#333'
                      }
                    }
                  }}>
                    <Box onClick={() => handleDownloadForecast(forecast._id)}>
                      <Tooltip title="Download Report">
                        <DownloadIcon fontSize="small" />
                      </Tooltip>
                    </Box>
                    <Box sx={{ borderLeft: '1px solid #f0f0f0', borderRight: '1px solid #f0f0f0' }}>
                      <Tooltip title="Share Report">
                        <ArrowForwardIcon fontSize="small" onClick={() => handleShareForecast(forecast._id)} />
                      </Tooltip>
                    </Box>
                    <Box onClick={() => isViewOnly() ? null : handleDeleteForecast(forecast._id)}
                      sx={{
                        opacity: isViewOnly() ? 0.5 : 1,
                        cursor: isViewOnly() ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <Tooltip title="Delete Report">
                        <DeleteIcon fontSize="small" />
                      </Tooltip>
                    </Box>
                  </Box>
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
