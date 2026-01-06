# Product Edit with Shared Form - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement product editing functionality by extracting the creation form into a reusable component shared between create and edit pages.

**Architecture:** MVVM pattern with separated models (create/edit) but shared view (ProductForm component). ImageDropzone adapted to support edit mode with current image display and removal.

**Tech Stack:** Next.js 15, TypeScript, React Hook Form, Zod, SWR, Tailwind CSS, shadcn/ui

---

## Task 1: Copy ImageDropzone to Worktree

**Files:**
- Copy: `components/product/image-dropzone.tsx` from main to worktree

**Step 1: Copy ImageDropzone from main branch**

```bash
cp /home/lexmarcos/projects/StockShift/components/product/image-dropzone.tsx \
   /home/lexmarcos/projects/StockShift/.worktrees/feature/product-edit-shared-form/components/product/image-dropzone.tsx
```

**Step 2: Verify file copied**

Run: `ls -la components/product/image-dropzone.tsx`
Expected: File exists with ~150 lines

**Step 3: Commit**

```bash
git add components/product/image-dropzone.tsx
git commit -m "chore: add image-dropzone component to worktree"
```

---

## Task 2: Create ProductForm Types

**Files:**
- Create: `app/products/components/product-form.types.ts`

**Step 1: Create directory**

```bash
mkdir -p app/products/components
```

**Step 2: Create types file**

```typescript
// app/products/components/product-form.types.ts
import { UseFormReturn } from "react-hook-form";
import { ProductCreateFormData } from "../create/products-create.schema";
import { CustomAttribute } from "./custom-attributes-builder";

export interface Category {
  id: string;
  name: string;
}

export interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
}

export interface ProductFormProps {
  mode: 'create' | 'edit';
  onSubmit: (data: ProductCreateFormData) => void;
  isSubmitting: boolean;
  form: UseFormReturn<ProductCreateFormData>;

  // Dados auxiliares
  categories: Category[];
  isLoadingCategories: boolean;
  brands: Brand[];
  isLoadingBrands: boolean;

  // Atributos customizados
  customAttributes: CustomAttribute[];
  addCustomAttribute: () => void;
  removeCustomAttribute: (index: number) => void;
  updateCustomAttribute: (
    index: number,
    field: "key" | "value",
    value: string
  ) => void;

  // Imagem
  productImage: File | null;
  currentImageUrl?: string;
  handleImageSelect: (file: File | null) => void;
  handleImageRemove?: () => void;

  // Scanner
  openScanner: () => void;
  closeScanner: () => void;
  isScannerOpen: boolean;
  handleBarcodeScan: (barcode: string) => void;

  // Outros
  nameInputRef: React.RefObject<HTMLInputElement>;
  warehouseId: string | null;
}

export type { ProductCreateFormData, CustomAttribute };
```

**Step 3: Verify TypeScript compiles**

Run: `pnpm exec tsc --noEmit app/products/components/product-form.types.ts`
Expected: No errors

**Step 4: Commit**

```bash
git add app/products/components/product-form.types.ts
git commit -m "feat: add ProductForm types interface"
```

---

## Task 3: Adapt ImageDropzone for Edit Mode

**Files:**
- Modify: `components/product/image-dropzone.tsx`

**Step 1: Update ImageDropzoneProps interface**

Find the interface (around line 6-10) and replace with:

```typescript
interface ImageDropzoneProps {
  onImageSelect: (file: File | null) => void;
  value: File | null;
  disabled?: boolean;
  currentImageUrl?: string;
  onRemoveImage?: () => void;
}
```

**Step 2: Add state for image removal indicator**

After the preview state (around line 15), add:

```typescript
const [showRemovalIndicator, setShowRemovalIndicator] = useState(false);
```

**Step 3: Update component logic for edit mode**

Replace the return statement with logic to handle 4 states:

```typescript
export const ImageDropzone = ({
  onImageSelect,
  value,
  disabled = false,
  currentImageUrl,
  onRemoveImage,
}: ImageDropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [showRemovalIndicator, setShowRemovalIndicator] = useState(false);

  // ... existing handlers (handleDragOver, handleDragLeave, validateFile, handleFile, handleDrop, handleFileInput) ...

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
                {value.name}
              </p>
              <p className="text-[11px] text-muted-foreground/70">
                {(value.size / 1024).toFixed(0)} KB
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
              alt="Current image"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Imagem Atual
              </p>
              <p className="text-[11px] text-muted-foreground/70">
                Clique em trocar para selecionar nova imagem
              </p>
            </div>
            <div className="flex gap-2">
              {onRemoveImage && (
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
              )}
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State 3: Image was removed (show indicator)
  if (showRemovalIndicator && onRemoveImage) {
    return (
      <div className="w-full">
        <div
          onClick={handleReplace}
          className="relative rounded-sm border-2 border-dashed border-red-900/40 bg-red-950/10 p-8 cursor-pointer hover:bg-red-950/20"
        >
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-red-900/20 border border-red-900/40">
              <X className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-red-400">
                Imagem será removida ao salvar
              </p>
              <p className="text-[11px] text-muted-foreground/70 mt-1">
                Clique para adicionar nova imagem
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State 4: No image (create mode or empty)
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
              {isDragging ? "Solte a imagem aqui" : "Arraste uma imagem ou clique"}
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
```

**Step 4: Add missing import**

At the top of the file, ensure these imports exist:

```typescript
import { Upload, X, Image as ImageIcon } from "lucide-react";
```

**Step 5: Verify TypeScript compiles**

Run: `pnpm exec tsc --noEmit components/product/image-dropzone.tsx`
Expected: No errors

**Step 6: Commit**

```bash
git add components/product/image-dropzone.tsx
git commit -m "feat: adapt ImageDropzone for edit mode with current image and removal support"
```

---

## Task 4: Extract ProductForm Component

**Files:**
- Create: `app/products/components/product-form.view.tsx`
- Read: `app/products/create/products-create.view.tsx` (reference)

**Step 1: Copy create view to new location**

```bash
cp app/products/create/products-create.view.tsx \
   app/products/components/product-form.view.tsx
```

**Step 2: Update imports in product-form.view.tsx**

Replace the imports section:

```typescript
"use client";

import { CustomAttributesBuilder } from "@/components/product/custom-attributes-builder";
import { BarcodeScannerModal } from "@/components/product/barcode-scanner-modal";
import { ImageDropzone } from "@/components/product/image-dropzone";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  DollarSign,
  Layers,
  Loader2,
  Package,
  Ruler,
  Scale,
  Settings2,
  Tag,
  Zap,
  Scan,
} from "lucide-react";
import Link from "next/link";
import { ProductFormProps } from "./product-form.types";
```

**Step 3: Update component signature**

Replace the interface and component signature:

```typescript
export const ProductForm = ({
  mode,
  form,
  onSubmit,
  isSubmitting,
  categories,
  isLoadingCategories,
  brands,
  isLoadingBrands,
  customAttributes,
  addCustomAttribute,
  removeCustomAttribute,
  updateCustomAttribute,
  nameInputRef,
  openScanner,
  closeScanner,
  isScannerOpen,
  handleBarcodeScan,
  warehouseId,
  productImage,
  currentImageUrl,
  handleImageSelect,
  handleImageRemove,
}: ProductFormProps) => {
```

**Step 4: Update header title based on mode**

Find the header title (around line 116-119) and replace:

```typescript
<h1 className="text-base font-semibold tracking-tight">
  {mode === 'create' ? 'NOVO PRODUTO' : 'EDITAR PRODUTO'}
</h1>
<p className="text-xs text-muted-foreground hidden md:block mt-0.5">
  {mode === 'create'
    ? 'Cadastro de item no catálogo com estoque'
    : 'Atualização de dados do produto'}
</p>
```

**Step 5: Update ImageDropzone props**

Find the ImageDropzone component (around line 249-257) and update:

```typescript
<ImageDropzone
  value={productImage}
  currentImageUrl={currentImageUrl}
  onImageSelect={handleImageSelect}
  onRemoveImage={handleImageRemove}
  disabled={isSubmitting}
/>
```

**Step 6: Hide continuous mode field in edit mode**

Find the continuousMode FormField (around line 550-572) and wrap with condition:

```typescript
{mode === 'create' && (
  <FormField
    control={form.control}
    name="continuousMode"
    render={({ field }) => (
      <FormItem className="flex flex-row items-center justify-between rounded-sm border border-border/40 p-3 bg-muted/10">
        <div className="space-y-0.5">
          <FormLabel className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2">
            <Zap className="h-3 w-3 text-foreground/60" />
            Cadastro Contínuo
          </FormLabel>
          <FormDescription className="text-[11px] text-muted-foreground/70">
            Vários produtos seguidos
          </FormDescription>
        </div>
        <FormControl>
          <Switch
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        </FormControl>
      </FormItem>
    )}
  />
)}
```

**Step 7: Update submit button text**

Find the submit button (around line 727-740) and update:

```typescript
<Button
  type="submit"
  size="default"
  className="w-full md:w-auto md:min-w-[160px] rounded-sm bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
  disabled={isSubmitting || !warehouseId}
>
  {isSubmitting ? (
    <>
      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
      Salvando...
    </>
  ) : (
    <>
      <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
      {mode === 'create' ? 'Salvar Produto' : 'Atualizar Produto'}
    </>
  )}
</Button>
```

**Step 8: Verify TypeScript compiles**

Run: `pnpm exec tsc --noEmit app/products/components/product-form.view.tsx`
Expected: No errors

**Step 9: Commit**

```bash
git add app/products/components/product-form.view.tsx
git commit -m "feat: extract ProductForm shared component from create view"
```

---

## Task 5: Refactor Create Page to Use ProductForm

**Files:**
- Modify: `app/products/create/page.tsx`
- Modify: `app/products/create/products-create.model.ts`

**Step 1: Update create page imports**

In `app/products/create/page.tsx`, replace the view import:

```typescript
"use client";

import { useProductCreateModel } from "./products-create.model";
import { ProductForm } from "../components/product-form.view";

export default function ProductCreatePage() {
  const modelProps = useProductCreateModel();

  return <ProductForm mode="create" {...modelProps} />;
}
```

**Step 2: Verify create page compiles**

Run: `pnpm exec tsc --noEmit app/products/create/page.tsx`
Expected: No errors

**Step 3: Commit**

```bash
git add app/products/create/page.tsx
git commit -m "refactor: update create page to use shared ProductForm component"
```

---

## Task 6: Create Edit Model

**Files:**
- Create: `app/products/[id]/edit/products-edit.model.ts`

**Step 1: Create edit directory**

```bash
mkdir -p app/products/\[id\]/edit
```

**Step 2: Create edit model file**

```typescript
// app/products/[id]/edit/products-edit.model.ts
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  productCreateSchema,
  ProductCreateFormData,
} from "../../create/products-create.schema";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";
import {
  CategoriesResponse,
  BrandsResponse,
  CustomAttribute,
} from "../../create/products-create.types";

interface Product {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  categoryId: string | null;
  brandId: string | null;
  barcode: string | null;
  barcodeType: string | null;
  sku: string | null;
  isKit: boolean;
  attributes: Record<string, string> | null;
  hasExpiration: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductResponse {
  success: boolean;
  message: string | null;
  data: Product;
}

export const useProductEditModel = (productId: string) => {
  const router = useRouter();
  const { warehouseId } = useSelectedWarehouse();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customAttributes, setCustomAttributes] = useState<CustomAttribute[]>([]);
  const [productImage, setProductImage] = useState<File | null>(null);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Fetch product data
  const { data: productData, isLoading: isLoadingProduct } = useSWR<ProductResponse>(
    productId ? `products/${productId}` : null,
    async (url: string) => {
      return await api.get(url).json<ProductResponse>();
    }
  );

  // Fetch categories
  const { data: categoriesData, isLoading: isLoadingCategories } =
    useSWR<CategoriesResponse>("categories", async () => {
      return await api.get("categories").json<CategoriesResponse>();
    });

  // Fetch brands
  const { data: brandsData, isLoading: isLoadingBrands } =
    useSWR<BrandsResponse>("brands", async () => {
      return await api.get("brands").json<BrandsResponse>();
    });

  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(productCreateSchema),
    defaultValues: {
      name: "",
      description: "",
      barcode: "",
      isKit: false,
      hasExpiration: false,
      active: true,
      continuousMode: false,
      categoryId: "",
      brandId: "",
      attributes: {
        weight: "",
        dimensions: "",
      },
      quantity: 0,
      manufacturedDate: "",
      expirationDate: "",
      costPrice: undefined,
      sellingPrice: undefined,
    },
  });

  // Populate form when product loads
  useEffect(() => {
    if (productData?.data) {
      const product = productData.data;

      form.reset({
        name: product.name,
        description: product.description || "",
        barcode: product.barcode || "",
        isKit: product.isKit,
        hasExpiration: product.hasExpiration,
        active: product.active,
        continuousMode: false,
        categoryId: product.categoryId || "",
        brandId: product.brandId || "",
        attributes: {
          weight: product.attributes?.weight || "",
          dimensions: product.attributes?.dimensions || "",
        },
        quantity: 0,
        manufacturedDate: "",
        expirationDate: "",
        costPrice: undefined,
        sellingPrice: undefined,
      });

      // Extract custom attributes (excluding weight and dimensions)
      if (product.attributes) {
        const attrs = Object.entries(product.attributes)
          .filter(([key]) => key !== "weight" && key !== "dimensions")
          .map(([key, value]) => ({
            id: crypto.randomUUID(),
            key,
            value,
          }));
        setCustomAttributes(attrs);
      }
    }
  }, [productData, form]);

  const addCustomAttribute = () => {
    setCustomAttributes([
      ...customAttributes,
      { id: crypto.randomUUID(), key: "", value: "" },
    ]);
  };

  const removeCustomAttribute = (index: number) => {
    setCustomAttributes(customAttributes.filter((_, i) => i !== index));
  };

  const updateCustomAttribute = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    const updated = [...customAttributes];
    updated[index][field] = value;
    setCustomAttributes(updated);
  };

  const openScanner = () => {
    setIsScannerOpen(true);
  };

  const closeScanner = () => {
    setIsScannerOpen(false);
  };

  const handleBarcodeScan = (barcode: string) => {
    form.setValue("barcode", barcode);
    toast.success(`Código ${barcode} detectado!`);
  };

  const handleImageSelect = (file: File | null) => {
    setProductImage(file);
    if (file) {
      setRemoveCurrentImage(false);
    }
  };

  const handleImageRemove = () => {
    setProductImage(null);
    setRemoveCurrentImage(true);
  };

  const validateCustomAttributes = (): boolean => {
    for (let i = 0; i < customAttributes.length; i++) {
      const attr = customAttributes[i];
      if (!attr.key.trim() || !attr.value.trim()) {
        toast.error(`Atributo ${i + 1}: Nome e valor são obrigatórios`);
        return false;
      }
    }

    const keys = customAttributes.map((a) => a.key.trim().toLowerCase());
    const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
    if (duplicates.length > 0) {
      toast.error(`Já existe um atributo com o nome "${duplicates[0]}"`);
      return false;
    }

    return true;
  };

  const mergeAttributes = (formData: ProductCreateFormData) => {
    const merged: Record<string, string> = {};

    if (formData.attributes?.weight) {
      merged.weight = formData.attributes.weight;
    }
    if (formData.attributes?.dimensions) {
      merged.dimensions = formData.attributes.dimensions;
    }

    customAttributes.forEach((attr) => {
      if (attr.key.trim() && attr.value.trim()) {
        merged[attr.key.trim()] = attr.value.trim();
      }
    });

    return Object.keys(merged).length > 0 ? merged : undefined;
  };

  const onSubmit = async (data: ProductCreateFormData) => {
    if (!validateCustomAttributes()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const productPayload = {
        name: data.name,
        description: data.description || undefined,
        barcode: data.barcode || undefined,
        categoryId: data.categoryId || undefined,
        brandId: data.brandId || undefined,
        isKit: data.isKit,
        hasExpiration: data.hasExpiration,
        attributes: mergeAttributes(data),
        active: data.active,
      };

      const formData = new FormData();

      const productBlob = new Blob([JSON.stringify(productPayload)], {
        type: "application/json",
      });
      formData.append("product", productBlob);

      // Handle image
      if (!removeCurrentImage && productImage) {
        formData.append("image", productImage);
      }

      await api.put(`products/${productId}`, { body: formData });

      // Invalidate caches
      mutate("products");
      mutate(`products/${productId}`);

      toast.success("Produto atualizado com sucesso!");
      router.push("/products");
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      toast.error("Erro ao atualizar produto. Verifique os dados.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    onSubmit,
    isSubmitting,
    categories: categoriesData?.data || [],
    isLoadingCategories,
    brands: brandsData?.data || [],
    isLoadingBrands,
    customAttributes,
    addCustomAttribute,
    removeCustomAttribute,
    updateCustomAttribute,
    nameInputRef,
    openScanner,
    closeScanner,
    isScannerOpen,
    handleBarcodeScan,
    warehouseId,
    productImage,
    currentImageUrl: productData?.data?.imageUrl || undefined,
    handleImageSelect,
    handleImageRemove,
    product: productData?.data || null,
    isLoadingProduct,
  };
};
```

**Step 3: Verify TypeScript compiles**

Run: `pnpm exec tsc --noEmit app/products/[id]/edit/products-edit.model.ts`
Expected: No errors

**Step 4: Commit**

```bash
git add app/products/\[id\]/edit/products-edit.model.ts
git commit -m "feat: create product edit model with form population and image handling"
```

---

## Task 7: Create Edit Page

**Files:**
- Create: `app/products/[id]/edit/page.tsx`

**Step 1: Create edit page file**

```typescript
// app/products/[id]/edit/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useProductEditModel } from "./products-edit.model";
import { ProductForm } from "../../components/product-form.view";
import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function ProductEditPage() {
  const params = useParams();
  const productId = params.id as string;

  const { isLoadingProduct, product, ...modelProps } =
    useProductEditModel(productId);

  if (isLoadingProduct) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-20 border-b border-border/40 bg-card">
          <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Link
                href="/products"
                className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-muted/50 hover:bg-muted"
              >
                <span className="sr-only">Voltar</span>
              </Link>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground mb-3" />
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Carregando produto...
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-20 border-b border-border/40 bg-card">
          <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Link
                href="/products"
                className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-muted/50 hover:bg-muted"
              >
                <span className="sr-only">Voltar</span>
              </Link>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Produto não encontrado
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return <ProductForm mode="edit" {...modelProps} />;
}
```

**Step 2: Verify TypeScript compiles**

Run: `pnpm exec tsc --noEmit app/products/[id]/edit/page.tsx`
Expected: No errors

**Step 3: Commit**

```bash
git add app/products/\[id\]/edit/page.tsx
git commit -m "feat: create product edit page with loading and error states"
```

---

## Task 8: Add Edit Button to Product Details Page

**Files:**
- Modify: `app/products/[id]/products-detail.view.tsx`

**Step 1: Add Edit button to header**

Find the header section (around line 106-126) and replace with:

```typescript
<header className="sticky top-0 z-20 border-b border-border/40 bg-card">
  <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
    <div className="flex items-center gap-3">
      <Link
        href="/products"
        className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-muted/50 hover:bg-muted"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
      </Link>
      <div className="border-l border-border/40 pl-3">
        <h1 className="text-base font-semibold tracking-tight">
          DETALHES DO PRODUTO
        </h1>
      </div>
    </div>
    {product && (
      <Link
        href={`/products/${product.id}/edit`}
        className="inline-flex h-8 items-center justify-center rounded-sm border border-border bg-muted/50 hover:bg-muted px-3 text-xs font-semibold uppercase tracking-wide"
      >
        Editar
      </Link>
    )}
  </div>
</header>
```

**Step 2: Verify TypeScript compiles**

Run: `pnpm exec tsc --noEmit app/products/[id]/products-detail.view.tsx`
Expected: No errors

**Step 3: Commit**

```bash
git add app/products/\[id\]/products-detail.view.tsx
git commit -m "feat: add edit button to product details header"
```

---

## Task 9: Manual Testing

**Files:**
- N/A (manual testing only)

**Step 1: Start development server**

Run: `pnpm dev`
Expected: Server starts on http://localhost:3000

**Step 2: Test create flow**

1. Navigate to `/products/create`
2. Fill form with test data
3. Upload an image
4. Submit form
5. Verify redirect to `/products`
6. Expected: Product created successfully

**Step 3: Test edit flow - Keep image**

1. Navigate to a product detail page
2. Click "Editar" button
3. Verify form pre-populated
4. Verify current image displayed
5. Change product name
6. Submit without changing image
7. Verify redirect to `/products`
8. Verify product updated with same image
9. Expected: Product updated, image unchanged

**Step 4: Test edit flow - Change image**

1. Navigate to a product detail page
2. Click "Editar" button
3. Click "Trocar" button on image
4. Select new image
5. Submit form
6. Verify redirect to `/products`
7. Verify product updated with new image
8. Expected: Product updated with new image

**Step 5: Test edit flow - Remove image**

1. Navigate to a product detail page with image
2. Click "Editar" button
3. Click "Remover" button on image
4. Verify "Imagem será removida" indicator
5. Submit form
6. Verify redirect to `/products`
7. Verify product updated without image
8. Expected: Product updated, image removed

**Step 6: Document any issues**

If any issues found, create TODO list and fix before final commit.

---

## Task 10: Final Commit

**Files:**
- N/A (git operations only)

**Step 1: Verify all changes staged**

Run: `git status`
Expected: Working tree clean or only untracked files

**Step 2: Review commit history**

Run: `git log --oneline -10`
Expected: 8-9 commits following the implementation plan

**Step 3: Push branch**

Run: `git push -u origin feature/product-edit-shared-form`
Expected: Branch pushed successfully

**Step 4: Plan completion message**

Implementation complete! Next steps:
- Create PR from `feature/product-edit-shared-form` to `main`
- Request code review
- Address any review feedback
- Merge to main

---

## Summary

**Total Tasks:** 10
**Estimated Time:** 60-90 minutes
**Key Achievements:**
- ✅ Shared ProductForm component
- ✅ ImageDropzone supports edit mode
- ✅ Edit model with form population
- ✅ Edit page with loading/error states
- ✅ Navigation from details to edit
- ✅ Image management (keep, change, remove)
- ✅ Proper MVVM architecture maintained
- ✅ Corporate Solid Dark design preserved

**Architecture Benefits:**
- DRY: Single form component for create/edit
- Separation of concerns: Models separated, view shared
- Type safety: Full TypeScript coverage
- Maintainability: Changes to form affect both create/edit
