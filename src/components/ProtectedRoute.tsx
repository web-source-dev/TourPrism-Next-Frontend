'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  
  // List of public routes that don't require authentication
  // Keep this in sync with middleware.ts
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
  
  useEffect(() => {
    // Don't redirect if on a public route
    const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));
    
    if (!isLoading && !isAuthenticated && !isPublicRoute) {
      router.push(`/login?from=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  // Show nothing while checking authentication on protected routes
  if (isLoading && !publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    return null;
  }

  // Always show content for public routes, otherwise only if authenticated
  const shouldShowContent = publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`)) || isAuthenticated;
  return shouldShowContent ? <>{children}</> : null;
};

export default ProtectedRoute; 