"use client";

import { type BarcodeScannerDetectedCode } from "@/components/product/barcode-scanner.types";
import { ScanLine, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BarcodeScanner } from "@/components/product/barcode-scanner";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface StockMovementScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (barcode: string) => void;
}

export function StockMovementScanner({
  open,
  onOpenChange,
  onScan,
}: StockMovementScannerProps) {
  const handleScan = (detectedCodes: BarcodeScannerDetectedCode[]) => {
    const barcode = detectedCodes[0]?.rawValue;
    if (!barcode) return;
    onScan(barcode);
  };

  const handleError = (error: unknown) => {
    console.error("Erro ao acessar câmera:", error);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="max-h-[92vh] rounded-t-[4px] border-neutral-800 bg-[#171717]">
        <DrawerHeader className="border-b border-neutral-800 px-4 py-3 text-left">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <ScanLine className="size-4 text-blue-400" strokeWidth={2.5} />
              <div className="min-w-0">
                <DrawerTitle className="text-sm font-bold uppercase tracking-wide text-white">
                  Scanner de Produto
                </DrawerTitle>
                <DrawerDescription className="text-[10px] text-neutral-500">
                  Aponte para o código de barras para adicionar o produto
                </DrawerDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="size-8 rounded-[4px] text-neutral-400 hover:bg-neutral-800 hover:text-white"
            >
              <X className="size-4" strokeWidth={2} />
            </Button>
          </div>
        </DrawerHeader>

        <div className="p-4">
          <div className="relative overflow-hidden rounded-[4px] border border-neutral-800 bg-[#0A0A0A]">
            <BarcodeScanner
              onScan={handleScan}
              onError={handleError}
              components={{ finder: true }}
              styles={{
                container: { width: "100%", height: "min(64vh, 420px)" },
                video: { objectFit: "cover" },
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-[#0A0A0A]/80 px-4 py-3">
              <p className="text-center text-[10px] font-bold uppercase tracking-wide text-blue-300">
                Leitura contínua ativa
              </p>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
