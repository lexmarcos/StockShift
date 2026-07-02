import { describe, expect, it, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

const createImageAssetRequest = (
  assetUrl: string,
  cookie: string = "accessToken=access-token",
): NextRequest => {
  const requestUrl = new URL(
    "https://stockshift.test/api/product-prompt-assets/image",
  );
  requestUrl.searchParams.set("url", assetUrl);
  return new NextRequest(requestUrl, { headers: { cookie } });
};

const createFetchMock = () => {
  const fetchMock = vi.fn<
    (input: string | URL | Request, init?: RequestInit) => Promise<Response>
  >();
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("product prompt asset image route", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 401 when no session cookie exists", async () => {
    const request = createImageAssetRequest(
      "https://bucket.r2.dev/products/image.jpg",
      "",
    );

    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it("returns 400 for URLs outside the R2 asset allowlist", async () => {
    const request = createImageAssetRequest("https://example.com/image.jpg");

    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it("fetches allowed R2 images without following redirects", async () => {
    const fetchMock = createFetchMock();
    fetchMock.mockResolvedValue(
      new Response("image-bytes", {
        status: 200,
        headers: { "content-type": "image/png" },
      }),
    );
    const request = createImageAssetRequest(
      "https://bucket.r2.dev/products/image.png",
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      new URL("https://bucket.r2.dev/products/image.png"),
      { cache: "no-store", redirect: "error" },
    );
  });

  it("rejects allowed R2 responses that are not images", async () => {
    const fetchMock = createFetchMock();
    fetchMock.mockResolvedValue(
      new Response("not-image", {
        status: 200,
        headers: { "content-type": "text/plain" },
      }),
    );
    const request = createImageAssetRequest(
      "https://bucket.r2.dev/products/image.txt",
    );

    const response = await GET(request);

    expect(response.status).toBe(415);
  });
});
