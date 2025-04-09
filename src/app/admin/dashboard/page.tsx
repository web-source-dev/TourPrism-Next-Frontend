'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
  Chip
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import { getAdminDashboard } from '@/services/adminApi';
import { AdminDashboardStats } from '@/services/adminApi';

export default function AdminDashboard() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, isLoading, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await getAdminDashboard();
        setDashboardData(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && isAdmin) {
      fetchDashboardData();
    }
  }, [isAuthenticated, isAdmin]);

  if (isLoading || loading) {
    return (
      <AdminLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
          Admin Dashboard
        </Typography>

        {/* Stats Cards in a flex row */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: '#f5f5f5',
              borderRadius: 2,
              flex: '1 1 200px'
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Total Alerts
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              {dashboardData?.stats.totalAlerts || 0}
            </Typography>
          </Paper>
          
          <Paper
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: '#fff8e1',
              borderRadius: 2,
              flex: '1 1 200px'
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Pending Alerts
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1, color: '#ff9800' }}>
              {dashboardData?.stats.pendingAlerts || 0}
            </Typography>
          </Paper>
          
          <Paper
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: '#e8f5e9',
              borderRadius: 2,
              flex: '1 1 200px'
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Approved Alerts
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1, color: '#4caf50' }}>
              {dashboardData?.stats.approvedAlerts || 0}
            </Typography>
          </Paper>
          
          <Paper
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: '#ffebee',
              borderRadius: 2,
              flex: '1 1 200px'
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Rejected Alerts
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1, color: '#f44336' }}>
              {dashboardData?.stats.rejectedAlerts || 0}
            </Typography>
          </Paper>
        </Box>

        {/* Recent Alerts */}
        <Paper
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2
          }}
        >
          <Typography variant="h6" gutterBottom>
            Recent Alerts
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {dashboardData?.recentAlerts?.map((alert) => (
              <React.Fragment key={alert._id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{ px: 0 }}
                  secondaryAction={
                    <Chip 
                      label={alert.status?.toUpperCase() || 'PENDING'} 
                      size="small"
                      color={
                        alert.status === 'approved' ? 'success' :
                        alert.status === 'rejected' ? 'error' : 'warning'
                      }
                    />
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {typeof alert.createdBy === 'object' && alert.createdBy.name 
                        ? alert.createdBy.name.charAt(0).toUpperCase() 
                        : 'U'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={alert.title || 'Untitled Alert'}
                    secondary={
                      <React.Fragment>
                        <Typography
                          sx={{ display: 'inline' }}
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          {typeof alert.createdBy === 'object' ? alert.createdBy.email : 'Unknown User'}
                        </Typography>
                        {` — ${alert.description?.substring(0, 100)}...`}
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                          Location: {alert.city}, {alert.country} | Created: {new Date(alert.createdAt).toLocaleString()}
                        </Typography>
                      </React.Fragment>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
            
            {(!dashboardData?.recentAlerts || dashboardData.recentAlerts.length === 0) && (
              <ListItem>
                <ListItemText primary="No recent alerts found" />
              </ListItem>
            )}
          </List>
        </Paper>
      </Container>
    </AdminLayout>
  );
} 