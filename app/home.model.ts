import { homeTokenPayloadSchema } from "./home.schema";
import { HomeRedirectPath, HomeRouteSession } from "./home.types";

const SALES_REDIRECT_PATH = "/sales";
const WAREHOUSES_REDIRECT_PATH = "/warehouses";

export function resolveHomeRedirectPath(
  selectedWarehouseId: string | null,
): HomeRedirectPath {
  if (selectedWarehouseId?.trim()) {
    return SALES_REDIRECT_PATH;
  }

  return WAREHOUSES_REDIRECT_PATH;
}

export function createHomeRedirectMessage(
  redirectPath: HomeRedirectPath,
): string {
  if (redirectPath === SALES_REDIRECT_PATH) {
    return "Redirecionando para vendas...";
  }

  return "Redirecionando para seleção de armazém...";
}

function decodeBase64UrlSegment(segment: string): string | null {
  const normalizedSegment = segment.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (normalizedSegment.length % 4)) % 4;
  const paddedSegment = normalizedSegment + "=".repeat(paddingLength);

  try {
    const binaryValue = globalThis.atob(paddedSegment);
    const bytes = Uint8Array.from(binaryValue, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

export function extractWarehouseIdFromJwt(token?: string): string | null {
  const payloadSegment = token?.split(".")[1];
  if (!payloadSegment) return null;

  const decodedPayload = decodeBase64UrlSegment(payloadSegment);
  if (!decodedPayload) return null;

  try {
    const payload = JSON.parse(decodedPayload) as unknown;
    const parsedPayload = homeTokenPayloadSchema.safeParse(payload);
    return parsedPayload.success ? parsedPayload.data.warehouseId ?? null : null;
  } catch {
    return null;
  }
}

export function resolveHomeServerRedirectPath(
  session: HomeRouteSession,
): HomeRedirectPath | null {
  const accessTokenWarehouseId = extractWarehouseIdFromJwt(session.accessToken);
  const refreshTokenWarehouseId = extractWarehouseIdFromJwt(session.refreshToken);

  if (accessTokenWarehouseId || refreshTokenWarehouseId) {
    return SALES_REDIRECT_PATH;
  }

  return null;
}
