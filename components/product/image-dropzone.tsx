"use client";

import { RemoteImage } from "@/components/ui/remote-image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compressImage } from "@/lib/image-compressor";

interface ImageDropzoneProps {
  onImageSelect: (file: File | null) => void;
  value: File | null;
  disabled?: boolean;
  currentImageUrl?: string;
  onRemoveImage?: () => void;
  onProcessingChange?: (isProcessing: boolean) => void;
  className?: string;
  text?: string;
}

interface ImageActionProps {
  disabled: boolean;
  onRemove: () => void;
  onReplace: () => void;
}

interface EmptyImageDropzoneProps {
  disabled: boolean;
  isDragging: boolean;
  text?: string;
  onDragOver: (event: React.DragEvent) => void;
  onDragLeave: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
  onFileInput: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/jpg,image/webp";
const VALID_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const useObjectUrl = (file: File | null): string | null => {
  const objectUrl = useMemo(() => {
    return file ? URL.createObjectURL(file) : null;
  }, [file]);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  return objectUrl;
};

const validateImageFile = (file: File): boolean => {
  if (!VALID_IMAGE_TYPES.includes(file.type)) {
    alert("Formato inválido. Use PNG, JPG, JPEG ou WEBP");
    return false;
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    alert("Imagem muito grande. Tamanho máximo: 5MB");
    return false;
  }

  return true;
};

const ImagePreviewFrame = ({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) => (
  <div className="relative aspect-video w-full overflow-hidden rounded-sm border border-border/40 bg-background/30">
    <RemoteImage
      src={src}
      alt={alt}
      fill
      sizes="100vw"
      className="object-contain"
    />
  </div>
);

const RemoveImageButton = ({
  disabled,
  onRemove,
}: Pick<ImageActionProps, "disabled" | "onRemove">) => (
  <Button
    type="button"
    variant="outline"
    size="sm"
    onClick={onRemove}
    disabled={disabled}
    className="h-8 rounded-sm border-border/40 hover:bg-muted"
  >
    <X className="mr-1 size-3" />
    Remover
  </Button>
);

const SelectedImagePanel = ({
  previewUrl,
  value,
  disabled,
  onRemove,
}: {
  previewUrl: string;
  value: File;
  disabled: boolean;
  onRemove: () => void;
}) => (
  <ImagePanel>
    <ImagePreviewFrame src={previewUrl} alt="Preview" />
    <div className="mt-3 flex items-center justify-between">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-foreground/80">
          {value.name || "Imagem selecionada"}
        </p>
        <p className="text-[11px] text-muted-foreground/70">
          {(value.size / 1024).toFixed(0)} KB
        </p>
      </div>
      <RemoveImageButton disabled={disabled} onRemove={onRemove} />
    </div>
  </ImagePanel>
);

const CurrentImagePanel = ({
  currentImageUrl,
  disabled,
  onRemove,
  onReplace,
}: {
  currentImageUrl: string;
} & ImageActionProps) => (
  <ImagePanel>
    <ImagePreviewFrame src={currentImageUrl} alt="Imagem atual" />
    <div className="mt-3 flex items-center justify-between gap-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-foreground/80">
          Imagem atual do produto
        </p>
        <p className="text-[11px] text-muted-foreground/70">
          Gerenciado pelo sistema
        </p>
      </div>
      <div className="flex gap-2">
        <ReplaceImageButton disabled={disabled} onReplace={onReplace} />
        <RemoveImageButton disabled={disabled} onRemove={onRemove} />
      </div>
    </div>
  </ImagePanel>
);

const ReplaceImageButton = ({
  disabled,
  onReplace,
}: Pick<ImageActionProps, "disabled" | "onReplace">) => (
  <Button
    type="button"
    variant="outline"
    size="sm"
    onClick={onReplace}
    disabled={disabled}
    className="h-8 rounded-sm border-border/40 hover:bg-muted"
  >
    Trocar
  </Button>
);

const RemovedImagePanel = ({
  disabled,
  onReplace,
}: Pick<ImageActionProps, "disabled" | "onReplace">) => (
  <div className="relative rounded-sm border border-red-900/30 bg-red-950/10 p-4">
    <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-sm border border-red-900/20 bg-red-950/5">
      <div className="flex flex-col items-center gap-2 text-center">
        <X className="size-8 text-red-700/70" />
        <p className="text-xs font-semibold uppercase tracking-wide text-red-700/80">
          Imagem será removida ao salvar
        </p>
      </div>
    </div>
    <div className="mt-3 flex items-center justify-end">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onReplace}
        disabled={disabled}
        className="h-8 rounded-sm border-border/40 hover:bg-muted"
      >
        Adicionar nova imagem
      </Button>
    </div>
  </div>
);

const CompressingImagePanel = () => (
  <div className="relative rounded-sm border-2 border-dashed border-blue-600/40 bg-blue-950/10 p-8">
    <div className="flex flex-col items-center justify-center gap-3 text-center">
      <div className="flex size-12 items-center justify-center rounded-sm border border-blue-600/30 bg-blue-600/10">
        <Loader2 className="size-6 animate-spin text-blue-500" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
          Comprimindo imagem…
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground/70">
          Otimizando para upload
        </p>
      </div>
    </div>
  </div>
);

const EmptyImageDropzone = ({
  disabled,
  isDragging,
  text,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileInput,
}: EmptyImageDropzoneProps) => (
  <div
    onDragOver={onDragOver}
    onDragLeave={onDragLeave}
    onDrop={onDrop}
    className={`relative rounded-sm border-2 border-dashed p-8 ${
      isDragging
        ? "border-foreground/40 bg-muted/20"
        : "border-border/40 bg-card/80"
    } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
  >
    <input
      type="file"
      accept={ACCEPTED_IMAGE_TYPES}
      onChange={onFileInput}
      disabled={disabled}
      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
    />
    <div className="flex flex-col items-center justify-center gap-3 text-center">
      <div className="flex size-12 items-center justify-center rounded-sm border border-border/30 bg-foreground/5">
        {isDragging ? (
          <Upload className="size-6 text-foreground/70" />
        ) : (
          <ImageIcon className="size-6 text-foreground/70" />
        )}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
          {isDragging ? "Solte a imagem aqui" : text || "Arraste uma imagem ou clique"}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground/70">
          PNG, JPG, JPEG ou WEBP • Máx 5MB
        </p>
      </div>
    </div>
  </div>
);

const ImagePanel = ({ children }: { children: React.ReactNode }) => (
  <div className="relative rounded-sm border border-border/50 bg-card/80 p-4">
    {children}
  </div>
);

export const ImageDropzone = ({
  onImageSelect,
  value,
  disabled = false,
  currentImageUrl,
  onRemoveImage,
  onProcessingChange,
  className,
  text,
}: ImageDropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showRemovalIndicator, setShowRemovalIndicator] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const previewUrl = useObjectUrl(value);
  const rootClassName = className ? `w-full ${className}` : "w-full";

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFile = useCallback(async (file: File): Promise<boolean> => {
    if (!validateImageFile(file)) return false;
    setIsCompressing(true);
    onProcessingChange?.(true);
    try {
      onImageSelect(await compressImage(file, 0.7));
      return true;
    } catch (error) {
      console.error("Error compressing image:", error);
      onImageSelect(file);
      return true;
    } finally {
      setIsCompressing(false);
      onProcessingChange?.(false);
    }
  }, [onImageSelect, onProcessingChange]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const [file] = Array.from(event.dataTransfer.files);
    if (file) void handleFile(file);
  }, [disabled, handleFile]);

  const handleFileInput = useCallback((
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const [file] = Array.from(event.target.files ?? []);
    if (file) void handleFile(file);
  }, [handleFile]);

  const handleRemove = useCallback(() => {
    onImageSelect(null);
    if (!onRemoveImage) return;
    onRemoveImage();
    setShowRemovalIndicator(true);
  }, [onImageSelect, onRemoveImage]);

  const handleReplacementFile = useCallback(async (
    file: File | undefined,
    input: HTMLInputElement,
  ): Promise<void> => {
    try {
      if (!file) return;
      const didSelectReplacement = await handleFile(file);
      if (didSelectReplacement) setShowRemovalIndicator(false);
    } finally {
      input.remove();
    }
  }, [handleFile]);

  const handleReplace = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ACCEPTED_IMAGE_TYPES;
    input.onchange = (event) => {
      const [file] = Array.from((event.target as HTMLInputElement).files ?? []);
      void handleReplacementFile(file, input);
    };
    input.click();
  }, [handleReplacementFile]);

  return (
    <div className={rootClassName}>
      {isCompressing ? (
        <CompressingImagePanel />
      ) : previewUrl && value ? (
        <SelectedImagePanel
          previewUrl={previewUrl}
          value={value}
          disabled={disabled}
          onRemove={handleRemove}
        />
      ) : currentImageUrl && !showRemovalIndicator ? (
        <CurrentImagePanel
          currentImageUrl={currentImageUrl}
          disabled={disabled}
          onRemove={handleRemove}
          onReplace={handleReplace}
        />
      ) : showRemovalIndicator ? (
        <RemovedImagePanel disabled={disabled} onReplace={handleReplace} />
      ) : (
        <EmptyImageDropzone
          disabled={disabled}
          isDragging={isDragging}
          text={text}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onFileInput={handleFileInput}
        />
      )}
    </div>
  );
};
