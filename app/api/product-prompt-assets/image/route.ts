import { NextResponse, type NextRequest } from "next/server";

const PRODUCT_PROMPT_ASSET_PATH_PREFIXES = ["/products/", "/company-logos/"];

export async function GET(request: NextRequest): Promise<Response> {
  if (!hasSessionCookie(request)) {
    return createProductPromptAssetErrorResponse(
      "Autenticação necessária para buscar imagem.",
      401,
    );
  }

  const assetUrl = parseProductPromptAssetUrl(request);
  if (!assetUrl) {
    return createProductPromptAssetErrorResponse(
      "URL inválida. Esperado arquivo de imagem público do R2.",
      400,
    );
  }
  return fetchProductPromptAsset(assetUrl);
}

function hasSessionCookie(request: NextRequest): boolean {
  const accessToken = request.cookies.get("accessToken");
  const refreshToken = request.cookies.get("refreshToken");
  return Boolean(accessToken || refreshToken);
}

function parseProductPromptAssetUrl(request: NextRequest): URL | null {
  const assetUrl = request.nextUrl.searchParams.get("url");
  if (!assetUrl) return null;
  try {
    const parsedUrl = new URL(assetUrl);
    return isAllowedProductPromptAssetUrl(parsedUrl) ? parsedUrl : null;
  } catch {
    return null;
  }
}

function isAllowedProductPromptAssetUrl(assetUrl: URL): boolean {
  return (
    assetUrl.protocol === "https:" &&
    assetUrl.hostname.endsWith(".r2.dev") &&
    PRODUCT_PROMPT_ASSET_PATH_PREFIXES.some((prefix) =>
      assetUrl.pathname.startsWith(prefix),
    )
  );
}

async function fetchProductPromptAsset(assetUrl: URL): Promise<Response> {
  try {
    const response = await fetch(assetUrl, {
      cache: "no-store",
      redirect: "error",
    });
    if (!response.ok) {
      return createProductPromptAssetErrorResponse("Imagem indisponível.", 502);
    }
    return createProductPromptAssetResponse(response);
  } catch {
    return createProductPromptAssetErrorResponse("Falha ao buscar imagem.", 502);
  }
}

async function createProductPromptAssetResponse(
  response: Response,
): Promise<Response> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    return createProductPromptAssetErrorResponse(
      "Arquivo remoto não é imagem.",
      415,
    );
  }
  const imageBuffer = await response.arrayBuffer();
  return new NextResponse(imageBuffer, {
    headers: {
      "Cache-Control": "private, max-age=60",
      "Content-Type": contentType,
    },
  });
}

function createProductPromptAssetErrorResponse(
  message: string,
  status: number,
): Response {
  return NextResponse.json({ message }, { status });
}
