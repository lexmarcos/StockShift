import { describe, expect, it } from "vitest";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { config, middleware } from "./middleware";

describe("middleware matcher", () => {
  it("does not run for proxied backend API routes", () => {
    expect(
      unstable_doesMiddlewareMatch({
        config,
        url: "/stockshift/api/warehouses/warehouse-1/products",
      }),
    ).toBe(false);
  });

  it("still runs for protected application pages", () => {
    expect(
      unstable_doesMiddlewareMatch({
        config,
        url: "/products",
      }),
    ).toBe(true);
  });

  it("redirects unauthenticated password changes to login", () => {
    const request = new NextRequest("https://stockshift.test/change-password");
    const response = middleware(request);

    expect(response.headers.get("location")).toBe("https://stockshift.test/login");
  });

  it("allows protected pages when access token exists", () => {
    const request = new NextRequest("https://stockshift.test/products", {
      headers: { cookie: "accessToken=access-token" },
    });
    const response = middleware(request);

    expect(response.headers.get("location")).toBeNull();
  });

  it("adds a nonce-based content security policy to protected pages", () => {
    const request = new NextRequest("https://stockshift.test/products", {
      headers: { cookie: "accessToken=access-token" },
    });
    const response = middleware(request);

    const contentSecurityPolicy = response.headers.get("content-security-policy");

    expect(contentSecurityPolicy).toContain("default-src 'self'");
    expect(contentSecurityPolicy).toMatch(/script-src .*'nonce-[^']+'/);
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("adds security headers to auth redirects", () => {
    const request = new NextRequest("https://stockshift.test/products");
    const response = middleware(request);

    expect(response.headers.get("location")).toBe("https://stockshift.test/login");
    expect(response.headers.get("content-security-policy")).toContain(
      "frame-ancestors 'none'",
    );
    expect(response.headers.get("strict-transport-security")).toContain(
      "includeSubDomains",
    );
  });

  it("allows protected pages when only refresh token exists", () => {
    const request = new NextRequest("https://stockshift.test/products", {
      headers: { cookie: "refreshToken=refresh-token" },
    });
    const response = middleware(request);

    expect(response.headers.get("location")).toBeNull();
  });
});
