export interface Collaborator {
  email: string;
  role: 'viewer' | 'manager';
  password?: string;
}

export interface Company {
  _id: string;
  name: string;
}

export interface User {
  _id: string;
  email: string;
  name?: string;
  isVerified: boolean;
  role?: string;
  createdAt: string;
  updatedAt: string;
  firstName?: string;
  lastName?: string;
  emailPrefrences?: boolean;
  isCollaborator?: boolean;
  collaborator?: Collaborator;
  company?: {
    name?: string;
    type?: string;
    MainOperatingRegions?: string[];
  };
  preferences?: {
    Communication?: {
      emailPrefrences?: boolean;
      whatsappPrefrences?: boolean;
    };
    AlertSummaries?: {
      daily?: boolean;
      weekly?: boolean;
      monthly?: boolean;
    }
  };
  collaborators?: Collaborator[];
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
  updated?: string;
  expectedStart?: string;
  expectedEnd?: string;
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
  risk?: string;
  type?: string;
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