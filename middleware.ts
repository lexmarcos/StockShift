import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Páginas públicas que não precisam de autenticação.
  // "/offline" é pública para o service worker pré-cachear a página de offline
  // real, e não o HTML de /login (redirecionamento de auth corromperia o fallback).
  const publicPaths = ["/login", "/register", "/offline"];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Se for uma página pública, permite o acesso
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Verifica se existe algum cookie de sessão (httpOnly)
  const accessToken = request.cookies.get("accessToken");
  const refreshToken = request.cookies.get("refreshToken");

  // Se o accessToken expirou, deixa o cliente usar o refreshToken para renovar
  if (!accessToken && !refreshToken) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Se estiver autenticado, permite o acesso
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api and stockshift/api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|stockshift/api|_next/static|_next/image|favicon.ico|.*\\..*|manifest.json).*)",
  ],
};
