import { api } from "@/lib/api";
import type { CreateStockMovementSchema } from "./create-stock-movement.schema";
import { getOptionalText } from "./stock-movement-batch-form-validation";
import { inlineProductImageToFile } from "./create-stock-movement.storage";
import type { InlineProductImageData } from "./create-stock-movement.types";

interface ExistingProductMovementPayload {
  productId: string | undefined;
  quantity: number;
  manufacturedDate?: string;
  expirationDate?: string;
  costPrice?: number;
  sellingPrice?: number;
}

interface NewProductMovementPayload {
  quantity: number;
  newProduct: {
    name: string;
    description?: string;
    barcode?: string;
    categoryId?: string;
    brandId?: string;
    isKit?: boolean;
    hasExpiration: boolean;
    active?: boolean;
    attributes?: Record<string, string>;
  };
  manufacturedDate?: string;
  expirationDate?: string;
  costPrice?: number;
  sellingPrice?: number;
  imageUploadId?: string;
}

type MovementItemPayload =
  | ExistingProductMovementPayload
  | NewProductMovementPayload;

interface StockMovementPayload {
  type: NonNullable<CreateStockMovementSchema["type"]>;
  notes?: string;
  items: MovementItemPayload[];
}

export const resolveExistingProductBatchQuantity = (value: string): number => {
  const quantity = Number(value);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
};

const buildExistingProductItemPayload = (
  item: CreateStockMovementSchema["items"][number],
): ExistingProductMovementPayload => {
  const payload: {
    productId: string | undefined;
    quantity: number;
    manufacturedDate?: string;
    expirationDate?: string;
    costPrice?: number;
    sellingPrice?: number;
  } = { productId: item.productId, quantity: item.quantity };

  const manufacturedDate = getOptionalText(item.manufacturedDate);
  const expirationDate = getOptionalText(item.expirationDate);
  if (manufacturedDate) payload.manufacturedDate = manufacturedDate;
  if (expirationDate) payload.expirationDate = expirationDate;
  if (item.costPrice !== undefined) payload.costPrice = item.costPrice;
  if (item.sellingPrice !== undefined) payload.sellingPrice = item.sellingPrice;
  return payload;
};

const buildMovementItemPayload = (
  item: CreateStockMovementSchema["items"][number],
): MovementItemPayload => {
  if (!item.newProductData) return buildExistingProductItemPayload(item);
  const newProduct = {
    name: item.newProductData.name,
    description: item.newProductData.description,
    barcode: item.newProductData.barcode,
    categoryId: item.newProductData.categoryId,
    brandId: item.newProductData.brandId,
    isKit: item.newProductData.isKit,
    hasExpiration: Boolean(item.newProductData.expirationDate),
    active: item.newProductData.active,
    attributes: item.newProductData.attributes,
  };
  return {
    quantity: item.quantity,
    newProduct,
    manufacturedDate: getOptionalText(item.newProductData.manufacturedDate),
    expirationDate: getOptionalText(item.newProductData.expirationDate),
    costPrice: item.newProductData.costPrice,
    sellingPrice: item.newProductData.sellingPrice,
  };
};

export const buildMovementPayload = (
  selectedMovementType: NonNullable<CreateStockMovementSchema["type"]>,
  data: CreateStockMovementSchema,
): StockMovementPayload => ({
  type: selectedMovementType,
  notes: data.notes || undefined,
  items: data.items.map(buildMovementItemPayload),
});

interface TemporaryProductImageUploadResponse {
  success: boolean;
  data: {
    uploadId: string;
    fileName: string;
    contentType: string;
    sizeBytes: number;
  };
}

const uploadTemporaryInlineProductImage = async (
  image: InlineProductImageData,
): Promise<string> => {
  const formData = new FormData();
  formData.append("image", inlineProductImageToFile(image));
  const response = await api
    .post("uploads/product-images/temp", { body: formData })
    .json<TemporaryProductImageUploadResponse>();
  return response.data.uploadId;
};

export const uploadInlineProductImages = async (
  payload: StockMovementPayload,
  items: CreateStockMovementSchema["items"],
): Promise<StockMovementPayload> => {
  const movementItems = [...payload.items];
  for (const [index, formItem] of items.entries()) {
    if (!formItem.newProductData?.image) continue;
    const itemPayload = movementItems[index];
    if (!("newProduct" in itemPayload)) continue;
    movementItems[index] = {
      ...itemPayload,
      imageUploadId: await uploadTemporaryInlineProductImage(
        formItem.newProductData.image,
      ),
    };
  }
  return { ...payload, items: movementItems };
};
