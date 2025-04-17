'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';

// Public routes that don't require authentication
// Keep this in sync with the list in ProtectedRoute.tsx
const publicRoutes = ['/', '/login', '/signup', '/forgot-password','/action-hub','/insights','/subscription', '/feed','/feature','/resources', '/about', '/pricing', '/ambassadors', '/not-found'];
// Auth process routes should never redirect, even during auth loading
const authProcessRoutes = ['/auth/google/callback'];

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isCollaborator: boolean;
  collaboratorRole: string | null;
  collaboratorEmail: string | null;
  // Role-based utility flags
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isManager: boolean;
  isViewer: boolean;
  isEditor: boolean;
  isCollaboratorViewer: boolean;
  isCollaboratorManager: boolean;
  // Role check utility function
  hasRole: (role: string | string[]) => boolean;
}

const defaultContext: AuthContextType = {
  user: null,
  isLoading: true,
  setUser: () => {},
  logout: () => {},
  isAuthenticated: false,
  isCollaborator: false,
  collaboratorRole: null,
  collaboratorEmail: null,
  // Role-based utility flags default values
  isAdmin: false,
  isSuperAdmin: false,
  isManager: false,
  isViewer: false,
  isEditor: false,
  isCollaboratorViewer: false,
  isCollaboratorManager: false,
  // Role check utility function
  hasRole: () => false
};

const AuthContext = createContext<AuthContextType>(defaultContext);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCollaborator, setIsCollaborator] = useState<boolean>(false);
  const [collaboratorRole, setCollaboratorRole] = useState<string | null>(null);
  const [collaboratorEmail, setCollaboratorEmail] = useState<string | null>(null);
  
  // Role-based state values
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [isManager, setIsManager] = useState<boolean>(false);
  const [isViewer, setIsViewer] = useState<boolean>(false);
  const [isEditor, setIsEditor] = useState<boolean>(false);
  const [isCollaboratorViewer, setIsCollaboratorViewer] = useState<boolean>(false);
  const [isCollaboratorManager, setIsCollaboratorManager] = useState<boolean>(false);
  
  const router = useRouter();
  const pathname = usePathname();

  // Utility function to check roles
  const hasRole = useCallback((role: string | string[]): boolean => {
    if (!user) return false;
    
    const roles = Array.isArray(role) ? role : [role];
    
    // Check main user role
    if (user.role && roles.includes(user.role)) {
      return true;
    }
    
    // Check collaborator role if applicable
    if (isCollaborator && collaboratorRole && roles.includes(`collaborator-${collaboratorRole}`)) {
      return true;
    }
    
    return false;
  }, [user, isCollaborator, collaboratorRole]);

  // Update role flags whenever user or collaborator status changes
  useEffect(() => {
    if (user) {
      const userRole = user.role || 'user';
      setIsAdmin(userRole === 'admin');
      setIsSuperAdmin(userRole === 'superadmin');
      setIsManager(userRole === 'manager');
      setIsViewer(userRole === 'viewer');
      setIsEditor(userRole === 'editor');
    } else {
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setIsManager(false);
      setIsViewer(false);
      setIsEditor(false);
    }
    
    // Set collaborator role flags
    setIsCollaboratorViewer(isCollaborator && collaboratorRole === 'viewer');
    setIsCollaboratorManager(isCollaborator && collaboratorRole === 'manager');
    
  }, [user, isCollaborator, collaboratorRole]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if we're in the browser
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('user');
          const token = localStorage.getItem('token');
          const storedIsCollaborator = localStorage.getItem('isCollaborator');
          const storedCollaboratorRole = localStorage.getItem('collaboratorRole');
          const storedCollaboratorEmail = localStorage.getItem('collaboratorEmail');
          
          if (storedUser && token) {
            // Ensure token is also in cookies for middleware
            if (!Cookies.get('token')) {
              Cookies.set('token', token, { path: '/' });
            }
            
            // Set user state
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            
            // Set collaborator info if present
            if (storedIsCollaborator === 'true') {
              setIsCollaborator(true);
              setCollaboratorRole(storedCollaboratorRole);
              setCollaboratorEmail(storedCollaboratorEmail);
            }
          } else {
            // Clear any existing cookies if no token in localStorage
            Cookies.remove('token', { path: '/' });
            
            // Only redirect to login if not on a public route or auth process route
            const isPublicRoute = publicRoutes.some(route => pathname === route);
            const isAuthProcessRoute = authProcessRoutes.some(route => pathname.startsWith(route));
            
            if (!isPublicRoute && !isAuthProcessRoute && typeof window !== 'undefined') {
              router.push('/login?from=' + pathname);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [pathname, router]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('isCollaborator');
      localStorage.removeItem('collaboratorRole');
      localStorage.removeItem('collaboratorEmail');
      
      // Also remove cookies
      Cookies.remove('token', { path: '/' });
      
      // Reset state
      setUser(null);
      setIsCollaborator(false);
      setCollaboratorRole(null);
      setCollaboratorEmail(null);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setIsManager(false);
      setIsViewer(false);
      setIsEditor(false);
      setIsCollaboratorViewer(false);
      setIsCollaboratorManager(false);
      
      router.push('/');
    }
  };

  const value = {
    user,
    isLoading,
    setUser,
    logout: handleLogout,
    isAuthenticated: !!user,
    isCollaborator,
    collaboratorRole,
    collaboratorEmail,
    isAdmin,
    isSuperAdmin,
    isManager,
    isViewer,
    isEditor,
    isCollaboratorViewer,
    isCollaboratorManager,
    hasRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 