import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { batchCreateSchema, BatchCreateFormData } from "./batches-create.schema";
import type { BatchCreateResponse } from "./batches-create.types";

interface ProductsResponse {
  success: boolean;
  data: Array<{
    id: string;
    name: string;
    sku?: string | null;
    hasExpiration: boolean;
  }>;
}

interface WarehousesResponse {
  success: boolean;
  data: Array<{ id: string; name: string }>;
}

export const buildBatchPayload = (data: BatchCreateFormData) => ({
  productId: data.productId,
  warehouseId: data.warehouseId,
  quantity: data.quantity,
  batchCode: data.batchCode?.trim() || undefined,
  manufacturedDate: data.manufacturedDate || undefined,
  expirationDate: data.expirationDate || undefined,
  costPrice: data.costPrice,
  sellingPrice: data.sellingPrice,
  notes: data.notes?.trim() || undefined,
});

export const useBatchCreateModel = () => {
  const router = useRouter();

  const form = useForm<BatchCreateFormData>({
    resolver: zodResolver(batchCreateSchema),
    defaultValues: {
      productId: "",
      warehouseId: "",
      quantity: 1,
      batchCode: "",
      manufacturedDate: "",
      expirationDate: "",
      costPrice: undefined,
      sellingPrice: undefined,
      notes: "",
    },
  });

  const { data: productsData } = useSWR<ProductsResponse>(
    "products",
    async () => {
      const { api } = await import("@/lib/api");
      return await api.get("products").json<ProductsResponse>();
    }
  );

  const { data: warehousesData } = useSWR<WarehousesResponse>(
    "warehouses",
    async () => {
      const { api } = await import("@/lib/api");
      return await api.get("warehouses").json<WarehousesResponse>();
    }
  );

  const selectedProduct = productsData?.data.find(
    (product) => product.id === form.watch("productId")
  );

  const onSubmit = async (data: BatchCreateFormData) => {
    if (selectedProduct?.hasExpiration && !data.expirationDate) {
      form.setError("expirationDate", {
        message: "Validade obrigatória para este produto",
      });
      return;
    }

    try {
      const payload = buildBatchPayload(data);
      const { api } = await import("@/lib/api");
      const response = await api
        .post("batches", { json: payload })
        .json<BatchCreateResponse>();

      if (response.success) {
        toast.success("Batch criado com sucesso");
        router.push(`/batches/${response.data.id}`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao criar batch");
    }
  };

  return {
    form,
    onSubmit,
    products: productsData?.data || [],
    warehouses: warehousesData?.data || [],
    selectedProduct,
  };
};
