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

// Extended interface for Alert type that includes expectedStart and expectedEnd
interface ExtendedAlert extends Alert {
  expectedStart?: string;
  expectedEnd?: string;
}

export default function EditAlertPage() {
  const router = useRouter();
  const params = useParams();
  const alertId = params.id as string;

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
    fetchAlertDetails();
  }, [fetchAlertDetails]);

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

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  if (error && !alert) {
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
                <MenuItem value="published">Published</MenuItem>
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
            <TextField
              name="alertCategory"
              label="Alert Category"
              variant="outlined"
              value={formValues.alertCategory || ''}
              onChange={handleInputChange}
              sx={{ flex: '1 1 45%', minWidth: '250px' }}
            />
            
            <TextField
              name="alertType"
              label="Alert Type"
              variant="outlined"
              value={formValues.alertType || ''}
              onChange={handleInputChange}
              sx={{ flex: '1 1 45%', minWidth: '250px' }}
            />
            
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
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl sx={{ flex: '1 1 30%', minWidth: '200px' }}>
              <InputLabel id="impact-label">Impact</InputLabel>
              <Select
                labelId="impact-label"
                id="impact"
                name="impact"
                value={formValues.impact || ''}
                label="Impact"
                onChange={handleSelectChange}
              >
                <MenuItem value="minimal">Minimal</MenuItem>
                <MenuItem value="moderate">Moderate</MenuItem>
                <MenuItem value="significant">Significant</MenuItem>
                <MenuItem value="severe">Severe</MenuItem>
              </Select>
            </FormControl>
            
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
                <MenuItem value="urgent">Urgent</MenuItem>
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

          {/* Media */}
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, mt: 2 }}>
            Media
          </Typography>
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