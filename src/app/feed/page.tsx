'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Divider, 
  Skeleton,
  Dialog,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Snackbar,
  Alert as MuiAlert,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import FilterDrawer from '@/components/FilterDrawer';
import { fetchAlerts } from '@/services/api';
import { followAlert } from '@/services/alertActions';
import { Alert as AlertType, FilterOptions } from '@/types';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

export default function Feed() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [city, setCity] = useState<string | null>(null);
  const [coords, setCoords] = useState<{latitude: number; longitude: number} | null>(null);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [lowAccuracyWarning, setLowAccuracyWarning] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: 'newest',
    incidentTypes: [],
    timeRange: 0,
    distance: 50
  });

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Define the fetchLocationAlerts function with useCallback to avoid recreation on each render
  const fetchLocationAlerts = useCallback(async (cityName: string = "Edinburgh", coordinates: {latitude: number; longitude: number} | null = null) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page: 1,
        limit: isAuthenticated ? 10 : 3, // Limit to 3 for non-logged in users
        sortBy: filters.sortBy,
      };
      
      // Add time range filter if not set to "All Time"
      // This now filters based on the alert's expected start/end date
      if (filters.timeRange > 0) {
        // Current date as the reference point
        const now = new Date();
        
        // For filtering, we want to include alerts:
        // 1. That are expected to be active now or in the future
        // 2. Up to 'timeRange' days from now
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + filters.timeRange);
        
        // Use as start date for the filter (now)
        params.startDate = now.toISOString();
        // Use as end date for the filter (future)
        params.endDate = futureDate.toISOString();
      }
      
      // Add incident type filters if selected
      if (filters.incidentTypes && filters.incidentTypes.length > 0) {
        params.incidentTypes = filters.incidentTypes;
      }
      
      // Add location parameters
      if (coordinates) {
        params.latitude = coordinates.latitude;
        params.longitude = coordinates.longitude;
        if (filters.distance && filters.distance > 0) {
          params.distance = filters.distance; // in km
        }
      } else if (cityName) {
        params.city = cityName;
      }
      
      console.log('Fetching alerts with params:', params);
      const response = await fetchAlerts(params);
      
      // Ensure each alert has a unique ID
      const uniqueAlerts = Array.from(
        new Map(response.alerts.map(alert => [alert._id, alert])).values()
      );
      
      // If we filtered out any duplicates, log a warning
      if (uniqueAlerts.length < response.alerts.length) {
        console.warn(`Filtered out ${response.alerts.length - uniqueAlerts.length} duplicate alert(s) in initial load`);
      }
      
      // Don't redirect if not authenticated
      if (!isAuthenticated) {
        // Ensure we only show 3 alerts max for non-authenticated users
        setAlerts(uniqueAlerts.slice(0, 3));
      } else {
        setAlerts(uniqueAlerts);
      }
      
      setTotalCount(response.totalCount);
      setHasMore(isAuthenticated && uniqueAlerts.length < response.totalCount);
      setPage(1);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch alerts',
        severity: 'error'
      });
      setAlerts([]);
      setTotalCount(0);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, filters]); // Only include dependencies that affect how alerts are fetched

  // Define the handleUseMyLocation function with useCallback
  const handleUseMyLocation = useCallback(async () => {
    setLocationLoading(true);
    setLocationError(null);
    
    try {
      // First attempt with high accuracy
      const position = await getHighAccuracyLocation(true);
      await handleLocationSuccess(position, true);
    } catch (error) {
      console.error('Error in handleUseMyLocation:', error);
      try {
        // Fall back to low accuracy if high accuracy fails
        const position = await getHighAccuracyLocation(false);
        await handleLocationSuccess(position, false);
      } catch (error) {
        const geolocationError = error as GeolocationPositionError;
        handleLocationError(geolocationError);
      }
    } finally {
      setLocationLoading(false);
    }
  }, [/* eslint-disable-line react-hooks/exhaustive-deps */]); // Dependency array is empty to avoid circular dependencies with handleLocationSuccess and handleLocationError

  useEffect(() => {
    // Check if we have stored location
    const storedCity = localStorage.getItem('selectedCity');
    const storedLat = localStorage.getItem('selectedLat');
    const storedLng = localStorage.getItem('selectedLng');
    
    if (storedCity && storedLat && storedLng) {
      setCity(storedCity);
      setCoords({
        latitude: parseFloat(storedLat),
        longitude: parseFloat(storedLng)
      });
      setLocationConfirmed(true);
      fetchLocationAlerts(storedCity, {
        latitude: parseFloat(storedLat),
        longitude: parseFloat(storedLng)
      });
    } else {
      handleUseMyLocation();
    }
  }, [fetchLocationAlerts, handleUseMyLocation]);

  const handleFollowUpdate = async (alertId: string) => {
    if (!isAuthenticated) {
      // Show login dialog if not authenticated
      setLoginDialogOpen(true);
      return;
    }

    try {
      const response = await followAlert(alertId);
      
      // Use the functional state update to ensure we're working with the latest state
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alert._id === alertId ? 
            { 
              ...alert, 
              numberOfFollows: response.numberOfFollows, 
              isFollowing: response.following 
            } : 
            alert
        )
      );
      
      setSnackbar({
        open: true,
        message: response.following ? 'You are now following this alert' : 'You have unfollowed this alert',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error following alert:', error);
      setSnackbar({
        open: true,
        message: 'Failed to follow the alert',
        severity: 'error'
      });
    }
  };

  const formatTime = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays}d ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}m ago`;
  };

  const getHighAccuracyLocation = (highAccuracy = true) => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      const options = {
        enableHighAccuracy: highAccuracy,
        timeout: 10000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(error),
        options
      );
    });
  };

  const handleLocationSuccess = async (position: GeolocationPosition, highAccuracy = true) => {
    const { latitude, longitude } = position.coords;
    const accuracy = position.coords.accuracy;
    
    // Store the location accuracy for potential warnings
    setLocationAccuracy(accuracy);
    
    // Show low accuracy warning if accuracy is worse than 100 meters
    const hasLowAccuracy = accuracy > 100;
    if (!highAccuracy || hasLowAccuracy) {
      setLowAccuracyWarning(true);
    }
    
    try {
      const cityName = await getCityFromCoordinates(latitude, longitude);
      
      // Store location in localStorage
      localStorage.setItem('selectedCity', cityName);
      localStorage.setItem('selectedLat', latitude.toString());
      localStorage.setItem('selectedLng', longitude.toString());
      localStorage.setItem('locationAccuracy', accuracy.toString());
      
      setCity(cityName);
      setCoords({ latitude, longitude });
      setLocationConfirmed(true);
      
      // Fetch alerts for this location
      fetchLocationAlerts(cityName, { latitude, longitude });
      
    } catch (error) {
      setLocationError('Failed to get your city name. Please try again or select a city manually.');
      console.error('Error in reverse geocoding:', error);
    }
  };

  const handleLocationError = (error: GeolocationPositionError) => {
    console.error('Geolocation error:', error);
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        setLocationError("You denied access to your location. Please enable location services or select a city manually.");
        break;
      case error.POSITION_UNAVAILABLE:
        setLocationError("Location information is unavailable. Please try again or select a city manually.");
        break;
      case error.TIMEOUT:
        setLocationError("The request to get your location timed out. Please try again or select a city manually.");
        break;
      default:
        setLocationError("An unknown error occurred while getting your location. Please try again or select a city manually.");
    }
  };

  const handleSelectEdinburgh = () => {
    const edinburghCoords = { latitude: 55.9533, longitude: -3.1883 };
    localStorage.setItem('selectedCity', 'Edinburgh');
    localStorage.setItem('selectedLat', edinburghCoords.latitude.toString());
    localStorage.setItem('selectedLng', edinburghCoords.longitude.toString());
    
    setCity('Edinburgh');
    setCoords(edinburghCoords);
    setLocationConfirmed(true);
    fetchLocationAlerts('Edinburgh', edinburghCoords);
  };

  const handleContinueWithLocation = () => {
    setLocationConfirmed(true);
    if (city && coords) {
      fetchLocationAlerts(city, coords);
    }
  };

  const handleResetLocation = () => {
    setLocationConfirmed(false);
    setCity(null);
    setCoords(null);
    localStorage.removeItem('selectedCity');
    localStorage.removeItem('selectedLat');
    localStorage.removeItem('selectedLng');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleCloseLoginDialog = () => {
    setLoginDialogOpen(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  const handleLoadMore = () => {
    if (isAuthenticated) {
      loadMoreAlerts();
    } else {
      setLoginDialogOpen(true);
    }
  };


  const loadMoreAlerts = async () => {
    if (!hasMore || loading || !isAuthenticated) return;
    
    const nextPage = page + 1;
    setLoading(true);
    
    try {
      const params: Record<string, unknown> = {
        page: nextPage,
        limit: 10,
        sortBy: filters.sortBy,
      };
      
      // Add time range filter if not set to "All Time"
      // This now filters based on the alert's expected start/end date
      if (filters.timeRange > 0) {
        // Current date as the reference point
        const now = new Date();
        
        // For filtering, we want to include alerts:
        // 1. That are expected to be active now or in the future
        // 2. Up to 'timeRange' days from now
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + filters.timeRange);
        
        // Use as start date for the filter (now)
        params.startDate = now.toISOString();
        // Use as end date for the filter (future)
        params.endDate = futureDate.toISOString();
      }
      
      // Add incident type filters if selected
      if (filters.incidentTypes && filters.incidentTypes.length > 0) {
        params.incidentTypes = filters.incidentTypes;
      }
      
      // Add location parameters
      if (coords) {
        params.latitude = coords.latitude;
        params.longitude = coords.longitude;
        if (filters.distance && filters.distance > 0) {
          params.distance = filters.distance; // in km
        }
      } else if (city) {
        params.city = city;
      }
      
      const response = await fetchAlerts(params);
      
      // Create a map of current alerts by ID for fast lookup
      const alertMap = new Map(alerts.map(alert => [alert._id, alert]));
      
      // Only add alerts that don't already exist in our current list
      const newUniqueAlerts = response.alerts.filter(alert => !alertMap.has(alert._id));
      
      // If we received duplicates, log a warning
      if (newUniqueAlerts.length < response.alerts.length) {
        console.warn(`Filtered out ${response.alerts.length - newUniqueAlerts.length} duplicate alert(s)`);
      }
      
      // Update state with combined unique alerts
      setAlerts(prevAlerts => [...prevAlerts, ...newUniqueAlerts]);
      setHasMore(alerts.length + newUniqueAlerts.length < response.totalCount);
      setPage(nextPage);
    } catch (error) {
      console.error('Error loading more alerts:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load more alerts',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    setIsFilterDrawerOpen(false);
    // Refetch alerts with new filters
    if (city && coords) {
      fetchLocationAlerts(city, coords);
    } else if (city) {
      fetchLocationAlerts(city);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      sortBy: 'newest',
      incidentTypes: [],
      timeRange: 0,
      distance: 50
    });
  };

  const getCityFromCoordinates = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
      );
      const data = await response.json();
      
      if (data.address) {
        // Try to get the city, town, or village name
        return data.address.city || data.address.town || data.address.village || 'Unknown location';
      }
      return 'Unknown location';
    } catch (error) {
      console.error('Error getting location name:', error);
      return 'Unknown location';
    }
  };

  if (!locationConfirmed) {
    return (
      <Layout>
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
            Choose Your Location
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
            For a personalized experience, please share your location or select a city
          </Typography>
          
          {locationError && (
            <MuiAlert severity="error" sx={{ mb: 3, width: '100%', maxWidth: 500 }}>
              {locationError}
            </MuiAlert>
          )}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', maxWidth: 500 }}>
            <Button
              variant="contained"
              onClick={handleUseMyLocation}
              disabled={locationLoading}
              startIcon={locationLoading && <CircularProgress size={20} color="inherit" />}
              sx={{
                bgcolor: 'black',
                color: 'white',
                '&:hover': { bgcolor: '#333' },
                py: 1.5,
                borderRadius: 3
              }}
            >
              {locationLoading ? 'Getting location...' : 'Use my current location'}
            </Button>
            
            <Button
              variant="outlined"
              onClick={handleSelectEdinburgh}
              sx={{
                borderColor: 'black',
                color: 'black',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                py: 1.5,
                borderRadius: 3
              }}
            >
              Edinburgh (Demo City)
            </Button>
            
            {city && coords && (
              <Button
                variant="contained"
                onClick={handleContinueWithLocation}
                sx={{
                  bgcolor: 'black',
                  color: 'white',
                  '&:hover': { bgcolor: '#333' },
                  py: 1.5,
                  borderRadius: 3,
                  mt: 2
                }}
              >
                Continue with {city}
              </Button>
            )}
          </Box>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout onFilterOpen={() => setIsFilterDrawerOpen(true)}>
      <Box sx={{ p: 2, maxWidth: 800, mx: 'auto' }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Alerts near {city}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {totalCount} alerts
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <button
              onClick={handleResetLocation}
              style={{
                border: '1px solid black',
                color: 'black',
                height: '40px',
                width: '40px',
                padding: '5px',
                borderRadius: '8px',
                backgroundColor: 'transparent',
              }}
            >
              <i className="ri-map-pin-5-line"> </i>
            </button>
          </Box>
        </Box>
        
        {/* Low Accuracy Warning Dialog */}
        <Dialog
          open={lowAccuracyWarning}
          onClose={() => setLowAccuracyWarning(false)}
          fullScreen={fullScreen}
          PaperProps={{
            sx: {
              borderRadius: 2,
              maxWidth: '500px',
              width: '100%'
            }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            py: 2
          }}>
            <i className="ri-radar-line" style={{ color: '#000', fontSize: '24px' }}></i>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#000' }}>
              Improve Location Accuracy
            </Typography>
          </DialogTitle>
          
          <DialogContent sx={{ px: 3, pt: 3, pb: 1 }}>
            <Typography variant="body1" sx={{ my: 3 }}>
              We detected that your location accuracy is {locationAccuracy ? `approximately ${Math.round(locationAccuracy)} meters` : 'lower than optimal'}.
            </Typography>
            
            <Typography variant="subtitle1" sx={{ fontWeight: 600}}>
              How to improve location accuracy:
            </Typography>
            
            <List sx={{ mb: 2 }}>
              <ListItem sx={{ px: 0}}>
                <ListItemText 
                  primary="Move to an open area away from buildings" 
                  secondary="Tall structures can interfere with GPS signals"
                />
              </ListItem>
              
              <ListItem sx={{ px: 0}}>
                <ListItemText 
                  primary="Enable high-accuracy mode in settings" 
                  secondary="In your device settings, ensure location is set to high-accuracy mode"
                />
              </ListItem>
              
              <ListItem sx={{ px: 0}}>
                <ListItemText 
                  primary="Connect to Wi-Fi if possible" 
                  secondary="Wi-Fi connections can help improve location accuracy"
                />
              </ListItem>
              
              <ListItem sx={{ px: 0}}>
  <ListItemText
    primary="Try restarting your location services"
    secondary="Turn location off and on again in your device settings"
  />
</ListItem>
            </List>
          </DialogContent>
          
          <DialogActions sx={{ px: 3, pb: 3, pt: 1, flexDirection: {xs: 'row', sm: 'row'}, gap: 1 }}>
            <Button 
              fullWidth={fullScreen}
              variant="outlined" 
              onClick={() => {
                setLowAccuracyWarning(false);
                handleUseMyLocation();
              }}
              sx={{ 
                borderColor: '#000',
                color: '#000',
                order: {xs: 2, sm: 1}
              }}
            >
              Try Again
            </Button>
            <Button 
              fullWidth={fullScreen}
              variant="contained" 
              onClick={() => setLowAccuracyWarning(false)} 
              sx={{ 
                bgcolor: '#000',
                color: 'white',
                order: {xs: 1, sm: 2}
              }}
            >
              Continue Anyway
            </Button>
          </DialogActions>
        </Dialog>

        {/* Alerts List */}
        {loading && alerts.length === 0 ? (
          // Skeleton loading
          Array.from(new Array(3)).map((_, index) => (
            <Paper key={index} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', mb: 1 }}>
                <Skeleton variant="text" width="70%" />
              </Box>
              <Box sx={{ display: 'flex', mb: 2, gap: 1 }}>
                <Skeleton variant="text" width="15%" />
                <Skeleton variant="text" width="25%" />
                <Skeleton variant="text" width="20%" />
              </Box>
              <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Skeleton variant="text" width={100} />
                <Skeleton variant="rectangular" width={120} height={30} />
              </Box>
            </Paper>
          ))
        ) : alerts.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <i className="ri-file-list-3-line" style={{ fontSize: 48, color: '#ccc' }}></i>
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              No alerts found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              There are no safety alerts in this area yet. Change your location or filters to see more results.
            </Typography>
          </Paper>
        ) : (
          <>
            {alerts.map((alert: AlertType, index: number) => (
              <Paper key={`alert-${alert._id}-${index}`} sx={{ py: 0.5, borderRadius: 2, boxShadow: 'none' }}>
                {/* Alert Header */}
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  {alert.title || "Road Closures in 48h : Fringe Festival Protest"}
                </Typography>
                
                {/* Alert Metadata */}
                <Box sx={{ display: 'flex', gap: 1, color: 'text.secondary', fontSize: '0.85rem', mb: 0.5 }}>
                  <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                    <i className="ri-bus-2-line" style={{ fontSize: '1rem', marginRight: '4px' }}></i>
                    {alert.alertCategory || "Transport"}
                  </Box>
                  <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                    <i className="ri-map-pin-line" style={{ fontSize: '1rem', marginRight: '4px' }}></i>
                    {alert.city || "Princess Street"}
                  </Box>
                  <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                    <i className="ri-time-line" style={{ fontSize: '1rem', marginRight: '4px' }}></i>
                    {alert.createdAt ? formatTime(alert.createdAt) : "26h"}
                  </Box>
                </Box>
                
                {/* Alert Content - Combined description and recommended action */}
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {alert.description || "Roads closures expected, resulting in delayed check-ins."}
                  {alert.recommendedAction && ` ${alert.recommendedAction}`}
                </Typography>
                
                {/* Risk Level Box - conditionally shown */}
                {(alert.risk && isAuthenticated) && (
                  <Box 
                    sx={{ 
                      p: 1.5, 
                      mb: 2, 
                      bgcolor: '#e5f7f0', 
                      borderRadius: 1,
                      color: '#00855b',
                      fontWeight: 500,
                      fontSize: '0.85rem'
                    }}
                  >
                    Risk level escalated – Prepare for further disruption.
                  </Box>
                )}
                
                {/* Update Time and Follow Text */}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                    Updated {formatTime(alert.updatedAt || alert.createdAt)}
                  </Typography>
                  
                  {/* Use text with bell icon instead of button */}
                  <Box 
                    onClick={() => handleFollowUpdate(alert._id)}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 0.5,
                      cursor: 'pointer',
                      color: alert.isFollowing ? 'primary.main' : 'text.secondary',
                      fontWeight: alert.isFollowing ? 500 : 400,
                      '&:hover': { color: 'primary.main' }
                    }}
                  >
                    <i className={alert.isFollowing ? "ri-notification-3-fill" : "ri-notification-3-line"} 
                       style={{ fontSize: '1.1rem' }} />
                    <Typography variant="body2">
                      {alert.isFollowing ? 'Following' : 'Follow Updates'}
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 1 }} />
              </Paper>
            ))}
            
            {/* Login to view more alert - for non-logged in users */}
            {!isAuthenticated && alerts.length > 0 && (
              <Box 
                sx={{ 
                  textAlign: 'center', 
                  p: 1, 
                  bgcolor: 'rgb(238, 238, 238)',
                  borderRadius: 5,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'rgb(220, 220, 220)'
                  }
                }}
                onClick={handleLogin}
              >
                <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600, borderRadius: 4 }}>
                  Login to view updates of the alerts!
                </Typography>
              </Box>
            )}
            
            {/* Load more button - only for logged in users */}
            {hasMore && isAuthenticated && (
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Button 
                  variant="outlined"
                  onClick={handleLoadMore}
                  disabled={loading}
                  startIcon={loading && <CircularProgress size={20} />}
                  sx={{
                    borderColor: 'black',
                    color: 'black',
                    borderRadius: 2,
                    px: 4,
                    py: 1
                  }}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>
      
      {/* Filter Drawer */}
      <FilterDrawer
        open={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        resultCount={totalCount}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
      />
      
      {/* Login Dialog */}
      <Dialog
        open={loginDialogOpen}
        onClose={handleCloseLoginDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxWidth: '380px',
            width: '100%'
          }
        }}
      >
        <DialogContent sx={{ p: 3, textAlign: 'center' }}>
          <Box sx={{ mb: 2 }}>
            <Image 
              src="/images/login-alert.png" 
              alt="Login required" 
              width={120} 
              height={120} 
              style={{ margin: '0 auto' }}
            />
          </Box>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 500, fontSize: '20px' }}>
            Login in to view updates of the alerts!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontSize: '14px' }}>
            Please sign in to track disruptions and receive personalized notifications.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleLogin}
              sx={{
                bgcolor: 'black',
                color: 'white',
                '&:hover': { bgcolor: '#333' },
                py: 1.2,
                borderRadius: 2
              }}
            >
              Login Now
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleCloseLoginDialog}
              sx={{
                borderColor: 'divider',
                color: 'text.primary',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                py: 1.2,
                borderRadius: 2
              }}
            >
              Cancel
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Layout>
  );
} 