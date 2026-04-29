import { describe, expect, it } from "vitest";
import { shouldRefreshAccessToken } from "./api";

describe("shouldRefreshAccessToken", () => {
  it("refreshes on unauthorized responses", async () => {
    const response = new Response(null, { status: 401 });

    await expect(shouldRefreshAccessToken(response)).resolves.toBe(true);
  });

  it("does not refresh on authorization forbidden responses", async () => {
    const response = new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
    });

    await expect(shouldRefreshAccessToken(response)).resolves.toBe(false);
  });

  it("keeps refresh fallback for opaque 403 responses", async () => {
    const response = new Response("not-json", { status: 403 });

    await expect(shouldRefreshAccessToken(response)).resolves.toBe(true);
  });
});
