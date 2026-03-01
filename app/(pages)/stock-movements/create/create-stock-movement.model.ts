import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { api } from "@/lib/api";
import {
  createStockMovementSchema,
  CreateStockMovementSchema,
} from "./create-stock-movement.schema";
import { CreateStockMovementViewProps } from "./create-stock-movement.types";
import { useBreadcrumb } from "@/components/breadcrumb";

interface ProductListResponse {
  success: boolean;
  data:
    | { content: Array<{ id: string; name: string }> }
    | Array<{ id: string; name: string }>;
}

export function useCreateStockMovementModel(): CreateStockMovementViewProps {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [addItemError, setAddItemError] = useState<string | null>(null);

  useBreadcrumb({
    title: "Nova Movimentação",
    backUrl: "/stock-movements",
    section: "Movimentações",
    subsection: "Criar",
  });

  const form = useForm<CreateStockMovementSchema>({
    resolver: zodResolver(createStockMovementSchema),
    defaultValues: {
      items: [],
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const { data: productsData, isLoading: isLoadingProducts } =
    useSWR<ProductListResponse>("products", (url: string) =>
      api.get(url).json<ProductListResponse>(),
    );

  const rawProducts = productsData?.data;
  const products = (
    Array.isArray(rawProducts) ? rawProducts : rawProducts?.content || []
  ).map((p) => ({ id: p.id, name: p.name }));

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    setAddItemError(null);
  };

  const handleAddItem = () => {
    setAddItemError(null);

    if (!selectedProductId) {
      setAddItemError("Selecione um produto.");
      return;
    }

    const qty = Number(itemQuantity);
    if (!qty || qty <= 0) {
      setAddItemError("Informe uma quantidade válida.");
      return;
    }

    const alreadyAdded = fields.find((f) => f.productId === selectedProductId);
    if (alreadyAdded) {
      setAddItemError(
        "Este produto já foi adicionado. Remova-o para alterar a quantidade.",
      );
      return;
    }

    const product = products.find((p) => p.id === selectedProductId);

    append({
      productId: selectedProductId,
      quantity: qty,
      productName: product?.name || "Produto",
    });

    setSelectedProductId("");
    setItemQuantity("");
  };

  const onSubmit = async (data: CreateStockMovementSchema) => {
    setIsSubmitting(true);
    try {
      await api.post("stock-movements", {
        json: {
          type: data.type,
          notes: data.notes || undefined,
          items: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      });

      toast.success("Movimentação criada com sucesso!");
      router.push("/stock-movements");
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Erro ao criar movimentação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    onSubmit,
    products,
    isLoadingProducts,
    isSubmitting,
    selectedProductId,
    itemQuantity,
    addItemError,
    onProductChange: handleProductChange,
    onQuantityChange: setItemQuantity,
    onAddItem: handleAddItem,
    onRemoveItem: remove,
    items: fields,
  };
}
