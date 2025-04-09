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
  Chip,
  TextField,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Tab,
  Tabs,
  Pagination,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import { getPendingAlerts, updateAlertStatus, deleteAlert, getAlertsByStatus } from '@/services/adminApi';
import { PendingAlertsResponse } from '@/services/adminApi';
import { fetchAlerts } from '@/services/api';
import { Alert as AlertType } from '@/types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`alert-tabpanel-${index}`}
      aria-labelledby={`alert-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function AlertsManagement() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pendingAlerts, setPendingAlerts] = useState<AlertType[]>([]);
  const [allAlerts, setAllAlerts] = useState<AlertType[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<AlertType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  
  // For action menu (more options)
  const handleActionMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, alert: AlertType) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedAlert(alert);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
  };

  // Tab change handler
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(1); // Reset to first page when changing tabs
  };

  // Pagination handler
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // Handle alert status change dialog
  const handleStatusDialogOpen = (status: string) => {
    setNewStatus(status);
    setStatusDialogOpen(true);
    handleActionMenuClose();
  };

  const handleStatusDialogClose = () => {
    setStatusDialogOpen(false);
  };

  const handleStatusChange = async () => {
    if (!selectedAlert) return;
    
    try {
      const updatedAlert = await updateAlertStatus(selectedAlert._id, newStatus as 'approved' | 'rejected' | 'pending');
      // Update local state instead of refetching all data
      const updateAlertInList = (alerts: AlertType[]): AlertType[] => {
        return alerts.map(alert => 
          alert._id === selectedAlert._id ? { ...alert, status: newStatus } : alert
        );
      };
      
      // Update the lists based on current tab
      if (tabValue === 0) {
        setPendingAlerts(prev => prev.filter(alert => alert._id !== selectedAlert._id));
      } else {
        setAllAlerts(prev => updateAlertInList(prev));
      }
      
      // Show success feedback
      setSuccessMessage(`Alert status changed to ${newStatus} successfully`);
      setStatusDialogOpen(false);
    } catch (error) {
      console.error('Error updating alert status:', error);
      setErrorMessage('Failed to update alert status');
    }
  };

  // Handle alert deletion dialog
  const handleDeleteDialogOpen = () => {
    setDeleteDialogOpen(true);
    handleActionMenuClose();
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };

  const handleDeleteAlert = async () => {
    if (!selectedAlert) return;
    
    try {
      await deleteAlert(selectedAlert._id);
      
      // Update local state instead of refetching all data
      if (tabValue === 0) {
        setPendingAlerts(prev => prev.filter(alert => alert._id !== selectedAlert._id));
      } else {
        setAllAlerts(prev => prev.filter(alert => alert._id !== selectedAlert._id));
      }
      
      // Show success feedback
      setSuccessMessage('Alert deleted successfully');
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting alert:', error);
      setErrorMessage('Failed to delete alert');
    }
  };

  // Handle alert edit
  const handleEditAlert = () => {
    if (!selectedAlert) return;
    // Store selected alert in local storage for the edit page
    localStorage.setItem('editAlert', JSON.stringify(selectedAlert));
    router.push(`/admin/alerts/edit?id=${selectedAlert._id}`);
    handleActionMenuClose();
  };

  // Fetch alerts based on tab value and page
  const fetchData = async () => {
    setLoading(true);
    try {
      if (tabValue === 0) {
        // Fetch pending alerts
        const response = await getPendingAlerts(page, 10);
        setPendingAlerts(response.alerts);
        setTotalPages(response.totalPages);
      } else {
        // Fetch alerts by status using admin API
        const statuses = ['approved', 'rejected', 'all'];
        const status = tabValue === 3 ? undefined : statuses[tabValue - 1]; // approved, rejected, or all
        
        // Use new API endpoint for filtered alerts
        const response = await getAlertsByStatus(status as 'approved' | 'rejected' | undefined, page, 10, searchQuery);
        setAllAlerts(response.alerts);
        setTotalPages(response.totalPages || Math.ceil(response.totalAlerts / 10));
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchData();
    }
  }, [isAuthenticated, isAdmin, tabValue, page]);

  // Handle search
  const handleSearch = () => {
    setPage(1); // Reset to first page when searching
    fetchData();
  };

  // Get current alerts based on active tab
  const currentAlerts = tabValue === 0 ? pendingAlerts : allAlerts;

  if (isLoading || loading) {
    return (
      <AdminLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  // Function to get status color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <AdminLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Alerts Management
          </Typography>
        </Box>

        {/* Success Snackbar */}
        <Snackbar
          open={!!successMessage}
          autoHideDuration={4000}
          onClose={() => setSuccessMessage(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={() => setSuccessMessage(null)} severity="success">
            {successMessage}
          </Alert>
        </Snackbar>
        
        {/* Error Snackbar */}
        <Snackbar
          open={!!errorMessage}
          autoHideDuration={4000}
          onClose={() => setErrorMessage(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={() => setErrorMessage(null)} severity="error">
            {errorMessage}
          </Alert>
        </Snackbar>

        {/* Search bar */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <TextField
            label="Search alerts"
            variant="outlined"
            size="small"
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
          />
          <Button 
            variant="contained" 
            onClick={handleSearch}
            sx={{ 
              bgcolor: 'black', 
              '&:hover': { bgcolor: '#333' },
              whiteSpace: 'nowrap'
            }}
          >
            Search
          </Button>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="alert tabs">
            <Tab label="Pending Approval" />
            <Tab label="Approved" />
            <Tab label="Rejected" />
            <Tab label="All Alerts" />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          <AlertsList 
            alerts={pendingAlerts} 
            onActionClick={handleActionMenuOpen}
            getStatusColor={getStatusColor}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <AlertsList 
            alerts={allAlerts} 
            onActionClick={handleActionMenuOpen}
            getStatusColor={getStatusColor}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <AlertsList 
            alerts={allAlerts} 
            onActionClick={handleActionMenuOpen}
            getStatusColor={getStatusColor}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <AlertsList 
            alerts={allAlerts} 
            onActionClick={handleActionMenuOpen}
            getStatusColor={getStatusColor}
          />
        </TabPanel>

        {/* Pagination */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={handlePageChange} 
            color="primary" 
          />
        </Box>

        {/* Action Menu */}
        <Menu
          anchorEl={actionMenuAnchor}
          open={Boolean(actionMenuAnchor)}
          onClose={handleActionMenuClose}
        >
          <MenuItem onClick={handleEditAlert}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <i className="ri-edit-line" style={{ marginRight: 8 }} />
              <Tooltip title="Edit all alert details including location, coordinates, and properties" placement="right">
                <span>Edit Alert Details</span>
              </Tooltip>
            </Box>
          </MenuItem>
          <MenuItem onClick={() => handleStatusDialogOpen('approved')}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <i className="ri-check-line" style={{ marginRight: 8, color: 'green' }} />
              Approve
            </Box>
          </MenuItem>
          <MenuItem onClick={() => handleStatusDialogOpen('rejected')}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <i className="ri-close-line" style={{ marginRight: 8, color: 'red' }} />
              Reject
            </Box>
          </MenuItem>
          <MenuItem onClick={() => handleStatusDialogOpen('pending')}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <i className="ri-time-line" style={{ marginRight: 8, color: 'orange' }} />
              Set to Pending
            </Box>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleDeleteDialogOpen} sx={{ color: 'error.main' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <i className="ri-delete-bin-line" style={{ marginRight: 8 }} />
              Delete
            </Box>
          </MenuItem>
        </Menu>

        {/* Status Change Dialog */}
        <Dialog open={statusDialogOpen} onClose={handleStatusDialogClose}>
          <DialogTitle>Change Alert Status</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to change the status of this alert to {newStatus}?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleStatusDialogClose}>Cancel</Button>
            <Button onClick={handleStatusChange} autoFocus>
              Change Status
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
          <DialogTitle>Delete Alert</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this alert? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteDialogClose}>Cancel</Button>
            <Button onClick={handleDeleteAlert} color="error" autoFocus>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AdminLayout>
  );
}

// Alerts List Component
interface AlertsListProps {
  alerts: AlertType[];
  onActionClick: (event: React.MouseEvent<HTMLButtonElement>, alert: AlertType) => void;
  getStatusColor: (status?: string) => "success" | "error" | "warning" | "default";
}

function AlertsList({ alerts, onActionClick, getStatusColor }: AlertsListProps) {
  // Helper function to get user display name
  const getUserDisplayInfo = (alert: AlertType) => {
    // Check for createdBy object
    if (typeof alert.createdBy === 'object' && alert.createdBy) {
      return {
        name: alert.createdBy.name || 'U',
        email: alert.createdBy.email || 'No Email'
      };
    }
    
    // Fallback to userId if available
    if (typeof alert.userId === 'object' && alert.userId) {
      return {
        name: alert.userId.name || 'U',
        email: alert.userId.email || 'No Email'
      };
    }
    
    // Default when no user info is available
    return {
      name: 'U',
      email: 'Unknown User'
    };
  };

  return (
    <Paper
      sx={{
        width: '100%',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {alerts.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No alerts found
          </Typography>
        </Box>
      ) : (
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {alerts.map((alert) => {
            const userInfo = getUserDisplayInfo(alert);
            
            return (
              <React.Fragment key={alert._id}>
                <ListItem
                  alignItems="flex-start"
                  secondaryAction={
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip 
                        label={alert.status?.toUpperCase() || 'PENDING'} 
                        size="small"
                        color={getStatusColor(alert.status)}
                        sx={{ mr: 1 }}
                      />
                      <Tooltip title="Actions">
                        <IconButton 
                          edge="end" 
                          aria-label="actions"
                          onClick={(e) => onActionClick(e, alert)}
                        >
                          <i className="ri-more-2-fill" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {userInfo.name.charAt(0).toUpperCase()}
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
                          {userInfo.email}
                        </Typography>
                        {` — ${alert.description?.substring(0, 100) || 'No description'}...`}
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                          Location: {alert.city || 'Unknown'}, {alert.country || 'Unknown'} | Created: {new Date(alert.createdAt).toLocaleString()}
                        </Typography>
                      </React.Fragment>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            );
          })}
        </List>
      )}
    </Paper>
  );
} 