import { NextResponse } from 'next/server';
import { verifyJWT } from './lib/auth';

export async function proxy(request) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Session expired or not authenticated.' } },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  const payload = await verifyJWT(token);

  if (!payload) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Session expired or invalid.' } },
        { status: 401 }
      );
    }
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('token', '', { maxAge: 0 });
    return response;
  }

  // Inject session context into headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-business-id', payload.businessId);
  requestHeaders.set('x-user-role', payload.role);
  requestHeaders.set('x-user-name', payload.name);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/products/:path*',
    '/inventory/:path*',
    '/sales/:path*',
    '/purchases/:path*',
    '/customers/:path*',
    '/suppliers/:path*',
    '/expenses/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/assistant/:path*',
    
    '/api/dashboard/:path*',
    '/api/products/:path*',
    '/api/inventory/:path*',
    '/api/categories/:path*',
    '/api/sales/:path*',
    '/api/purchases/:path*',
    '/api/customers/:path*',
    '/api/suppliers/:path*',
    '/api/expenses/:path*',
    '/api/settings/:path*',
    '/api/automation/:path*',
    '/api/assistant/:path*',
    '/api/admin/:path*'
  ]
};
