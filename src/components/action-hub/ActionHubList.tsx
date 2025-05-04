'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  CircularProgress, 
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { getFlaggedAlerts } from '@/services/action-hub';
import { Alert } from '@/types';
import ActionStatusTabs from './ActionStatusTabs';

const ActionHubList: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const data = await getFlaggedAlerts();
        console.log('flag data ', data);
        setAlerts(data);
        setError(null);
      } catch (err) {
        setError('Failed to load flagged alerts. Please try again later.');
        console.error('Error loading flagged alerts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const handleAlertClick = (alertId: string) => {
    router.push(`/action-hub/alert/${alertId}`);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Filter alerts based on the selected tab
  const filteredAlerts = alerts.filter(alert => {
    if (tabValue === 0) return alert.status === 'pending' || !alert.status; // Pending
    if (tabValue === 1) return alert.status === 'resolved'; // Resolved
    return true; // All alerts
  });

  const pendingCount = alerts.filter(alert => alert.status === 'pending' || !alert.status).length;
  const resolvedCount = alerts.filter(alert => alert.status === 'resolved').length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" p={3}>
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <ActionStatusTabs
        tabValue={tabValue}
        pendingCount={pendingCount}
        resolvedCount={resolvedCount}
        totalCount={alerts.length}
        onTabChange={handleTabChange}
      />

      {filteredAlerts.length === 0 ? (
        <Box textAlign="center" p={3}>
          <Typography variant="body1" color="textSecondary">
            No alerts found for this filter.
          </Typography>
        </Box>
      ) : (
        <Box px={2} py={2}>
          {filteredAlerts.map((alert) => (
            <Card 
              key={alert._id}
              elevation={1}
              sx={{ 
                mb: 2,
                borderRadius: 1,
                overflow: 'hidden'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {alert.title || 'Untitled Alert'}
                </Typography>
                
                <Box display="flex" flexDirection="column" gap={0.5} mb={2}>
                  <Box display="flex">
                    <Typography variant="body2" fontWeight="500" width="80px">
                      Location:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {alert.city || 'Unknown location'}
                    </Typography>
                  </Box>
                  
                  <Box display="flex">
                    <Typography variant="body2" fontWeight="500" width="80px">
                      Date:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {alert.expectedStart 
                        ? `May ${new Date(alert.expectedStart).getDate()} - ${alert.expectedEnd ? new Date(alert.expectedEnd).getDate() : ''}`
                        : 'Not specified'}
                    </Typography>
                  </Box>
                  
                  <Box display="flex">
                    <Typography variant="body2" fontWeight="500" width="80px">
                      Status:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {alert.status ? alert.status.charAt(0).toUpperCase() + alert.status.slice(1) : 'Pending'}
                    </Typography>
                  </Box>
                </Box>
                
                <Button 
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={() => handleAlertClick(alert._id)}
                  sx={{ 
                    bgcolor: 'black',
                    '&:hover': {
                      bgcolor: '#333'
                    },
                    textTransform: 'none'
                  }}
                >
                  Open Action
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ActionHubList; 