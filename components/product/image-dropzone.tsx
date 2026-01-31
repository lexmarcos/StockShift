"use client";

import { useCallback, useState, useEffect } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compressImage } from "@/lib/image-compressor";

interface ImageDropzoneProps {
  onImageSelect: (file: File | null) => void;
  value: File | null;
  disabled?: boolean;
  currentImageUrl?: string;
  onRemoveImage?: () => void;
  className?: string;
  text?: string;
}

export const ImageDropzone = ({
  onImageSelect,
  value,
  disabled = false,
  currentImageUrl,
  onRemoveImage,
  className,
  text
}: ImageDropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [showRemovalIndicator, setShowRemovalIndicator] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  // Sync preview with value prop changes (e.g. from AI Fill)
  useEffect(() => {
    if (value) {
      // If we have a value but no preview, or if the value object reference changed
      // (assuming external updates pass a new File object)
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(value);
    } else {
      setPreview(null);
    }
  }, [value]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): boolean => {
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      alert("Formato inválido. Use PNG, JPG, JPEG ou WEBP");
      return false;
    }

    if (file.size > maxSize) {
      alert("Imagem muito grande. Tamanho máximo: 5MB");
      return false;
    }

    return true;
  };

  const handleFile = useCallback(async (file: File) => {
    if (!validateFile(file)) {
      return;
    }

    setIsCompressing(true);
    try {
      // Compress image before passing to parent
      const compressedFile = await compressImage(file, 0.7);
      onImageSelect(compressedFile);

      // Create preview from compressed file
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Error compressing image:", error);
      // Fallback to original file if compression fails
      onImageSelect(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressing(false);
    }
  }, [onImageSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [disabled, handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleRemove = useCallback(() => {
    onImageSelect(null);
    setPreview(null);
    if (onRemoveImage) {
      onRemoveImage();
      setShowRemovalIndicator(true);
    }
  }, [onImageSelect, onRemoveImage]);

  const handleReplace = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/jpg,image/webp';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        handleFile(files[0]);
        setShowRemovalIndicator(false);
      }
      input.remove(); // Cleanup the input element
    };
    input.click();
  }, [handleFile]);

  // State 1: New image selected (preview exists)
  if (preview && value) {
    return (
      <div className="w-full">
        <div className="relative rounded-sm border border-border/50 bg-card/80 p-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-sm border border-border/40 bg-background/30">
            <img
              src={preview}
              alt="Preview"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground/80 truncate">
                {value?.name || "Imagem selecionada"}
              </p>
              <p className="text-[11px] text-muted-foreground/70">
                {value ? `${(value.size / 1024).toFixed(0)} KB` : ""}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              disabled={disabled}
              className="h-8 rounded-sm border-border/40 hover:bg-muted"
            >
              <X className="h-3 w-3 mr-1" />
              Remover
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // State 2: Current image exists (edit mode, no new image)
  if (currentImageUrl && !showRemovalIndicator) {
    return (
      <div className="w-full">
        <div className="relative rounded-sm border border-border/50 bg-card/80 p-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-sm border border-border/40 bg-background/30">
            <img
              src={currentImageUrl}
              alt="Imagem atual"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground/80 truncate">
                Imagem atual do produto
              </p>
              <p className="text-[11px] text-muted-foreground/70">
                Gerenciado pelo sistema
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReplace}
                disabled={disabled}
                className="h-8 rounded-sm border-border/40 hover:bg-muted"
              >
                Trocar
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={disabled}
                className="h-8 rounded-sm border-border/40 hover:bg-muted"
              >
                <X className="h-3 w-3 mr-1" />
                Remover
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State 3: Image was removed (edit mode, removal indicated)
  if (showRemovalIndicator) {
    return (
      <div className="w-full">
        <div className="relative rounded-sm border border-red-900/30 bg-red-950/10 p-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-sm border border-red-900/20 bg-red-950/5 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-center">
              <X className="h-8 w-8 text-red-700/70" />
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
              onClick={handleReplace}
              disabled={disabled}
              className="h-8 rounded-sm border-border/40 hover:bg-muted"
            >
              Adicionar nova imagem
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // State 4: Compressing image
  if (isCompressing) {
    return (
      <div className="w-full">
        <div className="relative rounded-sm border-2 border-dashed p-8 border-blue-600/40 bg-blue-950/10">
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-blue-600/10 border border-blue-600/30">
              <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                Comprimindo imagem...
              </p>
              <p className="text-[11px] text-muted-foreground/70 mt-1">
                Otimizando para upload
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State 5: No image (create mode or empty)
  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-sm border-2 border-dashed p-8 ${
          isDragging
            ? "border-foreground/40 bg-muted/20"
            : "border-border/40 bg-card/80"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleFileInput}
          disabled={disabled}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-foreground/5 border border-border/30">
            {isDragging ? (
              <Upload className="h-6 w-6 text-foreground/70" />
            ) : (
              <ImageIcon className="h-6 w-6 text-foreground/70" />
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
              {isDragging ? "Solte a imagem aqui" : (text || "Arraste uma imagem ou clique")}
            </p>
            <p className="text-[11px] text-muted-foreground/70 mt-1">
              PNG, JPG, JPEG ou WEBP • Máx 5MB
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
