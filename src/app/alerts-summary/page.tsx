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
  "Industrial Action": ["Strike", "Work-to-Rule", "Labor Dispute", "Other"],
  "Extreme Weather": ["Storm", "Flooding", "Heatwave", "Wildfire", "Snow", "Other"],
  "Infrastructure Failures": ["Power Outage", "IT & System Failure", "Transport Service Suspension", "Road, Rail & Tram Closure", "Repairs or Delays", "Other"],
  "Public Safety Incidents": ["Protest", "Crime", "Terror Threats", "Travel Advisory", "Other"],
  "Festivals and Events": ["Citywide Festival", "Sporting Event", "Concerts and Stadium Events", "Parades and Ceremonies", "Other"]
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
  const [weeklyAlertCount, setWeeklyAlertCount] = useState<number | null>(null);
  
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
    checkWeeklyAlerts();
  }, []);

  const checkWeeklyAlerts = async () => {
    try {
      const response = await getUpcomingForecasts(7);
      if (response.success && response.forecast) {
        const alertCount = response.forecast.alerts?.length || 0;
        setWeeklyAlertCount(alertCount);
      }
    } catch (error) {
      console.error('Error checking weekly alerts:', error);
      // Don't show an error to the user, just set count to null
      setWeeklyAlertCount(null);
    }
  };

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
      
      if (response.success) {
        // Check if we have alerts
        const hasAlerts = response.forecast?.alerts && response.forecast.alerts.length > 0;
        
        if (response.forecast?.pdfUrl) {
          // Download the PDF using the URL from the forecast
          await downloadPdf(
            response.forecast.pdfUrl,
            `Weekly_Forecast_${format(new Date(), 'yyyy-MM-dd')}.pdf`
          );
        } else if (!hasAlerts) {
          // Create a special "No alerts" PDF
          const noAlertsData = {
            title: "Weekly Disruption Forecast - No Alerts",
            description: `No disruptions found for ${format(new Date(), 'dd MMM yyyy')} to ${format(addDays(new Date(), 7), 'dd MMM yyyy')}`,
            summaryType: 'forecast' as const,
            startDate: new Date().toISOString(),
            endDate: addDays(new Date(), 7).toISOString(),
            generatePDF: true,
            autoSave: false,
            // Use the user regions from the response if available
            locations: response.forecast?.userRegions || []
          };
          
          // Generate the PDF with "no alerts" content
          const noAlertsResponse = await generateSummary(noAlertsData);
          
          if (noAlertsResponse.success && noAlertsResponse.summary.pdfUrl) {
            await downloadPdf(
              noAlertsResponse.summary.pdfUrl,
              `Weekly_Forecast_No_Alerts_${format(new Date(), 'yyyy-MM-dd')}.pdf`
            );
          } else {
            // Only show an error if we can't even generate a "no alerts" PDF
            setError('No alerts found in your operating regions for the upcoming week. We\'ve prepared a blank report for you.');
          }
        } else {
          setError('Failed to generate the weekly forecast PDF. Please try again.');
        }
      } else {
        setError('Failed to retrieve weekly forecast data. Please try again.');
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
      
      if (!forecastResponse.success) {
        setError('Failed to generate weekly forecast. Please try again.');
        return;
      }

      // Check if we have alerts
      const hasAlerts = forecastResponse.forecast?.alerts && forecastResponse.forecast.alerts.length > 0;
      
      // Now save the forecast with the data we got, including MainOperatingRegions
      const data = {
        title: forecastResponse.forecast?.title || "Weekly Disruption Forecast",
        description: forecastResponse.forecast?.description || 
                    (hasAlerts 
                      ? `Weekly forecast for ${format(new Date(), 'dd MMM yyyy')}` 
                      : `No disruptions found for the week of ${format(new Date(), 'dd MMM yyyy')}`),
        summaryType: 'forecast' as const,
        startDate: forecastResponse.forecast?.timeRange?.startDate || new Date().toISOString(),
        endDate: forecastResponse.forecast?.timeRange?.endDate || addDays(new Date(), 7).toISOString(),
        generatePDF: true,
        autoSave: true,
        locations: forecastResponse.forecast?.userRegions || [], // Use userRegions for locations
        alertCategory: forecastResponse.forecast?.alertCategory,
        impact: forecastResponse.forecast?.impact,
        includedAlerts: forecastResponse.forecast?.alerts || [] // Include the alerts from the forecast
      };

      // If we have no alerts, add a special flag to ensure proper handling
      if (!hasAlerts) {
        // Include metadata to indicate this is an empty report
        data.description = `No disruptions found for the week of ${format(new Date(), 'dd MMM yyyy')}`;
        data.title = "Weekly Disruption Forecast - No Alerts";
      }

      const response = await generateSummary(data);
      
      if (response.success && response.summary.savedSummaryId) {
        // Navigate to the saved forecast view
        router.push(`/alerts-summary/${response.summary.savedSummaryId}`);
      } else if (!hasAlerts && response.success) {
        // If no alerts but the save was "successful", still direct them to the summary page
        // This might happen when we generate a "no alerts" PDF
        router.push(`/alerts-summary`);
        // Show a message
        setError('No alerts found in your operating regions. A blank report has been saved.');
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
      
      if (!response.success) {
        setError('Failed to retrieve forecast details. Please try again.');
        setLoading(false);
        return;
      }
      
      const summary = response.summary;
      const hasAlerts = summary.includedAlerts && summary.includedAlerts.length > 0;
      
      // Check if this is a "No Alerts" forecast that needs special handling
      const isNoAlertsForecast = 
        summary.title.includes('No Alerts') || 
        (summary.description && summary.description.includes('No disruptions')) ||
        !hasAlerts;
      
      if (summary.pdfUrl) {
        // Use the downloadPdf utility with the existing PDF URL
        const success = await downloadPdf(
          summary.pdfUrl,
          `${summary.title.replace(/\s+/g, '_')}.pdf`
        );
        
        if (!success) {
          // If download fails, try to regenerate
          regeneratePdf(id, summary, isNoAlertsForecast);
        }
      } else {
        // No PDF available, generate one
        await regeneratePdf(id, summary, isNoAlertsForecast);
      }
    } catch (error) {
      console.error('Error downloading forecast:', error);
      setError('Failed to download forecast. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to regenerate a PDF when the existing one fails or doesn't exist
  const regeneratePdf = async (id: string, summary: Summary, isNoAlertsForecast: boolean) => {
    try {
      // Try to generate the PDF on demand via the API
      const pdfUrl = await generatePdfOnDemand(id);
      
      if (pdfUrl) {
        await downloadPdf(
          pdfUrl,
          `${summary.title.replace(/\s+/g, '_')}.pdf`
        );
      } else if (isNoAlertsForecast) {
        // For "No Alerts" forecasts, generate a new PDF with appropriate "No Alerts" content
        const noAlertsData = {
          title: summary.title || "Disruption Forecast - No Alerts",
          description: summary.description || `No disruptions found for the requested period`,
          summaryType: 'forecast' as const,
          startDate: summary.timeRange.startDate,
          endDate: summary.timeRange.endDate,
          locations: summary.locations || [],
          generatePDF: true,
          autoSave: false // Don't save a new summary, just generate the PDF
        };
        
        const noAlertsResponse = await generateSummary(noAlertsData);
        
        if (noAlertsResponse.success && noAlertsResponse.summary.pdfUrl) {
          await downloadPdf(
            noAlertsResponse.summary.pdfUrl,
            `${summary.title.replace(/\s+/g, '_')}.pdf`
          );
        } else {
          // If all else fails, show a user-friendly message specifically for no alerts case
          setError('We encountered an issue creating your "No Alerts" report. Your selected regions currently have no reported disruptions.');
        }
      } else {
        // This is a regular forecast with content but PDF generation failed
        setError('Failed to generate PDF. Please try again.');
      }
    } catch (error) {
      console.error('Error regenerating PDF:', error);
      setError('Failed to generate PDF. Please try again.');
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
              {weeklyAlertCount === null ? 'Loading alerts...' :
                weeklyAlertCount === 0 ? 'No alerts for this week.' :
                weeklyAlertCount === 1 ? '1 Alert for this week.' :
                `${weeklyAlertCount} Alerts for this week.`}
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
