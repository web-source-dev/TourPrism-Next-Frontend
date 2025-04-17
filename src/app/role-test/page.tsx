'use client';

import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  Alert,
  Chip,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useAuth } from '@/context/AuthContext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import GroupIcon from '@mui/icons-material/Group';

// Interface for tab panel props
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Tab Panel component
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`role-tabpanel-${index}`}
      aria-labelledby={`role-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Main component
export default function RoleTestPage() {
  // Get role info from auth context
  const {
    user,
    isAdmin,
    isSuperAdmin,
    isManager,
    isViewer,
    isEditor,
    isCollaboratorViewer,
    isCollaboratorManager,
    isCollaborator,
    collaboratorRole,
    hasRole,
    isAuthenticated,
  } = useAuth();

  // Tab value state
  const [value, setValue] = useState(0);

  // Handle tab change
  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  // Function to render role status
  const RoleStatus = ({ active }: { active: boolean }) => (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {active ? (
        <>
          <CheckCircleIcon color="success" fontSize="small" sx={{ mr: 1 }} />
          <Typography variant="body2" sx={{ color: 'success.main' }}>Active</Typography>
        </>
      ) : (
        <>
          <CancelIcon color="error" fontSize="small" sx={{ mr: 1 }} />
          <Typography variant="body2" sx={{ color: 'error.main' }}>Inactive</Typography>
        </>
      )}
    </Box>
  );

  // Role access grid component
  const RoleAccessGrid = () => {
    const features = [
      { name: 'View Dashboard', roles: ['admin', 'superadmin', 'manager'] },
      { name: 'Edit Alerts', roles: ['admin', 'superadmin', 'editor'] },
      { name: 'Delete Alerts', roles: ['admin', 'superadmin'] },
      { name: 'Manage Users', roles: ['admin', 'superadmin'] },
      { name: 'View Reports', roles: ['admin', 'superadmin', 'manager', 'viewer', 'collaborator-viewer', 'collaborator-manager'] },
      { name: 'Edit Settings', roles: ['admin', 'superadmin'] },
    ];

    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>Feature Access Tests</Typography>
        <List>
          {features.map((feature, index) => {
            // Calculate if the current user role has access to this feature
            // For collaborators, we prefix with 'collaborator-' for the hasRole check
            let roleToCheck: string[] = [];
            
            if (isCollaborator && collaboratorRole) {
              roleToCheck = [`collaborator-${collaboratorRole}`, ...feature.roles];
            } else {
              roleToCheck = feature.roles;
            }
            
            const hasAccess = hasRole(feature.roles);
            
            return (
              <ListItem key={index} divider>
                <ListItemIcon>
                  {hasAccess ? <LockOpenIcon color="success" /> : <LockIcon color="error" />}
                </ListItemIcon>
                <ListItemText 
                  primary={feature.name} 
                  secondary={
                    <>
                      Allowed roles: {feature.roles.join(', ')}
                      <Chip 
                        size="small" 
                        label={hasAccess ? 'Access Granted' : 'Access Denied'} 
                        color={hasAccess ? 'success' : 'error'}
                        sx={{ ml: 1 }}
                      />
                    </>
                  }
                />
              </ListItem>
            );
          })}
        </List>
      </Box>
    );
  };

  // If user is not authenticated, show a message
  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          You are not logged in. Please log in to test roles.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Role Testing Dashboard
      </Typography>
      
      {/* Current User Info Card */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>Current User</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1">Email: {user?.email}</Typography>
            <Typography variant="subtitle1">Role: {user?.role || 'No role'}</Typography>
            {isCollaborator && (
              <>
                <Typography variant="subtitle1">
                  Collaborator: Yes (Role: {collaboratorRole})
                </Typography>
              </>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>Active Roles:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {isAdmin && <Chip icon={<AdminPanelSettingsIcon />} label="Admin" color="primary" />}
              {isSuperAdmin && <Chip icon={<SupervisorAccountIcon />} label="Super Admin" color="secondary" />}
              {isManager && <Chip icon={<PersonIcon />} label="Manager" color="info" />}
              {isViewer && <Chip icon={<VisibilityIcon />} label="Viewer" color="default" />}
              {isEditor && <Chip icon={<EditIcon />} label="Editor" color="warning" />}
              {isCollaboratorViewer && <Chip icon={<GroupIcon />} label="Collaborator (Viewer)" color="success" />}
              {isCollaboratorManager && <Chip icon={<GroupIcon />} label="Collaborator (Manager)" color="error" />}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Role Testing Tabs */}
      <Paper elevation={3} sx={{ mt: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="role testing tabs">
            <Tab label="Admin" />
            <Tab label="Super Admin" />
            <Tab label="Manager" />
            <Tab label="Viewer" />
            <Tab label="Editor" />
            <Tab label="Collaborator" />
          </Tabs>
        </Box>

        {/* Admin Tab */}
        <TabPanel value={value} index={0}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>Admin Role</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Status</Typography>
                    <RoleStatus active={isAdmin} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      {isAdmin 
                        ? "You have Admin privileges. You can access all admin features." 
                        : "You don't have Admin privileges."}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Admin Capabilities</Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                        <ListItemText primary="Manage users" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                        <ListItemText primary="Access admin dashboard" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                        <ListItemText primary="Approve/reject alerts" />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
          <RoleAccessGrid />
        </TabPanel>

        {/* Super Admin Tab */}
        <TabPanel value={value} index={1}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>Super Admin Role</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Status</Typography>
                    <RoleStatus active={isSuperAdmin} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      {isSuperAdmin 
                        ? "You have Super Admin privileges. You have the highest level of access." 
                        : "You don't have Super Admin privileges."}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Super Admin Capabilities</Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                        <ListItemText primary="All Admin privileges" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                        <ListItemText primary="Manage other admins" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                        <ListItemText primary="System configuration" />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
          <RoleAccessGrid />
        </TabPanel>

        {/* Manager Tab */}
        <TabPanel value={value} index={2}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>Manager Role</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Status</Typography>
                    <RoleStatus active={isManager} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      {isManager 
                        ? "You have Manager privileges." 
                        : "You don't have Manager privileges."}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Manager Capabilities</Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                        <ListItemText primary="View dashboard" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                        <ListItemText primary="Generate reports" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CancelIcon color="error" /></ListItemIcon>
                        <ListItemText primary="Cannot manage users" />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
          <RoleAccessGrid />
        </TabPanel>

        {/* Viewer Tab */}
        <TabPanel value={value} index={3}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>Viewer Role</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Status</Typography>
                    <RoleStatus active={isViewer} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      {isViewer 
                        ? "You have Viewer privileges." 
                        : "You don't have Viewer privileges."}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Viewer Capabilities</Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                        <ListItemText primary="View reports" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CancelIcon color="error" /></ListItemIcon>
                        <ListItemText primary="Cannot edit anything" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CancelIcon color="error" /></ListItemIcon>
                        <ListItemText primary="No admin access" />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
          <RoleAccessGrid />
        </TabPanel>

        {/* Editor Tab */}
        <TabPanel value={value} index={4}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>Editor Role</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Status</Typography>
                    <RoleStatus active={isEditor} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      {isEditor 
                        ? "You have Editor privileges." 
                        : "You don't have Editor privileges."}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Editor Capabilities</Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                        <ListItemText primary="Create/Edit alerts" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                        <ListItemText primary="Update content" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CancelIcon color="error" /></ListItemIcon>
                        <ListItemText primary="No user management" />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
          <RoleAccessGrid />
        </TabPanel>

        {/* Collaborator Tab */}
        <TabPanel value={value} index={5}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>Collaborator Roles</Typography>
            <Divider sx={{ mb: 2 }} />
            
            {isCollaborator ? (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">Status</Typography>
                      <Typography variant="body1">
                        Collaborator Type: {collaboratorRole || "Unknown"}
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2">Viewer Permission:</Typography>
                        <RoleStatus active={isCollaboratorViewer} />
                      </Box>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2">Manager Permission:</Typography>
                        <RoleStatus active={isCollaboratorManager} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">Collaborator Capabilities</Typography>
                      {isCollaboratorViewer && (
                        <List dense>
                          <ListItem>
                            <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                            <ListItemText primary="View shared alerts" />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                            <ListItemText primary="Access reports" />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon><CancelIcon color="error" /></ListItemIcon>
                            <ListItemText primary="No management permission" />
                          </ListItem>
                        </List>
                      )}
                      {isCollaboratorManager && (
                        <List dense>
                          <ListItem>
                            <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                            <ListItemText primary="All viewer permissions" />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                            <ListItemText primary="Manage alerts" />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                            <ListItemText primary="Edit shared content" />
                          </ListItem>
                        </List>
                      )}
                      {!isCollaboratorViewer && !isCollaboratorManager && (
                        <Typography variant="body2" color="error">
                          No valid collaborator role detected.
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            ) : (
              <Alert severity="info">
                You are not logged in as a collaborator user. This tab displays collaborator-specific roles.
              </Alert>
            )}
          </Box>
          <RoleAccessGrid />
        </TabPanel>
      </Paper>
    </Box>
  );
} 