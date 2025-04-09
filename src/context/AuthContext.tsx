'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';

// Public routes that don't require authentication
// Keep this in sync with the list in ProtectedRoute.tsx
const publicRoutes = ['/', '/login', '/signup', '/forgot-password', '/feed', '/about', '/pricing', '/ambassadors'];

// Admin routes that require admin or superadmin role
const adminRoutes = ['/admin', '/admin/users', '/admin/alerts', '/admin/dashboard'];

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const defaultContext: AuthContextType = {
  user: null,
  isLoading: true,
  setUser: () => {},
  logout: () => {},
  isAuthenticated: false,
  isAdmin: false,
  isSuperAdmin: false
};

const AuthContext = createContext<AuthContextType>(defaultContext);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if we're in the browser
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('user');
          const token = localStorage.getItem('token');
          
          if (storedUser && token) {
            // Ensure token is also in cookies for middleware
            if (!Cookies.get('token')) {
              Cookies.set('token', token, { path: '/' });
            }
            setUser(JSON.parse(storedUser));
          } else {
            // Clear any existing cookies if no token in localStorage
            Cookies.remove('token', { path: '/' });
            
            // Only redirect to login if not on a public route
            const isPublicRoute = publicRoutes.some(route => pathname === route);
            if (!isPublicRoute && typeof window !== 'undefined') {
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

  // Check if user is on an admin route but doesn't have admin privileges
  useEffect(() => {
    if (!isLoading && user && pathname) {
      const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
      
      if (isAdminRoute && user.role !== 'admin' && user.role !== 'superadmin') {
        // User is trying to access admin route without admin privileges
        router.push('/');
      }
    }
  }, [pathname, user, isLoading, router]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Also remove cookies
      Cookies.remove('token', { path: '/' });
      setUser(null);
      router.push('/');
    }
  };

  const isAdmin = !!user && (user.role === 'admin' || user.role === 'superadmin');
  const isSuperAdmin = !!user && user.role === 'superadmin';

  const value = {
    user,
    isLoading,
    setUser,
    logout: handleLogout,
    isAuthenticated: !!user,
    isAdmin,
    isSuperAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 