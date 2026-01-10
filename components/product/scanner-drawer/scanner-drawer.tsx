"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Drawer } from "vaul";
import {
  Camera,
  X,
  PackageX,
  Loader2,
  CheckCircle2,
  ScanLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useScannerDrawer } from "./use-scanner-drawer";
import { batchFormSchema, BatchFormSchema } from "./scanner-drawer.schema";
import { ScannerDrawerProps } from "./scanner-drawer.types";
import { useRouter } from "next/navigation";

export const ScannerDrawer = ({ open, onOpenChange }: ScannerDrawerProps) => {
  const router = useRouter();
  const { state, scannedBarcode, product, isSubmitting, onScan, onSubmitBatch, onReset } =
    useScannerDrawer();

  const [batchCode, setBatchCode] = useState("");

  const form = useForm<BatchFormSchema>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: {
      quantity: 1,
      hasExpiration: false,
      batchCode: "",
      expirationDate: undefined,
    },
  });

  // Generate batch code when product is found
  useEffect(() => {
    if (state === "product-found" && !batchCode) {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      const code = `BATCH-${year}${month}${day}-${random}`;
      setBatchCode(code);
      form.setValue("batchCode", code);
    }
  }, [state, batchCode, form]);

  // Reset on drawer close
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        onReset();
        form.reset();
        setBatchCode("");
      }, 300);
    }
  }, [open, onReset, form]);

  const handleScan = (detectedCodes: { rawValue: string }[]) => {
    if (detectedCodes.length > 0 && state === "scanning") {
      const barcode = detectedCodes[0].rawValue;
      onScan(barcode);
    }
  };

  const handleSubmit = form.handleSubmit(async (data: BatchFormSchema) => {
    await onSubmitBatch(data);
    onOpenChange(false);
  });

  const handleCreateProduct = () => {
    onOpenChange(false);
    router.push(`/products/create?barcode=${scannedBarcode}`);
  };

  const hasExpiration = form.watch("hasExpiration");

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border/40 flex flex-col rounded-t-sm max-h-[95vh]">
          {/* Accessibility requirements */}
          <Drawer.Title className="sr-only">Adicionar via Scanner</Drawer.Title>
          <Drawer.Description className="sr-only">Escanear código de barras para adicionar itens ao estoque</Drawer.Description>

          {/* Header */}
          <div className="flex items-center justify-between px-4 h-14 border-b border-border/40 shrink-0">
            <div className="flex items-center gap-2">
              <ScanLine className="h-4 w-4 text-[#00FF41]" />
              <h2 className="text-sm font-semibold uppercase tracking-wide">
                Adicionar via Scanner
              </h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-sm"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            {/* Scanner Area */}
            <div className="relative mb-6">
              {state === "scanning" && (
                <div className="relative aspect-[4/3] bg-black rounded-sm overflow-hidden border border-border/20">
                  <Scanner
                    onScan={handleScan}
                    formats={[
                      "ean_13",
                      "ean_8",
                      "code_128",
                      "code_39",
                      "upc_a",
                      "upc_e",
                    ]}
                    components={{
                      finder: false,
                    }}
                    styles={{
                      container: { width: "100%", height: "100%" },
                      video: { objectFit: "cover" },
                    }}
                  />
                  {/* Scan Line Overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#00FF41] shadow-[0_0_10px_#00FF41] animate-pulse" />
                    {/* Corner Markers */}
                    <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#00FF41]" />
                    <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#00FF41]" />
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#00FF41]" />
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#00FF41]" />
                  </div>
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <p className="text-xs text-[#00FF41] font-mono uppercase tracking-wider">
                      Posicione o código de barras
                    </p>
                  </div>
                </div>
              )}

              {state === "loading" && (
                <div className="aspect-[4/3] bg-muted rounded-sm flex flex-col items-center justify-center border border-border/40">
                  <Loader2 className="h-8 w-8 text-foreground animate-spin mb-3" />
                  <p className="text-sm text-muted-foreground font-mono">
                    Processando...
                  </p>
                </div>
              )}

              {(state === "product-found" || state === "product-not-found") && (
                <div className="aspect-[4/3] bg-muted rounded-sm flex flex-col items-center justify-center border border-border/40">
                  <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                  <Button
                    variant="outline"
                    onClick={onReset}
                    className="rounded-sm"
                  >
                    <ScanLine className="mr-2 h-4 w-4" />
                    Ler Novo Código
                  </Button>
                </div>
              )}
            </div>

            {/* Product Found - Form */}
            {state === "product-found" && product && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Product Name - Read Only */}
                <div className="bg-background border border-border/40 p-3 rounded-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#00FF41] mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        Produto Encontrado
                      </p>
                      <p className="text-sm font-semibold truncate">
                        {product.name}
                      </p>
                      {product.sku && (
                        <p className="text-xs text-muted-foreground font-mono mt-1">
                          SKU: {product.sku}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Batch Code */}
                <div className="space-y-1.5">
                  <Label htmlFor="batchCode" className="text-xs uppercase tracking-wide">
                    Código do Batch
                  </Label>
                  <Input
                    id="batchCode"
                    {...form.register("batchCode")}
                    className="h-9 rounded-sm bg-background border-border/60 font-mono text-sm"
                    placeholder="BATCH-20260104-XXXX"
                  />
                  {form.formState.errors.batchCode && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.batchCode.message}
                    </p>
                  )}
                </div>

                {/* Quantity */}
                <div className="space-y-1.5">
                  <Label htmlFor="quantity" className="text-xs uppercase tracking-wide">
                    Quantidade
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    {...form.register("quantity", { valueAsNumber: true })}
                    className="h-9 rounded-sm bg-background border-border/60"
                    placeholder="0"
                    min={1}
                  />
                  {form.formState.errors.quantity && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.quantity.message}
                    </p>
                  )}
                </div>

                {/* Has Expiration Checkbox */}
                <div className="flex items-center space-x-2 py-2">
                  <Checkbox
                    id="hasExpiration"
                    checked={hasExpiration}
                    onCheckedChange={(checked) =>
                      form.setValue("hasExpiration", checked === true)
                    }
                    className="rounded-sm"
                  />
                  <Label
                    htmlFor="hasExpiration"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Produto tem validade
                  </Label>
                </div>

                {/* Expiration Date */}
                {hasExpiration && (
                  <div className="space-y-1.5">
                    <Label htmlFor="expirationDate" className="text-xs uppercase tracking-wide">
                      Data de Validade
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-9 rounded-sm bg-background border-border/60",
                            !form.watch("expirationDate") && "text-muted-foreground"
                          )}
                        >
                          {form.watch("expirationDate") ? (
                            format(form.watch("expirationDate")!, "dd/MM/yyyy", {
                              locale: ptBR,
                            })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={form.watch("expirationDate")}
                          onSelect={(date) => form.setValue("expirationDate", date)}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {form.formState.errors.expirationDate && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.expirationDate.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-10 rounded-sm bg-foreground text-background hover:bg-foreground/90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adicionando...
                    </>
                  ) : (
                    "Adicionar Estoque"
                  )}
                </Button>
              </form>
            )}

            {/* Product Not Found */}
            {state === "product-not-found" && (
              <div className="bg-muted border border-border/40 rounded-sm p-6 text-center">
                <PackageX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm font-semibold mb-2">Produto não encontrado</p>
                <p className="text-xs text-muted-foreground mb-6">
                  Nenhum produto foi encontrado com o código{" "}
                  <span className="font-mono">{scannedBarcode}</span>
                </p>
                <Button
                  onClick={handleCreateProduct}
                  className="w-full rounded-sm bg-foreground text-background hover:bg-foreground/90"
                >
                  Cadastrar Produto
                </Button>
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
