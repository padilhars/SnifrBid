import { type NextRequest, NextResponse } from 'next/server';

const PROTECTED_PREFIXES = ['/dashboard', '/oportunidades', '/interesses', '/acompanhamento', '/notificacoes', '/configuracoes'];
const ADMIN_PREFIXES = ['/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has('snifrbid_session');

  // Redireciona rotas protegidas para login se sem sessão
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redireciona admin para login se sem sessão
  const isAdmin = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
  if (isAdmin && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redireciona login/register para dashboard se já autenticado
  if ((pathname === '/login' || pathname === '/register') && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redireciona raiz para dashboard
  if (pathname === '/') {
    return NextResponse.redirect(new URL(hasSession ? '/dashboard' : '/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sw.js|icon-.*\\.png|badge-.*\\.png).*)'],
};
