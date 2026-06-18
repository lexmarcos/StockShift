"use client";

import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/ui/responsive-modal";

interface BarcodeScannerErrorModalProps {
  content: string | null;
  onClose: () => void;
}

export const formatBarcodeScannerError = (error: unknown): string => {
  if (error instanceof Error) {
    return JSON.stringify(
      {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      null,
      2,
    );
  }

  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
};

export const BarcodeScannerErrorModal = ({
  content,
  onClose,
}: BarcodeScannerErrorModalProps) => {
  const handleCopyContent = (): void => {
    if (!content) return;
    void navigator.clipboard?.writeText(content);
  };

  return (
    <ResponsiveModal
      open={content !== null}
      onOpenChange={(open) => !open && onClose()}
      title="Erro no leitor"
      description="Conteúdo capturado pelo leitor de código de barras."
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-10 w-full rounded-[4px] border-neutral-800 text-xs font-bold uppercase tracking-wide md:w-auto"
          >
            Fechar
          </Button>
          <Button
            type="button"
            onClick={handleCopyContent}
            className="h-10 w-full rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 md:w-auto"
          >
            Copiar Conteúdo
          </Button>
        </>
      }
    >
      <pre className="max-h-[360px] overflow-auto rounded-[4px] border border-neutral-800 bg-neutral-950 p-3 text-xs text-neutral-300 whitespace-pre-wrap">
        {content}
      </pre>
    </ResponsiveModal>
  );
};
