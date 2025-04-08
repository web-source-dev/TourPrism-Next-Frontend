import axios from 'axios';

// Define Axios types since import is having issues
type AxiosInstance = any;
type AxiosResponse<T = any> = {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: any;
};
type AxiosError<T = any> = Error & {
  response?: {
    data: T;
    status: number;
    statusText: string;
    headers: any;
    config: any;
  };
};
type InternalAxiosRequestConfig = any;

import { User, Alert, Notification } from '../types';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tourprism-backend.onrender.com';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Add token to requests if it exists
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token') || Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

const getErrorMessage = (error: AxiosError): string => {
  // Handle network errors
  if (!error.response) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  // Handle specific error messages from backend
  const backendMessage = error.response?.data?.message;
  if (backendMessage) {
    // Map backend messages to user-friendly messages
    const messageMap: Record<string, string> = {
      'Invalid credentials': 'The email or password you entered is incorrect.',
      'User already exists': 'An account with this email already exists.',
      'User not found': 'No account found with this email address.',
      'Invalid or expired OTP': 'The verification code is invalid or has expired.',
      'Email already verified': 'Your email is already verified.',
      'Please wait before requesting another OTP': 'Please wait a moment before requesting another verification code.',
      'This email is registered with Google. Please continue with Google login.': 'This email is linked to a Google account. Please use Google Sign In instead.',
    };
    return messageMap[backendMessage] || backendMessage;
  }

  // Default error message
  return 'Something went wrong. Please try again later.';
};

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Check if error is due to authentication and we're not on a public page
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const publicRoutes = ['/', '/login', '/signup', '/forgot-password', '/feed'];
      const currentPath = window.location.pathname;
      const isPublicRoute = publicRoutes.some(route => currentPath === route);
      
      // Only redirect if not on a public route and token exists
      const token = localStorage.getItem('token');
      if (token && !isPublicRoute) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/session-expired';
      }
    }
    return Promise.reject(error);
  }
);

interface AuthResponse {
  token: string;
  user: User;
  requireMFA?: boolean;
  userId?: string;
  message?: string;
}

interface OTPVerifyRequest {
  userId: string;
  otp: string;
}

interface PasswordResetRequest {
  userId: string;
  otp: string;
  newPassword: string;
}

export const register = async (userData: any): Promise<AuthResponse> => {
  try {
    const response: AxiosResponse<AuthResponse> = await api.post('/auth/register', userData);
    if (response.data.token && typeof window !== 'undefined') {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      // Also set in cookies for middleware
      Cookies.set('token', response.data.token, { path: '/' });
    }
    return response.data;
  } catch (error) {
    throw { message: getErrorMessage(error as AxiosError) };
  }
};

export const login = async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
  try {
    const response: AxiosResponse<AuthResponse> = await api.post('/auth/login', credentials);
    if (response.data.token && typeof window !== 'undefined') {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      // Also set in cookies for middleware
      Cookies.set('token', response.data.token, { path: '/' });
    }
    return response.data;
  } catch (error) {
    throw { message: getErrorMessage(error as AxiosError) };
  }
};

export const googleLogin = (): void => {
  if (typeof window !== 'undefined') {
    window.location.href = `${API_URL}/auth/google`;
  }
};

export const handleGoogleCallback = async (token: string): Promise<User> => {
  if (token && typeof window !== 'undefined') {
    localStorage.setItem('token', token);
    // Fetch user data using the token
    try {
      const response: AxiosResponse<User> = await api.get('/auth/user/profile');
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      throw axiosError.response?.data || { message: 'An error occurred' };
    }
  }
  throw new Error('No token provided');
};

export const logout = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Also remove from cookies
    Cookies.remove('token', { path: '/' });
    window.location.href = '/';
  }
};

export const forgotPassword = async (data: { email: string }): Promise<{ userId: string }> => {
  try {
    const response: AxiosResponse<{ userId: string }> = await api.post('/auth/forgot-password', data);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw axiosError.response?.data || { message: 'An error occurred' };
  }
};

export const verifyOTP = async (data: OTPVerifyRequest): Promise<AuthResponse> => {
  try {
    const response: AxiosResponse<AuthResponse> = await api.post('/auth/verify-email', data);
    if (response.data.token && typeof window !== 'undefined') {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      // Also set in cookies for middleware
      Cookies.set('token', response.data.token, { path: '/' });
    }
    return response.data;
  } catch (error) {
    throw { message: getErrorMessage(error as AxiosError) };
  }
};

export const verifyResetOTP = async (data: OTPVerifyRequest): Promise<{ success: boolean }> => {
  try {
    const response: AxiosResponse<{ success: boolean }> = await api.post('/auth/verify-reset-otp', data);
    return response.data;
  } catch (error) {
    throw { message: getErrorMessage(error as AxiosError) };
  }
};

export const resetPassword = async (data: PasswordResetRequest): Promise<{ success: boolean }> => {
  try {
    const response: AxiosResponse<{ success: boolean }> = await api.post('/auth/reset-password', data);
    return response.data;
  } catch (error) {
    throw { message: getErrorMessage(error as AxiosError) };
  }
};

export const resendOTP = async (data: { userId: string }): Promise<{ success: boolean }> => {
  try {
    const response: AxiosResponse<{ success: boolean }> = await api.post('/auth/resend-otp', data);
    return response.data;
  } catch (error) {
    throw { message: getErrorMessage(error as AxiosError) };
  }
};

export const resendResetOTP = async (data: { userId: string }): Promise<{ success: boolean }> => {
  try {
    const response: AxiosResponse<{ success: boolean }> = await api.post('/auth/resend-reset-otp', data);
    return response.data;
  } catch (error) {
    throw { message: getErrorMessage(error as AxiosError) };
  }
};

// Alert related API calls
export const createAlert = async (formData: FormData): Promise<Alert> => {
  try {
    const response: AxiosResponse<Alert> = await api.post('/api/alerts/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw axiosError.response?.data || { message: 'An error occurred' };
  }
};

export const getAlerts = async (filters = {}): Promise<{ alerts: Alert[], totalCount: number }> => {
  try {
    const response: AxiosResponse<{ alerts: Alert[], totalCount: number }> = await api.get('/api/alerts', { params: filters });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw axiosError.response?.data || { message: 'An error occurred' };
  }
};

export const getAlertById = async (alertId: string): Promise<Alert> => {
  try {
    const response: AxiosResponse<Alert> = await api.get(`/api/alerts/${alertId}`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw axiosError.response?.data || { message: 'An error occurred' };
  }
};

export const getUserAlerts = async (): Promise<Alert[]> => {
  try {
    const response: AxiosResponse<Alert[]> = await api.get('/api/alerts/user/my-alerts');
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw axiosError.response?.data || { message: 'An error occurred' };
  }
};

interface FetchAlertsParams {
  city?: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  startDate?: string;
  endDate?: string;
  incidentTypes?: string[];
  limit?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const fetchAlerts = async (params: FetchAlertsParams = {}): Promise<{ alerts: Alert[], totalCount: number }> => {
  try {
    const queryParams = new URLSearchParams();
    
    // Location filters - ensure these are properly handled
    if (params.city) {
      queryParams.append('city', params.city);
    }
    
    if (params.latitude !== undefined && params.longitude !== undefined) {
      // Validate and ensure coordinates are valid numbers
      const latitude = Number(params.latitude);
      const longitude = Number(params.longitude);
      
      if (!isNaN(latitude) && !isNaN(longitude)) {
        queryParams.append('latitude', latitude.toFixed(6));
        queryParams.append('longitude', longitude.toFixed(6));
        
        // Only append distance if coordinates are present and distance is valid
        if (params.distance && Number(params.distance) > 0) {
          queryParams.append('distance', String(Number(params.distance)));
        }
      }
    }

    // Time range filters
    if (params.startDate) {
      queryParams.append('startDate', params.startDate);
    }
    if (params.endDate) {
      queryParams.append('endDate', params.endDate);
    }

    // Incident type filters - handle as array properly
    if (params.incidentTypes && Array.isArray(params.incidentTypes) && params.incidentTypes.length > 0) {
      params.incidentTypes.forEach(type => {
        queryParams.append('incidentTypes[]', type);
      });
    }

    // Pagination
    queryParams.append('limit', String(params.limit || 20));
    queryParams.append('page', String(params.page || 1));

    // Sorting
    if (params.sortBy) {
      queryParams.append('sortBy', params.sortBy);
      queryParams.append('sortOrder', params.sortOrder || 'desc');
    }
    
    // Debug log the query string
    const queryString = queryParams.toString();
    console.log('API Call queryString:', queryString);
    
    const endpoint = queryString ? `/api/alerts?${queryString}` : '/api/alerts';
    
    const response: AxiosResponse<{ alerts: Alert[], totalCount: number }> = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching alerts:', error);
    const axiosError = error as AxiosError;
    throw axiosError.response?.data || {
      message: 'Failed to fetch alerts. Please try again later.',
      error: (error as Error).message
    };
  }
};

export const getNotifications = async (): Promise<Notification[]> => {
  try {
    const response: AxiosResponse<Notification[]> = await api.get('/api/notifications');
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw axiosError.response?.data || { message: 'Error fetching notifications' };
  }
};

export const markAsRead = async (notificationId: string): Promise<{ success: boolean }> => {
  try {
    const response: AxiosResponse<{ success: boolean }> = await api.patch(`/api/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw axiosError.response?.data || { message: 'Error marking notification as read' };
  }
};

export const deleteNotification = async (notificationId: string): Promise<{ success: boolean }> => {
  try {
    const response: AxiosResponse<{ success: boolean }> = await api.delete(`/api/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw axiosError.response?.data || { message: 'Error deleting notification' };
  }
};

export const markAllAsRead = async (): Promise<{ success: boolean }> => {
  try {
    const response: AxiosResponse<{ success: boolean }> = await api.patch('/api/notifications/mark-all-read');
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw axiosError.response?.data || { message: 'Error marking all notifications as read' };
  }
};

export { api }; 