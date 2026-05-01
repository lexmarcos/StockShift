import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useForm } from "react-hook-form";
import { applyProductAiFillData } from "./product-ai-fill.model";
import type { ProductCreateFormData } from "../create/products-create.schema";

const defaultProductValues: ProductCreateFormData = {
  name: "",
  description: "",
  barcode: "",
  categoryId: "",
  brandId: "",
  isKit: false,
  hasExpiration: false,
  active: true,
  continuousMode: false,
  attributes: { weight: "", dimensions: "" },
  quantity: 0,
  manufacturedDate: "",
  expirationDate: "",
  costPrice: undefined,
  sellingPrice: undefined,
};

describe("applyProductAiFillData", () => {
  it("preenche nome, categoria, marca e peso detectados", () => {
    const { result } = renderHook(() =>
      useForm<ProductCreateFormData>({
        defaultValues: defaultProductValues,
      }),
    );

    act(() => {
      applyProductAiFillData(result.current, {
        name: "Café Especial",
        categoryId: "cat-1",
        brandId: "brand-1",
        volumeValue: 500,
        volumeUnit: "g",
      });
    });

    expect(result.current.getValues("name")).toBe("Café Especial");
    expect(result.current.getValues("categoryId")).toBe("cat-1");
    expect(result.current.getValues("brandId")).toBe("brand-1");
    expect(result.current.getValues("attributes.weight")).toBe("500g");
  });

  it("mantém peso atual quando a análise não retorna volume", () => {
    const { result } = renderHook(() =>
      useForm<ProductCreateFormData>({
        defaultValues: {
          ...defaultProductValues,
          attributes: { weight: "250g", dimensions: "" },
        },
      }),
    );

    act(() => {
      applyProductAiFillData(result.current, {
        name: "Café Moído",
      });
    });

    expect(result.current.getValues("name")).toBe("Café Moído");
    expect(result.current.getValues("attributes.weight")).toBe("250g");
  });
});
