import type { CustomAttribute } from "@/components/product/custom-attributes-builder";

export interface CustomAttributeError {
  index: number;
  field: "key" | "value";
  message: string;
}

/** DOM id of a custom attribute input, mirroring CustomAttributesBuilder. */
export const customAttributeFieldId = (
  index: number,
  field: "key" | "value",
): string => `attr-${field}-${index}`;

/**
 * Returns the first blocking error among the custom attribute rows — an
 * incomplete row first, then a duplicate name — or null when all rows are
 * valid. The returned `index`/`field` point at the input to scroll to.
 */
export const findCustomAttributeError = (
  attributes: CustomAttribute[],
): CustomAttributeError | null => {
  const incompleteIndex = attributes.findIndex(
    (attr) => !attr.key.trim() || !attr.value.trim(),
  );
  if (incompleteIndex >= 0) {
    const attribute = attributes[incompleteIndex];
    return {
      index: incompleteIndex,
      field: attribute.key.trim() ? "value" : "key",
      message: `Atributo ${incompleteIndex + 1}: Nome e valor são obrigatórios`,
    };
  }

  const keys = attributes.map((attr) => attr.key.trim().toLowerCase());
  const duplicateIndex = keys.findIndex(
    (key, index) => keys.indexOf(key) !== index,
  );
  if (duplicateIndex >= 0) {
    return {
      index: duplicateIndex,
      field: "key",
      message: `Já existe um atributo com o nome "${keys[duplicateIndex]}"`,
    };
  }

  return null;
};
