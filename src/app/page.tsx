'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Container, Button, Divider, useTheme, useMediaQuery } from '@mui/material';
import { useRouter } from 'next/navigation';
import { ArrowRightAlt, DirectionsBus, Healing, SecurityOutlined } from '@mui/icons-material';
import Layout from '@/components/Layout';
import Image from 'next/image';

import { motion } from 'framer-motion';
export default function Home() {
  const router = useRouter();
  
  const handleCreateAccount = () => {
    router.push('/signup');
  };
  
  // Benefits data
  const benefitsData = [
    {
      value: '30%',
      title: 'Reduction in financial losses',
      description: 'Our proactive alerts significantly minimize costly cancellations, refunds, and rebookings.'
    },
    {
      value: '5x',
      title: 'Faster response to disruptions',
      description: 'Our one-click communication instantly alerts guests, staff, and adjusts operations.'
    },
    {
      value: '10x',
      title: 'Return on your Investment (ROI)',
      description: 'Our enterprise-grade intelligence offered at budget-friendly pricing, results in massive financial gains.'
    }
  ];

  // What We Predict data
  const predictionsData = [
    {
      title: 'Weather',
      description: 'Storms, flooding, extreme temperatures etc.',
      icon: (
        <svg viewBox="0 0 24 24" style={{ width: 30, height: 30 }}>
          <path d="M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,2L14.39,5.42C13.65,5.15 12.84,5 12,5C11.16,5 10.35,5.15 9.61,5.42L12,2M3.34,7L7.5,6.65C6.9,7.16 6.36,7.78 5.94,8.5C5.5,9.24 5.25,10 5.11,10.79L3.34,7M3.36,17L5.12,13.23C5.26,14 5.53,14.78 5.95,15.5C6.37,16.24 6.91,16.86 7.5,17.37L3.36,17M20.65,7L18.88,10.79C18.74,10 18.47,9.23 18.05,8.5C17.63,7.78 17.1,7.15 16.5,6.64L20.65,7M20.64,17L16.5,17.36C17.09,16.85 17.62,16.22 18.04,15.5C18.46,14.77 18.73,14 18.87,13.21L20.64,17M12,22L9.59,18.56C10.33,18.83 11.14,19 12,19C12.82,19 13.63,18.83 14.37,18.56L12,22Z" />
        </svg>
      )
    },
    {
      title: 'Transport',
      description: 'Delays, cancellations, rescheduling etc.',
      icon: <DirectionsBus sx={{ fontSize: 30 }} />
    },
    {
      title: 'Civil Unrest',
      description: 'Protests, riots, strikes or public disorder',
      icon: (
        <svg viewBox="0 0 24 24" style={{ width: 30, height: 30 }}>
          <path d="M12,5.5A3.5,3.5 0 0,1 15.5,9A3.5,3.5 0 0,1 12,12.5A3.5,3.5 0 0,1 8.5,9A3.5,3.5 0 0,1 12,5.5M5,8C5.56,8 6.08,8.15 6.53,8.42C6.38,9.85 6.8,11.27 7.66,12.38C7.16,13.34 6.16,14 5,14A3,3 0 0,1 2,11A3,3 0 0,1 5,8M19,8A3,3 0 0,1 22,11A3,3 0 0,1 19,14C17.84,14 16.84,13.34 16.34,12.38C17.2,11.27 17.62,9.85 17.47,8.42C17.92,8.15 18.44,8 19,8M5.5,18.25C5.5,16.18 8.41,14.5 12,14.5C15.59,14.5 18.5,16.18 18.5,18.25V20H5.5V18.25M0,20V18.5C0,17.11 1.89,15.94 4.45,15.6C3.86,16.28 3.5,17.22 3.5,18.25V20H0M24,20H20.5V18.25C20.5,17.22 20.14,16.28 19.55,15.6C22.11,15.94 24,17.11 24,18.5V20Z" />
        </svg>
      )
    },
    {
      title: 'Health',
      description: 'Health emergencies, epidemics or advisories',
      icon: <Healing sx={{ fontSize: 30 }} />
    },
    {
      title: 'Natural Disasters',
      description: 'Earthquakes, floods, wildfires etc.',
      icon: (
        <svg viewBox="0 0 24 24" style={{ width: 30, height: 30 }}>
          <path d="M12,2L1,12H3V21H21V12H23M12,5.5C14.14,5.5 15.93,7 16.35,9H14.23C13.92,8.14 13.03,7.5 12,7.5C10.76,7.5 9.75,8.31 9.75,9.5C9.75,10.69 10.76,11.5 12,11.5C13.24,11.5 14.25,10.69 14.25,9.5V9H16.35C16.86,10.35 17.57,11.57 18.42,12.5C17.57,13.43 16.86,14.65 16.35,16H14.23C13.92,15.14 13.03,14.5 12,14.5C10.76,14.5 9.75,15.31 9.75,16.5C9.75,17.69 10.76,18.5 12,18.5C13.03,18.5 13.92,17.86 14.23,17H16.35C15.93,19 14.14,20.5 12,20.5C9.24,20.5 7,18.26 7,15.5C7,13.24 8.34,11.33 10.25,10.5C8.34,9.67 7,7.76 7,5.5C7,2.74 9.24,0.5 12,0.5C14.14,0.5 15.93,2 16.35,4H14.23C13.92,3.14 13.03,2.5 12,2.5C10.76,2.5 9.75,3.31 9.75,4.5C9.75,5.69 10.76,6.5 12,6.5C13.03,6.5 13.92,5.86 14.23,5H16.35C15.93,7 14.14,8.5 12,8.5C9.24,8.5 7,6.26 7,3.5" />
        </svg>
      )
    },
    {
      title: 'General Safety',
      description: 'Crimes, scams, acts of terrorisms or xenophobia',
      icon: <SecurityOutlined sx={{ fontSize: 30 }} />
    }
  ];

  // How It Works data
  const howItWorksData = [
    {
      title: 'Setup Instantly',
      description: 'Create account, select locations, and customize disruption alerts in minutes.',
      icon: (
        <svg viewBox="0 0 24 24" style={{ width: 30, height: 30 }}>
          <path d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z" />
        </svg>
      )
    },
    {
      title: 'Start Receiving Alerts',
      description: 'Get verified disruption alerts up to 72 hours in advance.',
      icon: (
        <svg viewBox="0 0 24 24" style={{ width: 30, height: 30 }}>
          <path d="M21,19V20H3V19L5,17V11C5,7.9 7.03,5.17 10,4.29C10,4.19 10,4.1 10,4A2,2 0 0,1 12,2A2,2 0 0,1 14,4C14,4.1 14,4.19 14,4.29C16.97,5.17 19,7.9 19,11V17L21,19M14,21A2,2 0 0,1 12,23A2,2 0 0,1 10,21M19.75,3.19L18.33,4.61C20.04,6.3 21,8.6 21,11H23C23,8.07 21.84,5.25 19.75,3.19M1,11H3C3,8.6 3.96,6.3 5.67,4.61L4.25,3.19C2.16,5.25 1,8.07 1,11Z" />
        </svg>
      )
    },
    {
      title: 'Take Action with One-Click',
      description: 'Instantly notify guest, staff and adjust operations — all from a single dashboard.',
      icon: (
        <svg viewBox="0 0 24 24" style={{ width: 30, height: 30 }}>
          <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
        </svg>
      )
    }
  ];

  // FAQs data
  const faqsData = [
    {
      question: 'How does it help my travel business?',
      answer: 'We provide actionable insights in advance, helping act faster to minimise losses.'
    },
    {
      question: 'Do you offer a free trial for paid plans?',
      answer: 'Yes! You get a 1-month free trial of our premium version—no commitment, cancel anytime.'
    },
    {
      question: 'Is this only for large companies?',
      answer: 'Not at all! Our paid plans deliver enterprise-grade intelligence at SMB-friendly pricing.'
    }
  ];
  const partnersData = [
    { title: 'Innovation Partner', logo: "/images/Techscaler.png", alt: "Techscaler", name: 'Techscaler' },
    { title: 'Innovation Partner', logo: "/images/Barclays.png", alt: "Barclays Eagle Lab", name: 'Barclays Eagle Lab' },
    { title: 'Industry Partner', logo: "/images/visitScotland.png", alt: "VisitScotland", name: 'VisitScotland' },
    { title: 'Industry Partner', logo: "/images/TravelTech.png", alt: "Travel Tech for Scotland", name: 'Travel Tech for Scotland' },
    { title: 'Funding Partner', logo: "/images/Scottish.png", alt: "Scottish EDGE", name: 'Scottish EDGE' },
  ];
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // mobile = 2 per row
  const itemsPerRow = isMobile ? 2 : 3;
  const [index, setIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % partnersData.length);
        setIsAnimating(false);
      }, 600); // match the transition duration
    }, 2000);

    return () => clearInterval(interval);
  }, [partnersData.length]);

  const current = partnersData[index];
  const next = partnersData[(index + 1) % partnersData.length];

  return (
    <Layout>
      <Container>
        {/* Edinburgh Alerts Button */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          my: 8 
        }}>
          <Button
            variant="outlined"
            endIcon={<ArrowRightAlt />}
            sx={{
              borderRadius: 28,
              border: '1px solid #e0e0e0',
              color: 'black',
              px: 3,
              py: 1,
              textTransform: 'none',
              boxShadow: '0px 1px 3px rgba(0,0,0,0.1)',
              '&:hover': {
                backgroundColor: '#f5f5f5',
                borderColor: '#e0e0e0'
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#4CAF50',
                mr: 1.5
              }}
              onClick={() => router.push('/feed')}
              />
              <Typography>View Edinburgh Alerts Now</Typography>
            </Box>
          </Button>
        </Box>

        {/* Hero Section */}
        <Box sx={{
          textAlign: 'center',
          mb: 4
        }}>
          <Typography variant="h1" sx={{
            fontSize: { xs: '24px', md: '40px' },
            fontWeight: '500',
            maxWidth: '800px',
            margin: '0 auto',
            mb: 2,
            px: 2
          }}>
            Don&apos;t Let Travel Disruptions Cost Your Bookings – Act Early
          </Typography>
          <Typography variant="body1" sx={{
            color: 'text.secondary',
            mb: 3,
            px: 2
          }}>
            Prevent costly cancellations and chaos with AI-powered early warnings, uniquely tailored for your business.
          </Typography>
          <Button
            variant="contained"
            endIcon={<ArrowRightAlt />}
            onClick={handleCreateAccount}
            sx={{
              bgcolor: 'black',
              borderRadius: 2,
              py: 1,
              px: 3,
              fontSize: '14px',
              fontWeight: '500',
              textTransform: 'none',
              '&:hover': {
                bgcolor: '#333'
              }
            }}
          >
            Create Free Account
          </Button>
        </Box>

        {/* Backed by Section */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          my: 5
        }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            Backed by
          </Typography>
          <Box sx={{ 
            bgcolor: '#6d1b7b', 
            width: 24, 
            height: 24, 
            borderRadius: '4px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mr: 1
          }}>
            <Typography variant="body2" sx={{ color: 'white', fontSize: 14 }}>T</Typography>
          </Box>
          <Typography variant="body2">Techscaler</Typography>
        </Box>

        <Divider sx={{ mb: 6 }} />

        {/* How You Benefit Section */}
        <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center',justifyContent: 'center', mb: 4, px: 1, height: {xs: 'auto', md: '80vh'}}}>
          <Typography variant="h2" sx={{
            fontSize: { xs: '20px', md: '32px' },
            fontWeight: '500',
            mb: 2,
          }}>
            How You Benefit
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 5, fontSize: { xs: '14px', md: '20px' } }}>
            Discover how we protect your revenue with proactive alerts.
          </Typography>
          <Box
      display="flex"
      flexDirection={isMobile ? 'column' : 'row'}
      justifyContent="space-between"
      alignItems="stretch"
    >
      {benefitsData.map((benefit, index) => {
        const isLastItem = index === benefitsData.length - 1;

        return (
          <Box
            key={index}
            sx={{
              flex: 1,
              px: 2,
              mb: isMobile ? 5 : 0,
              position: 'relative',
              textAlign: isMobile ? 'center' : 'left',
              borderRight: !isMobile && !isLastItem ? '1px solid #ccc' : 'none',
            }}
          >
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '24px', md: '48px' },
                fontWeight: 500,
                mb: 1,
              }}
            >
              {benefit.value}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontSize: { xs: '14px', md: '20px' },
                fontWeight: 500,
                mb: 1,
              }}
            >
              {benefit.title}
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ fontSize: { xs: '14px', md: '20px' } }}
            >
              {benefit.description}
            </Typography>

            {/* Bottom center border on mobile */}
            {isMobile && !isLastItem && (
              <Box
                sx={{
                  height: '1px',
                  width: '40%',
                  bgcolor: '#ccc',
                  mx: 'auto',
                  mt: 3,
                }}
              />
            )}
          </Box>
        );
      })}
    </Box>
        </Box>

        <Divider sx={{ mb: 6 }} />

        {/* What We Predict Section */}
        <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center',justifyContent: 'center', mb: 4, px: 1, height: {xs: 'auto', md: '100vh'}}}>
          <Typography variant="h2" sx={{
            fontSize: { xs: '20px', md: '32px' },
            fontWeight: '500',
            mb: 2
          }}>
            What We Predict
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4, fontSize: { xs: '14px', md: '20px' } }}>
            Explore the types of disruptions we predict to keep you ahead of potential issues.
          </Typography>

          {/* Categories grid - using the array */}
          <Box display="flex" flexWrap="wrap">
      {predictionsData.map((prediction, index) => {
        const isLastInRow = (index + 1) % itemsPerRow === 0;
        const isLastRow = index >= predictionsData.length - (predictionsData.length % itemsPerRow || itemsPerRow);

        return (
          <Box
            key={index}
            sx={{
              width: `${100 / itemsPerRow}%`,
              p: 1,
              boxSizing: 'border-box',
              borderRight: isLastInRow ? 'none' : '1px solid rgb(209, 209, 209)',
              borderBottom: isLastRow ? 'none' : '1px solid rgb(209, 209, 209)',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                p: 2,
                borderRadius: 1,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: '50%',
                  bgcolor: '#f5f5f5',
                  mb: 1,
                }}
              >
                {prediction.icon}
              </Box>
              <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 500 }}>
                {prediction.title}
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: { xs: '12px', md: '16px' }, textAlign: 'center' }}>
                {prediction.description}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>

          <Button
            variant="contained"
            endIcon={<ArrowRightAlt />}
            onClick={handleCreateAccount}
            sx={{
              bgcolor: 'black',
              borderRadius: 2,
              py: 1,
              px: 3,
              mt: 4,
              mb: 2,
              fontSize: '14px',
              fontWeight: '500',
              textTransform: 'none',
              '&:hover': {
                bgcolor: '#333'
              }
            }}
          >
            Create Free Account
          </Button>
        </Box>

        <Divider sx={{ mb: 6 }} />

        {/* How It Works Section */}
        <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center',justifyContent: 'center', mb: 4, px: 1, height: {xs: 'auto', md: '70vh'}}}>
          <Typography variant="h2" sx={{
            fontSize: { xs: '24px', md: '32px' },
            fontWeight: '500',
            mb: 2
          }}>
            How It Works
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Learn how our AI detects disruptions early and delivers real-time insights to protect your business.
          </Typography>

          <Box
      display="flex"
      flexDirection={isMobile ? 'column' : 'row'}
      justifyContent="center"
      alignItems="stretch"
    >
      {howItWorksData.map((step, index) => {
        const isLastItem = index === howItWorksData.length - 1;

        return (
          <Box
            key={index}
            sx={{
              flex: 1,
              px: 2,
              mb: isMobile ? 4 : 0,
              position: 'relative',
              borderRight: !isMobile && !isLastItem ? '1px solid rgb(209, 209, 209)' : 'none',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  bgcolor: '#f5f5f5',
                  mb: 2,
                }}
              >
                {step.icon}
              </Box>
              <Typography
                variant="h6"
                sx={{ fontSize: '18px', fontWeight: 500, mb: 1 }}
              >
                {step.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                {step.description}
              </Typography>
            </Box>

            {/* Bottom center border on mobile */}
            {isMobile && !isLastItem && (
              <Box
                sx={{
                  height: '1px',
                  width: '40%',
                  bgcolor: '#ccc',
                  mx: 'auto',
                  mt: 3,
                }}
              />
            )}
          </Box>
        );
      })}
    </Box>
        </Box>

        <Divider sx={{ mb: 6 }} />

        <Box sx={{ textAlign :'center',my: 4 }}>
      <Typography
        variant="h2"
        sx={{
          fontSize: { xs: '24px', md: '32px' },
          fontWeight: '600',
          mb: 4,
          textAlign: 'center',
        }}
      >
        FAQs
      </Typography>

      <Box>
        {faqsData.map((faq, index) => (
          <Box
            key={index}
            sx={{
              mb: 2,
              bgcolor: '#f5f5f5',
              borderRadius: 2,
              px: 3,
              py: 2.5,
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, mb: 1 }}
            >
              {faq.question}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {faq.answer}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Button
          variant="contained"
          endIcon={<ArrowRightAlt />}
          onClick={handleCreateAccount}
          sx={{
            bgcolor: 'black',
            borderRadius: 2,
            py: 1,
            px: 3,
            fontSize: '14px',
            fontWeight: '500',
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': {
              bgcolor: '#333',
            },
          }}
        >
          Create Free Account
        </Button>
      </Box>
    </Box>
    <Divider sx={{ mb: 6 }} />

    <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#fafafa' }}>
  <Typography variant="h5" fontWeight="600" mb={1}>
    Our Partners
  </Typography>
  <Typography
    variant="body1"
    color="text.secondary"
    mb={4}
    maxWidth={600}
    mx="auto"
  >
    We collaborate with industry leaders and innovators to deliver powerful solutions for the travel industry.
  </Typography>

  <Box sx={{ height: 60, overflow: 'hidden', position: 'relative' }}>
    {/* Next (slides in from bottom) */}
    <motion.div
      key={`next-${index}`}
      initial={{ y: 60 }}
      animate={{ y: isAnimating ? 0 : 60 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      style={{
        position: 'absolute',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '12px',
        zIndex: 1,
      }}
    >
      <Typography fontWeight="600" fontSize="14px" sx={{ whiteSpace: 'nowrap' }}>
        {next.title}
      </Typography>
      <Box
        sx={{
          width: 40,  // Set fixed width
          height: 40, // Set fixed height
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative', // Required for Next.js Image component
        }}
      >
        <Image
          src={next.logo}
          alt={next.alt}
          fill
          sizes="40px"
          style={{
            objectFit: 'contain',
          }}
        />
      </Box>
        <Typography sx={{ whiteSpace: 'nowrap', fontSize: '12px' }}>{next.name}</Typography>
    </motion.div>

    {/* Current (slides out up) */}
    <motion.div
      key={`current-${index}`}
      initial={{ y: 0 }}
      animate={{ y: isAnimating ? -60 : 0 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      style={{
        position: 'absolute',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '12px',
        zIndex: 2,
      }}
    >
      <Typography fontWeight="600" fontSize="14px" sx={{ whiteSpace: 'nowrap' }}>
        {current.title}
      </Typography>
      <Box
        sx={{
          width: 40,  // Set fixed width
          height: 40, // Set fixed height
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative', // Required for Next.js Image component
        }}
      >
        <Image
          src={current.logo}
          alt={current.alt}
          fill
          sizes="40px"
          style={{
            objectFit: 'contain',
          }}
        />
      </Box>
      <Typography sx={{ whiteSpace: 'nowrap', fontSize: '12px' }}>{current.name}</Typography>
    </motion.div>
  </Box>
</Box>


      </Container>
    </Layout>
  );
}
