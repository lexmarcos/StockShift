"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { ImageDropzone } from "@/components/product/image-dropzone";
import { Sparkles, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { AiFillData, Category, Brand } from "@/app/(pages)/products/create/products-create.types";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";

interface ProductAiFillModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: AiFillData, file: File, useImage: boolean) => void;
  categories: Category[];
  brands: Brand[];
}

export function ProductAiFillModal({
  open,
  onClose,
  onConfirm,
  categories,
  brands,
}: ProductAiFillModalProps) {
  const [step, setStep] = useState<"upload" | "analyzing" | "review">("upload");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [aiData, setAiData] = useState<AiFillData | null>(null);
  const [useImage, setUseImage] = useState(true);

  const reset = () => {
    setStep("upload");
    setImageFile(null);
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    setAiData(null);
    setUseImage(true);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleImageSelect = (file: File | null) => {
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      analyzeImage(file);
    }
  };

  const analyzeImage = async (file: File) => {
    setStep("analyzing");

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await api.post("products/analyze-image", {
        body: formData,
        timeout: 60000, // Longer timeout for AI analysis
      }).json<{ success: boolean; data: AiFillData }>();

      if (response.success && response.data) {
        setAiData(response.data);
        setStep("review");
      } else {
        toast.error("Não foi possível analisar a imagem.");
        setStep("upload");
      }
    } catch (error) {
      console.error("AI Analysis error:", error);
      toast.error("Erro ao analisar imagem. Tente novamente.");
      setStep("upload");
    }
  };

  const handleConfirm = () => {
    if (aiData && imageFile) {
      onConfirm(aiData, imageFile, useImage);
      handleClose();
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(val) => !val && handleClose()}
      title="Preencher com IA"
      description="Envie uma foto do produto para preencher os dados automaticamente usando inteligência artificial."
    >
      <div className="py-4">
        {step === "upload" && (
          <div className="space-y-4">
            <ImageDropzone
              value={null}
              onImageSelect={handleImageSelect}
              className="h-48"
              text="Arraste uma foto ou clique para capturar"
            />
          </div>
        )}

        {step === "analyzing" && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative bg-[#0A0A0A] p-4 rounded-full border border-neutral-800">
                <Sparkles className="h-8 w-8 text-indigo-400 animate-spin-slow" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-white font-bold text-sm">Analisando Imagem...</h3>
              <p className="text-neutral-500 text-xs">Identificando produto, marca e categoria</p>
            </div>
          </div>
        )}

        {step === "review" && aiData && (
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-3 rounded-[4px] border border-neutral-800 bg-[#0A0A0A]">
              {imageUrl && (
                <div className="relative h-16 w-16 shrink-0 rounded-[4px] overflow-hidden border border-neutral-800">
                  <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-white uppercase tracking-wide">
                    Usar imagem no produto?
                  </Label>
                  <Switch
                    checked={useImage}
                    onCheckedChange={setUseImage}
                    className="data-[state=checked]:bg-indigo-600 scale-90"
                  />
                </div>
                <p className="text-[10px] text-neutral-500 leading-tight">
                  Se ativado, esta imagem será definida como a foto principal do produto.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-neutral-400">Nome Sugerido</Label>
                <Input
                  value={aiData.name}
                  onChange={(e) => setAiData({ ...aiData, name: e.target.value })}
                  className="h-9 bg-neutral-900 border-neutral-800 text-sm focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-neutral-400 flex items-center justify-between">
                    Categoria
                    {!aiData.categoryId && aiData.detectedCategory && (
                       <span className="text-amber-500 text-[9px] flex items-center gap-1">
                         <AlertTriangle className="h-3 w-3" />
                         Sugestão: {aiData.detectedCategory}
                       </span>
                    )}
                  </Label>
                  <Select
                    value={aiData.categoryId || undefined}
                    onValueChange={(val) => setAiData({ ...aiData, categoryId: val })}
                  >
                    <SelectTrigger className="w-full h-9 bg-neutral-900 border-neutral-800 text-xs">
                       <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#171717] border-neutral-800 text-neutral-300">
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-neutral-400 flex items-center justify-between">
                    Marca
                    {!aiData.brandId && aiData.detectedBrand && (
                       <span className="text-amber-500 text-[9px] flex items-center gap-1">
                         <AlertTriangle className="h-3 w-3" />
                         Sugestão: {aiData.detectedBrand}
                       </span>
                    )}
                  </Label>
                  <Select
                    value={aiData.brandId || undefined}
                    onValueChange={(val) => setAiData({ ...aiData, brandId: val })}
                  >
                    <SelectTrigger className="w-full h-9 bg-neutral-900 border-neutral-800 text-xs">
                       <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#171717] border-neutral-800 text-neutral-300">
                      {brands.map((b) => (
                        <SelectItem key={b.id} value={b.id} className="text-xs">{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {aiData.volumeValue && (
                 <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-neutral-400">Peso/Volume Detectado</Label>
                  <Input
                    value={`${aiData.volumeValue} ${aiData.volumeUnit || ''}`}
                    disabled
                    className="h-9 bg-neutral-900/50 border-neutral-800 text-sm text-neutral-500"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={reset}
                className="flex-1 h-9 border-neutral-700 hover:bg-neutral-800 text-xs uppercase font-bold"
              >
                <X className="mr-2 h-3 w-3" />
                Tentar Outra
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-xs uppercase font-bold"
              >
                <CheckCircle2 className="mr-2 h-3 w-3" />
                Confirmar
              </Button>
            </div>
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
}
