import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Páginas públicas que não precisam de autenticação
  const publicPaths = ["/login", "/register", "/change-password"];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Se for uma página pública, permite o acesso
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Verifica se existe o cookie de autenticação (httpOnly)
  const accessToken = request.cookies.get("accessToken");

  // Se não estiver autenticado, redireciona para login
  if (!accessToken) {
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
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|manifest.json).*)",
  ],
};
