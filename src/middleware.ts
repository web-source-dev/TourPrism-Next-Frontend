import { NextRequest, NextResponse } from 'next/server';

// List of public paths that don't require authentication
const publicPaths = [
  '/login',
  '/signup',
  '/forgot-password',
  '/',
  '/feed',
  '/about',
  '/pricing',
  '/ambassadors',
  // Add other public paths here
];

// Admin paths that require admin privileges
const adminPaths = [
  '/admin',
  '/admin/users',
  '/admin/alerts',
  '/admin/dashboard',
];

// /bulk path is intentionally NOT added to public paths as it should be protected

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // If it's a public path or an API route, don't check authentication
  if (publicPaths.some(path => pathname.startsWith(path)) || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Check for authentication token
  const token = request.cookies.get('token')?.value;
  
  if (!token) {
    // Redirect to login if not authenticated
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }
  
  // For admin routes, we'll let the client-side AuthContext handle the role check
  // The server-side admin routes are protected by their own middleware
  
  return NextResponse.next();
}

// Only run middleware on these paths
export const config = {
  matcher: [
    // Skip all static files
    '/((?!_next/static|_next/image|favicon.ico|images|uploads).*)',
  ],
}; 