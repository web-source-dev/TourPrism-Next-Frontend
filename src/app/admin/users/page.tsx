'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
  Chip,
  TextField,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Tab,
  Tabs,
  Pagination,
  Tooltip
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import { getUsers, getUserById, updateUserRole } from '@/services/adminApi';
import { User } from '@/types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-tabpanel-${index}`}
      aria-labelledby={`user-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function UsersManagement() {
  const { isAuthenticated, isAdmin, isSuperAdmin, isLoading } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<'user' | 'admin' | 'superadmin'>('user');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [userStats, setUserStats] = useState({
    total: 0,
    admins: 0,
    superadmins: 0,
    regularUsers: 0,
    verified: 0,
    unverified: 0
  });
  const router = useRouter();
  
  // For action menu (more options)
  const handleActionMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, user: User) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedUser(user);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
  };

  // Tab change handler
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Update filtered users based on tab
    filterUsersByTab(newValue);
  };

  // Filter users based on selected tab
  const filterUsersByTab = (tabIndex: number) => {
    if (users.length === 0) return;
    
    switch(tabIndex) {
      case 0: // All Users
        setFilteredUsers(users);
        break;
      case 1: // Admins
        setFilteredUsers(users.filter(user => 
          user.role === 'admin' || user.role === 'superadmin'
        ));
        break;
      case 2: // Regular Users
        setFilteredUsers(users.filter(user => 
          user.role === 'user' || !user.role
        ));
        break;
      case 3: // Verified Users
        setFilteredUsers(users.filter(user => user.isVerified));
        break;
      case 4: // Unverified Users
        setFilteredUsers(users.filter(user => !user.isVerified));
        break;
      default:
        setFilteredUsers(users);
    }
  };

  // Pagination handler
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // Handle user role change dialog
  const handleRoleDialogOpen = () => {
    if (selectedUser) {
      setNewRole(selectedUser.role || 'user');
    }
    setRoleDialogOpen(true);
    handleActionMenuClose();
  };

  const handleRoleDialogClose = () => {
    setRoleDialogOpen(false);
  };

  const handleRoleChange = (event: SelectChangeEvent) => {
    setNewRole(event.target.value as 'user' | 'admin' | 'superadmin');
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    
    try {
      await updateUserRole(selectedUser._id, newRole);
      
      // Update local state to reflect the change
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === selectedUser._id ? { ...user, role: newRole } : user
        )
      );
      
      // Also update filtered users
      setFilteredUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === selectedUser._id ? { ...user, role: newRole } : user
        )
      );
      
      // Recalculate user stats
      calculateUserStats(users.map(user => 
        user._id === selectedUser._id ? { ...user, role: newRole } : user
      ));
      
      setRoleDialogOpen(false);
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  // Calculate user statistics from the users array
  const calculateUserStats = (userArray: User[]) => {
    const stats = {
      total: userArray.length,
      admins: userArray.filter(user => user.role === 'admin').length,
      superadmins: userArray.filter(user => user.role === 'superadmin').length,
      regularUsers: userArray.filter(user => !user.role || user.role === 'user').length,
      verified: userArray.filter(user => user.isVerified).length,
      unverified: userArray.filter(user => !user.isVerified).length
    };
    setUserStats(stats);
  };

  // Fetch users data
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await getUsers();
      setUsers(response.users || []);
      setFilteredUsers(response.users || []);
      calculateUserStats(response.users || []);
      setTotalPages(Math.ceil((response.users?.length || 0) / 10));
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchData();
    }
  }, [isAuthenticated, isAdmin]);

  // Handle search
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      filterUsersByTab(tabValue);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const searchResults = users.filter(user => 
      user.email.toLowerCase().includes(query) || 
      (user.name && user.name.toLowerCase().includes(query))
    );
    
    setFilteredUsers(searchResults);
  };

  // Get paginated users
  const getPaginatedUsers = () => {
    const startIndex = (page - 1) * 10;
    const endIndex = startIndex + 10;
    return filteredUsers.slice(startIndex, endIndex);
  };

  if (isLoading || loading) {
    return (
      <AdminLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Users Management
          </Typography>
        </Box>

        {/* User statistics */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: '#f5f5f5',
              borderRadius: 2,
              flex: '1 1 200px'
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Total Users
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              {userStats.total}
            </Typography>
          </Paper>
          
          <Paper
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: '#e3f2fd',
              borderRadius: 2,
              flex: '1 1 200px'
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Admin Users
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1, color: '#2196f3' }}>
              {userStats.admins + userStats.superadmins}
            </Typography>
          </Paper>
          
          <Paper
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: '#e8f5e9',
              borderRadius: 2,
              flex: '1 1 200px'
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Verified Users
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1, color: '#4caf50' }}>
              {userStats.verified}
            </Typography>
          </Paper>
          
          <Paper
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: '#ffebee',
              borderRadius: 2,
              flex: '1 1 200px'
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Unverified Users
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1, color: '#f44336' }}>
              {userStats.unverified}
            </Typography>
          </Paper>
        </Box>

        {/* Search bar */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <TextField
            label="Search users by email or name"
            variant="outlined"
            size="small"
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
          />
          <Button 
            variant="contained" 
            onClick={handleSearch}
            sx={{ 
              bgcolor: 'black', 
              '&:hover': { bgcolor: '#333' },
              whiteSpace: 'nowrap'
            }}
          >
            Search
          </Button>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="user tabs">
            <Tab label="All Users" />
            <Tab label="Admins" />
            <Tab label="Regular Users" />
            <Tab label="Verified" />
            <Tab label="Unverified" />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          <UsersList 
            users={getPaginatedUsers()} 
            onActionClick={handleActionMenuOpen}
            isSuperAdmin={isSuperAdmin}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <UsersList 
            users={getPaginatedUsers()} 
            onActionClick={handleActionMenuOpen}
            isSuperAdmin={isSuperAdmin}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <UsersList 
            users={getPaginatedUsers()} 
            onActionClick={handleActionMenuOpen}
            isSuperAdmin={isSuperAdmin}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <UsersList 
            users={getPaginatedUsers()} 
            onActionClick={handleActionMenuOpen}
            isSuperAdmin={isSuperAdmin}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={4}>
          <UsersList 
            users={getPaginatedUsers()} 
            onActionClick={handleActionMenuOpen}
            isSuperAdmin={isSuperAdmin}
          />
        </TabPanel>

        {/* Pagination */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination 
            count={Math.max(1, Math.ceil(filteredUsers.length / 10))} 
            page={page} 
            onChange={handlePageChange} 
            color="primary" 
          />
        </Box>

        {/* Action Menu */}
        <Menu
          anchorEl={actionMenuAnchor}
          open={Boolean(actionMenuAnchor)}
          onClose={handleActionMenuClose}
        >
          {isSuperAdmin && (
            <MenuItem onClick={handleRoleDialogOpen}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <i className="ri-shield-user-line" style={{ marginRight: 8 }} />
                Change Role
              </Box>
            </MenuItem>
          )}
        </Menu>

        {/* Role Change Dialog */}
        <Dialog open={roleDialogOpen} onClose={handleRoleDialogClose}>
          <DialogTitle>Change User Role</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Update role for user: {selectedUser?.email}
            </DialogContentText>
            <FormControl fullWidth>
              <InputLabel id="role-select-label">Role</InputLabel>
              <Select
                labelId="role-select-label"
                value={newRole}
                label="Role"
                onChange={handleRoleChange}
              >
                <MenuItem value="user">Regular User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="superadmin">Super Admin</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleRoleDialogClose}>Cancel</Button>
            <Button onClick={handleUpdateRole} variant="contained" autoFocus>
              Update Role
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AdminLayout>
  );
}

// Users List Component
interface UsersListProps {
  users: User[];
  onActionClick: (event: React.MouseEvent<HTMLButtonElement>, user: User) => void;
  isSuperAdmin: boolean;
}

function UsersList({ users, onActionClick, isSuperAdmin }: UsersListProps) {
  // Get role badge color
  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'superadmin':
        return '#7b1fa2'; // purple
      case 'admin':
        return '#1976d2'; // blue
      default:
        return '#757575'; // gray
    }
  };

  return (
    <Paper
      sx={{
        width: '100%',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {users.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No users found
          </Typography>
        </Box>
      ) : (
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {users.map((user) => (
            <React.Fragment key={user._id}>
              <ListItem
                alignItems="flex-start"
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {isSuperAdmin && (
                      <Tooltip title="Actions">
                        <IconButton 
                          edge="end" 
                          aria-label="actions"
                          onClick={(e) => onActionClick(e, user)}
                        >
                          <i className="ri-more-2-fill" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                }
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: getRoleBadgeColor(user.role) }}>
                    {user.name 
                      ? user.name.charAt(0).toUpperCase() 
                      : user.email.charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {user.email}
                      <Chip 
                        label={user.role?.toUpperCase() || 'USER'} 
                        size="small"
                        sx={{ 
                          bgcolor: getRoleBadgeColor(user.role),
                          color: 'white',
                          fontSize: '0.7rem'
                        }}
                      />
                      <Chip 
                        label={user.isVerified ? 'VERIFIED' : 'UNVERIFIED'} 
                        size="small"
                        color={user.isVerified ? 'success' : 'warning'}
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </Box>
                  }
                  secondary={
                    <React.Fragment>
                      <Typography
                        sx={{ display: 'inline' }}
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {user.name || 'No name provided'}
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Created: {new Date(user.createdAt).toLocaleString()} | Last updated: {new Date(user.updatedAt).toLocaleString()}
                      </Typography>
                    </React.Fragment>
                  }
                />
              </ListItem>
              <Divider variant="inset" component="li" />
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
}