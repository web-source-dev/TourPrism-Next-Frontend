'use client';

import React, { useEffect, useState, ReactNode } from 'react';
import { 
  Box,
  Toolbar, 
  Typography, 
  Container, 
  Drawer, 
  IconButton, 
  List, 
  ListItem, 
  ListItemText, 
  Badge,
  Button,
} from '@mui/material';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import NotificationDrawer from './NotificationDrawer';
import Banner from './Banner';
import { getNotifications } from '../services/api';
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
    { text: 'Action Hub', icon: 'ri-notification-line', path: '/action-hub' },
    { text: 'Insights', icon: 'ri-line-chart-line', path: '/insights' },
    { text: 'Subscription', icon: 'ri-vip-crown-line', path: '/subscription' },
    { text: 'Settings', icon: 'ri-settings-line', path: '/profile' },
    { text: 'Logout', icon: 'ri-logout-box-line', path: '/' }
  ] : [
    { text: 'About', icon: 'ri-information-line', path: '/about' },
    { text: 'Feature', icon: 'ri-notification-line', path: '/feature' },
    { text: 'Resources', icon: 'ri-team-line', path: '/resources' },
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
  const handleLogoutClick = () => {
    logout();
    router.push('/');
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
    <Box sx={{ display: 'flex',bgcolor:'#f5f5f5',  flexDirection: 'column', minHeight: '100vh', p: 0, m: 0 }}>
      <Box sx={{ 
        px: { xs: 3, sm: 2, md: 3 }, 
        py: 0.5, 
        mx: { xs: 1, sm: 1.5, md: 3 },
        my: 1.5,
        bgcolor: pathname === '/feed' ? '#EBEBEC' : '#fff', 
        borderRadius: 50,
        boxShadow: 'none'
      }}>
        <Toolbar 
          disableGutters
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            minHeight: { xs: '40px', sm: '50px' }
          }}
        >
          {/* Left side of header */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
            {!isFeedPage && (
            <Typography
              component={Link}
              href="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                fontWeight: 'bold',
                fontSize: '20px',
                color: 'black',
                textDecoration: 'none'
              }}
            >
              <span style={{ fontSize: '30px', color: '#0066FF' }}>t</span> {''}
              <Typography sx={{ fontSize:'20px',ml: 0.5,fontWeight: '550', color: 'black',display: { xs: 'none', md: 'block' } }}>tourprism</Typography>
            </Typography>
            )}
            
            {/* Feed text - only on feed page */}
            {isFeedPage && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={() => router.push('/')} sx={{ display:{xs:'none',md:'block'}}}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10.2965 4.40253C10.1889 4.48379 9.86773 4.72639 9.68259 4.87088C9.31178 5.16026 8.81906 5.55566 8.32779 5.9822C7.83405 6.4109 7.35319 6.86124 6.99969 7.26131C6.82244 7.46192 6.68775 7.63814 6.60008 7.78356C6.51763 7.92033 6.50049 8.00112 6.50049 8.00112C6.50049 8.00112 6.51764 8.07954 6.60008 8.2163C6.68775 8.36172 6.82243 8.53794 6.99969 8.73855C7.35318 9.13863 7.83405 9.58897 8.3278 10.0177C8.81907 10.4442 9.3118 10.8396 9.68261 11.129C9.86776 11.2735 10.1885 11.5157 10.296 11.597C10.5184 11.7608 10.5664 12.0741 10.4026 12.2964C10.2388 12.5188 9.92584 12.5663 9.7035 12.4025L9.70194 12.4014C9.58923 12.3162 9.25637 12.0648 9.06739 11.9173C8.6882 11.6214 8.18093 11.2145 7.67219 10.7728C7.16594 10.3332 6.64681 9.84943 6.25031 9.40069C6.05256 9.17689 5.87475 8.95003 5.74366 8.73258C5.62085 8.52887 5.5 8.27094 5.5 7.99993C5.5 7.72892 5.62086 7.471 5.74367 7.26728C5.87475 7.04984 6.05256 6.82298 6.25031 6.59918C6.64681 6.15043 7.16594 5.66665 7.67218 5.2271C8.18091 4.7854 8.68818 4.37845 9.06736 4.08253C9.25641 3.93499 9.58914 3.68368 9.70172 3.59865L9.70314 3.59757C9.92549 3.43381 10.2388 3.48108 10.4026 3.70342C10.5663 3.92576 10.5188 4.23877 10.2965 4.40253Z" fill="#616161"/>
</svg>

                </IconButton>
                
              <Typography
                sx={{
                  display: { xs: 'flex' },
                  alignItems: 'center',
                  ml: 0.5,
                  fontWeight: 'medium',
                  fontSize: '18px',
                  color: 'black'
                }}
              >
                Feed
              </Typography>
                </Box>
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
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Login button for non-logged in users */}
            {!isAuthenticated && (
              <Button 
                variant="contained" 
                sx={{ 
                  bgcolor: '#EBEBEC',
                  borderRadius: 10, 
                  color: '#444',
                  boxShadow: 'none',
                  px: 3,
                  '&:hover': {
                    bgcolor: '#EBEBEC',
                    boxShadow:'none'
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
                  }}
                >
                  <Badge badgeContent={isClient ? unreadCount : 0} color="error">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M8.7738 1.35363C9.14472 1.11082 9.59748 1.04169 10 1.04169C10.4025 1.04169 10.8553 1.11082 11.2262 1.35363C11.6377 1.62301 11.875 2.05904 11.875 2.60419C11.875 2.991 11.7573 3.39117 11.5658 3.73695C14.1929 4.40545 16.1768 6.71781 16.3255 9.54302C16.3331 9.6868 16.3387 9.82447 16.3441 9.95711C16.3626 10.4084 16.3787 10.8013 16.4604 11.1777C16.5581 11.6276 16.7389 11.9813 17.1066 12.257C17.7477 12.7379 18.125 13.4925 18.125 14.2939C18.125 15.445 17.219 16.4584 16 16.4584H13.0625C12.7729 17.8848 11.5118 18.9584 10 18.9584C8.48815 18.9584 7.22706 17.8848 6.93751 16.4584H4C2.78099 16.4584 1.875 15.445 1.875 14.2939C1.875 13.4925 2.25232 12.7379 2.89344 12.257C3.26108 11.9813 3.44187 11.6276 3.53958 11.1777C3.62134 10.8013 3.63741 10.4084 3.65588 9.9571C3.6613 9.82448 3.66694 9.68679 3.6745 9.54302C3.8232 6.71781 5.80714 4.40545 8.43423 3.73695C8.24271 3.39117 8.125 2.991 8.125 2.60419C8.125 2.05904 8.3623 1.62301 8.7738 1.35363ZM8.23169 16.4584C8.48909 17.1866 9.18361 17.7084 10 17.7084C10.8164 17.7084 11.5109 17.1866 11.7683 16.4584H8.23169ZM16 15.2084C16.478 15.2084 16.875 14.8064 16.875 14.2939C16.875 13.886 16.6829 13.5018 16.3566 13.257C15.6848 12.7532 15.3811 12.098 15.2389 11.443C15.1317 10.9493 15.1104 10.4118 15.0919 9.94517C15.0873 9.82803 15.0828 9.71512 15.0772 9.60872C14.9351 6.90834 12.7041 4.79169 10 4.79169C7.29589 4.79169 5.0649 6.90834 4.92278 9.60872C4.91717 9.71519 4.91271 9.82795 4.90807 9.94517C4.8896 10.4118 4.86833 10.9493 4.7611 11.443C4.61886 12.098 4.31517 12.7532 3.64344 13.257C3.31708 13.5018 3.125 13.886 3.125 14.2939C3.125 14.8064 3.52201 15.2084 4 15.2084H16ZM10.3823 3.27148C10.2206 3.48904 10.0724 3.54169 10 3.54169C9.92757 3.54169 9.77944 3.48904 9.61773 3.27148C9.46066 3.06017 9.375 2.79774 9.375 2.60419C9.375 2.51757 9.392 2.47523 9.40137 2.45742C9.41025 2.44055 9.42483 2.42147 9.45843 2.39947C9.53992 2.34613 9.71216 2.29169 10 2.29169C10.2878 2.29169 10.4601 2.34613 10.5416 2.39947C10.5752 2.42147 10.5898 2.44055 10.5986 2.45742C10.608 2.47523 10.625 2.51757 10.625 2.60419C10.625 2.79774 10.5393 3.06017 10.3823 3.27148Z" fill="#616161"/>
</svg>

                  </Badge>
                </IconButton>
                {isFeedPage && (
                  <IconButton
                    onClick={handleFilterOpenForFeedPage}
                    sx={{ 
                      color: 'black',
                    }}
                  >
                   <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8.33301 1.04205C8.67819 1.04205 8.95801 1.32188 8.95801 1.66705L8.95801 6.66705C8.95801 7.01223 8.67819 7.29205 8.33301 7.29205C7.98783 7.29205 7.70801 7.01223 7.70801 6.66705L7.70801 4.79208L3.33303 4.79226C2.98786 4.79227 2.70802 4.51246 2.70801 4.16728C2.70799 3.8221 2.9878 3.54227 3.33298 3.54226L7.70801 3.54208L7.70801 1.66705C7.70801 1.32188 7.98783 1.04205 8.33301 1.04205Z" fill="#616161"/>
<path d="M10.208 4.16705C10.208 3.82188 10.4878 3.54205 10.833 3.54205L16.6663 3.54205C17.0115 3.54205 17.2913 3.82188 17.2913 4.16705C17.2913 4.51223 17.0115 4.79205 16.6663 4.79205L10.833 4.79205C10.4878 4.79205 10.208 4.51223 10.208 4.16705Z" fill="#616161"/>
<path d="M13.958 7.50039C13.958 7.15521 13.6782 6.87539 13.333 6.87539C12.9878 6.87539 12.708 7.15521 12.708 7.50039L12.708 12.5004C12.708 12.8456 12.9878 13.1254 13.333 13.1254C13.6782 13.1254 13.958 12.8456 13.958 12.5004L13.958 10.625L16.6663 10.6252C17.0115 10.6252 17.2913 10.3454 17.2913 10.0002C17.2914 9.65504 17.0116 9.37521 16.6664 9.37518L13.958 9.37502V7.50039Z" fill="#616161"/>
<path d="M10.6247 13.3337C10.6247 12.9885 10.3449 12.7087 9.99967 12.7087C9.6545 12.7087 9.37467 12.9885 9.37467 13.3337V18.3337C9.37467 18.6789 9.6545 18.9587 9.99967 18.9587C10.3449 18.9587 10.6247 18.6789 10.6247 18.3337V16.4587L16.6663 16.4587C17.0115 16.4587 17.2913 16.1789 17.2913 15.8337C17.2913 15.4885 17.0115 15.2087 16.6663 15.2087L10.6247 15.2087V13.3337Z" fill="#616161"/>
<path d="M3.33302 10.6256L10.833 10.6254C11.1782 10.6254 11.458 10.3455 11.458 10.0004C11.458 9.65519 11.1782 9.37538 10.833 9.37539L3.33299 9.37559C2.98781 9.3756 2.708 9.65543 2.70801 10.0006C2.70802 10.3458 2.98785 10.6256 3.33302 10.6256Z" fill="#616161"/>
<path d="M3.33304 16.4589L7.49971 16.4587C7.84488 16.4587 8.12469 16.1789 8.12467 15.8337C8.12466 15.4885 7.84482 15.2087 7.49964 15.2087L3.33298 15.2089C2.9878 15.2089 2.70799 15.4888 2.70801 15.834C2.70802 16.1791 2.98786 16.4589 3.33304 16.4589Z" fill="#616161"/>
</svg>


                  </IconButton>
                )}
                <IconButton onClick={handleLogoutClick}
                sx={{ 
                  color: 'black',
                  display:{xs:'none',md:'block'}
                }}
                >
             <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13.1245 5.28769C13.0498 3.40842 11.4838 1.82556 9.41443 1.87618C8.93363 1.88794 8.36843 2.04749 7.48174 2.29779L7.37294 2.3285C4.9365 3.01574 2.5467 4.2454 1.97799 7.1451C1.87489 7.67076 1.87493 8.25098 1.875 9.2244L1.875 10.7756C1.87493 11.749 1.87489 12.3293 1.97799 12.8549C2.5467 15.7546 4.9365 16.9843 7.37294 17.6715L7.48172 17.7022C8.36841 17.9525 8.93363 18.1121 9.41442 18.1238C11.4838 18.1745 13.0498 16.5916 13.1245 14.7123C13.1382 14.3674 12.8697 14.0767 12.5248 14.063C12.1799 14.0493 11.8892 14.3178 11.8755 14.6627C11.8275 15.87 10.8213 16.9079 9.445 16.8742C9.14351 16.8668 8.74417 16.7595 7.71228 16.4685C5.37954 15.8105 3.62923 14.7793 3.20462 12.6143C3.12784 12.2229 3.12501 11.7723 3.12501 10.6977V9.30229C3.12501 8.22772 3.12784 7.77713 3.20462 7.38568C3.62923 5.2207 5.37954 4.18954 7.71228 3.53156C8.74418 3.24049 9.14351 3.13318 9.445 3.12581C10.8213 3.09214 11.8275 4.13004 11.8755 5.33733C11.8892 5.68224 12.1799 5.95073 12.5248 5.93702C12.8697 5.92331 13.1382 5.6326 13.1245 5.28769Z" fill="#616161"/>
<path d="M15.8523 7.46849C15.6048 7.22791 15.2091 7.23353 14.9685 7.48105C14.7279 7.72857 14.7335 8.12426 14.981 8.36484C15.1157 8.49573 15.33 8.66425 15.5339 8.82444L15.5814 8.8617C15.7861 9.02246 16.0051 9.19438 16.2123 9.36995L16.2183 9.375H8.33333C7.98816 9.375 7.70833 9.65482 7.70833 10C7.70833 10.3452 7.98816 10.625 8.33333 10.625H16.2183L16.2123 10.63C16.0051 10.8056 15.7861 10.9775 15.5814 11.1383L15.5339 11.1756C15.33 11.3357 15.1157 11.5043 14.981 11.6352C14.7335 11.8757 14.7279 12.2714 14.9685 12.519C15.2091 12.7665 15.6048 12.7721 15.8523 12.5315C15.9283 12.4576 16.0798 12.3362 16.306 12.1586L16.356 12.1194C16.5578 11.961 16.7945 11.7752 17.0204 11.5837C17.2625 11.3786 17.514 11.1489 17.7096 10.9193C17.8075 10.8043 17.9042 10.6746 17.9788 10.5351C18.0508 10.4006 18.125 10.2152 18.125 10C18.125 9.78476 18.0508 9.59939 17.9788 9.46485C17.9042 9.32536 17.8075 9.1957 17.7096 9.08066C17.514 8.8511 17.2625 8.62145 17.0204 8.41628C16.7945 8.22485 16.5578 8.03905 16.356 7.88066L16.306 7.84142C16.0798 7.66376 15.9283 7.54241 15.8523 7.46849Z" fill="#616161"/>
</svg>


                </IconButton>
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

      {/* Display Banner for authenticated users */}
      {isAuthenticated && pathname !== '/profile' && <Banner />}

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