'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Snackbar,
  Alert as MuiAlert,
  Divider,
  Stack,
  SelectChangeEvent
} from '@mui/material';
import AdminLayout from '@/components/AdminLayout';
import { getAlertById, updateAlert } from '@/services/api';
import { Alert } from '@/types';
import { useAuth } from '@/context/AuthContext';

// Extended interface for Alert type that includes expectedStart and expectedEnd
interface ExtendedAlert extends Alert {
  expectedStart?: string;
  expectedEnd?: string;
}

export default function EditAlertPage() {
  const router = useRouter();
  const params = useParams();
  const alertId = params.id as string;
  const { isAdmin, isManager, isEditor } = useAuth();

  const [alert, setAlert] = useState<ExtendedAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Partial<ExtendedAlert>>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // Permission check
  const canEditAlert = isAdmin || isManager || isEditor;
  
  // Redirect if not authorized
  useEffect(() => {
    if (!canEditAlert) {
      setSnackbar({
        open: true,
        message: 'You do not have permission to edit alerts',
        severity: 'error'
      });
      
      // Redirect after showing message briefly
      const redirectTimer = setTimeout(() => {
        router.push('/admin/alerts');
      }, 2000);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [canEditAlert, router]);

  const fetchAlertDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const alertData = await getAlertById(alertId);
      setAlert(alertData);
      setFormValues(alertData);
    } catch (err) {
      console.error('Error fetching alert details:', err);
      setError('Failed to load alert details. Please try again.');
      setSnackbar({
        open: true,
        message: 'Failed to load alert details',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [alertId]);
  
  useEffect(() => {
    if (canEditAlert) {
      fetchAlertDetails();
    }
  }, [fetchAlertDetails, canEditAlert]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Double-check permissions
    if (!canEditAlert) {
      setSnackbar({
        open: true,
        message: 'You do not have permission to edit alerts',
        severity: 'error'
      });
      return;
    }
    
    setSaving(true);
    setError(null);

    try {
      await updateAlert(alertId, formValues);
      setSnackbar({
        open: true,
        message: 'Alert updated successfully',
        severity: 'success'
      });
      
      // Wait a moment to show the success message before redirecting
      setTimeout(() => {
        router.push('/admin/alerts');
      }, 1500);
    } catch (err) {
      console.error('Error updating alert:', err);
      setError('Failed to update alert. Please try again.');
      setSnackbar({
        open: true,
        message: 'Failed to update alert',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/alerts');
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading && canEditAlert) {
    return (
      <AdminLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  if (error && !alert && canEditAlert) {
    return (
      <AdminLayout>
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <Typography variant="h6" color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button 
              variant="contained" 
              onClick={fetchAlertDetails}
              startIcon={<i className="ri-refresh-line" />}
            >
              Try Again
            </Button>
            <Button 
              variant="outlined" 
              onClick={handleCancel}
              startIcon={<i className="ri-arrow-left-line" />}
            >
              Back to Alerts
            </Button>
          </Box>
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Unauthorized access warning */}
      {!canEditAlert && (
        <Box sx={{ p: 3, mb: 3, bgcolor: '#ffebee', borderRadius: 2, border: '1px solid #ffcdd2' }}>
          <Typography variant="subtitle1" color="error" sx={{ fontWeight: 'medium' }}>
            <i className="ri-error-warning-line" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            You do not have permission to edit alerts
          </Typography>
          <Typography variant="body2" color="error.dark" sx={{ mt: 1, opacity: 0.8 }}>
            You are being redirected to the alerts list.
          </Typography>
        </Box>
      )}
      
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Button 
            variant="text" 
            onClick={handleCancel}
            startIcon={<i className="ri-arrow-left-line" />}
            sx={{ mr: 1 }}
          >
            Back
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Edit Alert
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          Update alert information
        </Typography>
      </Box>

      {/* Only display form if authorized and data is loaded */}
      {canEditAlert && !loading && !error && alert && (
        <Paper sx={{ p: 3, borderRadius: 2 }} elevation={0}>
          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Basic Information
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
              <TextField
                name="title"
                label="Title"
                fullWidth
                variant="outlined"
                value={formValues.title || ''}
                onChange={handleInputChange}
                sx={{ flex: '1 1 60%', minWidth: '250px' }}
              />
              
              <FormControl sx={{ flex: '1 1 30%', minWidth: '200px' }}>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  id="status"
                  name="status"
                  value={formValues.status || 'pending'}
                  label="Status"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                name="description"
                label="Description"
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                value={formValues.description || ''}
                onChange={handleInputChange}
                sx={{ width: '100%' }}
              />
            </Box>

            {/* Location Information */}
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, mt: 2 }}>
              Location Information
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
              <TextField
                name="city"
                label="City"
                variant="outlined"
                value={formValues.city || ''}
                onChange={handleInputChange}
                sx={{ flex: '1 1 30%', minWidth: '200px' }}
              />
              
              <TextField
                name="latitude"
                label="Latitude"
                variant="outlined"
                type="number"
                inputProps={{ step: 'any' }}
                value={formValues.latitude || ''}
                onChange={handleInputChange}
                sx={{ flex: '1 1 30%', minWidth: '200px' }}
              />
              
              <TextField
                name="longitude"
                label="Longitude"
                variant="outlined"
                type="number"
                inputProps={{ step: 'any' }}
                value={formValues.longitude || ''}
                onChange={handleInputChange}
                sx={{ flex: '1 1 30%', minWidth: '200px' }}
              />
            </Box>

            {/* Time Information */}
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, mt: 2 }}>
              Time Information
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
              <TextField
                name="expectedStart"
                label="Expected Start"
                variant="outlined"
                type="datetime-local"
                value={formValues.expectedStart ? new Date(formValues.expectedStart as string).toISOString().substring(0, 16) : ''}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: '1 1 45%', minWidth: '250px' }}
              />
              
              <TextField
                name="expectedEnd"
                label="Expected End"
                variant="outlined"
                type="datetime-local"
                value={formValues.expectedEnd ? new Date(formValues.expectedEnd as string).toISOString().substring(0, 16) : ''}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: '1 1 45%', minWidth: '250px' }}
              />
            </Box>

            {/* Alert Classification */}
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, mt: 2 }}>
              Alert Classification
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
              <FormControl sx={{ flex: '1 1 45%', minWidth: '250px' }}>
                <InputLabel id="alert-category-label">Alert Category</InputLabel>
                <Select
                  labelId="alert-category-label"
                  id="alertCategory"
                  name="alertCategory"
                  value={formValues.alertCategory || ''}
                  label="Alert Category"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="Weather">Weather</MenuItem>
                  <MenuItem value="Transport">Transport</MenuItem>
                  <MenuItem value="Health">Health</MenuItem>
                  <MenuItem value="Civil Unrest">Civil Unrest</MenuItem>
                  <MenuItem value="General Safety">General Safety</MenuItem>
                  <MenuItem value="Natural Disaster">Natural Disaster</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl sx={{ flex: '1 1 45%', minWidth: '250px' }}>
                <InputLabel id="alert-type-label">Alert Type</InputLabel>
                <Select
                  labelId="alert-type-label"
                  id="alertType"
                  name="alertType"
                  value={formValues.alertType || ''}
                  label="Alert Type"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="Rain">Rain</MenuItem>
                  <MenuItem value="Strike">Strike</MenuItem>
                  <MenuItem value="Protest">Protest</MenuItem>
                  <MenuItem value="Cyber Attack">Cyber Attack</MenuItem>
                  <MenuItem value="Fire">Fire</MenuItem>
                  <MenuItem value="Fog">Fog</MenuItem>
                  <MenuItem value="Data Breach">Data Breach</MenuItem>
                  <MenuItem value="Storm">Storm</MenuItem>
                  <MenuItem value="Flood">Flood</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl sx={{ flex: '1 1 30%', minWidth: '200px' }}>
                <InputLabel id="risk-label">Risk Level</InputLabel>
                <Select
                  labelId="risk-label"
                  id="risk"
                  name="risk"
                  value={formValues.risk || ''}
                  label="Risk Level"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                name="impact"
                label="Impact"
                variant="outlined"
                value={formValues.impact || ''}
                onChange={handleInputChange}
                sx={{ flex: '1 1 30%', minWidth: '200px' }}
              />
              
              <FormControl sx={{ flex: '1 1 30%', minWidth: '200px' }}>
                <InputLabel id="priority-label">Priority</InputLabel>
                <Select
                  labelId="priority-label"
                  id="priority"
                  name="priority"
                  value={formValues.priority || ''}
                  label="Priority"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Additional Information */}
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, mt: 2 }}>
              Additional Information
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
              <TextField
                name="targetAudience"
                label="Target Audience"
                variant="outlined"
                value={formValues.targetAudience || ''}
                onChange={handleInputChange}
                sx={{ flex: '1 1 45%', minWidth: '250px' }}
              />
              
              <TextField
                name="recommendedAction"
                label="Recommended Action"
                variant="outlined"
                value={formValues.recommendedAction || ''}
                onChange={handleInputChange}
                sx={{ flex: '1 1 45%', minWidth: '250px' }}
              />
              
              <TextField
                name="linkToSource"
                label="Link to Source"
                variant="outlined"
                value={formValues.linkToSource || ''}
                onChange={handleInputChange}
                sx={{ width: '100%' }}
              />
            </Box>
            <Divider sx={{ mb: 3 }} />

            {/* Actions */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} /> : <i className="ri-save-line" />}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </form>
        </Paper>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MuiAlert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </AdminLayout>
  );
} 