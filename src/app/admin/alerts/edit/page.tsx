'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  Alert,
  Snackbar,
  SelectChangeEvent,
  Grid
} from '@mui/material';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import { Alert as AlertType } from '@/types';
import { updateAlert, updateAlertStatus } from '@/services/adminApi';

const INCIDENT_TYPES = [
  'Scam',
  'Theft',
  'Crime',
  'Weather',
  'Public Disorder',
  'Other'
];

const ALERT_CATEGORIES = [
  'Transport',
  'Health',
  'Safety',
  'Weather',
  'Scam',
  'Crime',
  'Other'
];

const RISK_LEVELS = [
  'Low',
  'Medium',
  'High',
  'Critical'
];

const PRIORITY_LEVELS = [
  'Low',
  'Medium',
  'High',
  'Critical',
  'Emergency'
];

const STATUSES = [
  'pending',
  'approved',
  'rejected'
];

export default function EditAlert() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<AlertType | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    alertCategory: '',
    alertType: '',
    risk: '',
    impact: '',
    priority: '',
    targetAudience: '',
    recommendedAction: '',
    city: '',
    country: '',
    status: '',
    linkToSource: '',
    latitude: 0,
    longitude: 0
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const alertId = searchParams.get('id');

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, isLoading, router]);

  useEffect(() => {
    // Load alert data from localStorage (saved when clicking edit)
    if (isAuthenticated && isAdmin && alertId) {
      const storedAlert = localStorage.getItem('editAlert');
      if (storedAlert) {
        try {
          const parsedAlert = JSON.parse(storedAlert);
          setAlert(parsedAlert);
          
          // Initialize form data
          setFormData({
            title: parsedAlert.title || '',
            description: parsedAlert.description || '',
            alertCategory: parsedAlert.alertCategory || '',
            alertType: parsedAlert.alertType || '',
            risk: parsedAlert.risk || '',
            impact: parsedAlert.impact || '',
            priority: parsedAlert.priority || '',
            targetAudience: parsedAlert.targetAudience || '',
            recommendedAction: parsedAlert.recommendedAction || '',
            city: parsedAlert.city || '',
            country: parsedAlert.country || '',
            status: parsedAlert.status || 'pending',
            linkToSource: parsedAlert.linkToSource || '',
            latitude: parsedAlert.latitude || 0,
            longitude: parsedAlert.longitude || 0
          });
        } catch (error) {
          console.error('Error parsing stored alert:', error);
          setErrorMessage('Failed to load alert data');
        }
      } else {
        setErrorMessage('Alert data not found');
        // Redirect back to alerts page after a short delay
        setTimeout(() => {
          router.push('/admin/alerts');
        }, 3000);
      }
      setLoading(false);
    }
  }, [isAuthenticated, isAdmin, alertId, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    if (name) {
      // Convert latitude and longitude to numbers if applicable
      if (name === 'latitude' || name === 'longitude') {
        setFormData(prev => ({ 
          ...prev, 
          [name]: value === '' ? 0 : Number(value) 
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
      
      // Clear error for this field if it exists
      if (formErrors[name]) {
        setFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!formData.city.trim()) {
      errors.city = 'City is required';
    }
    
    if (!formData.status) {
      errors.status = 'Status is required';
    }

    // Validate coordinates
    if (isNaN(formData.latitude) || formData.latitude < -90 || formData.latitude > 90) {
      errors.latitude = 'Latitude must be between -90 and 90';
    }

    if (isNaN(formData.longitude) || formData.longitude < -180 || formData.longitude > 180) {
      errors.longitude = 'Longitude must be between -180 and 180';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setErrorMessage('Please fix the errors in the form');
      return;
    }
    
    if (!alert) {
      setErrorMessage('Alert data is missing');
      return;
    }
    
    setSaving(true);
    
    try {
      // Use the new updateAlert function for comprehensive editing
      await updateAlert(alert._id, {
        title: formData.title,
        description: formData.description,
        alertCategory: formData.alertCategory,
        alertType: formData.alertType,
        risk: formData.risk,
        impact: formData.impact,
        priority: formData.priority,
        targetAudience: formData.targetAudience,
        recommendedAction: formData.recommendedAction,
        city: formData.city,
        country: formData.country,
        latitude: formData.latitude,
        longitude: formData.longitude,
        status: formData.status as 'approved' | 'rejected' | 'pending',
        linkToSource: formData.linkToSource
      });
      
      setSuccessMessage('Alert updated successfully');
      
      // Clear old stored alert data
      localStorage.removeItem('editAlert');
      
      // Redirect back to alerts page after a short delay
      setTimeout(() => {
        router.push('/admin/alerts');
      }, 2000);
    } catch (error) {
      console.error('Error updating alert:', error);
      setErrorMessage('Failed to update alert');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/alerts');
  };

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
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
            Edit Alert
          </Typography>
          
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errorMessage}
            </Alert>
          )}
          
          <Snackbar
            open={!!successMessage}
            autoHideDuration={6000}
            onClose={() => setSuccessMessage('')}
          >
            <Alert severity="success" sx={{ width: '100%' }}>
              {successMessage}
            </Alert>
          </Snackbar>
          
          <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 3 }}>
              <TextField
                label="Title"
                name="title"
                fullWidth
                value={formData.title}
                onChange={handleInputChange}
                error={!!formErrors.title}
                helperText={formErrors.title}
                required
                sx={{ mb: 2 }}
              />
              
              <TextField
                label="Description"
                name="description"
                fullWidth
                multiline
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                error={!!formErrors.description}
                helperText={formErrors.description}
                required
                sx={{ mb: 2 }}
              />
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <FormControl sx={{ minWidth: '48%', flexGrow: 1 }}>
                  <InputLabel>Alert Category</InputLabel>
                  <Select
                    name="alertCategory"
                    value={formData.alertCategory}
                    onChange={handleInputChange}
                    label="Alert Category"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {ALERT_CATEGORIES.map(category => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl sx={{ minWidth: '48%', flexGrow: 1 }}>
                  <InputLabel>Alert Type</InputLabel>
                  <Select
                    name="alertType"
                    value={formData.alertType}
                    onChange={handleInputChange}
                    label="Alert Type"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {INCIDENT_TYPES.map(type => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <FormControl sx={{ minWidth: '48%', flexGrow: 1 }}>
                  <InputLabel>Risk Level</InputLabel>
                  <Select
                    name="risk"
                    value={formData.risk}
                    onChange={handleInputChange}
                    label="Risk Level"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {RISK_LEVELS.map(level => (
                      <MenuItem key={level} value={level}>
                        {level}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl sx={{ minWidth: '48%', flexGrow: 1 }}>
                  <InputLabel>Priority Level</InputLabel>
                  <Select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    label="Priority Level"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {PRIORITY_LEVELS.map(level => (
                      <MenuItem key={level} value={level}>
                        {level}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <FormControl 
                  sx={{ minWidth: '48%', flexGrow: 1 }}
                  error={!!formErrors.status}
                  required
                >
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    label="Status"
                  >
                    {STATUSES.map(status => (
                      <MenuItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.status && <FormHelperText>{formErrors.status}</FormHelperText>}
                </FormControl>
              </Box>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Location Information
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <TextField
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  error={!!formErrors.city}
                  helperText={formErrors.city}
                  required
                  sx={{ flexGrow: 1, minWidth: '48%' }}
                />
                
                <TextField
                  label="Country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  sx={{ flexGrow: 1, minWidth: '48%' }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <TextField
                  label="Latitude"
                  name="latitude"
                  type="number"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  error={!!formErrors.latitude}
                  helperText={formErrors.latitude || "Value between -90 and 90"}
                  required
                  sx={{ flexGrow: 1, minWidth: '48%' }}
                  inputProps={{ step: 'any' }}
                />
                
                <TextField
                  label="Longitude"
                  name="longitude"
                  type="number"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  error={!!formErrors.longitude}
                  helperText={formErrors.longitude || "Value between -180 and 180"}
                  required
                  sx={{ flexGrow: 1, minWidth: '48%' }}
                  inputProps={{ step: 'any' }}
                />
              </Box>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Additional Information
              </Typography>
              
              <TextField
                label="Impact"
                name="impact"
                fullWidth
                multiline
                rows={2}
                value={formData.impact}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
              />
              
              <TextField
                label="Target Audience"
                name="targetAudience"
                fullWidth
                value={formData.targetAudience}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
              />
              
              <TextField
                label="Recommended Action"
                name="recommendedAction"
                fullWidth
                multiline
                rows={2}
                value={formData.recommendedAction}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
              />
              
              <TextField
                label="Link to Source"
                name="linkToSource"
                fullWidth
                value={formData.linkToSource}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
              />
            </Box>
            
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
                sx={{ 
                  bgcolor: 'black', 
                  '&:hover': { bgcolor: '#333' }
                }}
              >
                {saving ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
              </Button>
            </Box>
          </form>
        </Paper>
      </Container>
    </AdminLayout>
  );
} 