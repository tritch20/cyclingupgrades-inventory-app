import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const auth = req.cookies.get('auth')?.value;
  const pathname = req.nextUrl.pathname;

  const isLoginPage = pathname === '/login';
  const isLoginApi = pathname === '/api/login';
  const isNextAsset = pathname.startsWith('/_next');
  const isFavicon = pathname === '/favicon.ico';

  if (isLoginPage || isLoginApi || isNextAsset || isFavicon) {
    return NextResponse.next();
  }

  if (auth !== 'true') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};