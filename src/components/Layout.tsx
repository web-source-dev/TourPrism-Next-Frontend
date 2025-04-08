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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', p: 0, m: 0 }}>
      <AppBar position="static" sx={{ bgcolor: 'white', boxShadow: 1 }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{display: 'flex', gap: 1}}>
            {/* Mobile menu icon */}
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { sm: 'none' }, color: 'black' }}
            >
              <i className="ri-menu-2-line" style={{ fontSize: '24px' }}></i>
            </IconButton>

            <Typography
              component={Link}
              href="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontWeight: 'bold',
                fontSize: '24px',
                color: 'black',
                textDecoration: 'none'
              }}
            >
              <span style={{ color: '#0066FF' }}>t</span>
            </Typography>
            
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {!isAuthenticated && (
              <Button variant="contained" sx={{ bgcolor: 'rgb(220, 220, 220)',borderRadius: 10, color: '#444',boxShadow:'none'}} onClick={() => router.push('/login')}>
                Login
              </Button>
            )}
            {isAuthenticated && (
              <>
                <IconButton
                  onClick={() => setNotificationDrawerOpen(true)}
                  sx={{ color: 'black' }}
                >
                  <Badge badgeContent={isClient ? unreadCount : 0} color="error">
                    <NotificationsNone />
                  </Badge>
                </IconButton>
                {pathname === '/feed' && (
                  <IconButton
                    onClick={handleFilterOpenForFeedPage}
                    sx={{ color: 'black' }}
                  >
                    <i className="ri-filter-3-line"></i>
                  </IconButton>
                )}
              </>
            )}
          </Box>
          {/* Desktop navigation */}
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 2 }}>
            {!isAuthenticated && (
              <>
                <Link
                  href="/login"
                  style={{
                    color: 'black',
                    textDecoration: 'none',
                    fontSize: '16px'
                  }}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  style={{
                    color: 'black',
                    textDecoration: 'none',
                    fontSize: '16px'
                  }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

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
            py: 3,
            px: 0,
            mt: 'auto',
            bgcolor: 'white',
            borderTop: '1px solid #e0e0e0'
          }}
        >
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'flex-start' }, gap: 3 }}>
              {/* Navigation Links */}
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 6 }, alignItems: { xs: 'flex-start', md: 'flex-start' } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', md: 'flex-start' }, gap: 1 }}>
                  <Link href="/about" style={{ fontSize:'14px', color: '#000', textDecoration: 'none' }}>About</Link>
                  <Link href="/post-alert" style={{ fontSize:'14px', color: '#000', textDecoration: 'none' }}>Post Alert</Link>
                  <Link href="/ambassadors" style={{ fontSize:'14px', color: '#000', textDecoration: 'none' }}>Ambassadors</Link>
                  <Link href="/pricing" style={{ fontSize:'14px', color: '#000', textDecoration: 'none' }}>Pricing</Link>
                  <Link href="/privacy-policy" style={{ fontSize:'14px', color: '#000', textDecoration: 'none' }}>Privacy Policy</Link>
                  <Link href="/terms" style={{ fontSize:'14px', color: '#000', textDecoration: 'none' }}>Terms of Use</Link>
                </Box>
              </Box>
            </Box>
            {/* Logo and Social Links */}
            <Box sx={{ display: 'flex', mt: 3, flexDirection: 'column', alignItems: { xs: 'flex-start', md: 'flex-start' }, gap: 2 }}>
              <Typography
                component={Link}
                href="/"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontSize: '18px',
                  color: 'black',
                  textDecoration: 'none'
                }}
              >
                <span style={{ color: '#0066FF', fontWeight: 'bold', fontSize:'24px' }}>t</span> tourprism
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems:'center' }}>
                <Link href="mailto:info@tourprism.com" style={{ color: 'black', textDecoration:'none' }}>
                  <i className="ri-mail-fill" style={{ fontSize: '24px', color:'#666' }}></i>
                </Link>
                <Link href="https://linkedin.com" target="_blank" style={{ color: 'black', textDecoration:'none' }}>
                  <i className="ri-linkedin-box-fill" style={{ fontSize: '27px', color:'#666' }}></i>
                </Link>
                <Link href="https://twitter.com" target="_blank" style={{ color: 'white', textDecoration:'none', backgroundColor:'#666', borderRadius:'5px', height:'22px' }}>
                  <i className="ri-twitter-x-fill" style={{ fontSize: '20px' }}></i>
                </Link>
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                © 2025. Tourprism Limited. <br /> Made in Scotland.
              </Typography>
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