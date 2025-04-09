'use client';

import React, { useEffect, useState, ReactNode } from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Drawer, 
  IconButton, 
  List, 
  ListItem, 
  ListItemText, 
  Badge,
  Button
} from '@mui/material';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import NotificationDrawer from './NotificationDrawer';
import { getNotifications } from '../services/api';
import { NotificationsNone } from '@mui/icons-material';
import { Notification } from '../types';
import Image from 'next/image';

interface LayoutProps {
  children: ReactNode;
  isFooter?: boolean;
  onFilterOpen?: () => void;
}

const Layout = ({ children, isFooter = true, onFilterOpen }: LayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const isFeedPage = pathname === '/feed';

  // Use useEffect to mark when component is mounted on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Add fetchNotifications function
  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Add useEffect to fetch notifications when logged in
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  // Add this line to calculate unread notifications
  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = isAuthenticated ? [
    { text: 'Feed', icon: 'ri-home-line', path: '/feed' },
    { text: 'Post Alert', icon: 'ri-notification-line', path: '/post-alert' },
    { text: 'My Alerts', icon: 'ri-notification-line', path: '/my-alerts' },
    { text: 'Insights', icon: 'ri-line-chart-line', path: '/insights' },
    { text: 'Rewards', icon: 'ri-gift-line', path: '/rewards' },
    { text: 'Subscription', icon: 'ri-vip-crown-line', path: '/subscription' },
    { text: 'Settings', icon: 'ri-settings-line', path: '/settings' },
    { text: 'Logout', icon: 'ri-logout-box-line', path: '/' }
  ] : [
    { text: 'About', icon: 'ri-information-line', path: '/about' },
    { text: 'Post Alert', icon: 'ri-notification-line', path: '/post-alert' },
    { text: 'Ambassadors', icon: 'ri-team-line', path: '/ambassadors' },
    { text: 'Pricing', icon: 'ri-price-tag-3-line', path: '/pricing' },
    { text: 'Login', icon: 'ri-login-box-line', path: '/login' }
  ];

  const handleMenuItemClick = (path: string, text: string) => {
    setMobileOpen(false);
    
    if (text === 'Logout') {
      logout();
    } else {
      router.push(path);
    }
  };

  const handleFilterOpenForFeedPage = () => {
    if (onFilterOpen) {
      onFilterOpen();
    }
  };

  const drawer = (
    <Box sx={{ width: 300 }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
        <Typography onClick={handleDrawerToggle}>X</Typography>
      </Box>
      <List>
        {menuItems.map((item) => (
          <ListItem
            key={item.text}
            onClick={() => handleMenuItemClick(item.path, item.text)}
            sx={{
                color: 'black',
                textDecoration: 'none',
                fontSize: '18px',
                height: '35px',
                fontWeight: 'bold',
              '&:hover': {
                bgcolor: '#f5f5f5'
              },
              cursor: 'pointer'
            }}
          >
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  // Navigation links to show on desktop
  const navLinks = [
    { text: 'About', path: '/about' },
    { text: 'Feature', path: '/feature' },
    { text: 'Resources', path: '/resources' },
    { text: 'Pricing', path: '/pricing' }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', p: 0, m: 0 }}>
      <Box sx={{ 
        px: { xs: 3, sm: 3, md: 3 }, 
        py: 1.5, 
        mx: { xs: 1, sm: 1.5, md: 3.5 },
        my: 1.5,
        height: { sm: '30px', md: '80px' },
        bgcolor: '#EBEBEC', 
        borderRadius: 50,
        boxShadow: 'none'
      }}>
        <Toolbar 
          disableGutters
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            minHeight: { xs: '48px', sm: '56px' }
          }}
        >
          {/* Left side of header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Mobile menu icon - only on mobile */}
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { sm: 'none' }, color: 'black' }}
            >
              <i className="ri-menu-2-line" style={{ fontSize: '24px' }}></i>
            </IconButton>

            {/* Logo */}
            <Typography
              component={Link}
              href="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                fontWeight: 'bold',
                fontSize: '24px',
                color: 'black',
                textDecoration: 'none'
              }}
            >
              <span style={{ color: '#0066FF' }}>t</span>
            </Typography>
            
            {/* Feed text - only on feed page */}
            {isFeedPage && (
              <Typography
                sx={{
                  display: { xs: 'flex', sm: 'none' },
                  alignItems: 'center',
                  ml: 2,
                  fontWeight: 'medium',
                  fontSize: '18px',
                  color: 'black'
                }}
              >
                Feed
              </Typography>
            )}
          </Box>

          {/* Desktop navigation - center of header */}
          <Box sx={{ 
            display: { xs: 'none', sm: 'flex' }, 
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            gap: 3
          }}>
            {navLinks.map((link) => (
              <Link
                key={link.text}
                href={link.path}
                style={{
                  color: 'black',
                  textDecoration: 'none',
                  fontSize: '16px',
                  fontWeight: 500
                }}
              >
                {link.text}
              </Link>
            ))}
          </Box>

          {/* Right side of header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Login button for non-logged in users */}
            {!isAuthenticated && (
              <Button 
                variant="contained" 
                sx={{ 
                  bgcolor: 'rgb(220, 220, 220)',
                  borderRadius: 10, 
                  color: '#444',
                  boxShadow: 'none',
                  px: 3,
                  '&:hover': {
                    bgcolor: 'rgb(210, 210, 210)',
                  }
                }} 
                onClick={() => router.push('/login')}
              >
                Login
              </Button>
            )}

            {/* Notification and filter icons for logged in users */}
            {isAuthenticated && (
              <>
                <IconButton
                  onClick={() => setNotificationDrawerOpen(true)}
                  sx={{ 
                    color: 'black',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  <Badge badgeContent={isClient ? unreadCount : 0} color="error">
                    <NotificationsNone />
                  </Badge>
                </IconButton>
                {isFeedPage && (
                  <IconButton
                    onClick={handleFilterOpenForFeedPage}
                    sx={{ 
                      color: 'black',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                  >
                    <i className="ri-filter-3-line"></i>
                  </IconButton>
                )}
              </>
            )}
          </Box>
        </Toolbar>
      </Box>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 300 }
        }}
      >
        {drawer}
      </Drawer>

      <Container component="main" sx={{ flex: 1, py: 4, px: 0 }}>
        {children}
      </Container>

      {isFooter && pathname !== '/feed' && pathname !== '/post-alert' && (
        <Box
          component="footer"
          sx={{
            py: 5,
            px: 1,
            mt: 'auto',
            textAlign: 'center',
            borderTop: '1px solid rgb(218, 218, 218)'
          }}
        >
          <Container maxWidth="lg">
            {/* Footer Links Row */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center',
              gap: 2,
              mb: 2
            }}>
              <Link href="/about" style={{ color: '#000', textDecoration: 'none', fontSize: '14px' }}>
                About us
              </Link>
              <Link href="/privacy-policy" style={{ color: '#000', textDecoration: 'none', fontSize: '14px' }}>
                Privacy Policy
              </Link>
              <Link href="/terms" style={{ color: '#000', textDecoration: 'none', fontSize: '14px' }}>
                Terms of Use
              </Link>
            </Box>
            
            {/* Copyright */}
            <Typography variant="body2" sx={{ mb: 1, fontSize: '12px' }}>
              © 2025. Tourprism Limited. Made in Scotland.
            </Typography>
            
            {/* Social Icons */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center',
            }}>
              <IconButton sx={{ bgcolor: 'transparent', color: 'black', width: 36, height: 36 }}>
                <Image src="/images/mail.svg" alt="mail" width={36} height={36} />
              </IconButton>
              <IconButton sx={{ bgcolor: 'transparent', color: 'black', width: 36, height: 36 }}>
                <Image src="/images/linkedin.svg" alt="linkedin" width={36} height={36} />
              </IconButton>
              <IconButton sx={{ bgcolor: 'transparent', color: 'black', width: 36, height: 36 }}>
                <Image src="/images/twitter.svg" alt="twitter" width={36} height={36} />
              </IconButton>
            </Box>
          </Container>
        </Box>
      )}
      
      <NotificationDrawer
        open={notificationDrawerOpen}
        onClose={() => setNotificationDrawerOpen(false)}
        notifications={notifications}
        onNotificationUpdate={fetchNotifications}
      />
    </Box>
  );
};

export default Layout;