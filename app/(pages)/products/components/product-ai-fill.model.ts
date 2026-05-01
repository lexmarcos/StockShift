import type { UseFormReturn } from "react-hook-form";
import type { ProductCreateFormData } from "../create/products-create.schema";
import type { AiFillData } from "../create/products-create.types";

export const applyProductAiFillData = (
  form: UseFormReturn<ProductCreateFormData>,
  data: AiFillData,
): void => {
  if (data.name) form.setValue("name", data.name);
  if (data.categoryId) form.setValue("categoryId", data.categoryId);
  if (data.brandId) form.setValue("brandId", data.brandId);
  if (data.volumeValue === undefined) return;

  const weightValue = `${data.volumeValue}${data.volumeUnit || ""}`;
  form.setValue("attributes.weight", weightValue);
};
