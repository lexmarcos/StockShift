import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { mutate } from "swr";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import {
  ScannerState,
  Product,
  BatchFormData,
  UseScannerDrawerReturn,
} from "./scanner-drawer.types";

export const useScannerDrawer = (): UseScannerDrawerReturn => {
  const [state, setState] = useState<ScannerState>("scanning");
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { warehouseId } = useSelectedWarehouse();

  const generateBatchCode = useCallback(() => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BATCH-${year}${month}${day}-${random}`;
  }, []);

  const onScan = useCallback(
    async (barcode: string) => {
      if (!barcode || state !== "scanning") return;

      setState("loading");
      setScannedBarcode(barcode);

      try {
        // Busca produto por código de barras
        const response = await api
          .get(`products/search?q=${encodeURIComponent(barcode)}`)
          .json<{ success: boolean; data: Product[] }>();

        if (response.success && response.data.length > 0) {
          // Produto encontrado
          const foundProduct = response.data[0];
          setProduct(foundProduct);
          setState("product-found");
        } else {
          // Produto não encontrado
          setProduct(null);
          setState("product-not-found");
        }
      } catch (error) {
        console.error("Erro ao buscar produto:", error);
        toast.error("Erro ao buscar produto. Tente novamente.");
        setState("scanning");
        setScannedBarcode(null);
      }
    },
    [state]
  );

  const onSubmitBatch = useCallback(
    async (data: BatchFormData) => {
      if (!product || !warehouseId) {
        toast.error("Produto ou armazém não selecionado");
        return;
      }

      setIsSubmitting(true);

      try {
        const payload = {
          productId: product.id,
          warehouseId,
          quantity: data.quantity,
          batchNumber: data.batchCode,
          expirationDate: data.expirationDate
            ? data.expirationDate.toISOString().split("T")[0]
            : undefined,
        };

        await api.post("batches", { json: payload }).json();

        toast.success("Estoque adicionado com sucesso!");

        // Invalida cache para atualizar lista de produtos
        mutate((key) => typeof key === "string" && key.includes("products"));
        mutate((key) => typeof key === "string" && key.includes("batches"));

        // Reset
        onReset();
      } catch (error: unknown) {
        console.error("Erro ao adicionar batch:", error);
        if (error instanceof Error) {
          toast.error(error.message || "Erro ao adicionar estoque");
        } else {
          toast.error("Erro ao adicionar estoque");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [product, warehouseId]
  );

  const onReset = useCallback(() => {
    setState("scanning");
    setScannedBarcode(null);
    setProduct(null);
    setIsSubmitting(false);
  }, []);

  return {
    state,
    scannedBarcode,
    product,
    isSubmitting,
    onScan,
    onSubmitBatch,
    onReset,
  };
};
