'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Move publicRoutes outside the component to avoid recreating it on each render
// Keep this in sync with the list in AuthContext.tsx
const publicRoutes = [
  '/', 
  '/login', 
  '/signup', 
  '/forgot-password', 
  '/feed',
  '/about',
  '/pricing',
  '/ambassadors'
];

// Admin routes that require admin privileges
const adminRoutes = [
  '/admin',
  '/admin/users',
  '/admin/alerts',
  '/admin/dashboard'
];

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  
  useEffect(() => {
    // Don't redirect if on a public route
    const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));
    
    // Check if path is an admin route
    const isAdminRoute = adminRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));
    
    if (!isLoading) {
      // If not authenticated and not on a public route, redirect to login
      if (!isAuthenticated && !isPublicRoute) {
        router.push(`/login?from=${encodeURIComponent(pathname)}`);
      }
      
      // If authenticated but trying to access admin route without admin privileges
      if (isAuthenticated && isAdminRoute && !isAdmin) {
        router.push('/');
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, router, pathname]);

  // Show nothing while checking authentication on protected routes
  if (isLoading && !publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    return null;
  }

  // Always show content for public routes
  // For protected routes, only show if authenticated
  // For admin routes, only show if authenticated and isAdmin
  const isAdminRoute = adminRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));
  const shouldShowContent = 
    publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`)) || 
    (isAuthenticated && !isAdminRoute) || 
    (isAuthenticated && isAdminRoute && isAdmin);
  
  return shouldShowContent ? <>{children}</> : null;
};

export default ProtectedRoute; 