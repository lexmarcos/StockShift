import { describe, expect, it } from "vitest";
import {
  buildCompanyConfigFormData,
  buildCompanyConfigPayload,
} from "./company.model";

describe("company model helpers", () => {
  it("builds company config payload without logo", () => {
    const payload = buildCompanyConfigPayload({
      businessName: "StockShift",
      document: "123",
      email: "contato@stockshift.com",
      phone: "85999999999",
      logo: new File(["logo"], "logo.svg", { type: "image/svg+xml" }),
    });

    expect(payload).toEqual({
      businessName: "StockShift",
      document: "123",
      email: "contato@stockshift.com",
      phone: "85999999999",
    });
  });

  it("builds multipart company config with logo", async () => {
    const logo = new File(["logo"], "logo.svg", { type: "image/svg+xml" });
    const formData = buildCompanyConfigFormData({
      businessName: "StockShift",
      document: "123",
      email: "contato@stockshift.com",
      phone: "85999999999",
      logo,
    });

    const companyPart = formData.get("company");

    expect(formData.get("logo")).toBe(logo);
    expect(companyPart).toBeInstanceOf(Blob);
    expect((companyPart as Blob).type).toBe("application/json");
    expect((companyPart as Blob).size).toBeGreaterThan(0);
  });
});
