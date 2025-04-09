import { api } from './api';
import { User, Alert } from '../types';

export interface AdminDashboardStats {
  stats: {
    totalAlerts: number;
    pendingAlerts: number;
    approvedAlerts: number;
    rejectedAlerts: number;
  };
  recentAlerts: Alert[];
}

export interface UserListResponse {
  users: User[];
  totalCount: number;
}

export interface PendingAlertsResponse {
  alerts: Alert[];
  totalPages: number;
  currentPage: number;
  totalAlerts: number;
}

// Get admin dashboard statistics
export const getAdminDashboard = async (): Promise<AdminDashboardStats> => {
  try {
    const response = await api.get<AdminDashboardStats>('/api/admin/dashboard');
    return response.data;
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    throw error;
  }
};

// Get all users (paginated)
export const getUsers = async (page = 1, limit = 10): Promise<UserListResponse> => {
  try {
    const response = await api.get<UserListResponse>('/api/admin/users', {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Get user by ID
export const getUserById = async (userId: string): Promise<User> => {
  try {
    const response = await api.get<User>(`/api/admin/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

// Update user role (superadmin only)
export const updateUserRole = async (userId: string, role: 'user' | 'admin' | 'superadmin'): Promise<User> => {
  try {
    const response = await api.patch<User>(`/api/admin/users/${userId}/role`, { role });
    return response.data;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

// Get pending alerts
export const getPendingAlerts = async (page = 1, limit = 10): Promise<PendingAlertsResponse> => {
  try {
    const response = await api.get<PendingAlertsResponse>('/api/admin/alerts/pending', {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching pending alerts:', error);
    throw error;
  }
};

// Get alerts by status (approved, rejected, all)
export const getAlertsByStatus = async (
  status?: 'approved' | 'rejected', 
  page = 1, 
  limit = 10,
  searchTerm?: string
): Promise<PendingAlertsResponse> => {
  try {
    const params: Record<string, any> = { page, limit };
    
    // Add status if provided
    if (status) {
      params.status = status;
    }
    
    // Add search term if provided
    if (searchTerm) {
      params.search = searchTerm;
    }
    
    const response = await api.get<PendingAlertsResponse>('/api/admin/alerts', {
      params
    });
    
    console.log('Filtered alerts response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching alerts by status:', error);
    throw error;
  }
};

// Update alert status (approve/reject)
export const updateAlertStatus = async (alertId: string, status: 'approved' | 'rejected' | 'pending'): Promise<Alert> => {
  try {
    const response = await api.patch<{message: string, alert: Alert}>(`/api/admin/alerts/${alertId}/status`, { status });
    console.log('Status update response:', response.data);
    return response.data.alert;
  } catch (error) {
    console.error('Error updating alert status:', error);
    throw error;
  }
};

// Update all alert details (comprehensive edit)
export const updateAlert = async (alertId: string, alertData: Partial<Alert>): Promise<Alert> => {
  try {
    console.log('Updating alert with ID:', alertId);
    console.log('Data being sent:', JSON.stringify(alertData, null, 2));
    
    const response = await api.put<{message: string, alert: Alert}>(`/api/admin/alerts/${alertId}`, alertData);
    console.log('Update response:', response.data);
    return response.data.alert;
  } catch (error: any) {
    console.error('Error updating alert details:', error);
    // Log more detailed error information
    if (error.response) {
      console.error('Error response:', error.response.data);
      console.error('Status code:', error.response.status);
    }
    throw error;
  }
};

// Delete an alert
export const deleteAlert = async (alertId: string): Promise<{ success: boolean }> => {
  try {
    const response = await api.delete(`/api/admin/alerts/${alertId}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting alert:', error);
    throw error;
  }
}; 