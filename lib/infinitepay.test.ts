import { describe, expect, it } from "vitest";
import {
  buildInfinitePayCallbackUrl,
  buildInfinitePayDeeplink,
} from "./infinitepay";

function getDeeplinkParams(deeplink: string): URLSearchParams {
  const query = deeplink.split("?")[1] || "";
  return new URLSearchParams(query);
}

describe("buildInfinitePayDeeplink", () => {
  it("normalizes account identifiers for credit Tap payments", () => {
    const deeplink = buildInfinitePayDeeplink({
      amount: 100,
      paymentMethod: "credit",
      installments: 2,
      orderId: "sale-123",
      handle: " $merchant_dev_4 ",
      docNumber: "27.346.981/0001-44",
      resultUrl: "stockshift://sales/infinitepay/result",
    });

    const queryParams = getDeeplinkParams(deeplink);

    expect(deeplink).toMatch(/^infinitepaydash:\/\/infinitetap-app\?/);
    expect(queryParams.get("payment_method")).toBe("credit");
    expect(queryParams.get("installments")).toBe("2");
    expect(queryParams.get("handle")).toBe("merchant_dev_4");
    expect(queryParams.get("doc_number")).toBe("27346981000144");
  });

  it("omits optional account identifiers and installments for debit payments", () => {
    const deeplink = buildInfinitePayDeeplink({
      amount: 100,
      paymentMethod: "debit",
      installments: 1,
      orderId: "sale-123",
      handle: null,
      docNumber: undefined,
      resultUrl: "stockshift://sales/infinitepay/result",
    });

    const queryParams = getDeeplinkParams(deeplink);

    expect(queryParams.get("payment_method")).toBe("debit");
    expect(queryParams.has("installments")).toBe(false);
    expect(queryParams.has("handle")).toBe(false);
    expect(queryParams.has("doc_number")).toBe(false);
  });
});

describe("buildInfinitePayCallbackUrl", () => {
  it("builds the frontend callback URL from the current origin", () => {
    expect(buildInfinitePayCallbackUrl("https://app.stockshift.com/")).toBe(
      "https://app.stockshift.com/sales/infinitepay/callback",
    );
  });
});
