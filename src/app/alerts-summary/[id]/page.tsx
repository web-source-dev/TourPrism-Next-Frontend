'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
// Import the summaryService
import { 
  getSummaryById,
  Summary,
  getUpcomingForecasts,
  generateSummary,
  downloadPdf,
  generatePdfOnDemand
} from '@/services/summaryService';
import Layout from '@/components/Layout';
interface AlertItem {
  _id: string;
  title: string;
  description: string;
  alertType: string;
  impact: string;
  originCity?: string;
  city?: string;
  expectedStart?: string;
  expectedEnd?: string;
  alertCategory?: string;
}

export default function ForecastDetail() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [forecast, setForecast] = useState<Summary | null>(null);
  const [saved, setSaved] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  
  const { isCollaboratorViewer } = useAuth();

  const isViewOnly = () => {
    return isCollaboratorViewer;
  };

  // Extract the ID from params and query params
  const id = params?.id as string;
  
  useEffect(() => {
    const loadForecastData = async () => {
      // Parse query parameters
      const urlParams = new URLSearchParams(window.location.search);
      const queriedPdfUrl = urlParams.get('pdf');
      
      if (id && id !== 'weekly-forecast' && id !== 'custom-forecast') {
        // It's a saved forecast with an ID - load it from the server
        await loadForecastDetails(id);
      } else if (id === 'weekly-forecast') {
        // Handle weekly forecast view
        if (queriedPdfUrl) {
          setPdfUrl(queriedPdfUrl);
          loadWeeklyForecast(queriedPdfUrl);
        } else {
          // No PDF URL provided - load standard weekly forecast
          loadWeeklyForecast();
        }
      } else if (id === 'custom-forecast') {
        // Handle custom forecast - we need the PDF URL in query params
        if (queriedPdfUrl) {
          setPdfUrl(queriedPdfUrl);
          loadCustomForecast(queriedPdfUrl);
        } else {
          // Without a PDF URL, we can't display a custom forecast
          setError('Custom forecast data is missing. Please try generating a new forecast.');
          setLoading(false);
        }
      }
    };
    
    loadForecastData();
  }, [id]);

  const loadForecastDetails = async (forecastId: string) => {
    try {
      setLoading(true);
      const response = await getSummaryById(forecastId);
      
      if (response.success) {
        setForecast(response.summary);
        setPdfUrl(response.summary.pdfUrl || null);
        setSaved(true); // It's already saved if we're viewing it by ID
      } else {
        setError('Failed to load forecast details.');
      }
    } catch (error) {
      console.error('Error loading forecast details:', error);
      setError('An error occurred while loading the forecast. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadWeeklyForecast = async (existingPdfUrl?: string) => {
    setLoading(true);
    
    try {
      // Get real data from the API
      const response = await getUpcomingForecasts(7);
      
      if (!response.success || !response.forecast) {
        setError('Failed to load the weekly forecast. Please try again.');
        setLoading(false);
        return;
      }
      
      // Transform the forecast to match our Summary interface
      const weeklyForecast: Summary = {
        _id: 'weekly-forecast',
        userId: '',
        title: response.forecast.title || 'Weekly Disruption Forecast',
        description: 'Automatically generated weekly forecast of upcoming disruptions',
        summaryType: 'forecast',
        parameters: {
          alertCategory: response.forecast.alertCategory,
          impact: response.forecast.impact,
        },
        timeRange: {
          startDate: response.forecast.timeRange?.startDate,
          endDate: response.forecast.timeRange?.endDate,
        },
        includedAlerts: response.forecast.alerts || [],
        htmlContent: response.forecast.htmlContent,
        pdfUrl: existingPdfUrl || response.forecast?.pdfUrl, // Use the provided PDF URL or the one from response
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setForecast(weeklyForecast);
      setPdfUrl(weeklyForecast.pdfUrl || null);
      setSaved(false); // Weekly forecasts are not saved by default
    } catch (error) {
      console.error('Error creating weekly forecast:', error);
      setError('Failed to generate weekly forecast.');
    } finally {
      setLoading(false);
    }
  };

  // New function to handle custom forecasts
  const loadCustomForecast = async (existingPdfUrl: string) => {
    setLoading(true);
    
    try {
      // For custom forecasts, we need to extract information from the URL
      // and create a temporary forecast object
      const urlParams = new URLSearchParams(window.location.search);
      
      // Create a placeholder forecast
      const customForecast: Summary = {
        _id: 'custom-forecast',
        userId: '',
        title: 'Custom Disruption Forecast',
        description: 'Custom generated forecast',
        summaryType: 'forecast',
        parameters: {
          // Try to extract any parameters from URL if they were passed
          alertCategory: urlParams.get('category') || undefined,
          impact: urlParams.get('impact') || undefined,
        },
        timeRange: {
          startDate: urlParams.get('startDate') || new Date().toISOString(),
          endDate: urlParams.get('endDate') || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        includedAlerts: [],
        pdfUrl: existingPdfUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Try to get the forecast content using the PDF URL
      // This is a hack, but it allows us to get the content without saving
      if (existingPdfUrl) {
        try {
          // Use the existing PDF URL to extract location and other attributes if possible
          const location = urlParams.get('location');
          if (location) {
            customForecast.title = `Disruption Forecast for ${location}`;
          }
        } catch (err) {
          console.error('Error parsing custom forecast parameters:', err);
        }
      }
      
      setForecast(customForecast);
      setPdfUrl(existingPdfUrl);
      setSaved(false); // Custom forecasts are not saved by default
    } catch (error) {
      console.error('Error creating custom forecast:', error);
      setError('Failed to load custom forecast.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Only proceed if not already saved
    if (saved || !forecast || isViewOnly()) return;
    
    try {
      setLoading(true);
      
      // Prepare the alert types array
      const alertTypes = forecast.parameters.alertCategory 
        ? [forecast.parameters.alertCategory] 
        : [];
      
      // Create a summary object to save
      const summaryToSave = {
        title: forecast.title || 'Disruption Forecast',
        description: forecast.description || 'Manually saved forecast',
        summaryType: 'forecast',
        startDate: forecast.timeRange.startDate,
        endDate: forecast.timeRange.endDate,
        alertTypes: alertTypes,
        impact: forecast.parameters.impact,
        includeDuplicates: false,
        generatePDF: true,
        autoSave: true, // Set to true since user is explicitly saving
        locations: forecast.locations || []
      };
      
      // Call the API to save the forecast
      const response = await generateSummary({
        ...summaryToSave,
        summaryType: 'forecast' as const // Explicitly assert the type
      });
      
      if (response.success) {
        // Set saved state to true
        setSaved(true);
        
        // If we have a savedSummaryId, update our current URL to reflect that
        if (response.summary.savedSummaryId) {
          // Update the forecast object with the saved summary ID
          setForecast({
            ...forecast,
            _id: response.summary.savedSummaryId,
            pdfUrl: response.summary.pdfUrl || forecast.pdfUrl
          } as Summary);
          
          // Update the URL without full page refresh
          router.replace(`/alerts-summary/${response.summary.savedSummaryId}`, { scroll: false });
        }
      } else {
        setError('Failed to save the forecast.');
      }
    } catch (error) {
      console.error('Error saving forecast:', error);
      setError('Failed to save the forecast.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (loading || !forecast) return;
    
    try {
      setLoading(true);
      
      // Use the PDF URL if available (either from forecast or from state)
      if (forecast.pdfUrl || pdfUrl) {
        // Use the downloadPdf utility function
        await downloadPdf(
          forecast.pdfUrl || pdfUrl || '', 
          `${forecast.title.replace(/\s+/g, '_')}.pdf`
        );
        setLoading(false);
        return;
      }
      
      // No PDF available - handle based on whether this is a saved forecast or not
      if (forecast._id && forecast._id !== 'weekly-forecast') {
        // It's a saved forecast without a PDF, so generate one without saving again
        const pdfUrl = await generatePdfOnDemand(forecast._id);
        
        if (pdfUrl) {
          // Set the PDF URL in state
          setPdfUrl(pdfUrl);
          
          // Download the newly generated PDF
          await downloadPdf(
            pdfUrl,
            `${forecast.title.replace(/\s+/g, '_')}.pdf`
          );
        } else {
          setError('Failed to generate PDF. Please try again.');
        }
      } else {
        // It's not a saved forecast - generate a PDF without saving
        // Use the current forecast data to generate a new summary with PDF but don't save
        const data = {
          title: forecast.title,
          description: forecast.description,
          summaryType: 'forecast' as const,
          startDate: forecast.timeRange.startDate,
          endDate: forecast.timeRange.endDate,
          alertTypes: forecast.parameters.alertCategory ? [forecast.parameters.alertCategory] : [],
          impact: forecast.parameters.impact,
          generatePDF: true,
          autoSave: false, // Don't save
        };
        
        const response = await generateSummary(data);
        
        if (response.success && response.summary.pdfUrl) {
          // Store the PDF URL
          setPdfUrl(response.summary.pdfUrl);
          
          // Download the PDF
          await downloadPdf(
            response.summary.pdfUrl,
            `${forecast.title.replace(/\s+/g, '_')}.pdf`
          );
        } else {
          setError('Failed to generate PDF. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error downloading forecast:', error);
      setError('Failed to download the forecast. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (saved || !forecast) return;
    
    try {
      setLoading(true);
      
      window.navigator.share({
        title: forecast.title,
        text: forecast.description,
        url: window.location.href
      });
    } catch (error) {
      console.error('Error sharing forecast:', error);
      setError('Failed to share the forecast. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    router.push('/alerts-summary');
  };

  const handleViewDashboard = () => {
    router.push('/dashboard');
  };

  const getCategoryLabel = (alertType: string, alertCategory?: string): string => {
    // If there's a specific category, use it as the primary label
    if (alertCategory) {
      return alertCategory;
    }
    
    // Otherwise, try to determine the category from the alert type
    const categoryMap = {
      "Weather": ["Flood", "Rain", "Heat Warning", "Storm", "Snow", "Fog"],
      "Transport": ["Strike", "Delay", "Cancellation", "Infrastructure Issue", "Traffic"],
      "Health": ["Outbreak", "Epidemic", "Pandemic", "Contamination"],
      "Civil Unrest": ["Protest", "Riot", "Strike", "Demonstration"],
      "General Safety": ["Terrorism", "Crime", "Cyber Attack", "Data Breach"],
      "Natural Disaster": ["Earthquake", "Tsunami", "Volcanic Activity", "Wildfire", "Landslide"]
    };
    
    for (const [category, types] of Object.entries(categoryMap)) {
      if (types.includes(alertType)) {
        return `${category} - ${alertType}`;
      }
    }
    
    return alertType || 'Not specified';
  };

  // Find the main alert to display - avoid displaying duplicates
  const findPrimaryAlert = () => {
    if (!Array.isArray(forecast?.includedAlerts) || forecast?.includedAlerts.length === 0) {
      return null;
    }
    
    // Use the first alert as primary by default
    const primaryAlert = forecast.includedAlerts[0] as unknown as AlertItem;
    
    // Simple check for duplicates - if there are multiple alerts with same title/location
    // we'll display the one with the most detailed information
    if (forecast.includedAlerts.length > 1) {
      const similarAlerts = forecast.includedAlerts.filter(alert => {
        const a = alert as unknown as AlertItem;
        // Check if this might be similar to the primary
        return a.title === primaryAlert.title || 
               a.alertType === primaryAlert.alertType ||
               (a.originCity && a.originCity === primaryAlert.originCity);
      }) as unknown as AlertItem[];
      
      if (similarAlerts.length > 1) {
        // Return the one with the most detailed description or most recent
        return similarAlerts.sort((a, b) => {
          // First check description length
          if ((a.description?.length || 0) !== (b.description?.length || 0)) {
            return (b.description?.length || 0) - (a.description?.length || 0);
          }
          
          // If descriptions are similar in length, prefer the one with more specified data
          const aScore = (a.expectedStart ? 1 : 0) + (a.expectedEnd ? 1 : 0) + (a.impact ? 1 : 0);
          const bScore = (b.expectedStart ? 1 : 0) + (b.expectedEnd ? 1 : 0) + (b.impact ? 1 : 0);
          return bScore - aScore;
        })[0];
      }
    }
    
    return primaryAlert;
  };

  if (loading) {
    return (
      <Layout isFooter={false}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout isFooter={false}>
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={handleBackToList}>
          Back to Forecasts
        </Button>
      </Box>
      </Layout>
    );
  }

  if (!forecast) {
    return (
      <Layout isFooter={false}>
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Forecast not found.
        </Alert>
        <Button variant="outlined" onClick={handleBackToList}>
          Back to Forecasts
        </Button>
      </Box>
      </Layout>
    );
  }

  // Get the primary alert to display, using our improved function
  const primaryAlert = findPrimaryAlert();

  return (
    <Layout isFooter={false}>
    <Box sx={{ px: 3, py: 2, maxWidth: '1200px', mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBackToList} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1" fontWeight="bold">
          Your Disruption Forecast
        </Typography>
      </Box>

      <Paper elevation={1} sx={{ p: 0, borderRadius: 4, overflow: 'hidden', mb: 4, border: '1px solid #f0f0f0' }}>
        <Box sx={{ p: 3 }}>
        {/* Summary Header */}
        <Stack spacing={2} sx={{ mb: 2 }}>
          <Stack direction="row" spacing={2}>
            <Box sx={{ width: '33%' }}>
              <Typography variant="body2" color="text.secondary">
                Date:
              </Typography>
            </Box>
            <Box sx={{ width: '67%' }}>
              <Typography variant="body1" fontWeight="medium">
                {forecast.timeRange.startDate && forecast.timeRange.endDate ? (
                  `${format(parseISO(forecast.timeRange.startDate), 'd MMM')} – ${format(parseISO(forecast.timeRange.endDate), 'd MMM yyyy')}`
                ) : 'Date range not specified'}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={2}>
            <Box sx={{ width: '33%' }}>
              <Typography variant="body2" color="text.secondary">
                Location:
              </Typography>
            </Box>
            <Box sx={{ width: '67%' }}>
              <Typography variant="body1" fontWeight="medium">
                {forecast.locations && forecast.locations.length > 0
                  ? forecast.locations[0].city
                  : primaryAlert?.originCity || primaryAlert?.city || 'Edinburgh'}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={2}>
            <Box sx={{ width: '33%' }}>
              <Typography variant="body2" color="text.secondary">
                Impact:
              </Typography>
            </Box>
            <Box sx={{ width: '67%' }}>
              <Typography variant="body1" fontWeight="medium">
                {primaryAlert?.impact || 'Variable'}
              </Typography>
            </Box>
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Primary Alert */}
        {primaryAlert && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {primaryAlert.title}
            </Typography>
            
            {primaryAlert.originCity && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {primaryAlert.originCity}
              </Typography>
            )}
            
            <Typography variant="body2" sx={{ mb: 2 }}>
              {primaryAlert.description}
            </Typography>

            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <Box sx={{ width: '50%' }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Start Time
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {primaryAlert.expectedStart
                    ? format(parseISO(primaryAlert.expectedStart), 'dd MMM h:mma')
                    : 'Not specified'}
                </Typography>
              </Box>
              <Box sx={{ width: '50%' }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  End Time
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {primaryAlert.expectedEnd
                    ? format(parseISO(primaryAlert.expectedEnd), 'dd MMM h:mma')
                    : 'Not specified'}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={2}>
              <Box sx={{ width: '50%' }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Type:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {getCategoryLabel(primaryAlert.alertType, primaryAlert.alertCategory)}
                </Typography>
              </Box>
              <Box sx={{ width: '50%' }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Impact:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {primaryAlert.impact || 'Not specified'}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}

        {!primaryAlert && (
          <Box sx={{ mb: 4 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              No alerts found for this forecast period.
            </Alert>
            <Typography variant="body2">
              There are currently no disruptions predicted for the selected time period.
            </Typography>
          </Box>
        )}

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
            color: '#666'
          }
        }}>
          <Box onClick={handleDownload} sx={{ display: 'flex',cursor:'pointer', alignItems: 'center', justifyContent: 'center' }}>
            <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="body2">Download</Typography>
          </Box>
          <Box onClick={handleShare} sx={{ borderLeft: '1px solid #f0f0f0',cursor:'pointer', borderRight: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowForwardIcon fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="body2">Share</Typography>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            opacity: isViewOnly() ? 0.5 : 1,
            cursor: isViewOnly() ? 'not-allowed' : 'pointer'
          }} onClick={handleSave}
          >
            {saved ? <BookmarkIcon fontSize="small" sx={{ mr: 1 }} /> : <BookmarkBorderIcon fontSize="small" sx={{ mr: 1 }} />}
            <Typography variant="body2">Save</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Additional Alerts Section */}
      {Array.isArray(forecast.includedAlerts) && forecast.includedAlerts.length > 1 && (
        <>
          <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ ml: 1 }}>
            Additional Alerts in This Forecast
          </Typography>

          <Box sx={{ mb: 3 }}>
            {forecast.includedAlerts.slice(1).map((alert, index) => {
              const alertItem = alert as unknown as AlertItem;
              return (
                <Card key={alertItem._id || index} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      {alertItem.title}
                    </Typography>
                    
                    <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                      <Chip 
                        label={getCategoryLabel(alertItem.alertType, alertItem.alertCategory)}
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                      <Chip 
                        label={alertItem.impact || 'Unknown'} 
                        size="small" 
                        color={
                          alertItem.impact === 'Severe' ? 'error' : 
                          alertItem.impact === 'Moderate' ? 'warning' : 'success'
                        }
                        variant="outlined"
                      />
                    </Stack>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {alertItem.description?.substring(0, 120)}
                      {(alertItem.description?.length || 0) > 120 ? '...' : ''}
                    </Typography>
                    <Typography variant='body2'>
                      {alertItem.city}
                    </Typography>
                    
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {alertItem.expectedStart && alertItem.expectedEnd ? (
                        `${format(parseISO(alertItem.expectedStart), 'dd MMM')} - ${format(parseISO(alertItem.expectedEnd), 'dd MMM yyyy')}`
                      ) : 'Dates not specified'}
                    </Typography>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </>
      )}

      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          To view more alerts or take action, visit tourprism dashboard
        </Typography>
        <Button 
          variant="text" 
          endIcon={<ArrowForwardIcon />}
          onClick={handleViewDashboard}
        >
          View Dashboard
        </Button>
      </Box>
    </Box>
    </Layout>
  );
}