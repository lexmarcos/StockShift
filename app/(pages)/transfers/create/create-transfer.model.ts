import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import { useBreadcrumb } from "@/components/breadcrumb";
import { createTransferSchema, CreateTransferFormData } from "./create-transfer.schema";
import { CreateTransferResponse, Product, Warehouse } from "./create-transfer.types";

interface WarehousesResponse {
  success: boolean;
  data: Warehouse[];
}

interface ProductsResponse {
  success: boolean;
  data: Product[];
}

export const useCreateTransferModel = () => {
  const router = useRouter();
  const { warehouseId } = useSelectedWarehouse();

  useBreadcrumb({
    title: "Nova Transferência",
    backUrl: "/transfers",
    section: "Transferências",
    subsection: "Criar",
  });

  const form = useForm<CreateTransferFormData>({
    resolver: zodResolver(createTransferSchema),
    defaultValues: {
      destinationWarehouseId: "",
      notes: "",
      items: [{ productId: "", quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const { data: warehousesData } = useSWR<WarehousesResponse>(
    "warehouses",
    async () => await api.get("warehouses").json<WarehousesResponse>()
  );

  const { data: productsData } = useSWR<ProductsResponse>(
    warehouseId ? `warehouses/${warehouseId}/products` : null,
    async (url) => await api.get(url).json<ProductsResponse>()
  );

  const availableWarehouses = (warehousesData?.data || []).filter(
    (w) => w.id !== warehouseId
  );

  const currentWarehouse = warehousesData?.data.find((w) => w.id === warehouseId);

  const onSubmit = async (data: CreateTransferFormData) => {
    try {
      const response = await api
        .post("transfers", { json: data })
        .json<CreateTransferResponse>();

      if (response.success) {
        toast.success("Transferência criada com sucesso");
        router.push(`/transfers/${response.data.id}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao criar transferência";
      toast.error(message);
    }
  };

  const addItem = () => {
    append({ productId: "", quantity: 1 });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return {
    form,
    onSubmit,
    warehouses: availableWarehouses,
    products: productsData?.data || [],
    currentWarehouseName: currentWarehouse?.name || "",
    isSubmitting: form.formState.isSubmitting,
    items: fields,
    addItem,
    removeItem,
  };
};
