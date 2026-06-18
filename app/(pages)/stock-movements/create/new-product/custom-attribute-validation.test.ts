import { describe, expect, it } from "vitest";
import {
  customAttributeFieldId,
  findCustomAttributeError,
} from "./custom-attribute-validation";
import type { CustomAttribute } from "@/components/product/custom-attributes-builder";

const attribute = (
  id: string,
  key: string,
  value: string,
): CustomAttribute => ({ id, key, value });

describe("findCustomAttributeError", () => {
  it("returns null when every row has a name and a value", () => {
    const attributes = [attribute("a", "cor", "azul"), attribute("b", "peso", "1kg")];

    expect(findCustomAttributeError(attributes)).toBeNull();
  });

  it("points at the empty name field of the first incomplete row", () => {
    const attributes = [attribute("a", "cor", "azul"), attribute("b", "", "1kg")];

    expect(findCustomAttributeError(attributes)).toEqual({
      index: 1,
      field: "key",
      message: "Atributo 2: Nome e valor são obrigatórios",
    });
  });

  it("points at the value field when only the value is missing", () => {
    const attributes = [attribute("a", "cor", "")];

    expect(findCustomAttributeError(attributes)).toEqual({
      index: 0,
      field: "value",
      message: "Atributo 1: Nome e valor são obrigatórios",
    });
  });

  it("flags a duplicate name on the second occurrence, case-insensitively", () => {
    const attributes = [
      attribute("a", "Cor", "azul"),
      attribute("b", "cor", "verde"),
    ];

    expect(findCustomAttributeError(attributes)).toEqual({
      index: 1,
      field: "key",
      message: 'Já existe um atributo com o nome "cor"',
    });
  });

  it("reports incomplete rows before duplicates", () => {
    const attributes = [
      attribute("a", "cor", "azul"),
      attribute("b", "cor", ""),
    ];

    expect(findCustomAttributeError(attributes)?.field).toBe("value");
  });
});

describe("customAttributeFieldId", () => {
  it("builds the DOM id used by CustomAttributesBuilder", () => {
    expect(customAttributeFieldId(2, "key")).toBe("attr-key-2");
    expect(customAttributeFieldId(0, "value")).toBe("attr-value-0");
  });
});
