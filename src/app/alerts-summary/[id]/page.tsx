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

// Import the summaryService
import { 
  getSummaryById,
  Summary,
  getUpcomingForecasts
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
  
  // Extract the ID from params
  const id = params?.id as string;
  
  useEffect(() => {
    if (id && id !== 'weekly-forecast') {
      loadForecastDetails(id);
    } else if (id === 'weekly-forecast') {
      // Handle weekly forecast view
      loadWeeklyForecast();
    }
  }, [id]);

  const loadForecastDetails = async (forecastId: string) => {
    try {
      setLoading(true);
      const response = await getSummaryById(forecastId);
      
      if (response.success) {
        setForecast(response.summary);
        setSaved(true); // It's already saved if we're viewing it
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

  const loadWeeklyForecast = async () => {
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setForecast(weeklyForecast);
      setSaved(false); // Weekly forecasts are not saved by default
    } catch (error) {
      console.error('Error creating weekly forecast:', error);
      setError('Failed to generate weekly forecast.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // To be implemented - save the current forecast
    try {
      setLoading(true);
      // Would call an API to save the current forecast
      // For now, just simulate success
      setTimeout(() => {
        setSaved(true);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error saving forecast:', error);
      setError('Failed to save the forecast.');
      setLoading(false);
    }
  };

  const handleDownload = () => {
    // Would implement downloading the forecast as PDF
    if (forecast?.pdfUrl) {
      window.open(forecast.pdfUrl, '_blank');
    } else {
      alert('PDF not available for this forecast.');
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

  // Find the main alert to display
  const primaryAlert = Array.isArray(forecast.includedAlerts) && forecast.includedAlerts.length > 0
    ? forecast.includedAlerts[0] as unknown as AlertItem
    : null;

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

      <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
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

        <Divider sx={{ my: 2 }} />

        {/* Action Buttons */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={saved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
              onClick={handleSave}
              disabled={saved}
              sx={{ p: 1 }}
            >
              {saved ? 'Saved' : 'Save This Forecast'}
            </Button>
          </Box>
          <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              sx={{ p: 1 }}
            >
              Download PDF
            </Button>
          </Box>
        </Stack>
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