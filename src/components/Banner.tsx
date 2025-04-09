'use client';

import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';

const Banner = () => {
  const router = useRouter();

  const handleProfileClick = () => {
    router.push('/profile');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F7FF',
        padding: '10px',
        borderRadius: '5px',
        margin: '0 auto 0 auto',
        maxWidth: { xs: '95%', sm: '90%', md: '85%' },
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        gap: 2
      }}
    >
      <Typography variant="body1" sx={{ color: '#0066FF' }}>
        Complete your profile to get personalized Alerts
      </Typography>
      <Button
        variant="contained"
        size="small"
        onClick={handleProfileClick}
        sx={{
          backgroundColor: '#0066FF',
          borderRadius: '20px',
          '&:hover': {
            backgroundColor: '#0055DD',
          }
        }}
      >
        Update Profile
      </Button>
    </Box>
  );
};

export default Banner;
