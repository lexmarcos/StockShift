import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createHomeRedirectMessage,
  extractWarehouseIdFromJwt,
  resolveHomeRedirectPath,
  resolveHomeServerRedirectPath,
} from "./home.model";
import { useHomeModel } from "./home.client.model";

const routerReplaceMock = vi.fn();
let selectedWarehouseIdMock: string | null = "wh-1";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: routerReplaceMock,
  }),
}));

vi.mock("@/hooks/use-selected-warehouse", () => ({
  useSelectedWarehouse: () => ({
    warehouseId: selectedWarehouseIdMock,
    setWarehouseId: vi.fn(),
  }),
}));

function createJwtWithPayload(payload: Record<string, unknown>): string {
  const headerSegment = Buffer.from(
    JSON.stringify({ alg: "none", typ: "JWT" }),
  ).toString("base64url");
  const payloadSegment = Buffer.from(JSON.stringify(payload)).toString(
    "base64url",
  );

  return `${headerSegment}.${payloadSegment}.`;
}

describe("resolveHomeRedirectPath", () => {
  it("returns sales when a warehouse is selected", () => {
    expect(resolveHomeRedirectPath("wh-1")).toBe("/sales");
  });

  it("returns warehouses when no warehouse is selected", () => {
    expect(resolveHomeRedirectPath(null)).toBe("/warehouses");
    expect(resolveHomeRedirectPath("   ")).toBe("/warehouses");
  });
});

describe("extractWarehouseIdFromJwt", () => {
  it("extracts the warehouse ID from a JWT payload", () => {
    const token = createJwtWithPayload({ warehouseId: "wh-token-1" });

    expect(extractWarehouseIdFromJwt(token)).toBe("wh-token-1");
  });

  it("returns null for invalid or empty JWT payloads", () => {
    expect(extractWarehouseIdFromJwt("invalid-token")).toBeNull();
    expect(extractWarehouseIdFromJwt(createJwtWithPayload({}))).toBeNull();
    expect(extractWarehouseIdFromJwt(createJwtWithPayload({ warehouseId: " " }))).toBeNull();
  });
});

describe("resolveHomeServerRedirectPath", () => {
  it("redirects to sales when the access token has a warehouse", () => {
    const accessToken = createJwtWithPayload({ warehouseId: "wh-access" });

    expect(resolveHomeServerRedirectPath({ accessToken })).toBe("/sales");
  });

  it("redirects to sales when only the refresh token has a warehouse", () => {
    const refreshToken = createJwtWithPayload({ warehouseId: "wh-refresh" });

    expect(resolveHomeServerRedirectPath({ refreshToken })).toBe("/sales");
  });

  it("returns null when no token has a warehouse", () => {
    expect(resolveHomeServerRedirectPath({})).toBeNull();
    expect(
      resolveHomeServerRedirectPath({
        accessToken: createJwtWithPayload({ warehouseId: null }),
        refreshToken: createJwtWithPayload({}),
      }),
    ).toBeNull();
  });
});

describe("createHomeRedirectMessage", () => {
  it("returns the sales redirect message", () => {
    expect(createHomeRedirectMessage("/sales")).toBe(
      "Redirecionando para vendas...",
    );
  });

  it("returns the warehouse selection redirect message", () => {
    expect(createHomeRedirectMessage("/warehouses")).toBe(
      "Redirecionando para seleção de armazém...",
    );
  });
});

describe("useHomeModel", () => {
  beforeEach(() => {
    routerReplaceMock.mockClear();
    selectedWarehouseIdMock = "wh-1";
  });

  it("redirects to sales when a warehouse is selected", async () => {
    const { result } = renderHook(() => useHomeModel());

    await waitFor(() => {
      expect(routerReplaceMock).toHaveBeenCalledWith("/sales");
    });

    expect(result.current.redirectMessage).toBe(
      "Redirecionando para vendas...",
    );
  });

  it("redirects to warehouses when no warehouse is selected", async () => {
    selectedWarehouseIdMock = null;

    const { result } = renderHook(() => useHomeModel());

    await waitFor(() => {
      expect(routerReplaceMock).toHaveBeenCalledWith("/warehouses");
    });

    expect(result.current.redirectMessage).toBe(
      "Redirecionando para seleção de armazém...",
    );
  });
});
