'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  CircularProgress, 
  Chip,
  Divider
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { getFollowedAlerts } from '@/services/action-hub';
import { Alert } from '@/types';
import ActionStatusTabs from './ActionStatusTabs';
import { format } from 'date-fns';

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
        const data = await getFollowedAlerts();
        console.log('followed alerts data ', data);
        setAlerts(data);
        setError(null);
      } catch (err) {
        setError('Failed to load followed alerts. Please try again later.');
        console.error('Error loading followed alerts:', err);
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

  // Get relative time (e.g., "3h ago")
  const getTimeAgo = (timestamp: string) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  // Filter alerts based on the selected tab
  const filteredAlerts = alerts.filter(alert => {
    if (tabValue === 0) return alert.status === 'new' || !alert.status; // New
    if (tabValue === 1) return alert.status === 'in_progress'; // In Progress
    if (tabValue === 2) return alert.status === 'handled'; // Handled
    return true; // Fallback - show all
  });

  const newCount = alerts.filter(alert => alert.status === 'new' || !alert.status).length;
  const inProgressCount = alerts.filter(alert => alert.status === 'in_progress').length;
  const handledCount = alerts.filter(alert => alert.status === 'handled').length;

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
      <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" fontWeight="bold" component="h1">
            Action Hub
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage the alerts you're following
          </Typography>
        </Box>
        <Box>
          {/* Filter icon would go here */}
        </Box>
      </Box>

      <ActionStatusTabs
        tabValue={tabValue}
        newCount={newCount}
        inProgressCount={inProgressCount}
        handledCount={handledCount}
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
              elevation={0}
              sx={{ 
                mb: 3,
                borderRadius: 1,
                overflow: 'hidden',
                boxShadow: 'none',
                border: '1px solid #eaeaea'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', px: 2, pt: 2, pb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                  {getTimeAgo(alert.createdAt)}
                </Typography>
                <Chip 
                  label={
                    alert.status === 'in_progress' ? 'In Progress' : 
                    alert.status === 'handled' ? 'Handled' : 'New'
                  }
                  size="small"
                  sx={{ 
                    bgcolor: 
                      alert.status === 'in_progress' ? '#ff9800' : 
                      alert.status === 'handled' ? '#4caf50' : '#2196f3',
                    color: 'white',
                    fontWeight: 'medium',
                    px: 1
                  }}
                />
              </Box>
              
              <CardContent sx={{ pt: 1, pb: 2, px: 2 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {alert.title || 'Untitled Alert'}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {alert.description ? 
                    (alert.description.length > 120 ? 
                      `${alert.description.substring(0, 120)}...` : 
                      alert.description) : 
                    'No description available'}
                </Typography>
                
                <Box sx={{ display: 'flex', mb: 2 }}>
                  <Box sx={{ width: {xs: '100%', md: '33%'} }}>
                    <Typography variant="caption" fontWeight="bold" display="block" color="text.secondary">
                      Location
                    </Typography>
                    <Typography variant="body2">
                      {alert.city || 'Unknown location'}
                    </Typography>
                  </Box>
                  <Box sx={{ width: {xs: '100%', md: '33%'} }}>
                    <Typography variant="caption" fontWeight="bold" display="block" color="text.secondary">
                      Start Date
                    </Typography>
                    <Typography variant="body2">
                      {alert.expectedStart ? 
                        format(new Date(alert.expectedStart), 'dd MMM h:mma') : 
                        '—'}
                    </Typography>
                  </Box>
                  <Box sx={{ width: {xs: '100%', md: '33%'} }}>
                    <Typography variant="caption" fontWeight="bold" display="block" color="text.secondary">
                      End Date
                    </Typography>
                    <Typography variant="body2">
                      {alert.expectedEnd ? 
                        format(new Date(alert.expectedEnd), 'dd MMM h:mma') : 
                        '—'}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" fontWeight="bold" display="block" color="text.secondary">
                    Impact Level
                  </Typography>
                  <Typography variant="body2">
                    {alert.impact || 'Not specified'}
                  </Typography>
                </Box>
                
                <Button 
                  variant="contained"
                  fullWidth
                  onClick={() => handleAlertClick(alert._id)}
                  sx={{ 
                    bgcolor: 'black',
                    '&:hover': {
                      bgcolor: '#333'
                    },
                    textTransform: 'uppercase',
                    fontWeight: 'bold',
                    py: 1
                  }}
                >
                  Manage Alert
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