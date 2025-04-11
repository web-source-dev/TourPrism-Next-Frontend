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
  const [locationConfirmed, setLocationConfirmed] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [city, setCity] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
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
        limit: isAuthenticated ? 10 : 3,
        sortBy: filters.sortBy,
      };
      if (filters.timeRange > 0) {
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + filters.timeRange);
        
        params.startDate = now.toISOString();
        params.endDate = futureDate.toISOString();
      }
      
      if (filters.incidentTypes && filters.incidentTypes.length > 0) {
        params.incidentTypes = filters.incidentTypes;
      }
      
      if (coordinates) {
        params.latitude = coordinates.latitude;
        params.longitude = coordinates.longitude;
        if (filters.distance && filters.distance > 0) {
          params.distance = filters.distance;
        }
      } else if (cityName) {
        params.city = cityName;
      }
      
      console.log('Fetching alerts with params:', params);
      const response = await fetchAlerts(params);
      
      const uniqueAlerts = Array.from(
        new Map(response.alerts.map(alert => [alert._id, alert])).values()
      );
      
      if (uniqueAlerts.length < response.alerts.length) {
        console.warn(`Filtered out ${response.alerts.length - uniqueAlerts.length} duplicate alert(s) in initial load`);
      }
      
      if (!isAuthenticated) {
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
  }, [isAuthenticated, filters]);

  const handleUseMyLocation = useCallback(async () => {
    setLocationLoading(true);
    setLocationError(null);

    try {
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
  }, []); 

 
  const handleSelectEdinburgh = useCallback(() => {
    const edinburghCoords = { latitude: 55.9533, longitude: -3.1883 };
    
    localStorage.setItem('selectedCity', 'Edinburgh');
    localStorage.setItem('selectedLat', edinburghCoords.latitude.toString());
    localStorage.setItem('selectedLng', edinburghCoords.longitude.toString());

    setCity('Edinburgh');
    setCoords(edinburghCoords);
    setLocationConfirmed(true);
    
    fetchLocationAlerts('Edinburgh', edinburghCoords);
  }, [fetchLocationAlerts])

  useEffect(() => {
    // Check if we have stored location
    const storedCity = localStorage.getItem('selectedCity');
    const storedLat = localStorage.getItem('selectedLat');
    const storedLng = localStorage.getItem('selectedLng');

    if (storedCity && storedLat && storedLng) {
      // Use stored location if available
      setCity(storedCity);
      setCoords({
        latitude: parseFloat(storedLat),
        longitude: parseFloat(storedLng)
      });
      setLocationConfirmed(true);
    } else {
      handleSelectEdinburgh();
    }
  }, [handleSelectEdinburgh]);

  useEffect(() => {
    if (locationConfirmed && city && coords) {
      fetchLocationAlerts(city, coords);
    }
  }, [city, coords, locationConfirmed, isAuthenticated, fetchLocationAlerts]);

  const handleFollowUpdate = async (alertId: string) => {
    if (!isAuthenticated) {
      setLoginDialogOpen(true);
      return;
    }

    try {
      const response = await followAlert(alertId);
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
      localStorage.setItem('selectedCity', cityName);
      localStorage.setItem('selectedLat', latitude.toString());
      localStorage.setItem('selectedLng', longitude.toString());
      localStorage.setItem('locationAccuracy', accuracy.toString());

      setCity(cityName);
      setCoords({ latitude, longitude });
      setLocationConfirmed(true);

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

  const handleContinueWithLocation = () => {
    if (!city || !coords) {
      handleSelectEdinburgh();
      return;
    }
    
    localStorage.setItem('selectedCity', city);
    localStorage.setItem('selectedLat', coords.latitude.toString());
    localStorage.setItem('selectedLng', coords.longitude.toString());
    
    // Confirm location and fetch alerts
    setLocationConfirmed(true);
    fetchLocationAlerts(city, coords);
  };

  const handleResetLocation = () => {
    if (!isAuthenticated) {
      setLoginDialogOpen(true);
      return;
    }
    setLocationConfirmed(false);
    
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
      if (filters.timeRange > 0) {
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + filters.timeRange);

        params.startDate = now.toISOString();
        params.endDate = futureDate.toISOString();
      }
      if (filters.incidentTypes && filters.incidentTypes.length > 0) {
        params.incidentTypes = filters.incidentTypes;
      }
      if (coords) {
        params.latitude = coords.latitude;
        params.longitude = coords.longitude;
        if (filters.distance && filters.distance > 0) {
          params.distance = filters.distance;
        }
      } else if (city) {
        params.city = city;
      }

      const response = await fetchAlerts(params);
      const alertMap = new Map(alerts.map(alert => [alert._id, alert]));
      const newUniqueAlerts = response.alerts.filter(alert => !alertMap.has(alert._id));
      if (newUniqueAlerts.length < response.alerts.length) {
        console.warn(`Filtered out ${response.alerts.length - newUniqueAlerts.length} duplicate alert(s)`);
      }

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
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
            {city ? 'Change Your Location' : 'Choose Your Location'}
          </Typography>

          <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
            {city 
              ? `Currently showing alerts for ${city}. Select a new location or continue with the current one.`
              : 'To show relevant alerts, please select a location.'
            }
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
              Use Edinburgh as location
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
    <Layout onFilterOpen={() => isAuthenticated ? setIsFilterDrawerOpen(true) : setLoginDialogOpen(true)}>
      <Box sx={{ px: 2, maxWidth: 1500, mx: 'auto' }}>
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
                cursor: 'pointer',
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

            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              How to improve location accuracy:
            </Typography>

            <List sx={{ mb: 2 }}>
              <ListItem sx={{ px: 0 }}>
                <ListItemText
                  primary="Move to an open area away from buildings"
                  secondary="Tall structures can interfere with GPS signals"
                />
              </ListItem>

              <ListItem sx={{ px: 0 }}>
                <ListItemText
                  primary="Enable high-accuracy mode in settings"
                  secondary="In your device settings, ensure location is set to high-accuracy mode"
                />
              </ListItem>

              <ListItem sx={{ px: 0 }}>
                <ListItemText
                  primary="Connect to Wi-Fi if possible"
                  secondary="Wi-Fi connections can help improve location accuracy"
                />
              </ListItem>

              <ListItem sx={{ px: 0 }}>
                <ListItemText
                  primary="Try restarting your location services"
                  secondary="Turn location off and on again in your device settings"
                />
              </ListItem>
            </List>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3, pt: 1, flexDirection: { xs: 'row', sm: 'row' }, gap: 1 }}>
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
                order: { xs: 2, sm: 1 }
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
                order: { xs: 1, sm: 2 }
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
              <Paper key={`alert-${alert._id}-${index}`} sx={{ py: 0.5,bgcolor:'#f5f5f5', borderRadius: 2, boxShadow: 'none' }}>
                {/* Alert Header */}
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  {alert.title || ""}
                </Typography>

                {/* Alert Metadata */}
                <Box sx={{ display: 'flex', gap: 1, color: 'text.secondary', fontSize: '0.85rem', mb: 0.5 }}>
                  <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6.83301 11.6667C6.83301 11.3905 7.05687 11.1667 7.33301 11.1667H8.66634C8.94248 11.1667 9.16634 11.3905 9.16634 11.6667C9.16634 11.9428 8.94248 12.1667 8.66634 12.1667H7.33301C7.05687 12.1667 6.83301 11.9428 6.83301 11.6667Z" fill="#757575"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M2.91761 2.67407C3.75577 1.92294 5.42033 0.833336 7.99972 0.833336C10.5791 0.833336 12.2437 1.92294 13.0818 2.67407L13.0961 2.68683C13.3284 2.89495 13.5142 3.06136 13.6737 3.41847C13.8336 3.77651 13.8334 4.08864 13.8331 4.47216L13.8331 9.36992C13.8331 10.2816 13.8331 11.0165 13.7554 11.5945C13.6747 12.1946 13.5021 12.6998 13.1008 13.1011C12.7539 13.448 12.3294 13.624 11.833 13.7174V14.6667C11.833 14.9428 11.6091 15.1667 11.333 15.1667C11.0569 15.1667 10.833 14.9428 10.833 14.6667V13.8162C10.4068 13.8334 9.92052 13.8333 9.36964 13.8333H6.62981C6.07888 13.8333 5.59252 13.8334 5.16634 13.8162V14.6667C5.16634 14.9428 4.94248 15.1667 4.66634 15.1667C4.3902 15.1667 4.16634 14.9428 4.16634 14.6667V13.7174C3.67002 13.624 3.24548 13.448 2.89862 13.1011C2.49734 12.6998 2.32475 12.1946 2.24407 11.5945C2.16636 11.0165 2.16637 10.2816 2.16639 9.36992L2.16636 4.47216C2.16608 4.08864 2.16585 3.77651 2.32577 3.41847C2.48526 3.06136 2.67103 2.89495 2.90337 2.68683L2.91761 2.67407ZM7.99972 1.83334C5.72617 1.83334 4.28951 2.78743 3.58499 3.41879C3.55125 3.44902 3.52146 3.47582 3.49497 3.5L12.5045 3.5C12.478 3.47582 12.4482 3.44902 12.4145 3.41879C11.7099 2.78743 10.2733 1.83334 7.99972 1.83334ZM3.16639 4.5L3.16639 8.94459L3.1926 8.95078C3.4498 9.0113 3.82554 9.09259 4.29396 9.17405C5.23183 9.33716 6.53565 9.49999 7.99995 9.49999C9.46425 9.49999 10.7681 9.33716 11.7059 9.17405C12.1744 9.09259 12.5501 9.0113 12.8073 8.95078L12.8331 8.9447L12.833 4.5L3.16639 4.5ZM12.832 9.97095C12.5786 10.0273 12.2563 10.0933 11.8773 10.1593C10.8985 10.3295 9.53565 10.5 7.99995 10.5C6.46425 10.5 5.10141 10.3295 4.12261 10.1593C3.74334 10.0933 3.42091 10.0272 3.16746 9.97084C3.16991 10.448 3.17795 10.8385 3.20421 11.1667H3.99967C4.27582 11.1667 4.49967 11.3905 4.49967 11.6667C4.49967 11.9428 4.27582 12.1667 3.99967 12.1667H3.43544C3.48464 12.256 3.54126 12.3295 3.60573 12.394C3.79024 12.5785 4.04928 12.6988 4.53847 12.7646C5.04204 12.8323 5.70944 12.8333 6.66639 12.8333H9.33306C10.29 12.8333 10.9574 12.8323 11.461 12.7646C11.9502 12.6988 12.2092 12.5785 12.3937 12.394C12.4582 12.3295 12.5148 12.256 12.564 12.1667H11.9997C11.7235 12.1667 11.4997 11.9428 11.4997 11.6667C11.4997 11.3905 11.7235 11.1667 11.9997 11.1667H12.7952C12.8215 10.8386 12.8295 10.4481 12.832 9.97095Z" fill="#757575"/>
<path d="M1.33301 5.5C1.60915 5.5 1.83301 5.72386 1.83301 6L1.83301 6.66667C1.83301 6.94281 1.60915 7.16667 1.33301 7.16667C1.05687 7.16667 0.833008 6.94281 0.833008 6.66667L0.833008 6C0.833008 5.72386 1.05687 5.5 1.33301 5.5Z" fill="#757575"/>
<path d="M15.1663 6C15.1663 5.72386 14.9425 5.5 14.6663 5.5C14.3902 5.5 14.1663 5.72386 14.1663 6V6.66667C14.1663 6.94281 14.3902 7.16667 14.6663 7.16667C14.9425 7.16667 15.1663 6.94281 15.1663 6.66667V6Z" fill="#757575"/>
</svg>

                    {alert.alertCategory || ""}
                  </Box>
                  <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M11.167 4.66667C11.167 6.24543 10.0117 7.55436 8.50033 7.79408L8.50033 12C8.50033 12.2761 8.27647 12.5 8.00033 12.5C7.72418 12.5 7.50033 12.2761 7.50033 12L7.50033 7.79408C5.989 7.55436 4.83366 6.24543 4.83366 4.66667C4.83366 2.91777 6.25142 1.5 8.00033 1.5C9.74923 1.5 11.167 2.91777 11.167 4.66667ZM8.00033 2.5C6.80371 2.5 5.83366 3.47005 5.83366 4.66667C5.83366 5.86328 6.80371 6.83333 8.00033 6.83333C9.19694 6.83333 10.167 5.86328 10.167 4.66667C10.167 3.47005 9.19694 2.5 8.00033 2.5Z" fill="#757575"/>
<path d="M5.16699 12.6667C5.16699 12.3905 4.94313 12.1667 4.66699 12.1667C4.39085 12.1667 4.16699 12.3905 4.16699 12.6667C4.16699 13.0325 4.35443 13.3305 4.58539 13.5489C4.81529 13.7664 5.12114 13.9391 5.45761 14.0737C6.13332 14.344 7.03253 14.5 8.00033 14.5C8.96813 14.5 9.86733 14.344 10.543 14.0737C10.8795 13.9391 11.1854 13.7664 11.4153 13.5489C11.6462 13.3305 11.8337 13.0325 11.8337 12.6667C11.8337 12.3905 11.6098 12.1667 11.3337 12.1667C11.0575 12.1667 10.8337 12.3905 10.8337 12.6667C10.8337 12.6697 10.8338 12.7225 10.7282 12.8224C10.6207 12.924 10.4384 13.0385 10.1717 13.1452C9.64094 13.3575 8.87347 13.5 8.00033 13.5C7.12718 13.5 6.35971 13.3575 5.829 13.1452C5.56225 13.0385 5.37994 12.924 5.2725 12.8224C5.16686 12.7225 5.16699 12.6697 5.16699 12.6667Z" fill="#757575"/>
</svg>

                    {alert.city || "EdinBurgh"}
                  </Box>
                  <Box component="span" sx={{ display: 'flex', alignItems: 'center',gap: 0.5 }}>
                    
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8.49967 5.33334C8.49967 5.05719 8.27582 4.83334 7.99967 4.83334C7.72353 4.83334 7.49967 5.05719 7.49967 5.33334V8C7.49967 8.13261 7.55235 8.25979 7.64612 8.35356L8.97945 9.68689C9.17472 9.88215 9.4913 9.88215 9.68656 9.68689C9.88182 9.49163 9.88182 9.17505 9.68656 8.97978L8.49967 7.7929V5.33334Z" fill="#757575"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M7.99967 0.833336C4.04163 0.833336 0.833008 4.04196 0.833008 8C0.833008 11.958 4.04163 15.1667 7.99967 15.1667C11.9577 15.1667 15.1663 11.958 15.1663 8C15.1663 4.04196 11.9577 0.833336 7.99967 0.833336ZM1.83301 8C1.83301 4.59425 4.59392 1.83334 7.99967 1.83334C11.4054 1.83334 14.1663 4.59425 14.1663 8C14.1663 11.4058 11.4054 14.1667 7.99967 14.1667C4.59392 14.1667 1.83301 11.4058 1.83301 8Z" fill="#757575"/>
</svg>

                    {alert.createdAt ? formatTime(alert.createdAt) : ""}
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {alert.description || ""}
                  {alert.recommendedAction && ` ${alert.recommendedAction}`}
                </Typography>
                {(alert.risk && isAuthenticated) && (
                  <Box
                    sx={{
                      p: 1.5,
                      mb: 2,
                      bgcolor:
                        alert.risk === 'Low' ? '#e6f4ea' :
                          alert.risk === 'Medium' ? '#fff4e5' :
                            alert.risk === 'High' ? '#fdecea' :
                            alert.risk === 'Critical' ? '#fbe9e7' :
                              'transparent',
                      borderRadius: 1,
                      color:
                        alert.risk === 'Low' ? '#00855b' :
                          alert.risk === 'Medium' ? '#c17e00' :
                            alert.risk === 'High' ? '#d32f2f' :
                            alert.risk === 'Critical' ? '#b71c1c' : 
                              'inherit',
                      fontWeight: 500,
                      fontSize: '0.85rem',
                    }}
                  >
                   {alert.risk} : {alert.impact}
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
                    {alert.isFollowing ? (
                      <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M6.99968 0.833374C4.02913 0.833374 1.61827 3.22772 1.61825 6.18468C1.61818 6.87247 1.57193 7.39159 1.25481 7.85817C1.21072 7.9221 1.15222 8.00217 1.0883 8.08966C0.977267 8.24164 0.849859 8.41603 0.753231 8.56704C0.582689 8.83357 0.416071 9.15498 0.358792 9.5295C0.171916 10.7514 1.03338 11.5425 1.89131 11.897C2.44899 12.1274 3.04588 12.3153 3.6675 12.4606C3.6634 12.5298 3.6701 12.6008 3.68887 12.6714C4.07359 14.1191 5.42024 15.1669 6.99984 15.1669C8.57944 15.1669 9.92609 14.1191 10.3108 12.6714C10.3296 12.6008 10.3363 12.5298 10.3322 12.4606C10.9537 12.3152 11.5505 12.1273 12.108 11.897C12.966 11.5425 13.8274 10.7514 13.6406 9.5295C13.5833 9.15499 13.4167 8.83357 13.2461 8.56704C13.1495 8.41604 13.0221 8.2417 12.9111 8.08972C12.8472 8.00224 12.7887 7.92215 12.7446 7.85822C12.4274 7.39162 12.3812 6.87256 12.3811 6.18473C12.3811 3.22774 9.97023 0.833374 6.99968 0.833374ZM8.87123 12.7193C7.63997 12.8714 6.35974 12.8714 5.12847 12.7193C5.4664 13.3728 6.17059 13.8335 6.99984 13.8335C7.82911 13.8335 8.53331 13.3727 8.87123 12.7193Z" fill="black"/>
                      </svg>                      
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M8.00012 0.833328C4.95497 0.833328 2.48355 3.29418 2.48353 6.33329C2.48347 7.04018 2.43605 7.57372 2.11097 8.05325C2.06577 8.11897 2.00579 8.20127 1.94026 8.2912C1.82644 8.4474 1.69585 8.62661 1.59679 8.78182C1.42197 9.05575 1.25116 9.38609 1.19245 9.77101C1.00088 11.0268 1.88398 11.8399 2.76346 12.2042C3.4182 12.4755 4.12567 12.6894 4.86357 12.8459C5.24629 14.1929 6.51269 15.1666 7.99947 15.1666C9.48615 15.1666 10.7525 14.1931 11.1353 12.8462C11.8737 12.6896 12.5816 12.4756 13.2368 12.2042C14.1162 11.8399 14.9994 11.0268 14.8078 9.77101C14.7491 9.3861 14.5783 9.05576 14.4034 8.78182C14.3044 8.62662 14.1738 8.44741 14.06 8.29121C13.9945 8.20131 13.9345 8.11901 13.8893 8.05331C13.5642 7.57375 13.5168 7.04027 13.5167 6.33333C13.5167 3.2942 11.0453 0.833328 8.00012 0.833328ZM3.48353 6.33333C3.48353 3.84961 5.50411 1.83333 8.00012 1.83333C10.4961 1.83333 12.5167 3.84965 12.5167 6.33337C12.5168 7.05499 12.5524 7.86444 13.0627 8.61613L13.0643 8.61847C13.1482 8.74056 13.2219 8.84064 13.2913 8.93497C13.3838 9.06063 13.4688 9.17611 13.5605 9.3198C13.7026 9.54255 13.7908 9.73558 13.8192 9.92181C13.9112 10.5247 13.5266 11.0017 12.8541 11.2804C10.0014 12.4621 5.99882 12.4621 3.14618 11.2804C2.47358 11.0017 2.08904 10.5247 2.18101 9.92181C2.20942 9.73558 2.29759 9.54255 2.43975 9.3198C2.53145 9.17611 2.61643 9.06065 2.70891 8.935C2.77824 8.8408 2.85215 8.74036 2.93592 8.61848L2.93752 8.61613C3.44788 7.86444 3.48347 7.05495 3.48353 6.33333ZM9.9754 13.0422C8.67637 13.2082 7.32244 13.2081 6.02345 13.0421C6.40445 13.7079 7.14181 14.1666 7.99947 14.1666C8.85706 14.1666 9.59436 13.708 9.9754 13.0422Z" fill="#616161"/>
</svg>

                    )}
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
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={handleLoadMore}
                  disabled={loading}
                  startIcon={loading && <CircularProgress size={20} />}
                  sx={{
                    borderColor: 'black',
                    color: 'black',
                    borderRadius: 50,
                    px: 10,
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