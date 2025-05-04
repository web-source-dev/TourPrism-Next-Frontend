'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { getUpcomingForecasts } from '@/services/summaryService';
import Layout from '@/components/Layout';

export default function WeeklyForecast() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    const generateWeeklyForecast = async () => {
      try {
        // Set loading state
        
        // Attempt to get a weekly forecast
        const response = await getUpcomingForecasts(7);
        
        if (response.success && response.forecast) {
          // If successful, redirect to the detail page with the proper format
          router.push('/alerts-summary/weekly-forecast');
        } else {
          // If there's an issue, set an error message
          setError('Failed to generate weekly forecast. Please try again later.');
        }
      } catch (error) {
        console.error('Error generating weekly forecast:', error);
        setError('An unexpected error occurred. Please try again later.');
      }
    };

    generateWeeklyForecast();
  }, [router]);

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Typography variant="body1" sx={{ mt: 2 }}>
          You can try generating another forecast or return to the main page.
        </Typography>
      </Box>
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
        This may take a moment as we analyze upcoming disruptions.
      </Typography>
    </Box>
    </Layout>
  );
} 