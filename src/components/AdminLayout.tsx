'use client';

import React, { useState, ReactNode } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Avatar
} from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface AdminLayoutProps {
  children: ReactNode;
}

const drawerWidth = 300;

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: 'ri-dashboard-line', path: '/admin/dashboard' },
    { text: 'Users', icon: 'ri-user-line', path: '/admin/users' },
    { text: 'Alerts', icon: 'ri-notification-line', path: '/admin/alerts' },
    { text: 'Back to App', icon: 'ri-arrow-left-line', path: '/' },
  ];

  const drawer = (
    <Box>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
          TourPrism Admin
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 1 }}>
            {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'A'}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {user?.name || user?.email}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.role?.toUpperCase()}
            </Typography>
          </Box>
        </Box>
      </Box>
      
      <Divider />
      
      <List>
        {menuItems.map((item) => (
          <ListItem
            key={item.text}
            component={Link}
            href={item.path}
            sx={{
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.04)'
              },
              cursor: 'pointer'
            }}
          >
            <ListItemIcon>
              <i className={item.icon} style={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
        
        <ListItem
          onClick={logout}
          sx={{
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.04)'
            },
            cursor: 'pointer'
          }}
        >
          <ListItemIcon>
            <i className="ri-logout-box-line" style={{ fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          boxShadow: 'none',
          bgcolor: 'white',
          borderBottom: '1px solid #eee'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' }, color: 'black' }}
          >
            <i className="ri-menu-line" />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ color: 'black' }}>
            Admin Panel
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          bgcolor: '#f5f5f5',
          minHeight: '100vh'
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayout; 