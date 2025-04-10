'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
}

const defaultContext: AuthContextType = {
  user: null,
  isLoading: true,
  setUser: () => {},
  logout: () => {},
  isAuthenticated: false
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
      // Also remove cookies
      Cookies.remove('token', { path: '/' });
      setUser(null);
      router.push('/');
    }
  };

  const value = {
    user,
    isLoading,
    setUser,
    logout: handleLogout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 