// Note: Next.js 16 shows a deprecation warning for middleware.ts, but it's still the standard approach.
// The "proxy" alternative mentioned in the warning is not yet documented or available.
// This middleware is required for authentication and route protection.
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Check for required environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Missing Supabase environment variables');
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error('Auth error in middleware:', authError);
      // Continue without user if auth fails
    }

    // Protect dashboard routes
    if (request.nextUrl.pathname.startsWith('/dashboard') || 
        request.nextUrl.pathname.startsWith('/mechanic') ||
        request.nextUrl.pathname.startsWith('/ops') ||
        request.nextUrl.pathname.startsWith('/clerk') ||
        request.nextUrl.pathname.startsWith('/driver')) {
      if (!user) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // Get user role from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, garage_id')
        .eq('id', user.id)
        .single();

      if (userError || !userData || !('role' in userData)) {
        console.error('Error fetching user data in middleware:', userError);
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // Role-based route protection
      const path = request.nextUrl.pathname;
      const userRole = userData.role;

      if (path.startsWith('/mechanic') && userRole !== 'mechanic') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      if (path.startsWith('/ops') && userRole !== 'ops_manager') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      if (path.startsWith('/clerk') && userRole !== 'parts_clerk') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      if (path.startsWith('/driver') && userRole !== 'driver') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }

    // Redirect authenticated users away from landing and auth pages
    if ((request.nextUrl.pathname === '/' ||
         request.nextUrl.pathname === '/login' || 
         request.nextUrl.pathname === '/register') && user) {
      // Redirect to appropriate dashboard based on role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!userError && userData && 'role' in userData) {
        const role = userData.role;
        const dashboardMap: Record<string, string> = {
          mechanic: '/mechanic',
          ops_manager: '/ops',
          parts_clerk: '/clerk',
          driver: '/driver',
        };
        return NextResponse.redirect(
          new URL(dashboardMap[role] || '/dashboard', request.url)
        );
      }
    }
  } catch (error) {
    console.error('Middleware error:', error);
    // On error, allow the request to continue to prevent blocking
    // In production, you might want to log to an error tracking service
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

