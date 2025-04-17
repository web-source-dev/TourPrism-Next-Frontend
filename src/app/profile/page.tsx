'use client';

import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Tab, Tabs, Container, CircularProgress, Alert, Button } from '@mui/material';
import { User } from '@/types';
import PersonalInfoTab from '@/components/profile/PersonalInfoTab';
import CompanyInfoTab from '@/components/profile/CompanyInfoTab';
import AccountSettingsTab from '@/components/profile/AccountSettingsTab';
import PreferencesTab from '@/components/profile/PreferencesTab';
import { getUserProfile } from '@/services/api';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';

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
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `profile-tab-${index}`,
    'aria-controls': `profile-tabpanel-${index}`,
  };
}

export default function ProfilePage() {
  const [value, setValue] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await getUserProfile();
      console.log('Fetched user profile:', userData);
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setError('Failed to load profile. Please try again later.');
      // Only redirect to login if it's an authentication error
      if (error instanceof Error && (error.toString().includes('401') || error.toString().includes('auth'))) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchUserProfile();
  }, []);


  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleUserUpdate = (updatedUser: User) => {
    console.log('User updated, setting new user data:', updatedUser);
    setUser(updatedUser);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl">
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
          <Button 
            onClick={fetchUserProfile} 
            sx={{ ml: 2 }}
            variant="outlined"
            size="small"
          >
            Retry
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="xl">
        <Typography variant="h5" color="error" sx={{ mt: 4, textAlign: 'center' }}>
          Unable to load profile. Please sign in again.
        </Typography>
      </Container>
    );
  }

  return (
    <Layout isFooter={false}>
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 3, backgroundColor: 'primary.main', color: 'white' }}>
          <Typography variant="h4" component="h1">
            User Profile
          </Typography>
          <Typography variant="subtitle1">
            Manage your personal information and account settings
          </Typography>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={value} 
            onChange={handleChange} 
            aria-label="profile tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Personal Info" {...a11yProps(0)} />
            <Tab label="Company Info" {...a11yProps(1)} />
            <Tab label="Account Settings" {...a11yProps(2)} />
            <Tab label="Preferences" {...a11yProps(3)} />
          </Tabs>
        </Box>

        <TabPanel value={value} index={0}>
          <PersonalInfoTab user={user} onUpdate={handleUserUpdate} />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <CompanyInfoTab user={user} onUpdate={handleUserUpdate} />
        </TabPanel>
        <TabPanel value={value} index={2}>
          <AccountSettingsTab />
        </TabPanel>
        <TabPanel value={value} index={3}>
          <PreferencesTab user={user} onUpdate={handleUserUpdate} />
        </TabPanel>
      </Paper>
    </Container>
    </Layout>
  );
}
