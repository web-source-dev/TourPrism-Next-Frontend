'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { Box, Button, Typography, CircularProgress, Link as MuiLink, Alert, Divider, Paper, TextField } from '@mui/material';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { login, googleLogin, verifyOTP, resendOTP } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, setUser } = useAuth();
  const redirectTo = searchParams.get('from') || '/feed';

  // OTP related states
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(''));
  const [otpStep, setOtpStep] = useState(false);
  const [userId, setUserId] = useState('');
  const [timer, setTimer] = useState(0);

  // Login form states
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, router, redirectTo]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    // Prevent the default paste behavior
    e.preventDefault();
    
    // Get the pasted data from the clipboard
    const pastedData = e.clipboardData.getData('text/plain');
    
    // Check if it's a 6-digit code
    if (/^\d{6}$/.test(pastedData)) {
      const newOtpValues = pastedData.split('').map(char => char);
      setOtpValues(newOtpValues);
      
      // Validate OTP immediately if all digits are filled
      if (newOtpValues.every(val => val !== '')) {
        validateOTP();
      }
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d*$/.test(value)) return;
    
    const newOtpValues = [...otpValues];
    // Take only the last character if more than one is somehow entered
    newOtpValues[index] = value.slice(-1);
    setOtpValues(newOtpValues);
    
    // Auto-focus next input if this one is filled
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
    
    // Validate OTP immediately if all digits are filled
    if (newOtpValues.every(val => val !== '')) {
      validateOTP();
    }
  };

  const handleOTPKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    // Handle backspace to clear current box and move to previous
    if (e.key === 'Backspace') {
      if (index > 0 && otpValues[index] === '') {
        const newOtpValues = [...otpValues];
        newOtpValues[index - 1] = '';
        setOtpValues(newOtpValues);
        
        // Focus previous input
        const prevInput = document.getElementById(`otp-input-${index - 1}`);
        if (prevInput) {
          prevInput.focus();
        }
      } else if (otpValues[index] !== '') {
        // Clear current box
        const newOtpValues = [...otpValues];
        newOtpValues[index] = '';
        setOtpValues(newOtpValues);
      }
    }
    
    // Handle arrow left/right for navigation
    if (e.key === 'ArrowLeft' && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
      }
    }
    if (e.key === 'ArrowRight' && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOTP = () => {
    // Check if all OTP fields are filled
    if (otpValues.some(val => val === '')) {
      setErrors({
        ...errors,
        otp: 'Please enter the complete 6-digit OTP'
      });
      return false;
    }
    
    // If all fields are filled, submit the OTP
    handleSubmitOTP();
    return true;
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    
    try {
      await resendOTP({ userId });
      setTimer(30); // Reset countdown timer
      
      // Show success message
      setErrors({
        ...errors,
        otp: 'OTP sent successfully!',
        otpSuccess: 'true'
      });
    } catch (error) {
      console.error('Error resending OTP:', error);
      setErrors({
        ...errors,
        otp: 'Failed to resend OTP. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      const response = await login(formData);
      
      // Handle MFA if required
      if (response.requireMFA) {
        setOtpStep(true);
        setUserId(response.userId || '');
        setTimer(30); // Start 30 second countdown for OTP resend
      } else {
        // Standard login
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
        }
        
        setUser(response.user);
        router.push(redirectTo);
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({
        ...errors,
        form: 'Invalid email or password. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitOTP = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
      const otp = otpValues.join('');
      const response = await verifyOTP({ userId, otp });
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      setUser(response.user);
      router.push(redirectTo);
    } catch (error) {
      console.error('OTP verification error:', error);
      setErrors({
        ...errors,
        otp: 'Invalid OTP. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    googleLogin();
  };

  return (
    <Box sx={{ 
      display: 'flex',
      minHeight: '100vh',
      bgcolor: 'background.default'
    }}>
      <Box sx={{ 
        display: { xs: 'none', md: 'flex' },
        width: '50%',
        bgcolor: '#f5f5f5',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Box
          component="img"
          src="/images/login-image.webp"
          alt="Login"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      </Box>
      
      <Box sx={{ 
        width: { xs: '100%', md: '50%' },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        p: { xs: 2, sm: 4 }
      }}>
        <Paper elevation={0} sx={{ 
          width: '100%', 
          maxWidth: 480,
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          boxShadow: { xs: 'none', sm: '0px 4px 20px rgba(0, 0, 0, 0.05)' }
        }}>
          <Link href="/" passHref>
            <Box 
              component="img" 
              src="/logo.png" 
              alt="Logo" 
              sx={{ height: 40, mb: 4, cursor: 'pointer', display: 'block', mx: 'auto' }}
            />
          </Link>
          
          <Typography variant="h4" component="h1" align="center" sx={{ mb: 1, fontWeight: 'bold' }}>
            {otpStep ? 'Enter OTP' : 'Welcome Back'}
          </Typography>
          
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
            {otpStep ? 'Please enter the 6-digit code sent to your email' : 'Sign in to continue to TourPrism'}
          </Typography>
          
          {errors.form && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errors.form}
            </Alert>
          )}
          
          {otpStep ? (
            // OTP Form
            <Box component="form">
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
                {otpValues.map((value, index) => (
                  <TextField
                    key={index}
                    id={`otp-input-${index}`}
                    value={value}
                    onChange={(e) => handleOTPChange(index, e.target.value)}
                    onPaste={index === 0 ? handleOTPPaste : undefined}
                    inputProps={{ 
                      maxLength: 1,
                      style: { textAlign: 'center', fontSize: '1.5rem', paddingTop: 8, paddingBottom: 8 }
                    }}
                    sx={{ 
                      width: 45,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                    autoFocus={index === 0}
                  />
                ))}
              </Box>
              
              {errors.otp && (
                <Alert 
                  severity={errors.otpSuccess ? "success" : "error"} 
                  sx={{ mb: 3 }}
                >
                  {errors.otp}
                </Alert>
              )}
              
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                {timer > 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Resend OTP in {timer} seconds
                  </Typography>
                ) : (
                  <Button 
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    sx={{ textTransform: 'none', color: 'black' }}
                  >
                    Resend OTP
                  </Button>
                )}
              </Box>
              
              <Button
                fullWidth
                variant="contained"
                disabled={isLoading || otpValues.some(val => val === '')}
                onClick={validateOTP}
                sx={{
                  bgcolor: 'black',
                  color: 'white',
                  py: 1.5,
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: '#333'
                  }
                }}
              >
                {isLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Verify OTP'}
              </Button>
            </Box>
          ) : (
            // Login Form
            <Box component="form" onSubmit={handleSubmit}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Email Address
                </Typography>
                <TextField
                  fullWidth
                  name="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  InputProps={{
                    sx: { borderRadius: 2 }
                  }}
                />
              </Box>
              
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Password
                  </Typography>
                  <Link href="/forgot-password" passHref>
                    <MuiLink 
                      underline="hover" 
                      sx={{ color: 'black', fontWeight: 500, fontSize: '0.875rem' }}
                    >
                      Forgot Password?
                    </MuiLink>
                  </Link>
                </Box>
                <TextField
                  fullWidth
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  error={!!errors.password}
                  helperText={errors.password}
                  InputProps={{
                    sx: { borderRadius: 2 }
                  }}
                />
              </Box>
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading}
                sx={{
                  bgcolor: 'black',
                  color: 'white',
                  py: 1.5,
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: '#333'
                  }
                }}
              >
                {isLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Sign In'}
              </Button>
              
              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  OR
                </Typography>
              </Divider>
              
              <Button
                fullWidth
                variant="outlined"
                onClick={handleGoogleLogin}
                startIcon={<i className="ri-google-fill" style={{ fontSize: 18 }}></i>}
                sx={{
                  borderColor: '#ddd',
                  color: '#333',
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#ccc',
                    bgcolor: 'rgba(0,0,0,0.02)'
                  }
                }}
              >
                Continue with Google
              </Button>
              
              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography variant="body2" display="inline">
                  Don&apos;t have an account?{' '}
                </Typography>
                <Link href="/signup" passHref>
                  <MuiLink 
                    underline="hover" 
                    sx={{ color: 'black', fontWeight: 'bold' }}
                  >
                    Sign Up
                  </MuiLink>
                </Link>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
} 