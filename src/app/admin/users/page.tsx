'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Button,
  TextField,
  MenuItem,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Snackbar,
  Alert,
  SelectChangeEvent,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
  Tooltip
} from '@mui/material';
import AdminLayout from '@/components/AdminLayout';
import { getAllUsers, updateUserRole } from '@/services/api';
import { User } from '@/types';
import { useAuth } from '@/context/AuthContext';

// Extend User type for additional admin-related fields
interface ExtendedUser extends User {
  followedAlertsCount?: number;
  role: string;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAdmin } = useAuth();

  // Permission check for changing user roles - only admin can change roles
  const canChangeUserRole = isAdmin;
  
  // Permission tooltips
  const changeRoleTooltip = !canChangeUserRole 
    ? "Only administrators can change user roles" 
    : "";

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: page + 1,
        limit: rowsPerPage
      };
      
      if (roleFilter !== 'all') {
        params.role = roleFilter;
      }
      
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      const { users: fetchedUsers, totalCount } = await getAllUsers(params);
      // Convert User[] to ExtendedUser[] with role defaults
      const extendedUsers: ExtendedUser[] = fetchedUsers.map(user => ({
        ...user,
        role: user.role || 'user' // Set default role if missing
      }));
      setUsers(extendedUsers);
      setTotalCount(totalCount);
    } catch (error) {
      console.error('Error fetching users:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load users',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, roleFilter, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRoleFilterChange = (event: SelectChangeEvent<string>) => {
    setRoleFilter(event.target.value);
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const handleRoleChangeClick = (user: ExtendedUser) => {
    setSelectedUser(user);
    setNewRole(user.role || 'user');
    setRoleDialogOpen(true);
  };

  const handleConfirmRoleChange = async () => {
    if (!selectedUser || !newRole) return;
    
    try {
      await updateUserRole(selectedUser._id, newRole);
      setUsers(users.map(user => 
        user._id === selectedUser._id 
          ? { ...user, role: newRole } 
          : user
      ));
      setSnackbar({
        open: true,
        message: `User role updated to ${newRole}`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update user role',
        severity: 'error'
      });
    } finally {
      setRoleDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return { bg: '#e3f2fd', color: '#1565c0' };
      default:
        return { bg: '#f5f5f5', color: '#616161' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Mobile card view for users
  const renderUserCards = () => {
    if (users.length === 0) {
      return (
        <Typography variant="body1" sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>
          No users found
        </Typography>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {users.map(user => (
          <Card 
            key={user._id} 
            elevation={0} 
            sx={{ 
              border: '1px solid #e0e0e0', 
              borderRadius: 2,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.08)'
              }
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {user.email}
                </Typography>
                <Chip
                  label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  size="small"
                  sx={{
                    bgcolor: getRoleColor(user.role).bg,
                    color: getRoleColor(user.role).color,
                    fontWeight: 'medium'
                  }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Name:</Typography>
                  <Typography variant="body2">{user.name || 'Not Set'}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Joined:</Typography>
                  <Typography variant="body2">{formatDate(user.createdAt)}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Status:</Typography>
                  <Typography variant="body2">
                    {user.isVerified ? "Verified" : "Unverified"}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Tooltip title={changeRoleTooltip}>
                  <span>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleRoleChangeClick(user)}
                      disabled={!canChangeUserRole}
                      sx={{ 
                        borderColor: '#ccc', 
                        color: '#555',
                        '&:hover': { borderColor: '#999', backgroundColor: '#f5f5f5' }
                      }}
                    >
                      Change Role
                    </Button>
                  </span>
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  };

  // Desktop table view for users
  const renderUserTable = () => {
    return (
      <TableContainer>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Joined</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user._id} hover>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.name || 'Not Set'}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={user.isVerified ? "Verified" : "Unverified"} 
                      size="small" 
                      color={user.isVerified ? "success" : "default"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      size="small"
                      sx={{
                        bgcolor: getRoleColor(user.role).bg,
                        color: getRoleColor(user.role).color,
                        fontWeight: 'medium'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title={changeRoleTooltip}>
                      <span>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleRoleChangeClick(user)}
                          disabled={!canChangeUserRole}
                          sx={{ 
                            borderColor: '#ccc', 
                            color: '#555',
                            '&:hover': { borderColor: '#999', backgroundColor: '#f5f5f5' }
                          }}
                        >
                          Change Role
                        </Button>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    No users found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <AdminLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
          User Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View, filter and manage all users
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }} elevation={0}>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          sx={{ mb: 3 }}
          alignItems={{ sm: 'center' }}
        >
          <TextField
            label="Search users"
            variant="outlined"
            size="small"
            fullWidth
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{ flex: 2, maxWidth: { sm: 300 } }}
          />
          <FormControl size="small" sx={{ width: { xs: '100%', sm: 200 } }}>
            <InputLabel id="role-filter-label">Filter by Role</InputLabel>
            <Select
              labelId="role-filter-label"
              id="role-filter"
              value={roleFilter}
              label="Filter by Role"
              onChange={handleRoleFilterChange}
            >
              <MenuItem value="all">All Roles</MenuItem>
              <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Switch between mobile card view and desktop table view */}
            {isMobile ? renderUserCards() : renderUserTable()}
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {/* Role Update Dialog */}
      <Dialog
        open={roleDialogOpen}
        onClose={() => setRoleDialogOpen(false)}
      >
        <DialogTitle>Update User Role</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Choose a new role for this user.
          </DialogContentText>
          {selectedUser && (
            <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2">
                {selectedUser.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current role: {selectedUser.role}
              </Typography>
            </Box>
          )}
          <FormControl fullWidth>
            <InputLabel id="new-role-label">Role</InputLabel>
            <Select
              labelId="new-role-label"
              id="new-role"
              value={newRole}
              label="Role"
              onChange={(e) => setNewRole(e.target.value as string)}
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmRoleChange} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
} 