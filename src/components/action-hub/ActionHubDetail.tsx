'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
  IconButton,
  TextField,
  List,
  ListItem,
  ListItemText,
  Chip,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tooltip,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { 
  getFlaggedAlertById, 
  markAlertStatus, 
  flagAlert, 
  followAlert,
  addGuests, 
  notifyGuests,
  notifyTeam,
  getActionLogs
} from '@/services/action-hub';
import { ActionHubItem, ActionLog } from '@/types';
import { 
  ArrowBack, 
  Flag, 
  FlagOutlined, 
  Email,
  NotificationsActive,
  NotificationsNone,
  Send,
  Refresh,
  Done,
  Warning
} from '@mui/icons-material';
import { format } from 'date-fns';
import { getTimeAgo } from '@/utils/getTimeAgo';
import { useAuth } from '@/context/AuthContext';

interface ActionHubDetailProps {
  alertId: string;
}

const ActionHubDetail: React.FC<ActionHubDetailProps> = ({ alertId }) => {
  const [alert, setAlert] = useState<ActionHubItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTabState] = useState<'notify_guests' | 'add_notes'>('notify_guests');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [guestName, setGuestName] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');
  const [recipientType, setRecipientType] = useState<string>('guests');
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [logsLoading, setLogsLoading] = useState<boolean>(false);
  
  // New state for tracking notification status
  const [notifiedGuestsCount, setNotifiedGuestsCount] = useState<number>(0);
  const [totalGuestsCount, setTotalGuestsCount] = useState<number>(0);
  const [notifiedTeamCount, setNotifiedTeamCount] = useState<number>(0);
  const [sendingNotification, setSendingNotification] = useState<boolean>(false);
  const [notificationSuccessCount, setNotificationSuccessCount] = useState<number>(0);
  const [notificationFailCount, setNotificationFailCount] = useState<number>(0);
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);
  
  // Get auth context to check user roles
  const { 
    isCollaboratorViewer,
  } = useAuth();
  
  // Helper function to check if user is view-only
  const isViewOnly = () => {
    return isCollaboratorViewer;
  };
  
  console.log(activeTab);
  const router = useRouter();

  useEffect(() => {
    const fetchAlert = async () => {
      try {
        setLoading(true);
        const data = await getFlaggedAlertById(alertId);
        setAlert(data);
        
        // Set the active tab from the retrieved data
        if (data.currentActiveTab) {
          // If the backend sends 'message_team' we should default to 'notify_guests'
          // since message_team is no longer supported
          if (data.currentActiveTab === 'notify_guests' || data.currentActiveTab === 'add_notes') {
            setActiveTabState(data.currentActiveTab);
          } else {
            setActiveTabState('notify_guests');
          }
        }
        
        // Calculate notification stats
        if (data.guests && data.guests.length > 0) {
          const totalGuests = data.guests.length;
          const notifiedGuests = data.guests.filter(guest => guest.notificationSent).length;
          setTotalGuestsCount(totalGuests);
          setNotifiedGuestsCount(notifiedGuests);
        } else {
          setTotalGuestsCount(0);
          setNotifiedGuestsCount(0);
        }
        
        if (data.teamMembers && data.teamMembers.length > 0) {
          // Note: Currently, we don't track which team members have been notified
          // This will be handled through the action logs
          const teamNotificationLogs = data.actionLogs?.filter(
            log => log.actionType === 'notify_guests' && 
                   log.actionDetails?.includes('team members')
          );
          setNotifiedTeamCount(teamNotificationLogs && teamNotificationLogs.length > 0 ? 1 : 0);
        } else {
          setNotifiedTeamCount(0);
        }
        
        setError(null);
        
        // Fetch action logs
        await fetchActionLogs(data.actionHubId);
      } catch (err) {
        setError('Failed to load alert details. Please try again later.');
        console.error('Error loading alert details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (alertId) {
      fetchAlert();
    }
  }, [alertId]);
  
  const fetchActionLogs = async (actionHubId: string) => {
    try {
      setLogsLoading(true);
      const logs = await getActionLogs(actionHubId);
      setActionLogs(logs as ActionLog[]);
    } catch (err) {
      console.error('Error fetching action logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleFlagToggle = async () => {
    if (!alert) return;
    
    try {
      const result = await flagAlert(alert._id);
      setAlert(prev => prev ? { 
        ...prev, 
        isFlagged: result.isFlagged,
        flaggedBy: Array(result.flagCount).fill('')
      } : null);
    } catch (err) {
      console.error('Error toggling flag:', err);
    }
  };

  const handleFollowToggle = async () => {
    if (!alert) return;
    
    try {
      const result = await followAlert(alert._id);
      
      // Update the alert state
      setAlert(prev => prev ? { 
        ...prev, 
        isFollowing: result.following,
        numberOfFollows: result.numberOfFollows
      } : null);
      
      // Provide feedback
      console.log(result.following ? 
        `You're now following this alert. Total followers: ${result.numberOfFollows}` : 
        `You've unfollowed this alert. Total followers: ${result.numberOfFollows}`);
      
      // Refresh action logs to show the follow/unfollow action
      await fetchActionLogs(alert.actionHubId);
    } catch (err) {
      console.error('Error toggling follow status:', err);
    }
  };

  const handleStatusChange = async (status: 'new' | 'in_progress' | 'handled') => {
    if (!alert) return;
    
    try {
      await markAlertStatus(alert.actionHubId, status);
      
      // Provide feedback
      console.log(`Alert marked as ${status}`);
      
      // Refresh the alert
      const updatedAlert = await getFlaggedAlertById(alertId);
      setAlert(updatedAlert);
      
      // Refresh action logs
      await fetchActionLogs(alert.actionHubId);
      
      if (status === 'handled') {
        // In a real app, you might want to:
        // 1. Show a success toast/snackbar
        // 2. Navigate back to the list view after a delay
        // router.push('/action-hub');
      }
    } catch (err) {
      console.error(`Error changing status to ${status}:`, err);
      // In a real app, show an error message
    }
  };
  
  const handleAddGuest = async () => {
    if (!alert || !guestEmail.trim()) return;
    
    try {
      // Add the guest
      await addGuests(alert.actionHubId, [{ 
        email: guestEmail.trim(),
        name: guestName.trim() || undefined
      }]);
      
      // Refresh the alert to get the updated guests
      const updatedAlert = await getFlaggedAlertById(alertId);
      setAlert(updatedAlert);
      
      // Clear inputs
      setGuestEmail('');
      setGuestName('');
      
      // Refresh action logs
      await fetchActionLogs(alert.actionHubId);
      
      // Add a console log as feedback
      console.log(`Guest ${guestEmail.trim()} added successfully`);
      
      // In a real application, you would show a toast/snackbar notification here
    } catch (err) {
      console.error('Error adding guest:', err);
      // In a real application, you would show an error notification here
    }
  };
  
  const handleNotifyGuests = async () => {
    if (!alert) return;
    
    try {
      setSendingNotification(true);
      
      // Get unnotified guests
      const unnotifiedGuests = alert.guests?.filter(g => !g.notificationSent) || [];
      
      if (unnotifiedGuests.length === 0) {
        console.log('No unnotified guests to notify');
        setSendingNotification(false);
        return;
      }
      
      // Get IDs of unnotified guests
      const unnotifiedGuestIds = unnotifiedGuests.map(g => g._id);
      
      // Use the default message or current instructions
      const message = instructions.trim() 
        ? instructions 
        : `Important information regarding your stay: ${alert.title || 'Alert notification'}`;
      
      // Notify only unnotified guests
      const result = await notifyGuests(alert.actionHubId, message, unnotifiedGuestIds);
      
      // Set success and failure counts
      if (result.emailResults) {
        const successCount = result.emailResults.filter(r => r.success).length;
        const failCount = result.emailResults.filter(r => !r.success).length;
        setNotificationSuccessCount(successCount);
        setNotificationFailCount(failCount);
      }
      
      // Refresh the alert to get the updated guest notification status
      const updatedAlert = await getFlaggedAlertById(alertId);
      setAlert(updatedAlert);
      
      // Calculate updated notification stats
      if (updatedAlert.guests && updatedAlert.guests.length > 0) {
        const notifiedGuests = updatedAlert.guests.filter(guest => guest.notificationSent).length;
        setTotalGuestsCount(updatedAlert.guests.length);
        setNotifiedGuestsCount(notifiedGuests);
      }
      
      // Refresh action logs
      await fetchActionLogs(alert.actionHubId);
    } catch (err) {
      console.error('Error notifying guests:', err);
    } finally {
      setSendingNotification(false);
    }
  };


  const handleRecipientChange = (event: SelectChangeEvent) => {
    setRecipientType(event.target.value as string);
    // Reset notification stats and selected guests when switching tabs
    setNotificationSuccessCount(0);
    setNotificationFailCount(0);
    setSelectedGuestIds([]);
  };

  // Handle resend to selected guests
  const handleResendToGuests = async (guestIds: string[]) => {
    if (!alert || guestIds.length === 0) return;
    
    try {
      setSendingNotification(true);
      
      // Use the default message or the current instructions
      const message = instructions.trim() 
        ? instructions 
        : `Important information regarding your stay: ${alert.title || 'Alert notification'}`;
      
      // Call API to resend to specific guest IDs
      const result = await notifyGuests(alert.actionHubId, message, guestIds);
      
      // Update notification counts
      const updatedAlert = await getFlaggedAlertById(alertId);
      setAlert(updatedAlert);
      
      // Calculate updated notification stats
      if (updatedAlert.guests && updatedAlert.guests.length > 0) {
        const notifiedGuests = updatedAlert.guests.filter(guest => guest.notificationSent).length;
        setNotifiedGuestsCount(notifiedGuests);
      }
      
      // Set success and failure counts
      if (result.emailResults) {
        const successCount = result.emailResults.filter(r => r.success).length;
        const failCount = result.emailResults.filter(r => !r.success).length;
        setNotificationSuccessCount(successCount);
        setNotificationFailCount(failCount);
      }
      
      // Refresh action logs
      await fetchActionLogs(alert.actionHubId);
      
      // Clear selected guests
      setSelectedGuestIds([]);
      
    } catch (err) {
      console.error('Error resending to guests:', err);
    } finally {
      setSendingNotification(false);
    }
  };
  
  // Handle resend to all team members
  const handleResendToTeam = async () => {
    if (!alert) return;
    
    try {
      setSendingNotification(true);
      
      // Use the default message or the current instructions
      const message = instructions.trim() 
        ? instructions 
        : `Team notification regarding ${alert.title || 'Alert'}: Please review and act accordingly.`;
      
      // Call API to resend to team
      const result = await notifyTeam(alert.actionHubId, message);
      
      // Set notification count
      setNotifiedTeamCount(1);
      
      // Set success and failure counts
      if (result.emailResults) {
        const successCount = result.emailResults.filter(r => r.success).length;
        const failCount = result.emailResults.filter(r => !r.success).length;
        setNotificationSuccessCount(successCount);
        setNotificationFailCount(failCount);
      }
      
      // Refresh action logs
      await fetchActionLogs(alert.actionHubId);
      
    } catch (err) {
      console.error('Error resending to team:', err);
    } finally {
      setSendingNotification(false);
    }
  };

  const handleForwardAlert = async () => {
    if (!alert) return;
    
    try {
      setSendingNotification(true);
      const message = `${alert.title || 'Alert notification'}: ${instructions || 'Please review this alert'}`;
      
      if (recipientType === 'guests') {
        // Check if we have any guests to notify
        if (!alert.guests || alert.guests.length === 0) {
          // No guests added yet
          if (guestEmail.trim()) {
            // If there's a guest email in the input field, add it first
            await handleAddGuest();
            // After adding the guest, fetch the updated alert data
            const updatedAlert = await getFlaggedAlertById(alertId);
            setAlert(updatedAlert);
          } else {
            console.log('No guests to notify');
            setSendingNotification(false);
            return; // Don't proceed if no guests
          }
        }
        
        // Get only unnotified guests
        const unnotifiedGuests = alert.guests?.filter(g => !g.notificationSent);
        const unnotifiedGuestIds = unnotifiedGuests?.map(g => g._id) || [];
        
        if (unnotifiedGuests && unnotifiedGuests.length > 0) {
          const result = await notifyGuests(alert.actionHubId, message, unnotifiedGuestIds);
          console.log(`Notified ${unnotifiedGuests.length} guests`);
          
          // Set success and failure counts
          if (result.emailResults) {
            const successCount = result.emailResults.filter(r => r.success).length;
            const failCount = result.emailResults.filter(r => !r.success).length;
            setNotificationSuccessCount(successCount);
            setNotificationFailCount(failCount);
          }
        } else {
          console.log('All guests already notified');
          setSendingNotification(false);
          return; // Don't proceed if all guests already notified
        }
      } else if (recipientType === 'team') {
        // Check if there are team members to notify
        if (!alert.teamMembers || alert.teamMembers.length === 0) {
          console.log('No team members to notify');
          setSendingNotification(false);
          return; // Don't proceed if no team members
        }
        
        const result = await notifyTeam(alert.actionHubId, message);
        console.log(`Notified ${alert.teamMembers.length} team members`);
        
        // Set success and failure counts
        if (result.emailResults) {
          const successCount = result.emailResults.filter(r => r.success).length;
          const failCount = result.emailResults.filter(r => !r.success).length;
          setNotificationSuccessCount(successCount);
          setNotificationFailCount(failCount);
        }
        
        // Set team as notified
        setNotifiedTeamCount(1);
      }
      
      // Refresh the alert to get the updated status
      const updatedAlert = await getFlaggedAlertById(alertId);
      setAlert(updatedAlert);
      
      // Update notification counts
      if (updatedAlert.guests && updatedAlert.guests.length > 0) {
        const notifiedGuests = updatedAlert.guests.filter(guest => guest.notificationSent).length;
        setTotalGuestsCount(updatedAlert.guests.length);
        setNotifiedGuestsCount(notifiedGuests);
      }
      
      // Refresh action logs
      await fetchActionLogs(alert.actionHubId);
      
      // Clear instructions
      setInstructions('');
      
    } catch (err) {
      console.error('Error forwarding alert:', err);
    } finally {
      setSendingNotification(false);
    }
  };


  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !alert) {
    return (
      <Box textAlign="center" p={3}>
        <Typography variant="h6" color="error" gutterBottom>
          {error || 'Alert not found'}
        </Typography>
        <Button 
          variant="contained" 
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  if (isExpanded) {
    // Expanded view to match the provided image
    return (
      <Box sx={{ backgroundColor: '#fff', height: '100vh' }}>
        <Box sx={{ 
          position: 'sticky', 
          top: 0, 
          bgcolor: 'background.paper', 
          zIndex: 10, 
          py: 1.5, 
          px: 2, 
          display: 'flex', 
          alignItems: 'center',
          borderBottom: '1px solid #eaeaea' 
        }}>
          <IconButton onClick={() => setIsExpanded(false)} color="inherit" aria-label="back" sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
        </Box>

        <Box sx={{ px: 2, py: 2 }}>
          {/* Title with timestamp */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" component="h1">
              {alert.title || 'Untitled Alert'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {alert.createdAt ? format(new Date(alert.createdAt), 'H') + 'h' : '26h'}
            </Typography>
          </Box>
          
          {/* Location */}
          <Typography variant="body1" sx={{ mb: 2 }}>
            {alert.city || 'Princess Street'}
          </Typography>
          
          {/* Description */}
          <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary', lineHeight: 1.6 }}>
            {alert.description || 'Roads closures expected, resulting in delayed check-ins. Notify guests alternative routes, suggest early-check ins, and prepare staff for detour info.'}
          </Typography>

          {/* Start Time */}
          <Typography variant="subtitle1" fontWeight="500">
            Start Time
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {alert.expectedStart 
              ? format(new Date(alert.expectedStart), 'dd MMM h:mma') 
              : '06 May 9:00AM'}
          </Typography>

          {/* End Time */}
          <Typography variant="subtitle1" fontWeight="500">
            End Time
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {alert.expectedEnd 
              ? format(new Date(alert.expectedEnd), 'dd MMM h:mma') 
              : '14 May 12:00PM'}
          </Typography>

          {/* Type and Impact */}
          <Box display="flex" justifyContent="space-between" sx={{ mb: 4 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Type:
              </Typography>
              <Typography variant="body1">
                {alert.alertType || 'Transport'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" align="right">
                Impact:
              </Typography>
              <Typography variant="body1" align="right">
                {alert.impact || 'Moderate'}
              </Typography>
            </Box>
          </Box>

          {/* Footer buttons */}
          <Box display="flex" justifyContent="space-between" sx={{ mt: 4, pt: 2, borderTop: '1px solid #eaeaea' }}>
            <Button
              variant="text"
              startIcon={alert.isFollowing ? <NotificationsActive /> : <NotificationsNone />}
              size="small"
              sx={{ color: alert.isFollowing ? 'primary.main' : 'text.primary' }}
              onClick={handleFollowToggle}
            >
              {alert.isFollowing ? 'Following' : 'Follow Updates'}
            </Button>
            
            <Button
              variant="text"
              startIcon={alert.isFlagged ? <Flag /> : <FlagOutlined />}
              size="small"
              sx={{ color: 'text.primary' }}
              onClick={handleFlagToggle}
            >
              {alert.isFlagged ? 'Flagged' : 'Flag'}
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  // Default view with action hub functionality - Mobile design
  return (
    <Box sx={{ backgroundColor: '#fff', height: '100%', pb: 4 }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        p: 2, 
        borderBottom: '1px solid #eaeaea'
      }}>
        <IconButton onClick={handleBack} edge="start" aria-label="back">
          <ArrowBack />
        </IconButton>
      </Box>

      {/* Time and Title */}
      <Box sx={{ px: 3, pt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {alert ? getTimeAgo(alert.createdAt) : ''}
        </Typography>
        
        <Typography variant="h6" fontWeight="bold" sx={{ mt: 1, mb: 2 }}>
          {alert.title || 'Untitled Alert'}
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 3 }}>
          {alert.description || 'No description available'}
        </Typography>
      </Box>

      {/* Details */}
      <Box sx={{ px: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" fontWeight="bold">Location</Typography>
          <Typography variant="body2">{alert.city || 'Unknown location'}</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" fontWeight="bold">Start Date</Typography>
          <Typography variant="body2">
            {alert.expectedStart ? format(new Date(alert.expectedStart), 'dd MMM h:mma') : '—'}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" fontWeight="bold">End Date</Typography>
          <Typography variant="body2">
            {alert.expectedEnd ? format(new Date(alert.expectedEnd), 'dd MMM h:mma') : '—'}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="body2" fontWeight="bold">Impact Level</Typography>
          <Typography variant="body2">{alert.impact || 'Not specified'}</Typography>
        </Box>
      </Box>

      {/* Forward Alert Section */}
      <Box sx={{ px: 3, py: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
          FORWARD TO
        </Typography>
        
        <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 2 }}>
          <Select
            value={recipientType}
            onChange={handleRecipientChange}
            displayEmpty
          >
            <MenuItem value="guests">Guests</MenuItem>
            <MenuItem value="team">Team Members</MenuItem>
          </Select>
        </FormControl>
        
        {recipientType === 'guests' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Add Guest Details:
            </Typography>
            
            <TextField
              label="Guest Email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              fullWidth
              margin="dense"
              size="small"
              sx={{ mb: 1 }}
              disabled={isViewOnly()}
            />
            
            <TextField
              label="Guest Name (optional)"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              fullWidth
              margin="dense"
              size="small"
              sx={{ mb: 1 }}
              disabled={isViewOnly()}
            />
            
            <Button
              variant="outlined"
              size="small"
              sx={{ mt: 1 }}
              onClick={handleAddGuest}
              disabled={!guestEmail.trim() || isViewOnly()}
            >
              Add Guest
            </Button>
            
            {/* Show list of added guests */}
            {alert.guests && alert.guests.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Guest List ({alert.guests.length}):
                  {notifiedGuestsCount > 0 && (
                    <Typography component="span" sx={{ ml: 1, color: 'success.main', fontSize: '0.8rem' }}>
                      {notifiedGuestsCount} notified
                    </Typography>
                  )}
                </Typography>
                
                <List dense sx={{ maxHeight: '150px', overflow: 'auto' }}>
                  {alert.guests.map((guest, index) => (
                    <ListItem 
                      key={index} 
                      sx={{ 
                        py: 0.5,
                        bgcolor: selectedGuestIds.includes(guest._id) ? 'rgba(0, 0, 0, 0.04)' : 'transparent'
                      }}
                      secondaryAction={
                        <Box>
                          {guest.notificationSent ? (
                            <Tooltip title={`Notified on ${new Date(guest.sentTimestamp || '').toLocaleString()}`}>
                              <Done color="success" fontSize="small" />
                            </Tooltip>
                          ) : (
                            <Tooltip title="Not notified yet">
                              <Email color="disabled" fontSize="small" />
                            </Tooltip>
                          )}
                        </Box>
                      }
                      onClick={() => {
                        // Don't allow selection for view-only users
                        if (isViewOnly()) return;
                        
                        // Toggle selection of this guest for resending
                        setSelectedGuestIds(prev => 
                          prev.includes(guest._id) 
                            ? prev.filter(id => id !== guest._id) 
                            : [...prev, guest._id]
                        );
                      }}
                    >
                      <ListItemText 
                        primary={
                          <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                            {guest.email}
                            {guest.notificationSent && (
                              <Chip 
                                label="Sent" 
                                size="small" 
                                color="success" 
                                sx={{ ml: 1, height: 20, fontSize: '0.65rem' }} 
                              />
                            )}
                          </Box>
                        }
                        secondary={guest.name || ''}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
                
                {selectedGuestIds.length > 0 && (
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    size="small"
                    sx={{ mt: 1 }}
                    onClick={() => handleResendToGuests(selectedGuestIds)}
                    disabled={isViewOnly()}
                  >
                    Resend to {selectedGuestIds.length} selected
                  </Button>
                )}
                
                {notifiedGuestsCount > 0 && notifiedGuestsCount < totalGuestsCount && (
                  <Button
                    variant="outlined"
                    startIcon={<Email />}
                    size="small"
                    sx={{ mt: 1, ml: selectedGuestIds.length > 0 ? 1 : 0 }}
                    onClick={handleNotifyGuests}
                    disabled={isViewOnly()}
                  >
                    Notify Remaining ({totalGuestsCount - notifiedGuestsCount})
                  </Button>
                )}
              </Box>
            )}
          </Box>
        )}
        
        {recipientType === 'team' && alert.teamMembers && alert.teamMembers.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Team Members ({alert.teamMembers.length}):
              {notifiedTeamCount > 0 && (
                <Typography component="span" sx={{ ml: 1, color: 'success.main', fontSize: '0.8rem' }}>
                  Team notified
                </Typography>
              )}
            </Typography>
            <List dense sx={{ maxHeight: '150px', overflow: 'auto' }}>
              {alert.teamMembers.map((member, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemText 
                    primary={
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                        {member.name || member.email}
                        {notifiedTeamCount > 0 && (
                          <Chip 
                            label="Notified" 
                            size="small" 
                            color="success" 
                            sx={{ ml: 1, height: 20, fontSize: '0.65rem' }} 
                          />
                        )}
                      </Box>
                    }
                    secondary={`${member.email} • ${member.role === 'manager' ? 'Manager' : 'Viewer'}`}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))}
            </List>
            
            {notifiedTeamCount > 0 ? (
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                size="small"
                sx={{ mt: 1 }}
                onClick={handleResendToTeam}
                disabled={isViewOnly()}
              >
                Resend to team
              </Button>
            ) : (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Team will be notified when you forward the alert
              </Typography>
            )}
          </Box>
        )}
        
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 3, mb: 2 }}>
          ADD INSTRUCTIONS
        </Typography>
        
        <TextField
          fullWidth
          multiline
          rows={4}
          placeholder="Add instructions here..."
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          variant="outlined"
          sx={{ mb: 2 }}
          disabled={isViewOnly()}
        />
        
        <Button
          variant="contained"
          fullWidth
          color="primary"
          startIcon={sendingNotification ? undefined : <Send />}
          onClick={handleForwardAlert}
          disabled={sendingNotification || 
            (recipientType === 'guests' && notifiedGuestsCount === totalGuestsCount && totalGuestsCount > 0) ||
            (recipientType === 'team' && notifiedTeamCount > 0) ||
            isViewOnly()}
          sx={{ 
            mt: 2,
            mb: 3,
            py: 1.5,
            bgcolor: 'black',
            '&:hover': { bgcolor: '#333' },
            textTransform: 'uppercase',
            fontWeight: 'bold'
          }}
        >
          {sendingNotification ? (
            <CircularProgress size={24} color="inherit" />
          ) : recipientType === 'guests' && notifiedGuestsCount === totalGuestsCount && totalGuestsCount > 0 ? (
            'ALL GUESTS NOTIFIED'
          ) : recipientType === 'team' && notifiedTeamCount > 0 ? (
            'TEAM NOTIFIED'
          ) : (
            'FORWARD ALERT'
          )}
        </Button>
        
        {/* Notification results */}
        {(notificationSuccessCount > 0 || notificationFailCount > 0) && (
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
            {notificationSuccessCount > 0 && (
              <Chip
                icon={<Done />}
                label={`${notificationSuccessCount} sent successfully`}
                color="success"
                size="small"
              />
            )}
            {notificationFailCount > 0 && (
              <Chip
                icon={<Warning />}
                label={`${notificationFailCount} failed`}
                color="error"
                size="small"
              />
            )}
          </Box>
        )}
      </Box>

      {/* Activity Log */}
      <Box sx={{ px: 3, py: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          ACTIVITY LOG
        </Typography>
        
        {/* Status Chip */}
        <Box sx={{ mt: 2, mb: 3 }}>
          <Chip 
            label={
              alert.status === 'in_progress' ? 'In Progress' : 
              alert.status === 'handled' ? 'Handled' : 'New'
            }
            size="medium"
            sx={{ 
              bgcolor: 
                alert.status === 'in_progress' ? '#ff9800' : 
                alert.status === 'handled' ? '#4caf50' : '#2196f3',
              color: 'white',
              fontWeight: 'medium',
              px: 1
            }}
          />
        </Box>
        
        {logsLoading ? (
          <CircularProgress size={20} sx={{ my: 1 }} />
        ) : actionLogs.length > 0 ? (
          <Box sx={{ mb: 3 }}>
            {actionLogs.slice(0, 5).map((log, index) => (
              <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                {log.formattedDate || (log.timestamp && format(new Date(log.timestamp), 'dd MMM'))} {log.formattedTime || (log.timestamp && format(new Date(log.timestamp), 'h:mma'))} – {log.displayName} {log.actionDetails}
              </Typography>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No activity logged yet.
          </Typography>
        )}
        
        {/* Action Buttons */}
        <Box sx={{ mt: 3 }}>
          {alert.status !== 'handled' && (
            <Button
              variant="outlined"
              fullWidth
              onClick={() => handleStatusChange('handled')}
              disabled={isViewOnly()}
              sx={{ 
                mb: 2,
                py: 1.5,
                borderColor: '#4caf50',
                color: '#4caf50',
                '&:hover': { borderColor: '#4caf50', bgcolor: 'rgba(76, 175, 80, 0.1)' },
                textTransform: 'none',
                fontWeight: 'bold'
              }}
            >
              Mark as Handled
            </Button>
          )}
          
          <Button
            variant="outlined"
            fullWidth
            onClick={handleFollowToggle}
            disabled={isViewOnly()}
            sx={{ 
              py: 1.5,
              borderColor: alert.isFollowing ? 'primary.main' : 'inherit',
              color: alert.isFollowing ? 'primary.main' : 'inherit',
              textTransform: 'none',
              fontWeight: 'bold'
            }}
          >
            {alert.isFollowing ? 'Unfollow Alert' : 'Follow Alert'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ActionHubDetail; 