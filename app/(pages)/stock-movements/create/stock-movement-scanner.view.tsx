"use client";

import { Scanner, IDetectedBarcode } from "@yudiel/react-qr-scanner";
import { ScanLine, X } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  const handleScan = (detectedCodes: IDetectedBarcode[]) => {
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
              <ScanLine className="h-4 w-4 text-blue-400" strokeWidth={2.5} />
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
              className="h-8 w-8 rounded-[4px] text-neutral-400 hover:bg-neutral-800 hover:text-white"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </Button>
          </div>
        </DrawerHeader>

        <div className="p-4">
          <div className="relative overflow-hidden rounded-[4px] border border-neutral-800 bg-black">
            <Scanner
              onScan={handleScan}
              onError={handleError}
              formats={[
                "ean_13",
                "ean_8",
                "code_128",
                "code_39",
                "upc_a",
                "upc_e",
              ]}
              components={{
                finder: true,
                onOff: false,
                torch: false,
                zoom: false,
              }}
              styles={{
                container: { width: "100%", height: "min(64vh, 420px)" },
                video: { objectFit: "cover" },
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/80 px-4 py-3">
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
