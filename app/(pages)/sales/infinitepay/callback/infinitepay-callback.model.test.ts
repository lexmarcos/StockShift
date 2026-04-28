import { describe, expect, it } from "vitest";
import {
  buildInfinitePayConfirmParams,
  buildInfinitePayResultPath,
} from "./infinitepay-callback.model";

describe("buildInfinitePayConfirmParams", () => {
  it("keeps only InfinitePay callback parameters", () => {
    const params = buildInfinitePayConfirmParams(
      "order_id=sale-123&nsu=abc&aut=999&card_brand=visa&ignored=value",
    );

    expect(params.get("order_id")).toBe("sale-123");
    expect(params.get("nsu")).toBe("abc");
    expect(params.get("aut")).toBe("999");
    expect(params.get("card_brand")).toBe("visa");
    expect(params.has("ignored")).toBe(false);
  });
});

describe("buildInfinitePayResultPath", () => {
  it("builds success result URL with sale id", () => {
    const path = buildInfinitePayResultPath({
      status: "success",
      saleId: "sale-123",
      message: null,
    });

    expect(path).toBe("/sales/infinitepay/result?status=success&sale_id=sale-123");
  });

  it("builds error result URL with message", () => {
    const path = buildInfinitePayResultPath({
      status: "error",
      saleId: null,
      message: "invalid_order",
    });

    expect(path).toBe("/sales/infinitepay/result?status=error&message=invalid_order");
  });
});
