"use client";

import { useReducer } from "react";
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

type ProductAiFillStep = "upload" | "analyzing" | "review";

interface ProductAiFillState {
  step: ProductAiFillStep;
  imageFile: File | null;
  imageUrl: string | null;
  aiData: AiFillData | null;
  useImage: boolean;
}

type ProductAiFillAction =
  | { type: "reset" }
  | { type: "image-selected"; file: File; url: string }
  | { type: "analyzing" }
  | { type: "review"; data: AiFillData }
  | { type: "analysis-failed" }
  | { type: "ai-data-changed"; values: Partial<AiFillData> }
  | { type: "use-image-changed"; value: boolean };

const initialProductAiFillState: ProductAiFillState = {
  step: "upload",
  imageFile: null,
  imageUrl: null,
  aiData: null,
  useImage: true,
};

const productAiFillReducer = (
  state: ProductAiFillState,
  action: ProductAiFillAction,
): ProductAiFillState => {
  switch (action.type) {
    case "reset":
      return initialProductAiFillState;
    case "image-selected":
      return { ...state, imageFile: action.file, imageUrl: action.url };
    case "analyzing":
      return { ...state, step: "analyzing" };
    case "review":
      return { ...state, step: "review", aiData: action.data };
    case "analysis-failed":
      return { ...state, step: "upload" };
    case "ai-data-changed":
      if (!state.aiData) return state;
      return { ...state, aiData: { ...state.aiData, ...action.values } };
    case "use-image-changed":
      return { ...state, useImage: action.value };
  }
};

export function ProductAiFillModal({
  open,
  onClose,
  onConfirm,
  categories,
  brands,
}: ProductAiFillModalProps) {
  const [state, dispatch] = useReducer(
    productAiFillReducer,
    initialProductAiFillState,
  );
  const { step, imageFile, imageUrl, aiData, useImage } = state;

  const reset = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    dispatch({ type: "reset" });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleImageSelect = (file: File | null) => {
    if (file) {
      const url = URL.createObjectURL(file);
      dispatch({ type: "image-selected", file, url });
      analyzeImage(file);
    }
  };

  const analyzeImage = async (file: File) => {
    dispatch({ type: "analyzing" });

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await api.post("products/analyze-image", {
        body: formData,
        timeout: 60000, // Longer timeout for AI analysis
      }).json<{ success: boolean; data: AiFillData }>();

      if (response.success && response.data) {
        dispatch({ type: "review", data: response.data });
      } else {
        toast.error("Não foi possível analisar a imagem.");
        dispatch({ type: "analysis-failed" });
      }
    } catch (error) {
      console.error("AI Analysis error:", error);
      toast.error("Erro ao analisar imagem. Tente novamente.");
      dispatch({ type: "analysis-failed" });
    }
  };

  const handleConfirm = () => {
    if (aiData && imageFile) {
      onConfirm(aiData, imageFile, useImage);
      handleClose();
    }
  };

  const getCategoryParentName = (category: Category) => {
    return category.parentCategoryName ?? category.parentCategory?.name ?? null;
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(val) => !val && handleClose()}
      title="Pegar dados de uma foto"
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
          <div className="flex flex-col items-center justify-center gap-y-4 py-8">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative bg-[#0A0A0A] p-4 rounded-full border border-neutral-800">
                <Sparkles className="size-8 text-blue-400 animate-spin-slow" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-white font-semibold text-sm">Analisando Imagem…</h3>
              <p className="text-neutral-500 text-xs">Identificando produto, marca e categoria</p>
            </div>
          </div>
        )}

        {step === "review" && aiData && (
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-3 rounded-[4px] border border-neutral-800 bg-[#0A0A0A]">
              {imageUrl && (
                <div className="relative size-16 shrink-0 rounded-[4px] overflow-hidden border border-neutral-800">
                  <Image
                    src={imageUrl}
                    alt="Preview"
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-white uppercase tracking-wide">
                    Usar imagem no produto?
                  </Label>
                  <Switch
                    checked={useImage}
                    onCheckedChange={(value) =>
                      dispatch({ type: "use-image-changed", value })
                    }
                    className="data-[state=checked]:bg-blue-600 scale-90"
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
                  onChange={(e) =>
                    dispatch({
                      type: "ai-data-changed",
                      values: { name: e.target.value },
                    })
                  }
                  className="h-9 bg-neutral-900 border-neutral-800 text-sm focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-neutral-400 flex items-center justify-between">
                    Categoria
                    {!aiData.categoryId && aiData.detectedCategory && (
                       <span className="text-amber-500 text-[9px] flex items-center gap-1">
                         <AlertTriangle className="size-3" />
                         Sugestão: {aiData.detectedCategory}
                       </span>
                    )}
                  </Label>
                  <Select
                    value={aiData.categoryId || undefined}
                    onValueChange={(val) =>
                      dispatch({
                        type: "ai-data-changed",
                        values: { categoryId: val },
                      })
                    }
                  >
                    <SelectTrigger className="w-full h-9 bg-neutral-900 border-neutral-800 text-xs">
                       <SelectValue placeholder="Selecione…" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#171717] border-neutral-800 text-neutral-300">
                      {categories.map((c) => {
                        const parentName = getCategoryParentName(c);

                        return (
                          <SelectItem key={c.id} value={c.id} className="text-xs">
                            {parentName ? (
                              <span className="inline-flex items-center gap-1">
                                <span className="text-neutral-500">{parentName}</span>
                                <span className="text-neutral-600">/</span>
                                <span>{c.name}</span>
                              </span>
                            ) : (
                              c.name
                            )}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-neutral-400 flex items-center justify-between">
                    Marca
                    {!aiData.brandId && aiData.detectedBrand && (
                       <span className="text-amber-500 text-[9px] flex items-center gap-1">
                         <AlertTriangle className="size-3" />
                         Sugestão: {aiData.detectedBrand}
                       </span>
                    )}
                  </Label>
                  <Select
                    value={aiData.brandId || undefined}
                    onValueChange={(val) =>
                      dispatch({
                        type: "ai-data-changed",
                        values: { brandId: val },
                      })
                    }
                  >
                    <SelectTrigger className="w-full h-9 bg-neutral-900 border-neutral-800 text-xs">
                       <SelectValue placeholder="Selecione…" />
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
                <X className="mr-2 size-3" />
                Tentar Outra
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-white text-xs uppercase font-bold"
              >
                <CheckCircle2 className="mr-2 size-3" />
                Confirmar
              </Button>
            </div>
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
}
