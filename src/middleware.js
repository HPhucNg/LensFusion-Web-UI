// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  // Get the pathname
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const isPublicPath = path === '/login' || 
                      path === '/register' || 
                      path === '/' || 
                      path.startsWith('/_next') || 
                      path.startsWith('/api');
  
  // Get the session token from cookies
  const authToken = request.cookies.get('authToken')?.value || '';
  
  // If the path is not public and there's no auth token, redirect to login
  if (!isPublicPath && !authToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If the user is authenticated and tries to access login/register, redirect to profile
  if (isPublicPath && authToken && (path === '/login' || path === '/register')) {
    return NextResponse.redirect(new URL('/dashboard/profile', request.url));
  }
  
  return NextResponse.next();
}

// Specify which paths this middleware should run on
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 