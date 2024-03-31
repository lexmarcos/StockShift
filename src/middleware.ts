import { NextRequest, NextResponse } from "next/server";
import { verify } from "./services/jwtSignVerify";
import { getUserByCookie } from "./app/api/utils/cookies";
import { cookies } from "next/headers";

async function handleTokenValidation(
  token: string,
  req: NextRequest
): Promise<void | NextResponse> {
  try {
    await verify(token, process.env.JWT_SECRET as string);
  } catch (error) {
    // Retorna um NextResponse com status 401 se o token for inválido
    return NextResponse.redirect(new URL("/auth/logout", req.url));
  }
}

export const middleware = async (req: NextRequest) => {
  const token = req.cookies.get("token");
  const user = getUserByCookie();
  const pathname = req.nextUrl.pathname;

  // Redirecionamentos para usuários não autenticados ou na página de login
  if (!token) {
    if (pathname.includes("signin")) return NextResponse.next();
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  // Valida o token e retorna uma resposta se o token for inválido
  const tokenValidationResponse = await handleTokenValidation(token.value, req);
  if (tokenValidationResponse) return tokenValidationResponse;

  // Redireciona usuários autenticados que estão na página de login
  if (pathname.includes("signin")) {
    const redirectUrl = user?.inventoryId ? "/app/dashboard" : "/app/inventories";
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }

  // Redireciona usuários autenticados sem inventário escolhido e que não estão acessando a página de inventários
  if (!user?.inventoryId && !pathname.includes("inventories")) {
    return NextResponse.redirect(new URL("/app/inventories", req.url));
  }

  return NextResponse.next();
};

export const config = {
  matcher: "/((?!_next|fonts|auth|api/auth|examples|[\\w-]+\\.\\w+).*)",
};
