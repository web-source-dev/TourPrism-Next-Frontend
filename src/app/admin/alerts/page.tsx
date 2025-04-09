'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Button,
  IconButton,
  TextField,
  MenuItem,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Stack,
  Snackbar,
  Alert,
  Card,
  CardContent,
  useMediaQuery,
  useTheme
} from '@mui/material';
import AdminLayout from '@/components/AdminLayout';
import { getAllAlertsAdmin, updateAlertStatus, deleteAlert } from '@/services/api';
import { Alert as AlertType } from '@/types';
import { useRouter } from 'next/navigation';

export default function AlertsManagement() {
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<AlertType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {
        page: page + 1,
        limit: rowsPerPage
      };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      const { alerts, totalCount } = await getAllAlertsAdmin(params);
      setAlerts(alerts);
      setTotalCount(totalCount);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setError('Failed to load alerts. Please try again.');
      setSnackbar({
        open: true,
        message: 'Failed to load alerts',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, statusFilter, searchQuery]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const handleDeleteClick = (alert: AlertType) => {
    setSelectedAlert(alert);
    setDialogOpen(true);
  };

  const handleStatusChangeClick = (alert: AlertType) => {
    setSelectedAlert(alert);
    setNewStatus(alert.status || 'pending');
    setStatusDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedAlert) return;
    
    try {
      await deleteAlert(selectedAlert._id);
      setAlerts(alerts.filter(alert => alert._id !== selectedAlert._id));
      setSnackbar({
        open: true,
        message: 'Alert deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting alert:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete alert',
        severity: 'error'
      });
    } finally {
      setDialogOpen(false);
      setSelectedAlert(null);
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedAlert || !newStatus) return;
    
    try {
      await updateAlertStatus(selectedAlert._id, newStatus);
      setAlerts(alerts.map(alert => 
        alert._id === selectedAlert._id 
          ? { ...alert, status: newStatus } 
          : alert
      ));
      setSnackbar({
        open: true,
        message: `Alert status updated to ${newStatus}`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating alert status:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update alert status',
        severity: 'error'
      });
    } finally {
      setStatusDialogOpen(false);
      setSelectedAlert(null);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleRetry = () => {
    fetchAlerts();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return { bg: '#e8f5e9', color: '#2e7d32' };
      case 'rejected':
        return { bg: '#ffebee', color: '#c62828' };
      case 'published':
        return { bg: '#e3f2fd', color: '#1565c0' };
      default:
        return { bg: '#fff8e1', color: '#f57f17' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Mobile card view for alerts
  const renderAlertCards = () => {
    if (alerts.length === 0) {
      return (
        <Typography variant="body1" sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>
          No alerts found
        </Typography>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {alerts.map(alert => (
          <Card 
            key={alert._id} 
            elevation={0} 
            sx={{ 
              border: '1px solid #e0e0e0', 
              borderRadius: 2,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.08)'
              }
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {alert.title || alert.description.substring(0, 30)}
                </Typography>
                <Chip
                  label={alert.status?.charAt(0).toUpperCase() + (alert.status?.slice(1) || '')}
                  size="small"
                  sx={{
                    bgcolor: getStatusColor(alert.status || 'pending').bg,
                    color: getStatusColor(alert.status || 'pending').color,
                    fontWeight: 'medium'
                  }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">City:</Typography>
                  <Typography variant="body2">{alert.city}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Created:</Typography>
                  <Typography variant="body2">{formatDate(alert.createdAt)}</Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleStatusChangeClick(alert)}
                  sx={{ 
                    borderColor: '#ccc', 
                    color: '#555',
                    '&:hover': { borderColor: '#999', backgroundColor: '#f5f5f5' }
                  }}
                >
                  Update Status
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => router.push(`/admin/alerts/edit/${alert._id}`)}
                  sx={{ 
                    borderColor: '#1976d2', 
                    color: '#1976d2',
                    '&:hover': { backgroundColor: '#e3f2fd' }
                  }}
                >
                  <i className="ri-edit-line" style={{ marginRight: '4px' }} />
                  Edit
                </Button>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteClick(alert)}
                >
                  <i className="ri-delete-bin-line" />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  };

  // Desktop table view for alerts
  const renderAlertTable = () => {
    return (
      <TableContainer>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>City</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Created On</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <TableRow key={alert._id} hover>
                  <TableCell sx={{ maxWidth: 250 }}>
                    <Typography noWrap title={alert.title || alert.description.substring(0, 30)}>
                      {alert.title || alert.description.substring(0, 30)}
                    </Typography>
                  </TableCell>
                  <TableCell>{alert.city}</TableCell>
                  <TableCell>{formatDate(alert.createdAt)}</TableCell>
                  <TableCell>
                    <Chip
                      label={alert.status?.charAt(0).toUpperCase() + (alert.status?.slice(1) || '')}
                      size="small"
                      sx={{
                        bgcolor: getStatusColor(alert.status || 'pending').bg,
                        color: getStatusColor(alert.status || 'pending').color,
                        fontWeight: 'medium'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleStatusChangeClick(alert)}
                        sx={{ 
                          borderColor: '#ccc', 
                          color: '#555',
                          '&:hover': { borderColor: '#999', backgroundColor: '#f5f5f5' }
                        }}
                      >
                        Update Status
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => router.push(`/admin/alerts/edit/${alert._id}`)}
                        sx={{ 
                          borderColor: '#1976d2', 
                          color: '#1976d2',
                          '&:hover': { backgroundColor: '#e3f2fd' }
                        }}
                      >
                        <i className="ri-edit-line" style={{ marginRight: '4px' }} />
                        Edit
                      </Button>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(alert)}
                      >
                        <i className="ri-delete-bin-line" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    No alerts found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Error display component
  const renderError = () => (
    <Box sx={{ textAlign: 'center', p: 4 }}>
      <Typography variant="h6" color="error" sx={{ mb: 2 }}>
        {error}
      </Typography>
      <Button 
        variant="contained" 
        onClick={handleRetry}
        startIcon={<i className="ri-refresh-line" />}
      >
        Try Again
      </Button>
    </Box>
  );

  return (
    <AdminLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
          Alerts Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View, filter and manage all alerts
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }} elevation={0}>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          sx={{ mb: 3 }}
          alignItems={{ sm: 'center' }}
        >
          <TextField
            label="Search alerts"
            variant="outlined"
            size="small"
            fullWidth
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{ flex: 2, maxWidth: { sm: 300 } }}
          />
          <FormControl size="small" sx={{ width: { xs: '100%', sm: 200 } }}>
            <InputLabel id="status-filter-label">Filter by Status</InputLabel>
            <Select
              labelId="status-filter-label"
              id="status-filter"
              value={statusFilter}
              label="Filter by Status"
              onChange={handleStatusFilterChange}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="published">Published</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="primary"
            startIcon={<i className="ri-add-line" />}
            onClick={() => router.push('/admin/alerts/create')}
            sx={{ 
              ml: { sm: 'auto' },
              whiteSpace: 'nowrap',
              minWidth: { xs: '100%', sm: 'auto' }
            }}
          >
            Create New Alert
          </Button>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          renderError()
        ) : (
          <>
            {/* Switch between mobile card view and desktop table view */}
            {isMobile ? renderAlertCards() : renderAlertTable()}
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this alert? This action cannot be undone.
          </DialogContentText>
          {selectedAlert && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2">
                {selectedAlert.title || selectedAlert.description.substring(0, 30)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedAlert.city}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
      >
        <DialogTitle>Update Alert Status</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Choose a new status for this alert.
          </DialogContentText>
          {selectedAlert && (
            <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2">
                {selectedAlert.title || selectedAlert.description.substring(0, 30)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedAlert.city}
              </Typography>
            </Box>
          )}
          <FormControl fullWidth>
            <InputLabel id="new-status-label">Status</InputLabel>
            <Select
              labelId="new-status-label"
              id="new-status"
              value={newStatus}
              label="Status"
              onChange={(e) => setNewStatus(e.target.value as string)}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="published">Published</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmStatusChange} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
} 