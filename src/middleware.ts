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
  '/session-expired'
  // Add other public paths here
];

// Admin paths that require admin role
const adminPaths = [
  '/admin',
  '/bulk',
];

// /bulk path is intentionally NOT added to public paths as it should be protected
// /profile path also requires authentication

export async function middleware(request: NextRequest) {
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
  
  // For admin routes, check if the user has admin role
  if (adminPaths.some(path => pathname.startsWith(path))) {
    try {
      // This is a simple check - in production you would verify the JWT signature
      // and decode it properly with the secret key
      const user = JSON.parse(atob(token.split('.')[1]));
      
      if (user.role !== 'admin' && user.role !== 'superadmin') {
        // Redirect to homepage if not admin
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (error) {
      console.error('Error checking admin role:', error);
      // If token is invalid, redirect to login
      const url = new URL('/login', request.url);
      return NextResponse.redirect(url);
    }
  }
  
  return NextResponse.next();
}

// Only run middleware on these paths
export const config = {
  matcher: [
    // Skip all static files
    '/((?!_next/static|_next/image|favicon.ico|images|uploads).*)',
  ],
}; 