import { NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login'];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow all public paths
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow root which handles redirect itself
  if (pathname === '/') {
    return NextResponse.next();
  }

  // For protected routes, check token cookie (set on login)
  const token = request.cookies.get('ssh_token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|android-chrome|apple-touch|favicon|site.webmanifest|default-avatar).*)'],
};
