'use client';

import React, { useState, useEffect } from 'react';
import { 
  Drawer, Box, Typography, IconButton, List, ListItem, 
  ListItemText, Divider, SwipeableDrawer,
  Button
} from '@mui/material';
import { markAsRead, deleteNotification } from '../services/api';
import { Notification } from '../types';

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  onNotificationUpdate: () => void;
}

const NotificationDrawer = ({ open, onClose, notifications, onNotificationUpdate }: NotificationDrawerProps) => {
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [visibleNotifications, setVisibleNotifications] = useState(10);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [actionDrawerOpen, setActionDrawerOpen] = useState(false);

  // Filter notifications based on unread status
  const filteredNotifications = showUnreadOnly 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const displayedNotifications = filteredNotifications.slice(0, visibleNotifications);

  const handleMarkAsRead = async () => {
    if (!selectedNotification) return;
    
    try {
      await markAsRead(selectedNotification._id);
      setSelectedNotification(null);
      setActionDrawerOpen(false); // Close the action drawer
      onNotificationUpdate();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedNotification) return;
    
    try {
      await deleteNotification(selectedNotification._id);
      setSelectedNotification(null);
      setActionDrawerOpen(false); // Close the action drawer
      onNotificationUpdate();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleActionClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setActionDrawerOpen(true);
  };

  const handleLoadMore = () => {
    setVisibleNotifications(prev => prev + 10);
  };

  // Add auto-refresh functionality
  useEffect(() => {
    const interval = setInterval(() => {
      onNotificationUpdate();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [onNotificationUpdate]);

  // Custom time formatter
  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 380 },
          zIndex: 1000, // Ensure the drawer is on top of other elements
          bgcolor: 'background.default'
        }
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={onClose}>
            <i className="ri-arrow-left-line"></i>
          </IconButton>
          <Typography variant="h6">Notifications</Typography>
        </Box>
        <IconButton 
          onClick={() => setShowUnreadOnly(!showUnreadOnly)}
          sx={{ 
            border: '1px solid',
            borderRadius: 1,
            backgroundColor: showUnreadOnly ? '#000 !important' : 'transparent', // Force background change
            p: 1,
            color: showUnreadOnly ? 'white !important' : 'inherit' // Force icon color change
          }}
        >
          <i className="ri-filter-3-line" style={{ fontSize: '1.2rem', color: showUnreadOnly ? 'white' : 'inherit' }}></i>
        </IconButton>
      </Box>
      <Divider />
      <List sx={{ p: 0 }}>
        {displayedNotifications.map((notification) => (
          <React.Fragment key={notification._id}>
            <ListItem 
              sx={{ 
                py: 2,
                px: 2,
                bgcolor: notification.isRead ? 'transparent' : 'rgba(25, 118, 210, 0.08)',
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <Box sx={{ width: '100%', p: 0 }}>
                  <Typography variant="subtitle2">
                    {notification.title}
                  </Typography>
                <Typography variant="body2" color="text.secondary">
                  {notification.message}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {formatTimeAgo(notification.createdAt)}
                </Typography>
                <IconButton
                  onClick={() => handleActionClick(notification)}
                  sx={{ ml: 'auto' }}
                >
                  <i className="ri-more-line"></i>
                </IconButton>
              </Box>
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>

      {filteredNotifications.length > visibleNotifications && (
        <Box sx={{ p: 5, textAlign: 'center' }}>
          <Button 
            onClick={handleLoadMore} 
            fullWidth 
            variant="outlined" 
            sx={{
              border: '2px solid #eee',  // Black border
              borderRadius: 5,       // 10px border radius
              color: '#333',             // Black text color
              padding: '10px',            // Add some padding
              fontWeight: 'bold',         // Make text bold
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.1)' // Light black hover effect
              }
            }}
          >
            See More
          </Button>
        </Box>
      )}

      {notifications.length === 0 && (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">No notifications yet</Typography>
        </Box>
      )}

      <SwipeableDrawer
        anchor="bottom"
        open={actionDrawerOpen}
        onClose={() => {
          setActionDrawerOpen(false);
          setSelectedNotification(null); // Also clear the selected notification
        }}
        onOpen={() => {}}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            pb: 2
          }
        }}
      >
        <List>
          {selectedNotification && !selectedNotification.isRead && (
            <ListItem onClick={handleMarkAsRead} sx={{ cursor: 'pointer' }}>
              <ListItemText primary="Mark as read" />
            </ListItem>
          )}
          <ListItem onClick={handleDelete} sx={{ cursor: 'pointer' }}>
            <ListItemText primary="Delete Notification" />
          </ListItem>
          <ListItem onClick={() => setActionDrawerOpen(false)} sx={{ cursor: 'pointer' }}>
            <ListItemText primary="Show less like this" />
          </ListItem>
        </List>
      </SwipeableDrawer>
    </Drawer>
  );
};

export default NotificationDrawer; 