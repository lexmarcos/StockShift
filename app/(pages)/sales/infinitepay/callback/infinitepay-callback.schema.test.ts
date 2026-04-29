import { describe, expect, it } from "vitest";
import { infinitePayCallbackStatusSchema } from "./infinitepay-callback.schema";

describe("infinitePayCallbackStatusSchema", () => {
  it("aceita o status success", () => {
    const status = infinitePayCallbackStatusSchema.parse("success");
    expect(status).toBe("success");
  });

  it("aceita o status error", () => {
    const status = infinitePayCallbackStatusSchema.parse("error");
    expect(status).toBe("error");
  });

  it("rejeita status inválido", () => {
    expect(() => infinitePayCallbackStatusSchema.parse("pending")).toThrow();
  });
});
