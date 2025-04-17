'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { createNewAlert } from '@/services/api';
import { Alert } from '@/types';

export default function CreateAlertPage() {
  const router = useRouter();
  
  const [saving, setSaving] = useState(false);
  const [formValues, setFormValues] = useState<Partial<Alert>>({
    status: 'pending',
    latitude: undefined,
    longitude: undefined,
    city: '',
    title: '',
    description: '',
    alertCategory: '',
    alertType: '',
    risk: '',
    impact: '',
    priority: '',
    targetAudience: '',
    recommendedAction: '',
    linkToSource: '',
  });
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

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

    try {
      await createNewAlert(formValues);
      setSnackbar({
        open: true,
        message: 'Alert created successfully',
        severity: 'success'
      });
      
      // Wait a moment to show the success message before redirecting
      setTimeout(() => {
        router.push('/admin/alerts');
      }, 1500);
    } catch (err) {
      console.error('Error creating alert:', err);
      setSnackbar({
        open: true,
        message: 'Failed to create alert',
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
            Create New Alert
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          Create a new alert with all necessary details
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
              required
            />
            
            <FormControl sx={{ flex: '1 1 30%', minWidth: '200px' }} required>
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
              required
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
              required
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
              required
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
              required
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
              color="primary"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <i className="ri-save-line" />}
            >
              {saving ? 'Creating...' : 'Create Alert'}
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