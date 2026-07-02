import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isPublicPath } from "@/lib/auth/public-paths";

const CSP_NONCE_HEADER = "x-nonce";

const SECURITY_HEADERS = [
  ["X-Frame-Options", "DENY"],
  ["X-Content-Type-Options", "nosniff"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["Permissions-Policy", "camera=(), microphone=(), geolocation=()"],
  [
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload",
  ],
] as const;

const API_ORIGIN = createOriginSource(process.env.NEXT_PUBLIC_API_URL);

export function middleware(request: NextRequest): NextResponse {
  const nonce = createContentSecurityPolicyNonce();
  const contentSecurityPolicy = createContentSecurityPolicy(nonce);
  const redirectResponse = createAuthRedirectResponse(request);

  if (redirectResponse) {
    return applyResponseSecurityHeaders(redirectResponse, contentSecurityPolicy);
  }

  return createSecureNextResponse(request, nonce, contentSecurityPolicy);
}

function createAuthRedirectResponse(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;

  // Páginas públicas que não precisam de autenticação (ver lib/auth/public-paths).
  // Se for uma página pública, permite o acesso.
  if (isPublicPath(pathname)) {
    return null;
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
  return null;
}

function createSecureNextResponse(
  request: NextRequest,
  nonce: string,
  contentSecurityPolicy: string,
): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(CSP_NONCE_HEADER, nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  return applyResponseSecurityHeaders(response, contentSecurityPolicy);
}

function applyResponseSecurityHeaders(
  response: NextResponse,
  contentSecurityPolicy: string,
): NextResponse {
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  SECURITY_HEADERS.forEach(([key, value]) => response.headers.set(key, value));
  return response;
}

function createContentSecurityPolicy(nonce: string): string {
  const connectSources = [
    "'self'",
    "https://*.clarity.ms",
    "https://*.bing.com",
    "https://hcaptcha.com",
    "https://*.hcaptcha.com",
  ];
  if (API_ORIGIN) connectSources.push(API_ORIGIN);

  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://www.clarity.ms https://*.clarity.ms https://hcaptcha.com https://*.hcaptcha.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.r2.dev https://*.clarity.ms https://*.bing.com https://hcaptcha.com https://*.hcaptcha.com",
    "font-src 'self' data:",
    `connect-src ${connectSources.join(" ")}`,
    "frame-src https://hcaptcha.com https://*.hcaptcha.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  return directives.join("; ");
}

function createContentSecurityPolicyNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}

function createOriginSource(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
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
