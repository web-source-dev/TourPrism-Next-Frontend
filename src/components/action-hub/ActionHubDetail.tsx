'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
  IconButton,
  Paper,
  TextField,
  List,
  ListItem,
  ListItemText,
  Chip,
  Card,
  CardContent,
  Stack,
  Pagination
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { 
  getFlaggedAlertById, 
  resolveAlertFlags, 
  flagAlert, 
  setActiveTab, 
  addNote, 
  addTeamMessage, 
  addGuests, 
  notifyGuests,
  getActionLogs
} from '@/services/action-hub';
import { ActionHubItem, ActionLog } from '@/types';
import { 
  ArrowBack, 
  Flag, 
  FlagOutlined, 
  Email,
  Message,
  NoteAdd,
  Edit,
  NotificationsActive,
  NotificationsNone,
  Send,
  PersonAdd,
  Save
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { followAlert } from '@/services/alertActions';

interface ActionHubDetailProps {
  alertId: string;
}

const ActionHubDetail: React.FC<ActionHubDetailProps> = ({ alertId }) => {
  const [alert, setAlert] = useState<ActionHubItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTabState] = useState<'notify_guests' | 'message_team' | 'add_notes'>('notify_guests');
  const [noteContent, setNoteContent] = useState<string>('');
  const [messageContent, setMessageContent] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [guestName, setGuestName] = useState<string>('');
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [logsLoading, setLogsLoading] = useState<boolean>(false);
  const [logsPage, setLogsPage] = useState<number>(1);
  const logsPerPage = 10;
  
  console.log(alert);
  const router = useRouter();
  const { isAdmin, isManager } = useAuth();

  useEffect(() => {
    const fetchAlert = async () => {
      try {
        setLoading(true);
        const data = await getFlaggedAlertById(alertId);
        setAlert(data);
        
        // Set the active tab from the retrieved data
        if (data.currentActiveTab) {
          setActiveTabState(data.currentActiveTab);
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
      setAlert(prev => prev ? { 
        ...prev, 
        isFollowing: result.following,
        numberOfFollows: result.numberOfFollows
      } : null);
    } catch (err) {
      console.error('Error toggling follow status:', err);
    }
  };

  const handleResolve = async () => {
    if (!alert) return;
    
    try {
      await resolveAlertFlags(alert.actionHubId);
      router.push('/action-hub');
    } catch (err) {
      console.error('Error resolving flags:', err);
    }
  };

  const handleViewMore = () => {
    setIsExpanded(true);
  };
  
  const handleTabChange = async (newTab: 'notify_guests' | 'message_team' | 'add_notes') => {
    if (!alert) return;
    
    try {
      setActiveTabState(newTab);
      await setActiveTab(alert.actionHubId, newTab);
    } catch (err) {
      console.error('Error changing tab:', err);
    }
  };
  
  const handleAddNote = async () => {
    if (!alert || !noteContent.trim()) return;
    
    try {
      await addNote(alert.actionHubId, noteContent);
      
      // Refresh the alert to get the updated notes
      const updatedAlert = await getFlaggedAlertById(alertId);
      setAlert(updatedAlert);
      
      // Clear input
      setNoteContent('');
      
      // Refresh action logs
      await fetchActionLogs(alert.actionHubId);
    } catch (err) {
      console.error('Error adding note:', err);
    }
  };
  
  const handleSendTeamMessage = async () => {
    if (!alert || !messageContent.trim()) return;
    
    try {
      await addTeamMessage(alert.actionHubId, messageContent);
      
      // Refresh the alert to get the updated messages
      const updatedAlert = await getFlaggedAlertById(alertId);
      setAlert(updatedAlert);
      
      // Clear input
      setMessageContent('');
      
      // Refresh action logs
      await fetchActionLogs(alert.actionHubId);
    } catch (err) {
      console.error('Error sending team message:', err);
    }
  };
  
  const handleAddGuest = async () => {
    if (!alert || !guestEmail.trim()) return;
    
    try {
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
    } catch (err) {
      console.error('Error adding guest:', err);
    }
  };
  
  const handleNotifyGuests = async () => {
    if (!alert) return;
    
    try {
      // Use the default message
      const message = `Important information regarding your stay: ${alert.title || 'Alert notification'}`;
      
      await notifyGuests(alert.actionHubId, message);
      
      // Refresh the alert to get the updated guest notification status
      const updatedAlert = await getFlaggedAlertById(alertId);
      setAlert(updatedAlert);
      
      // Refresh action logs
      await fetchActionLogs(alert.actionHubId);
    } catch (err) {
      console.error('Error notifying guests:', err);
    }
  };

  // Function to handle logs pagination
  const handleLogsPageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setLogsPage(value);
  };

  // Get current logs for pagination
  const getCurrentLogs = () => {
    const indexOfLastLog = logsPage * logsPerPage;
    const indexOfFirstLog = indexOfLastLog - logsPerPage;
    return actionLogs.slice(indexOfFirstLog, indexOfLastLog);
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
    <Box sx={{ backgroundColor: '#fff', height: '100vh' }}>
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

      {/* Content */}
      <Box sx={{ px: 2, py: 1 }}>
        {/* Title and Location */}
        <Typography variant="h6" fontWeight="bold" sx={{ mt: 1, mb: 0.5 }}>
          {alert.title || 'Untitled Alert'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {alert.city || 'Unknown location'}
        </Typography>
        
        {/* Description with View More */}
        <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.5 }}>
          {alert.description ? (
            alert.description.length > 100 ? (
              <>
                {alert.description.substring(0, 100)}...
                <Button 
                  variant="text" 
                  size="small" 
                  onClick={handleViewMore}
                  sx={{ 
                    p: 0, 
                    ml: 0.5,
                    color: 'error.main',
                    textDecoration: 'underline',
                    textTransform: 'none',
                    fontWeight: 'normal',
                    minWidth: 'auto'
                  }}
                >
                  View more
                </Button>
              </>
            ) : (
              <>
                {alert.description}
                <Button 
                  variant="text" 
                  size="small" 
                  onClick={handleViewMore}
                  sx={{ 
                    p: 0, 
                    ml: 0.5,
                    color: 'error.main',
                    textDecoration: 'underline',
                    textTransform: 'none',
                    fontWeight: 'normal',
                    minWidth: 'auto'
                  }}
                >
                  View more
                </Button>
              </>
            )
          ) : (
            'No description provided'
          )}
        </Typography>
        
        {/* Action Buttons */}
        <Stack direction="column" spacing={2} sx={{ mt: 3 }}>
          <Card 
            variant="outlined" 
            sx={{ 
              borderRadius: 2,
              boxShadow: 'none'
            }}
            onClick={() => handleTabChange('notify_guests')}
          >
            <CardContent sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              p: 2, 
              '&:last-child': { pb: 2 },
              cursor: 'pointer'
            }}>
              <Email sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="body1">Notify Guests</Typography>
            </CardContent>
          </Card>
          
          <Card 
            variant="outlined" 
            sx={{ 
              borderRadius: 2,
              boxShadow: 'none'
            }}
            onClick={() => handleTabChange('message_team')}
          >
            <CardContent sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              p: 2, 
              '&:last-child': { pb: 2 },
              cursor: 'pointer'
            }}>
              <Message sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="body1">Message Team</Typography>
            </CardContent>
          </Card>
          
          <Card 
            variant="outlined" 
            sx={{ 
              borderRadius: 2,
              boxShadow: 'none'
            }}
            onClick={() => handleTabChange('add_notes')}
          >
            <CardContent sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              p: 2, 
              '&:last-child': { pb: 2 },
              cursor: 'pointer'
            }}>
              <NoteAdd sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="body1">Add Notes</Typography>
            </CardContent>
          </Card>
        </Stack>
        
        {/* Active Tab Content */}
        {activeTab === 'notify_guests' && (
          <Box sx={{ mt: 3 }}>
            <Box sx={{ mb: 3 }}>
              <TextField
                label="Guest Email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                fullWidth
                margin="dense"
                size="small"
              />
              <TextField
                label="Guest Name (optional)"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                fullWidth
                margin="dense"
                size="small"
              />
              <Button
                variant="outlined"
                startIcon={<PersonAdd />}
                onClick={handleAddGuest}
                sx={{ mt: 1 }}
              >
                Add Guest
              </Button>
            </Box>
            
            {alert.guests && alert.guests.length > 0 ? (
              <Box>
                <List dense>
                  {alert.guests.map((guest, index) => (
                    <ListItem 
                      key={index}
                      secondaryAction={
                        guest.notificationSent ? (
                          <Chip size="small" label="Notified" color="success" />
                        ) : null
                      }
                    >
                      <ListItemText
                        primary={guest.email}
                        secondary={guest.name || 'No name provided'}
                      />
                    </ListItem>
                  ))}
                </List>
                
                <Button
                  variant="contained"
                  fullWidth
                  color="primary"
                  startIcon={<Send />}
                  onClick={handleNotifyGuests}
                  disabled={!alert.guests.some(guest => !guest.notificationSent)}
                  sx={{ mt: 1 }}
                >
                  Send Notifications
                </Button>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No guests added yet.
              </Typography>
            )}
          </Box>
        )}
        
        {activeTab === 'message_team' && (
          <Box sx={{ mt: 3 }}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                bgcolor: '#f8f9fa', 
                borderRadius: 2,
                mb: 3
              }}
            >
              <Typography variant="subtitle2" fontWeight="500" gutterBottom>
                Here&apos;s your pre-written message for Team
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Roads closures expected, resulting in delayed check-ins. Notify guests alternative routes, 
                suggest early-check ins, and prepare staff for detour info.
              </Typography>
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'flex-start', 
                  gap: 2,
                  mt: 2
                }}
              >
                <IconButton size="small" sx={{ color: 'text.secondary' }}>
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton size="small" sx={{ color: 'text.secondary' }}>
                  <Save fontSize="small" />
                </IconButton>
                <IconButton 
                  size="small" 
                  sx={{ color: 'text.secondary' }}
                  onClick={() => {
                    setMessageContent('Roads closures expected, resulting in delayed check-ins. Notify guests alternative routes, suggest early-check ins, and prepare staff for detour info.');
                  }}
                >
                  <Message fontSize="small" />
                </IconButton>
              </Box>
            </Paper>
            
            <TextField
              label="Your Message"
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              fullWidth
              multiline
              rows={3}
              margin="normal"
              size="small"
            />
            
            <Button
              variant="contained"
              fullWidth
              color="primary"
              startIcon={<Send />}
              onClick={handleSendTeamMessage}
              disabled={!messageContent.trim()}
              sx={{ mt: 1 }}
            >
              Send Message
            </Button>
          </Box>
        )}
        
        {activeTab === 'add_notes' && (
          <Box sx={{ mt: 3 }}>
            <TextField
              label="Note"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              fullWidth
              multiline
              rows={3}
              margin="normal"
              size="small"
            />
            
            <Button
              variant="contained"
              fullWidth
              color="primary"
              startIcon={<NoteAdd />}
              onClick={handleAddNote}
              disabled={!noteContent.trim()}
              sx={{ mt: 1 }}
            >
              Add Note
            </Button>
          </Box>
        )}

        {/* Activity Log */}
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography variant="subtitle1" fontWeight="500" gutterBottom>
            Activity Log
          </Typography>
          
          {logsLoading ? (
            <CircularProgress size={20} sx={{ my: 1 }} />
          ) : actionLogs.length > 0 ? (
            <>
              <Box>
                {getCurrentLogs().slice(0, 4).map((log, index) => (
                  <Box
                    key={log._id || index}
                    sx={{
                      py: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      borderBottom: index < getCurrentLogs().slice(0, 4).length - 1 ? '1px solid #f0f0f0' : 'none'
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'text.primary',
                        fontWeight: 'medium'
                      }}
                    >
                      {log.timestamp && format(new Date(log.timestamp), 'dd MMM h:mma')} – 
                      {' '}
                      {log.displayName || (typeof log.user === 'object' ? 
                        (log.user.firstName && log.user.lastName ? 
                          `${log.user.firstName} ${log.user.lastName}` : 
                          log.user.email) : 'User')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {log.actionDetails}
                    </Typography>
                  </Box>
                ))}
              </Box>
              
              {actionLogs.length > 4 && (
                <Box display="flex" justifyContent="center">
                  <Pagination 
                    count={Math.ceil(actionLogs.length / logsPerPage)} 
                    page={logsPage}
                    onChange={handleLogsPageChange}
                    size="small"
                    sx={{ mt: 2 }}
                  />
                </Box>
              )}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No activity logged yet.
            </Typography>
          )}
        </Box>
        
        {/* Admin/Manager Actions */}
        {isAdmin || isManager ? (
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleResolve}
            disabled={alert.status === 'resolved'}
            sx={{
              my: 2,
              py: 1.5,
              bgcolor: alert.status === 'resolved' ? 'success.main' : 'primary.main',
              '&.Mui-disabled': {
                bgcolor: 'success.light',
                color: 'white'
              }
            }}
          >
            {alert.status === 'resolved' ? 'Resolved' : 'Mark as Resolved'}
          </Button>
        ) : null}
      </Box>
    </Box>
  );
};

export default ActionHubDetail; 