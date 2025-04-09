export interface User {
  _id: string;
  email: string;
  name?: string;
  isVerified: boolean;
  role?: 'user' | 'admin' | 'superadmin';
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  _id: string;
  alertGroupId?: string;
  version?: number;
  isLatest?: boolean;
  alertCategory?: string;
  alertType?: string;
  title?: string;
  description: string;
  risk?: string;
  impact?: string;
  priority?: string;
  targetAudience?: string;
  recommendedAction?: string;
  status?: string;
  linkToSource?: string;
  numberOfFollows?: number;
  addToEmailSummary?: boolean;
  previousVersionNotes?: string;
  updatedBy?: string;
  userId?: User | string;
  location: string;
  latitude: number;
  longitude: number;
  city: string;
  country?: string;
  media?: Media[];
  isFollowing?: boolean;
  createdBy: User | string;
  createdAt: string;
  updatedAt: string;
}

export interface Media {
  url: string;
  type: string;
  file?: File;
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  userId: string;
  alertId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FilterOptions {
  sortBy: string;
  incidentTypes: string[];
  timeRange: number;
  distance: number;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordFormData {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AlertFormData {
  incidentType: string;
  otherType?: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  city: string;
  country?: string;
  media?: Media[];
  expectedStart?: Date | string;
  expectedEnd?: Date | string;
}

export interface ApiError {
  message: string;
  statusCode?: number;
}

export interface AuthResponse {
  token: string;
  user: User;
  requireMFA?: boolean;
  needsVerification?: boolean;
  userId?: string;
  message?: string;
} 