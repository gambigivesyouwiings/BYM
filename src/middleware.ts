import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'mck-beyond-youth-secret-key-change-in-production';
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin routes
  if (pathname.startsWith('/admin')) {
    // Allow /admin/login and /admin/login/*
    if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) {
      const token = request.cookies.get('admin_token')?.value;
      if (token) {
        try {
          await jwtVerify(token, encodedSecret);
          return NextResponse.redirect(new URL('/admin', request.url));
        } catch {
          // Token invalid, allow accessing login
        }
      }
      return NextResponse.next();
    }

    const token = request.cookies.get('admin_token')?.value;

    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      await jwtVerify(token, encodedSecret);
      return NextResponse.next();
    } catch {
      // Invalid or expired token
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('admin_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
