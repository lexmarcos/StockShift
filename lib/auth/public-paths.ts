// Rotas públicas que não exigem autenticação. Compartilhada entre o middleware
// (Edge) e o AuthProvider (client) para as duas listas nunca divergirem.
// "/offline" é pública para o service worker servir o fallback offline sem
// disparar redirecionamento de auth nem chamadas de rede a `auth/me`.
export const PUBLIC_PATHS = ["/login", "/register", "/offline"] as const;

export const isPublicPath = (pathname: string): boolean =>
  PUBLIC_PATHS.some((path) => pathname.startsWith(path));
