export type ProductParams = {
  params: { name: string };
};

export interface BaseProduct {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  sku: string;
}

export interface CreateProductInput extends BaseProduct {
  categoryIDs: string[];
}
