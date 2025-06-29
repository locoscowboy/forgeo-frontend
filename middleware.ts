﻿import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token');
  const { pathname } = request.nextUrl;
  
  console.log('🔒 Middleware - pathname:', pathname);
  console.log('🔒 Middleware - token:', !!token);

  // Protéger les routes qui nécessitent une authentification
  if (!pathname.startsWith('/login') && 
      !pathname.startsWith('/register') && 
      !pathname.includes('/_next') && 
      !pathname.includes('/favicon.ico') && 
      !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Rediriger les utilisateurs authentifiés de la page login vers les agents
  if ((pathname === '/login' || pathname === '/register') && token) {
    return NextResponse.redirect(new URL('/agents', request.url));
  }

  return NextResponse.next();
}

// Voir: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
