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
});
