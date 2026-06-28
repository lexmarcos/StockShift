import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  updateSellingPriceSchema,
  type UpdateSellingPriceFormData,
} from "./update-selling-price.schema";
import type { ProductBatch, SellingPriceUpdateModel } from "./product-batches.types";

interface UseUpdateSellingPriceParams {
  warehouseId: string | null;
  productId: string;
  batches: readonly ProductBatch[];
  onUpdated: () => void;
}

interface UpdateSellingPriceResponse {
  success: boolean;
  message: string;
  data: {
    message: string;
    affectedCount: number;
    productId: string;
    warehouseId: string;
  };
}

export const deriveSellingPriceSummary = (
  batches: readonly ProductBatch[],
): { hasDifferentPrices: boolean; currentUniformPrice: number | undefined } => {
  const distinctPrices = new Set(batches.map((batch) => batch.sellingPrice));
  const [onlyPrice] = distinctPrices;
  return {
    hasDifferentPrices: distinctPrices.size > 1,
    currentUniformPrice:
      distinctPrices.size === 1 ? onlyPrice ?? undefined : undefined,
  };
};

export const useUpdateSellingPrice = ({
  warehouseId,
  productId,
  batches,
  onUpdated,
}: UseUpdateSellingPriceParams): SellingPriceUpdateModel => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { hasDifferentPrices, currentUniformPrice } = useMemo(
    () => deriveSellingPriceSummary(batches),
    [batches],
  );

  const form = useForm<UpdateSellingPriceFormData>({
    resolver: zodResolver(updateSellingPriceSchema),
    defaultValues: { sellingPrice: undefined },
  });

  const openModal = () => {
    form.reset({ sellingPrice: currentUniformPrice });
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);

  const requestConfirmation = () => setIsConfirmOpen(true);

  const closeConfirm = () => setIsConfirmOpen(false);

  const confirmUpdate = async () => {
    const sellingPrice = form.getValues("sellingPrice");
    if (!warehouseId) {
      toast.error("Selecione um armazém para alterar o preço.");
      return;
    }
    if (typeof sellingPrice !== "number") return;

    setIsSubmitting(true);
    try {
      const { api } = await import("@/lib/api");
      const response = await api
        .patch(
          `batches/warehouses/${warehouseId}/products/${productId}/batches/selling-price`,
          { json: { sellingPrice } },
        )
        .json<UpdateSellingPriceResponse>();

      toast.success(`Preço atualizado em ${response.data.affectedCount} lote(s)`);
      onUpdated();
      setIsConfirmOpen(false);
      setIsOpen(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao atualizar o preço de venda";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    isOpen,
    isConfirmOpen,
    isSubmitting,
    hasDifferentPrices,
    openModal,
    closeModal,
    requestConfirmation,
    closeConfirm,
    confirmUpdate,
  };
};
