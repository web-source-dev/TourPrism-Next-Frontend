'use client';

import { useState, useEffect, useRef } from 'react';
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
  Stack,
  IconButton,
  Container,
  Autocomplete,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Tooltip,
  Card
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SaveIcon from '@mui/icons-material/Save';
import BusinessIcon from '@mui/icons-material/Business';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Layout from '@/components/Layout';

// Company types for selection
const companyTypes = ['Hotel', 'Tour Operator', 'DMO', 'Travel Agency', 'Other'];

// Interface for Google Places results
interface GoogleMapsPlace {
  formatted_address?: string;
  name?: string;
}

// Load Google Maps API script
const loadGoogleMapsScript = (callback: () => void) => {
  if (typeof window !== 'undefined' && !window.google) {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = callback;
    document.head.appendChild(script);
  } else if (typeof window !== 'undefined' && window.google) {
    callback();
  }
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    emailPrefrences: false,
    company: {
      name: '',
      type: [] as string[],
      MainOperatingRegions: '',
    },
    preferences: {
      Communication: {
        emailPrefrences: false,
        whatsappPrefrences: false,
      },
      AlertSummaries: {
        daily: false,
        weekly: false,
        monthly: false,
      }
    }
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  const router = useRouter();
  const operatingRegionsInputRef = useRef<HTMLInputElement>(null);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    let autocomplete: any = null;
    
    const initAutocomplete = () => {
      if (operatingRegionsInputRef.current && window.google && window.google.maps) {
        // @ts-ignore - Ignoring type checking for Google Maps API
        autocomplete = new window.google.maps.places.Autocomplete(operatingRegionsInputRef.current, {
          types: ['(cities)'],
        });
        
        // @ts-ignore - Ignoring type checking for Google Maps API
        autocomplete.addListener('place_changed', () => {
          // @ts-ignore - Ignoring type checking for Google Maps API
          const place = autocomplete.getPlace() as GoogleMapsPlace;
          if (place && place.formatted_address) {
            setFormData(prev => ({
              ...prev,
              company: {
                ...prev.company,
                MainOperatingRegions: place.formatted_address || ''
              }
            }));
          }
        });
      }
    };
    
    loadGoogleMapsScript(initAutocomplete);
    
    return () => {
      // Clean up the event listener if needed
      if (autocomplete && window.google && window.google.maps) {
        // @ts-ignore - Ignoring type checking for Google Maps API
        window.google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, []);

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
        
        // Parse company type as array
        let companyType: string[] = [];
        if (userData.company?.type) {
          companyType = Array.isArray(userData.company.type) 
            ? userData.company.type 
            : userData.company.type.split(',').map(t => t.trim()).filter(Boolean);
        }
        
        // Set form values with the data from the server
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          emailPrefrences: !!userData.emailPrefrences,
          company: {
            name: userData.company?.name || '',
            type: companyType,
            MainOperatingRegions: userData.company?.MainOperatingRegions || '',
          },
          preferences: {
            Communication: {
              emailPrefrences: userData.preferences?.Communication?.emailPrefrences || false,
              whatsappPrefrences: userData.preferences?.Communication?.whatsappPrefrences || false,
            },
            AlertSummaries: {
              daily: userData.preferences?.AlertSummaries?.daily || false,
              weekly: userData.preferences?.AlertSummaries?.weekly || false,
              monthly: userData.preferences?.AlertSummaries?.monthly || false,
            }
          }
        });
      } catch (error) {
        console.error('Error loading user profile:', error);
        // If there's an error, try to load from localStorage as fallback
        try {
          const parsedUser = JSON.parse(localStorage.getItem('user') || '') as User;
          setUser(parsedUser);
          
          // Parse company type as array
          let companyType: string[] = [];
          if (parsedUser.company?.type) {
            companyType = Array.isArray(parsedUser.company.type) 
              ? parsedUser.company.type 
              : parsedUser.company.type.split(',').map(t => t.trim()).filter(Boolean);
          }
          
          setFormData({
            firstName: parsedUser.firstName || '',
            lastName: parsedUser.lastName || '',
            email: parsedUser.email || '',
            emailPrefrences: !!parsedUser.emailPrefrences,
            company: {
              name: parsedUser.company?.name || '',
              type: companyType,
              MainOperatingRegions: parsedUser.company?.MainOperatingRegions || '',
            },
            preferences: {
              Communication: {
                emailPrefrences: parsedUser.preferences?.Communication?.emailPrefrences || false,
                whatsappPrefrences: parsedUser.preferences?.Communication?.whatsappPrefrences || false,
              },
              AlertSummaries: {
                daily: parsedUser.preferences?.AlertSummaries?.daily || false,
                weekly: parsedUser.preferences?.AlertSummaries?.weekly || false,
                monthly: parsedUser.preferences?.AlertSummaries?.monthly || false,
              }
            }
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
    
    if (name === 'emailPrefrences') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name.startsWith('company.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        company: {
          ...prev.company,
          [field]: value
        }
      }));
    } else if (name.startsWith('preferences.Communication.')) {
      const field = name.split('.')[2];
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          Communication: {
            ...prev.preferences.Communication,
            [field]: checked
          }
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle company type selection for multiple values
  const handleCompanyTypeChange = (event: React.SyntheticEvent, newValue: string[]) => {
    setFormData(prev => ({
      ...prev,
      company: {
        ...prev.company,
        type: newValue
      }
    }));
  };
  
  // Handle alert summaries preference change
  const handleAlertSummaryChange = (e: SelectChangeEvent<string>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        AlertSummaries: {
          daily: value === 'daily',
          weekly: value === 'weekly',
          monthly: value === 'monthly',
        }
      }
    }));
  };

  // Get current alert summary preference
  const getCurrentAlertSummary = () => {
    const { daily, weekly, monthly } = formData.preferences.AlertSummaries;
    if (daily) return 'daily';
    if (weekly) return 'weekly';
    if (monthly) return 'monthly';
    return '';
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
        company: {
          name: formData.company.name,
          type: formData.company.type.join(', '), // Join array values for backend storage
          MainOperatingRegions: formData.company.MainOperatingRegions,
        },
        preferences: {
          Communication: {
            emailPrefrences: formData.preferences.Communication.emailPrefrences,
            whatsappPrefrences: formData.preferences.Communication.whatsappPrefrences,
          },
          AlertSummaries: {
            daily: formData.preferences.AlertSummaries.daily,
            weekly: formData.preferences.AlertSummaries.weekly,
            monthly: formData.preferences.AlertSummaries.monthly,
          }
        }
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
    <Layout isFooter={false}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Back button */}
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          sx={{ 
            mb: 3, 
            color: 'rgb(43,43,43)',
            '&:hover': { backgroundColor: 'rgba(43,43,43,0.04)' }
          }}
        >
          Back
        </Button>

        {/* Main content */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          {/* Main form area */}
          <Box sx={{ flex: 1 }}>
            <Paper elevation={2} sx={{ borderRadius: '12px', overflow: 'hidden', mb: 3 }}>
              <Box 
                sx={{ 
                  p: 3, 
                  background: 'linear-gradient(135deg,rgb(43, 43, 43) 0%,rgb(25, 26, 28) 100%)',
                  color: 'white'
                }}
              >
                <Typography variant="h5" fontWeight="bold">
                  Profile Settings
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                  Update your personal information and account preferences
                </Typography>
              </Box>

              <form onSubmit={handleSubmit}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <PersonIcon sx={{ mr: 1 }} />
                      Personal Information
                    </Typography>
                    
                    <Stack spacing={3} sx={{ mt: 2 }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
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
                        helperText="Your email address cannot be changed"
                      />
                    </Stack>
                  </Box>
                  
                  <Divider sx={{ my: 3 }} />
                  
                  {/* Company Information */}
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <BusinessIcon sx={{ mr: 1 }} />
                      Company Information
                    </Typography>
                    
                    <Stack spacing={3} sx={{ mt: 2 }}>
                      <TextField
                        fullWidth
                        label="Company Name"
                        variant="outlined"
                        name="company.name"
                        value={formData.company.name}
                        onChange={handleChange}
                        helperText="Search existing companies or create a new one"
                        InputLabelProps={{ shrink: true }}
                      />
                      
                      <Autocomplete
                        multiple
                        id="company-type-tags"
                        options={companyTypes}
                        value={formData.company.type}
                        onChange={handleCompanyTypeChange}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip 
                              label={option} 
                              {...getTagProps({ index })} 
                              key={index}
                              sx={{ bgcolor: '#e3f2fd', color: '#1976d2' }}
                            />
                          ))
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Company Type"
                            placeholder="Select one or more types"
                            helperText="You can select multiple company types"
                          />
                        )}
                      />
                      
                      <TextField
                        fullWidth
                        label="Main Operating Regions"
                        variant="outlined"
                        name="company.MainOperatingRegions"
                        value={formData.company.MainOperatingRegions}
                        onChange={handleChange}
                        helperText="Enter your main operating regions or locations (city-level)"
                        InputLabelProps={{ shrink: true }}
                        inputRef={operatingRegionsInputRef}
                        placeholder="Start typing a city name..."
                      />
                    </Stack>
                  </Box>
                  
                  <Divider sx={{ my: 3 }} />
                  
                  {/* Collaborators */}
                  <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',flexDirection: { xs: 'column', md: 'row' },
                    gap: 2,
                    mb: 2 }}>
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                        <GroupAddIcon sx={{ mr: 1 }} />
                        Collaborators
                      </Typography>
                      <Button 
                        variant="outlined" 
                        startIcon={<GroupAddIcon />} 
                        size="small"
                        sx={{ borderRadius: '8px' ,width: { xs: '100%', md: 'auto' } }}
                      >
                        Add Collaborators
                      </Button>
                    </Box>
                    
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      Invite team members to collaborate on your account with different permission levels
                    </Typography>
                    
                    {user.collaborators && user.collaborators.length > 0 ? (
                      <Box sx={{ mt: 2 }}>
                        {/* Collaborator list would go here in the future */}
                        <Typography variant="body2">
                          You have {user.collaborators.length} collaborators
                        </Typography>
                      </Box>
                    ) : (
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          p: 3, 
                          backgroundColor: '#f8f9fa',
                          borderRadius: '8px',
                          textAlign: 'center'
                        }}
                      >
                        <Typography variant="body2" color="textSecondary">
                          You haven't added any collaborators yet
                        </Typography>
                      </Paper>
                    )}
                  </Box>
                  
                  <Divider sx={{ my: 3 }} />
                  
                  {/* Notification preferences */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <NotificationsIcon sx={{ mr: 1 }} />
                      Notification Preferences
                    </Typography>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                        Communication Channels
                      </Typography>
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          p: 3, 
                          bgcolor: '#fafafa',
                          borderRadius: '8px',
                          mb: 3
                        }}
                      >
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formData.preferences.Communication.emailPrefrences}
                                onChange={handleChange}
                                name="preferences.Communication.emailPrefrences"
                              />
                            }
                            label="Email Notifications"
                          />
                          <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 2, ml: 4 }}>
                            Receive alerts and updates via email
                          </Typography>
                          
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formData.preferences.Communication.whatsappPrefrences}
                                onChange={handleChange}
                                name="preferences.Communication.whatsappPrefrences"
                              />
                            }
                            label="WhatsApp Notifications"
                          />
                          <Typography variant="caption" color="textSecondary" display="block" sx={{ ml: 4 }}>
                            Receive alerts and updates via WhatsApp
                          </Typography>
                        </Box>
                      </Paper>
                    
                      <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                        Alert Summaries
                      </Typography>
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          p: 3, 
                          bgcolor: '#fafafa',
                          borderRadius: '8px',
                        }}
                      >
                        <FormControl fullWidth variant="outlined">
                          <InputLabel id="alert-summary-frequency-label">Summary Frequency</InputLabel>
                          <Select
                            labelId="alert-summary-frequency-label"
                            value={getCurrentAlertSummary()}
                            label="Summary Frequency"
                            onChange={handleAlertSummaryChange}
                          >
                            <MenuItem value="">
                              <em>No summaries</em>
                            </MenuItem>
                            <MenuItem value="daily">Daily</MenuItem>
                            <MenuItem value="weekly">Weekly</MenuItem>
                            <MenuItem value="monthly">Monthly</MenuItem>
                          </Select>
                          <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                            Choose how often you would like to receive a summary of alerts
                          </Typography>
                        </FormControl>
                      </Paper>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={isLoading}
                      startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                      sx={{ 
                        px: 4, 
                        py: 1.5, 
                        borderRadius: '8px',
                        bgcolor: "rgb(43,43,43)",
                        '&:hover': {
                          bgcolor: 'rgb(60,60,60)'
                        }
                      }}
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Box>
                </CardContent>
              </form>
            </Paper>
          </Box>
        </Box>
      </Container>

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
    </Layout>
  );
} 