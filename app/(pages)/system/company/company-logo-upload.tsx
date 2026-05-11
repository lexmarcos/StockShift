"use client";

import Image from "next/image";
import { useEffect, useState, type ChangeEvent, type DragEvent } from "react";
import { Image as ImageIcon, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CompanyLogoUploadProps {
  currentLogoUrl?: string | null;
  logoFile: File | null;
  disabled?: boolean;
  onLogoSelect: (file: File | null) => void;
}

const LOGO_TYPES = ["image/svg+xml", "image/png", "image/jpeg", "image/jpg"];
const MAX_LOGO_SIZE = 2 * 1024 * 1024;

export const CompanyLogoUpload = ({
  currentLogoUrl,
  logoFile,
  disabled = false,
  onLogoSelect,
}: CompanyLogoUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  useEffect(() => {
    if (!logoFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(logoFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [logoFile]);

  const handleFile = (file: File) => {
    const errorMessage = validateCompanyLogo(file);
    setLogoError(errorMessage);
    if (errorMessage) {
      onLogoSelect(null);
      return;
    }
    onLogoSelect(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (disabled || !event.dataTransfer.files[0]) {
      return;
    }
    handleFile(event.dataTransfer.files[0]);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    handleFile(file);
  };

  const activeLogoUrl = previewUrl || currentLogoUrl || null;

  return (
    <div className="space-y-2">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-[4px] border-2 border-dashed p-4 ${
          isDragging ? "border-blue-600 bg-blue-950/10" : "border-neutral-800 bg-neutral-900"
        } ${disabled ? "opacity-50" : "cursor-pointer"}`}
      >
        <input
          type="file"
          accept="image/svg+xml,image/png,image/jpeg,image/jpg"
          disabled={disabled}
          onChange={handleInputChange}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        />
        <div className="pointer-events-none relative z-20 grid gap-4 sm:grid-cols-[112px_1fr] sm:items-center">
          <div className="flex aspect-square size-28 items-center justify-center overflow-hidden rounded-[4px] border border-neutral-800 bg-[#0A0A0A]">
            {activeLogoUrl ? (
              <Image
                src={activeLogoUrl}
                alt="Logo da empresa"
                width={112}
                height={112}
                className="h-full w-full object-contain p-2"
              />
            ) : (
              <ImageIcon className="size-8 text-neutral-600" />
            )}
          </div>
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <Upload className="size-4 text-blue-500" />
              <p className="text-xs font-bold uppercase tracking-wide text-white">
                {logoFile ? logoFile.name : "Enviar logo da empresa"}
              </p>
            </div>
            <p className="text-[11px] text-neutral-500">
              SVG, PNG, JPG ou JPEG. Tamanho máximo de 2MB.
            </p>
            {logoFile && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={(event) => {
                  event.stopPropagation();
                  onLogoSelect(null);
                  setLogoError(null);
                }}
                className="pointer-events-auto h-8 rounded-[4px] border-neutral-800 bg-transparent text-xs text-neutral-300 hover:bg-neutral-800"
              >
                <X className="mr-1 size-3" />
                Remover seleção
              </Button>
            )}
          </div>
        </div>
      </div>
      {logoError && <p className="text-xs text-rose-500">{logoError}</p>}
    </div>
  );
};

const validateCompanyLogo = (file: File): string | null => {
  if (!LOGO_TYPES.includes(file.type)) {
    return `Formato inválido para ${file.name}. Use SVG, PNG, JPG ou JPEG.`;
  }
  if (file.size > MAX_LOGO_SIZE) {
    return `Logo ${file.name} excede 2MB.`;
  }
  return null;
};
