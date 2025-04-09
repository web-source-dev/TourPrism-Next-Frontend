'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { getUserProfile, updateUserProfile } from '@/services/api';
import {
  CardContent,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Box,
  Paper,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
  Stack
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SaveIcon from '@mui/icons-material/Save';
import Layout from '@/components/Layout';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    emailPrefrences: false,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  const router = useRouter();

  // Load user data from server
  useEffect(() => {
    async function loadUserProfile() {
      try {
        // First check localStorage for authentication
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          router.push('/login');
          return;
        }
        
        // Then fetch the latest user data from the server
        const userData = await getUserProfile();
        setUser(userData);
        
        // Set form values with the data from the server
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          emailPrefrences: !!userData.emailPrefrences,
        });
      } catch (error) {
        console.error('Error loading user profile:', error);
        // If there's an error, try to load from localStorage as fallback
        try {
          const parsedUser = JSON.parse(localStorage.getItem('user') || '') as User;
          setUser(parsedUser);
          setFormData({
            firstName: parsedUser.firstName || '',
            lastName: parsedUser.lastName || '',
            email: parsedUser.email || '',
            emailPrefrences: !!parsedUser.emailPrefrences,
          });
        } catch (fallbackError) {
            console.error(fallbackError)
          router.push('/login');
        }
      } finally {
        setIsLoading(false);
      }
    }
    
    loadUserProfile();
  }, [router]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'emailPrefrences' ? checked : value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const updatedUser = await updateUserProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        emailPrefrences: formData.emailPrefrences,
      });
      
      setUser(updatedUser);
      setSnackbar({
        open: true,
        message: 'Profile updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update profile',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Layout>
    <Box sx={{ maxWidth: '1000px', margin: '0 auto', padding: '0 1rem' }}>
      <Paper elevation={3} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Box 
          sx={{ 
            p: 3, 
            background: 'linear-gradient(135deg,rgb(43, 43, 43) 0%,rgb(25, 26, 28) 100%)',
            color: 'white'
          }}
        >
          <Typography variant="h4" fontWeight="bold">
            Profile Settings
          </Typography>
          <Typography variant="subtitle1" sx={{ mt: 1, opacity: 0.9 }}>
            Update your personal information and preferences
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={4}>
              {/* Avatar */}
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Avatar 
                  sx={{ 
                    width: 100, 
                    height: 100, 
                    bgcolor: '#e3f2fd',
                    color: '#1976d2'
                  }}
                >
                  <PersonIcon sx={{ fontSize: 60, color:'rgb(43,43,43)' }} />
                </Avatar>
              </Box>
              
              {/* Name fields */}
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  label="First Name"
                  variant="outlined"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  InputLabelProps={{ shrink: true }}
                />
                
                <TextField
                  fullWidth
                  label="Last Name"
                  variant="outlined"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
              
              {/* Email field */}
              <Box>
                <TextField
                  fullWidth
                  label="Email Address"
                  variant="outlined"
                  name="email"
                  value={formData.email}
                  disabled
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    "& .MuiInputBase-input.Mui-disabled": {
                      WebkitTextFillColor: "#666",
                      bgcolor: '#f5f5f5'
                    }
                  }}
                />
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  Your email address cannot be changed
                </Typography>
              </Box>
              
              {/* Notification preferences */}
              <Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Notification Preferences
                </Typography>
                
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 3, 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: '#fafafa',
                    borderRadius: '8px',
                    mt: 2
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1" fontWeight="medium">
                      Email Notifications
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Receive email notifications about alerts, updates, and other important information
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.emailPrefrences}
                        onChange={handleChange}
                        name="emailPrefrences"
                        sx={{
                            color:"rgb(43,43,43)"
                        }}
                      />
                    }
                    label=""
                  />
                </Paper>
              </Box>
            </Stack>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                sx={{ px: 4, py: 1.5, borderRadius: '8px',bgcolor: "rgb(43,43,43)"}}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </CardContent>
        </form>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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
    </Box>
    </Layout>
  );
} 