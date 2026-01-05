"use client";

import { Scanner } from "@yudiel/react-qr-scanner";
import { X, Camera, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  const handleScan = (detectedCodes: any[]) => {
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-sm border border-border/50 bg-card p-0 overflow-hidden">
        {/* Header - Corporate Solid */}
        <DialogHeader className="border-b border-border/30 px-6 py-4 bg-muted/10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-foreground/5 border border-border/30">
                <Camera className="h-5 w-5 text-foreground/70" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold uppercase tracking-wide">
                  Scanner de Código
                </DialogTitle>
                <DialogDescription className="text-xs mt-1">
                  Posicione o código dentro da área marcada
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-sm hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Scanner Area */}
        <div className="relative bg-black">
          <Scanner
            onScan={handleScan}
            onError={handleError}
            formats={[
              "qr_code",
              "ean_13",
              "ean_8",
              "code_128",
              "code_39",
              "upc_a",
              "upc_e",
            ]}
            styles={{
              container: {
                width: "100%",
                height: "400px",
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
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
            <div className="flex items-center gap-3 rounded-sm border border-border/30 bg-card/90 backdrop-blur-sm p-4">
              <AlertCircle className="h-5 w-5 text-foreground/60 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  Mantenha o código centralizado
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  A leitura é automática quando detectado
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border/30 px-6 py-4 bg-muted/5">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="w-full rounded-sm border-border/40"
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
