'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography, Alert, Button } from '@mui/material';
import { getUpcomingForecasts, generateSummary } from '@/services/summaryService';
import { format, addDays } from 'date-fns';
import Layout from '@/components/Layout';

export default function WeeklyForecast() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateWeeklyForecast = async () => {
      try {
        // Set loading state
        setLoading(true);
        
        // Get the forecast with proper MainOperatingRegions
        const response = await getUpcomingForecasts(7);
        
        if (response.success && response.forecast) {
          // Now create a forecast with the data so we have a PDF but don't auto-save it
          const today = new Date();
          const nextWeek = addDays(today, 7);
          
          // Prepare data for generating a summary
          const data = {
            title: response.forecast.title || `Weekly Disruption Forecast`,
            description: response.forecast.description || `Forecast for ${format(today, 'dd MMM yyyy')} to ${format(nextWeek, 'dd MMM yyyy')}`,
            summaryType: 'forecast' as const,
            startDate: response.forecast.timeRange.startDate,
            endDate: response.forecast.timeRange.endDate,
            locations: response.forecast.userRegions || [],
            alertCategory: response.forecast.alertCategory,
            impact: response.forecast.impact,
            generatePDF: true,
            autoSave: false,
            includedAlerts: response.forecast.alerts || []
          };

          const saveResponse = await generateSummary(data);
          
          if (saveResponse.success && saveResponse.summary.pdfUrl) {
            // Need to pass the full data through the URL to preserve the original forecast
            router.push(`/alerts-summary/weekly-forecast?pdf=${encodeURIComponent(saveResponse.summary.pdfUrl)}`);
          } else if (response.forecast.pdfUrl) {
            // Navigate but include the PDF URL directly from the first response if available
            router.push(`/alerts-summary/weekly-forecast?pdf=${encodeURIComponent(response.forecast.pdfUrl)}`);
          } else {
            // Otherwise, just show the non-persistent weekly forecast
            router.push('/alerts-summary/weekly-forecast');
          }
        } else {
          // If there's an issue, set an error message
          setError('Failed to generate weekly forecast. Please try again later.');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error generating weekly forecast:', error);
        setError('An unexpected error occurred. Please try again later.');
        setLoading(false);
      }
    };

    generateWeeklyForecast();
  }, [router]);

  const handleRetry = () => {
    setError('');
    setLoading(true);
    router.push('/alerts-summary'); // Go back to main page to try again
  };

  if (error) {
    return (
      <Layout isFooter={false}>
        <Box sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button 
            variant="contained" 
            onClick={handleRetry} 
            sx={{ mt: 2 }}
          >
            Try Again
          </Button>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout isFooter={false}>
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        gap: 2,
      }}
    >
      <CircularProgress size={40} />
      <Typography variant="h6">Generating your weekly forecast...</Typography>
      <Typography variant="body2" color="text.secondary">
        This may take a moment as we analyze upcoming disruptions in your operating regions.
      </Typography>
    </Box>
    </Layout>
  );
} 