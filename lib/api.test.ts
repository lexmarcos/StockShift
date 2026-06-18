import { describe, expect, it } from "vitest";
import { HTTPError } from "ky";
import type { NormalizedOptions } from "ky";
import { shouldRefreshAccessToken, attachApiErrorMessage } from "./api";

const stubOptions = {} as unknown as NormalizedOptions;

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

describe("attachApiErrorMessage", () => {
  it("extracts message from API error body", async () => {
    const response = new Response(
      JSON.stringify({ message: "Estoque insuficiente" }),
      { status: 422 },
    );
    const request = new Request("https://example.test/api/x");
    const error = new HTTPError(response, request, stubOptions);

    const result = await attachApiErrorMessage(error);

    expect(result.message).toBe("Estoque insuficiente");
  });

  it("leaves 403 responses untouched", async () => {
    const response = new Response(
      JSON.stringify({ message: "Forbidden" }),
      { status: 403 },
    );
    const request = new Request("https://example.test/api/x");
    const error = new HTTPError(response, request, stubOptions);
    const originalMessage = error.message;

    const result = await attachApiErrorMessage(error);

    expect(result.message).toBe(originalMessage);
  });

  it("keeps original message for non-JSON body", async () => {
    const response = new Response("not-json", { status: 500 });
    const request = new Request("https://example.test/api/x");
    const error = new HTTPError(response, request, stubOptions);
    const originalMessage = error.message;

    const result = await attachApiErrorMessage(error);

    expect(result.message).toBe(originalMessage);
  });
});
