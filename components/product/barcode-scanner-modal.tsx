"use client";

import { type IDetectedBarcode } from "@yudiel/react-qr-scanner";
import { AlertCircle } from "lucide-react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { BarcodeScanner } from "@/components/product/barcode-scanner";

interface BarcodeScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export const BarcodeScannerModal = ({
  open,
  onClose,
  onScan,
}: BarcodeScannerModalProps) => {
  const handleScan = (detectedCodes: IDetectedBarcode[]) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const code = detectedCodes[0].rawValue;
      onScan(code);
      onClose();
    }
  };

  const handleError = (error: unknown) => {
    console.error("Erro ao acessar câmera:", error);
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      title="Scanner de Código"
      description="Posicione o código dentro da área marcada"
      footer={
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="w-full rounded-[4px] border-neutral-800 bg-transparent text-xs font-bold uppercase tracking-wide text-neutral-400 hover:bg-neutral-800 hover:text-white"
        >
          Cancelar
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Scanner Area */}
        <div className="relative overflow-hidden rounded-[4px] border border-neutral-800 bg-[#0A0A0A]">
          <BarcodeScanner
            onScan={handleScan}
            onError={handleError}
            styles={{
              container: {
                width: "100%",
                height: "300px",
              },
              video: {
                objectFit: "cover",
              },
            }}
            components={{
              onOff: false,
              torch: false,
              zoom: false,
              finder: true,
            }}
          />

          {/* Overlay Instructions - Corporate Solid */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
            <div className="flex items-center gap-3 rounded-[4px] border border-neutral-800 bg-[#171717]/90 backdrop-blur-sm p-3">
              <AlertCircle className="size-4 text-neutral-500 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-white">
                  Leitura Automática
                </p>
                <p className="text-[10px] text-neutral-500 mt-0.5">
                  Mantenha o código centralizado
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ResponsiveModal>
  );
};
