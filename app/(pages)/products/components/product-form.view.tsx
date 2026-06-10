"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { CustomAttributesBuilder } from "@/components/product/custom-attributes-builder";
import { BarcodeScannerModal } from "@/components/product/barcode-scanner-modal";
import { ProductAiFillModal } from "@/components/product/product-ai-fill-modal";
import { ImageDropzone } from "@/components/product/image-dropzone";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CurrencyInput } from "@/components/ui/currency-input";
import { NumberInput } from "@/components/ui/number-input";
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
  AlertCircle,
  Calendar,
  CheckCircle2,
  DollarSign,
  Layers,
  Loader2,
  Minus,
  Ruler,
  Scale,
  Settings2,
  Tag,
  X,
  Zap,
  Scan,
  Box,
  Barcode,
  Plus,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { PermissionGate } from "@/components/permission-gate";
import type { BatchesDrawerProps, ProductFormProps } from "./product-form.types";
import { cn } from "@/lib/utils";

interface BatchModeSwitchProps {
  control: ProductFormProps["form"]["control"];
  isInlineMode: boolean;
  compact?: boolean;
}

interface ProductFormViewState {
  batchesDrawerState?: BatchesDrawerProps;
  continuousMode: boolean;
  isFooterVisible: boolean;
  isInlineMode: boolean;
  isInlineEdit: boolean;
  isProfitable: boolean;
  margin: number;
  productCancelHref: string;
  profit: number;
  showBatchDateFields: boolean;
  showContinuousMode: boolean;
  showMobileBatchModeToggle: boolean;
  showPricingCard: boolean;
  showQuantityField: boolean;
  submitLabel: string;
}

const getCategoryParentName = (
  category: ProductFormProps["categories"][number],
) => category.parentCategoryName ?? category.parentCategory?.name ?? null;

const BatchModeSwitch = ({
  control,
  isInlineMode,
  compact = false,
}: BatchModeSwitchProps) => (
  <FormField
    control={control}
    name="continuousMode"
    render={({ field }) => (
      <FormItem
        className={cn(
          "flex items-center justify-between rounded-[4px] border border-neutral-800 bg-neutral-900",
          compact ? "px-3 py-3" : "p-3",
        )}
      >
        <div className="space-y-0.5">
          <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-white">
            <Zap className="size-3 text-amber-500" />
            {isInlineMode ? "Modo em lote" : "Modo Contínuo"}
          </FormLabel>
          {!compact && (
            <FormDescription className="text-[10px] text-neutral-500">
              {isInlineMode
                ? "Adicionar vários produtos antes de voltar"
                : "Manter na tela após salvar"}
            </FormDescription>
          )}
        </div>
        <FormControl>
          <Switch
            checked={field.value}
            onCheckedChange={field.onChange}
            className="data-[state=checked]:bg-amber-500"
          />
        </FormControl>
      </FormItem>
    )}
  />
);

export const ProductForm = (productForm: ProductFormProps) => {
  const { form, mode } = productForm;
  const costPrice = form.watch("costPrice") || 0;
  const sellingPrice = form.watch("sellingPrice") || 0;
  const continuousMode = Boolean(form.watch("continuousMode"));
  const isInlineMode = mode === "inline";
  const isInlineEdit = Boolean(productForm.isInlineEdit);
  const profit = sellingPrice - costPrice;
  const margin = costPrice > 0 ? (profit / costPrice) * 100 : 0;
  const [isFooterVisible, setIsFooterVisible] = useState(true);
  const [showMobileBatchModeToggle, setShowMobileBatchModeToggle] = useState(
    isInlineMode && !isInlineEdit && continuousMode,
  );
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    if (!isInlineMode || isInlineEdit || !continuousMode) return;
    setShowMobileBatchModeToggle(true);
  }, [continuousMode, isInlineEdit, isInlineMode]);

  useEffect(() => {
    const handleScroll = (): void => {
      const currentScrollY = window.scrollY;
      const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
      const isAtPageEnd = currentScrollY >= maxScrollY - 8;
      const isScrollingUp = currentScrollY < lastScrollYRef.current;
      setIsFooterVisible(isScrollingUp || isAtPageEnd || currentScrollY < 8);
      lastScrollYRef.current = Math.max(currentScrollY, 0);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const viewState: ProductFormViewState = {
    batchesDrawerState: mode === "edit" ? productForm.batchesDrawer : undefined,
    continuousMode,
    isFooterVisible,
    isInlineMode,
    isInlineEdit,
    isProfitable: profit > 0,
    margin,
    productCancelHref: productForm.cancelHref || "/products",
    profit,
    showBatchDateFields: mode === "create" || isInlineMode,
    showContinuousMode: mode === "create" || (isInlineMode && !isInlineEdit),
    showMobileBatchModeToggle,
    showPricingCard: mode === "create" || isInlineMode,
    showQuantityField: mode === "create" || isInlineMode,
    submitLabel: isInlineMode
      ? isInlineEdit
        ? "Salvar edição"
        : continuousMode
          ? "Adicionar e continuar"
          : "Adicionar e voltar"
      : mode === "create"
        ? "Salvar Produto"
        : "Atualizar Produto",
  };

  return <ProductFormShell productForm={productForm} viewState={viewState} />;
};

const ProductFormShell = ({
  productForm,
  viewState,
}: {
  productForm: ProductFormProps;
  viewState: ProductFormViewState;
}) => (
  <div
    className={cn(
      "min-h-screen bg-[#0A0A0A] font-sans text-neutral-200 md:pb-20",
      viewState.isInlineMode ? "pb-56" : "pb-24",
    )}
  >
    <BarcodeScannerModal
      open={productForm.isScannerOpen}
      onClose={productForm.closeScanner}
      onScan={productForm.handleBarcodeScan}
    />
    <ExistingProductFoundModal productForm={productForm} />
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
      <ProductAiModal productForm={productForm} viewState={viewState} />
      <ProductFormBody productForm={productForm} viewState={viewState} />
    </main>
    <ProductBatchesDrawer viewState={viewState} />
  </div>
);

const ExistingProductFoundModal = ({
  productForm,
}: {
  productForm: ProductFormProps;
}) => {
  const { scannedExistingProduct, onExistingProductModalOpenChange, onCreateBatchForExistingProduct } = productForm;
  if (!onExistingProductModalOpenChange || !onCreateBatchForExistingProduct) return null;

  return (
    <ResponsiveModal
      open={scannedExistingProduct != null}
      onOpenChange={onExistingProductModalOpenChange}
      title="Produto já existe"
      description={`O produto "${scannedExistingProduct?.name}" já está cadastrado no sistema.`}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onExistingProductModalOpenChange(false)}
            className="h-10 w-full rounded-[4px] border-neutral-800 text-xs font-bold uppercase tracking-wide md:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onCreateBatchForExistingProduct}
            className="h-10 w-full rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 md:w-auto"
          >
            Adicionar Lote
          </Button>
        </>
      }
    >
      <div className="space-y-4 pb-2 pt-2">
        <div className="flex items-start gap-3 rounded-[4px] border border-amber-900/30 bg-amber-950/10 px-4 py-3">
          <AlertCircle className="size-5 shrink-0 text-amber-500" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-amber-400">
              Produto existente encontrado
            </p>
            <p className="text-xs text-amber-400/80">
              Não é possível criar um novo produto com este código. Deseja adicionar um novo lote ao produto existente?
            </p>
          </div>
        </div>
        {scannedExistingProduct && (
          <div className="rounded-[4px] border border-neutral-800 bg-neutral-900 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Código de barras
            </p>
            <p className="mt-1 font-mono text-sm font-bold text-white">
              {scannedExistingProduct.barcode}
            </p>
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
};

const ProductAiModal = ({
  productForm,
  viewState,
}: {
  productForm: ProductFormProps;
  viewState: ProductFormViewState;
}) => {
  if (!viewState.showPricingCard) return null;
  if (productForm.isAiModalOpen === undefined) return null;
  if (!productForm.closeAiModal || !productForm.handleAiFill) return null;

  return (
    <ProductAiFillModal
      open={productForm.isAiModalOpen}
      onClose={productForm.closeAiModal}
      onConfirm={productForm.handleAiFill}
      categories={productForm.categories}
      brands={productForm.brands}
    />
  );
};

const ProductFormBody = ({
  productForm,
  viewState,
}: {
  productForm: ProductFormProps;
  viewState: ProductFormViewState;
}) => (
  <Form {...productForm.form}>
    <form onSubmit={productForm.form.handleSubmit(productForm.onSubmit)}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ProductMainColumn productForm={productForm} viewState={viewState} />
        <ProductSidebar productForm={productForm} viewState={viewState} />
      </div>
      <ProductFooterActionBar productForm={productForm} viewState={viewState} />
    </form>
  </Form>
);

const ProductMainColumn = ({
  productForm,
  viewState,
}: {
  productForm: ProductFormProps;
  viewState: ProductFormViewState;
}) => (
  <div className="space-y-6 lg:col-span-2">
    <ProductBasicInfoCard productForm={productForm} viewState={viewState} />
    <ProductAttributesCard productForm={productForm} />
    {viewState.showPricingCard && (
      <ProductInventoryPricingCard
        productForm={productForm}
        viewState={viewState}
      />
    )}
  </div>
);

const ProductBasicInfoCard = ({
  productForm,
  viewState,
}: {
  productForm: ProductFormProps;
  viewState: ProductFormViewState;
}) => (
  <Card className="rounded-[4px] border border-neutral-800 bg-[#171717]">
    <CardHeader className="border-b border-neutral-800 pb-4">
      <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center md:gap-0">
        <div className="flex items-center gap-2">
          <Box className="size-4 text-blue-500" />
          <CardTitle className="text-sm font-bold uppercase tracking-wide text-white">
            Informações Básicas
          </CardTitle>
        </div>
        {viewState.showPricingCard && productForm.openAiModal && (
          <PermissionGate permission="products:analyze_image">
            <Button
              type="button"
              onClick={productForm.openAiModal}
              className="h-9 w-full rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 md:w-fit"
            >
              <Sparkles className="size-3" />
              Pegar dados de uma foto
            </Button>
          </PermissionGate>
        )}
      </div>
    </CardHeader>
    <CardContent className="space-y-5 pt-6">
      <ProductNameField productForm={productForm} />
      <ProductBarcodeField productForm={productForm} />
      <ProductDescriptionField productForm={productForm} />
    </CardContent>
  </Card>
);

const ProductNameField = ({
  productForm,
}: {
  productForm: ProductFormProps;
}) => (
  <FormField
    control={productForm.form.control}
    name="name"
    render={({ field }) => (
      <FormItem>
        <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          Nome do Produto <span className="text-rose-500">*</span>
        </FormLabel>
        <FormControl>
          <Input
            placeholder="EX: MONITOR ULTRAWIDE 34 POLEGADAS"
            className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
            {...field}
            ref={productForm.nameInputRef}
          />
        </FormControl>
        <FormMessage className="text-xs text-rose-500" />
      </FormItem>
    )}
  />
);

const ProductBarcodeField = ({
  productForm,
}: {
  productForm: ProductFormProps;
}) => (
  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
    <FormField
      control={productForm.form.control}
      name="barcode"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            <Barcode className="size-3" /> Código de Barras
          </FormLabel>
          <div className="flex gap-2">
            <FormControl>
              <Input
                placeholder="EAN / UPC / CODE128"
                className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 font-mono text-sm focus:border-blue-600 focus:ring-0"
                {...field}
              />
            </FormControl>
            <Button
              type="button"
              variant="outline"
              onClick={productForm.openScanner}
              className="size-10 shrink-0 rounded-[4px] border-neutral-800 bg-neutral-900 hover:bg-neutral-800 hover:text-white"
            >
              <Scan className="size-4" />
            </Button>
          </div>
          <FormMessage className="text-xs text-rose-500" />
        </FormItem>
      )}
    />
  </div>
);

const ProductDescriptionField = ({
  productForm,
}: {
  productForm: ProductFormProps;
}) => (
  <FormField
    control={productForm.form.control}
    name="description"
    render={({ field }) => (
      <FormItem>
        <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          Descrição Detalhada
        </FormLabel>
        <FormControl>
          <Textarea
            placeholder="Especificações técnicas, detalhes de uso, etc…"
            className="min-h-[100px] resize-y rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
            {...field}
          />
        </FormControl>
        <FormMessage className="text-xs text-rose-500" />
      </FormItem>
    )}
  />
);

const ProductAttributesCard = ({
  productForm,
}: {
  productForm: ProductFormProps;
}) => (
  <Card className="rounded-[4px] border border-neutral-800 bg-[#171717]">
    <CardHeader className="border-b border-neutral-800 pb-4">
      <div className="flex items-center gap-2">
        <Ruler className="size-4 text-blue-500" />
        <CardTitle className="text-sm font-bold uppercase tracking-wide text-white">
          Dimensões e Atributos
        </CardTitle>
      </div>
    </CardHeader>
    <CardContent className="space-y-6 pt-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <ProductAttributeTextField
          productForm={productForm}
          name="attributes.weight"
          icon={<Scale className="size-3" />}
          label="Peso"
          placeholder="EX: 1.5 KG"
        />
        <ProductAttributeTextField
          productForm={productForm}
          name="attributes.dimensions"
          icon={<Box className="size-3" />}
          label="Dimensões (C x L x A)"
          placeholder="EX: 10 x 20 x 5 CM"
        />
      </div>
      <div className="border-t border-neutral-800 pt-4">
        <h4 className="mb-4 text-xs font-semibold uppercase tracking-wide text-white">
          Atributos Personalizados
        </h4>
        <CustomAttributesBuilder
          attributes={productForm.customAttributes}
          onAdd={productForm.addCustomAttribute}
          onRemove={productForm.removeCustomAttribute}
          onUpdate={productForm.updateCustomAttribute}
        />
      </div>
    </CardContent>
  </Card>
);

const ProductAttributeTextField = ({
  icon,
  label,
  name,
  placeholder,
  productForm,
}: {
  icon: React.ReactNode;
  label: string;
  name: "attributes.weight" | "attributes.dimensions";
  placeholder: string;
  productForm: ProductFormProps;
}) => (
  <FormField
    control={productForm.form.control}
    name={name}
    render={({ field }) => (
      <FormItem>
        <FormLabel className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          {icon} {label}
        </FormLabel>
        <FormControl>
          <Input
            placeholder={placeholder}
            className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
            {...field}
          />
        </FormControl>
        <FormMessage className="text-xs text-rose-500" />
      </FormItem>
    )}
  />
);

const ProductInventoryPricingCard = ({
  productForm,
  viewState,
}: {
  productForm: ProductFormProps;
  viewState: ProductFormViewState;
}) => (
  <Card className="rounded-[4px] border border-neutral-800 bg-[#171717]">
    <CardHeader className="border-b border-neutral-800 pb-4">
      <div className="flex items-center gap-2">
        <DollarSign className="size-4 text-emerald-500" />
        <CardTitle className="text-sm font-bold uppercase tracking-wide text-white">
          Estoque e Precificação
        </CardTitle>
      </div>
      <CardDescription className="mt-2 text-xs text-neutral-500">
        {viewState.isInlineMode
          ? "Os preços serão aplicados ao primeiro lote criado pela movimentação."
          : "Ao salvar, o primeiro lote do produto será criado automaticamente com os dados informados nesta seção."}
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6 pt-6">
      <PricingFields productForm={productForm} />
      <ProfitSummary viewState={viewState} />
      {viewState.showBatchDateFields && (
        <BatchSeedFields productForm={productForm} viewState={viewState} />
      )}
    </CardContent>
  </Card>
);

const PricingFields = ({
  productForm,
}: {
  productForm: ProductFormProps;
}) => (
  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
    <CurrencyFormField
      productForm={productForm}
      name="costPrice"
      label="Preço de Custo"
      placeholder="0,00"
      className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm text-white focus:border-blue-600 focus:ring-0"
    />
    <CurrencyFormField
      productForm={productForm}
      name="sellingPrice"
      label="Preço de Venda"
      placeholder="0,00"
      className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm font-bold text-emerald-500 focus:border-emerald-600 focus:ring-0"
    />
  </div>
);

const CurrencyFormField = ({
  className,
  label,
  name,
  placeholder,
  productForm,
}: {
  className: string;
  label: string;
  name: "costPrice" | "sellingPrice";
  placeholder: string;
  productForm: ProductFormProps;
}) => (
  <FormField
    control={productForm.form.control}
    name={name}
    render={({ field }) => {
      const { onChange, value, ...rest } = field;
      return (
        <FormItem>
          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            {label}
          </FormLabel>
          <FormControl>
            <CurrencyInput
              {...rest}
              value={value}
              onValueChange={onChange}
              placeholder={placeholder}
              className={className}
            />
          </FormControl>
          <FormMessage className="text-xs text-rose-500" />
        </FormItem>
      );
    }}
  />
);

const ProfitSummary = ({
  viewState,
}: {
  viewState: ProductFormViewState;
}) => (
  <div
    className={cn(
      "mt-4 flex items-center justify-between rounded-[4px] border px-4 py-3",
      viewState.isProfitable
        ? "border-emerald-900/30 bg-emerald-950/10"
        : "border-rose-900/30 bg-rose-950/10",
    )}
  >
    <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">
      Lucro Estimado
    </span>
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "font-mono text-sm font-bold",
          viewState.isProfitable ? "text-emerald-500" : "text-rose-500",
        )}
      >
        {(viewState.profit / 100).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}
      </span>
      <div
        className={cn(
          "ml-1 rounded-[4px] border px-1.5 py-0.5 text-[10px] font-bold",
          viewState.isProfitable
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
            : "border-rose-500/30 bg-rose-500/10 text-rose-500",
        )}
      >
        {viewState.margin.toFixed(1)}%
      </div>
    </div>
  </div>
);

const BatchSeedFields = ({
  productForm,
  viewState,
}: {
  productForm: ProductFormProps;
  viewState: ProductFormViewState;
}) => (
  <div
    className={cn(
      "grid grid-cols-1 gap-5",
      viewState.showQuantityField ? "md:grid-cols-3" : "md:grid-cols-2",
    )}
  >
    {viewState.showQuantityField && (
      <QuantityField productForm={productForm} viewState={viewState} />
    )}
    <DateFormField
      productForm={productForm}
      name="manufacturedDate"
      label="Fabricação"
    />
    <DateFormField
      productForm={productForm}
      name="expirationDate"
      label="Validade"
    />
  </div>
);

const QuantityField = ({
  productForm,
  viewState,
}: {
  productForm: ProductFormProps;
  viewState: ProductFormViewState;
}) => (
  <FormField
    control={productForm.form.control}
    name="quantity"
    render={({ field }) => {
      const { onChange, value, ...rest } = field;
      const hasStepper = productForm.onQuantityIncrement && productForm.onQuantityDecrement;
      return (
        <FormItem>
          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            {viewState.isInlineMode ? "Quantidade" : "Qtd. Inicial"}{" "}
            <span className="text-rose-500">*</span>
          </FormLabel>
          {hasStepper ? (
            <div className="flex">
              <Button
                type="button"
                variant="outline"
                onClick={productForm.onQuantityDecrement}
                className="size-10 rounded-l-[4px] rounded-r-none border-neutral-800 bg-neutral-900 p-0 hover:bg-neutral-800 hover:text-white"
                aria-label="Diminuir quantidade"
              >
                <Minus className="size-4" />
              </Button>
              <FormControl>
                <NumberInput
                  {...rest}
                  value={value}
                  onValueChange={onChange}
                  mode="integer"
                  placeholder="0"
                  className="h-10 min-w-0 flex-1 rounded-none border-x-0 border-neutral-800 bg-neutral-900 text-center text-sm focus:border-blue-600 focus:ring-0"
                />
              </FormControl>
              <Button
                type="button"
                variant="outline"
                onClick={productForm.onQuantityIncrement}
                className="size-10 rounded-l-none rounded-r-[4px] border-neutral-800 bg-neutral-900 p-0 hover:bg-neutral-800 hover:text-white"
                aria-label="Aumentar quantidade"
              >
                <Plus className="size-4" />
              </Button>
            </div>
          ) : (
            <FormControl>
              <NumberInput
                {...rest}
                value={value}
                onValueChange={onChange}
                mode="integer"
                placeholder="0"
                className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
              />
            </FormControl>
          )}
          <FormMessage className="text-xs text-rose-500" />
        </FormItem>
      );
    }}
  />
);

const DateFormField = ({
  label,
  name,
  productForm,
}: {
  label: string;
  name: "manufacturedDate" | "expirationDate";
  productForm: ProductFormProps;
}) => (
  <FormField
    control={productForm.form.control}
    name={name}
    render={({ field }) => (
      <FormItem>
        <FormLabel className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          <Calendar className="size-3" /> {label}
        </FormLabel>
        <FormControl>
          <Input
            type="date"
            className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
            {...field}
          />
        </FormControl>
        <FormMessage className="text-xs text-rose-500" />
      </FormItem>
    )}
  />
);

const ProductSidebar = ({
  productForm,
  viewState,
}: {
  productForm: ProductFormProps;
  viewState: ProductFormViewState;
}) => (
  <div className="space-y-6">
    <ProductImageCard productForm={productForm} viewState={viewState} />
    <ProductOrganizationCard productForm={productForm} />
    <ProductSettingsCard productForm={productForm} viewState={viewState} />
  </div>
);

const ProductImageCard = ({
  productForm,
  viewState,
}: {
  productForm: ProductFormProps;
  viewState: ProductFormViewState;
}) => (
  <Card className="rounded-[4px] border border-neutral-800 bg-[#171717]">
    <CardHeader className="border-b border-neutral-800 pb-4">
      <CardTitle className="text-sm font-bold uppercase tracking-wide text-white">
        Imagem do Produto
      </CardTitle>
      {viewState.isInlineMode && (
        <CardDescription className="mt-2 text-xs text-neutral-500">
          A imagem será enviada somente ao registrar a movimentação.
        </CardDescription>
      )}
    </CardHeader>
    <CardContent className="pt-6">
      <ImageDropzone
        value={productForm.productImage}
        currentImageUrl={productForm.currentImageUrl}
        onImageSelect={productForm.handleImageSelect}
        onProcessingChange={productForm.handleImageProcessingChange}
        onRemoveImage={productForm.handleImageRemove}
        disabled={productForm.isSubmitting}
        text={
          viewState.isInlineMode ? "Adicionar imagem temporária" : undefined
        }
      />
    </CardContent>
  </Card>
);

const ProductOrganizationCard = ({
  productForm,
}: {
  productForm: ProductFormProps;
}) => (
  <Card className="rounded-[4px] border border-neutral-800 bg-[#171717]">
    <CardHeader className="border-b border-neutral-800 pb-4">
      <div className="flex items-center gap-2">
        <Tag className="size-4 text-amber-500" />
        <CardTitle className="text-sm font-bold uppercase tracking-wide text-white">
          Categorização
        </CardTitle>
      </div>
    </CardHeader>
    <CardContent className="pt-6">
      <div className="grid grid-cols-1 gap-5">
        <CategorySelectField productForm={productForm} />
        <BrandSelectField productForm={productForm} />
      </div>
    </CardContent>
  </Card>
);

const CategorySelectField = ({
  productForm,
}: {
  productForm: ProductFormProps;
}) => (
  <FormField
    control={productForm.form.control}
    name="categoryId"
    render={({ field }) => (
      <FormItem className="space-y-1.5">
        <FormLabel className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          <Layers className="size-3 text-amber-500/70" />
          Categoria
        </FormLabel>
        <Select
          key={field.value || "empty"}
          onValueChange={field.onChange}
          value={field.value || undefined}
        >
          <FormControl>
            <SelectTrigger className="h-11 w-full rounded-[4px] border-neutral-800 bg-neutral-900 text-sm transition-colors focus:border-blue-600 focus:ring-0">
              <SelectValue placeholder="Selecione a categoria…" />
            </SelectTrigger>
          </FormControl>
          <SelectContent className="max-h-[300px] rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
            {productForm.isLoadingCategories ? (
              <LoadingSelectContent value={field.value} />
            ) : (
              productForm.categories.map((category) => (
                <CategorySelectItem key={category.id} category={category} />
              ))
            )}
          </SelectContent>
        </Select>
        <FormMessage className="text-xs text-rose-500" />
      </FormItem>
    )}
  />
);

const LoadingSelectContent = ({ value }: { value?: string | null }) => (
  <>
    {value && (
      <SelectItem value={value} className="text-xs">
        Carregando…
      </SelectItem>
    )}
    <div className="flex items-center justify-center p-2 text-xs text-muted-foreground">
      <Loader2 className="mr-2 size-3 animate-spin" />
      Carregando…
    </div>
  </>
);

const CategorySelectItem = ({
  category,
}: {
  category: ProductFormProps["categories"][number];
}) => {
  const parentName = getCategoryParentName(category);

  return (
    <SelectItem
      value={category.id}
      className="py-2.5 text-xs focus:bg-neutral-800 focus:text-white"
    >
      <div className="flex items-center gap-2">
        <div className="size-2 rounded-[2px] bg-amber-500/50" />
        {parentName ? (
          <span className="inline-flex items-center gap-1">
            <span className="text-neutral-500">{parentName}</span>
            <span className="text-neutral-600">/</span>
            <span>{category.name}</span>
          </span>
        ) : (
          category.name
        )}
      </div>
    </SelectItem>
  );
};

const BrandSelectField = ({
  productForm,
}: {
  productForm: ProductFormProps;
}) => (
  <FormField
    control={productForm.form.control}
    name="brandId"
    render={({ field }) => (
      <FormItem className="space-y-1.5">
        <FormLabel className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          <CheckCircle2 className="size-3 text-blue-500/70" />
          Marca / Fabricante
        </FormLabel>
        <Select
          key={field.value || "empty"}
          onValueChange={field.onChange}
          value={field.value || undefined}
        >
          <FormControl>
            <SelectTrigger className="h-11 w-full rounded-[4px] border-neutral-800 bg-neutral-900 text-sm transition-colors focus:border-blue-600 focus:ring-0">
              <SelectValue placeholder="Selecione a marca…" />
            </SelectTrigger>
          </FormControl>
          <SelectContent className="max-h-[300px] rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300">
            {productForm.isLoadingBrands ? (
              <LoadingSelectContent value={field.value} />
            ) : (
              productForm.brands.map((brand) => (
                <BrandSelectItem key={brand.id} brand={brand} />
              ))
            )}
          </SelectContent>
        </Select>
        <FormMessage className="text-xs text-rose-500" />
      </FormItem>
    )}
  />
);

const BrandSelectItem = ({
  brand,
}: {
  brand: ProductFormProps["brands"][number];
}) => (
  <SelectItem
    value={brand.id}
    className="py-2.5 text-xs focus:bg-neutral-800 focus:text-white"
  >
    <div className="flex items-center gap-2">
      {brand.logoUrl ? (
        <Image
          src={brand.logoUrl}
          alt={brand.name}
          width={16}
          height={16}
          unoptimized
          className="size-4 rounded-[2px] object-contain"
        />
      ) : (
        <div className="flex size-4 items-center justify-center rounded-[2px] bg-neutral-800 text-[8px] font-bold text-neutral-500">
          {brand.name.substring(0, 1)}
        </div>
      )}
      {brand.name}
    </div>
  </SelectItem>
);

const ProductSettingsCard = ({
  productForm,
  viewState,
}: {
  productForm: ProductFormProps;
  viewState: ProductFormViewState;
}) => (
  <Card className="rounded-[4px] border border-neutral-800 bg-[#171717]">
    <CardHeader className="border-b border-neutral-800 pb-4">
      <div className="flex items-center gap-2">
        <Settings2 className="size-4 text-neutral-500" />
        <CardTitle className="text-sm font-bold uppercase tracking-wide text-white">
          Configurações
        </CardTitle>
      </div>
    </CardHeader>
    <CardContent className="space-y-3 pt-4">
      <ProductActiveSwitch productForm={productForm} />
      {viewState.showContinuousMode && (
        <BatchModeSwitch
          control={productForm.form.control}
          isInlineMode={viewState.isInlineMode}
        />
      )}
      <ProductKitSwitch productForm={productForm} />
    </CardContent>
  </Card>
);

const ProductActiveSwitch = ({
  productForm,
}: {
  productForm: ProductFormProps;
}) => (
  <FormField
    control={productForm.form.control}
    name="active"
    render={({ field }) => (
      <FormItem className="flex items-center justify-between rounded-[4px] border border-neutral-800 bg-neutral-900 p-3">
        <div className="space-y-0.5">
          <FormLabel className="text-xs font-bold uppercase tracking-wide text-white">
            {field.value ? "Ativo" : "Inativo"}
          </FormLabel>
          <FormDescription className="text-[10px] text-neutral-500">
            Status do produto no sistema
          </FormDescription>
        </div>
        <FormControl>
          <Switch
            checked={field.value}
            onCheckedChange={field.onChange}
            className="data-[state=checked]:bg-blue-600"
          />
        </FormControl>
      </FormItem>
    )}
  />
);

const ProductKitSwitch = ({
  productForm,
}: {
  productForm: ProductFormProps;
}) => (
  <div className="rounded-[4px] border border-neutral-800 bg-neutral-900/50 p-3">
    <FormField
      control={productForm.form.control}
      name="isKit"
      render={({ field }) => (
        <FormItem className="flex items-center justify-between">
          <FormLabel className="cursor-pointer text-xs font-medium text-neutral-400">
            É um Kit (Combo)
          </FormLabel>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              className="scale-90 data-[state=checked]:bg-blue-600"
            />
          </FormControl>
        </FormItem>
      )}
    />
  </div>
);

const ProductFooterActionBar = ({
  productForm,
  viewState,
}: {
  productForm: ProductFormProps;
  viewState: ProductFormViewState;
}) => (
  <div
    className={cn(
      "fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-800 bg-[#0A0A0A]/95 p-4 backdrop-blur-sm md:ml-[var(--sidebar-width)]",
      viewState.isFooterVisible
        ? "translate-y-0"
        : "translate-y-[calc(100%+1rem)]",
    )}
  >
    <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-3 px-4 md:flex-row md:justify-end md:px-6 lg:px-8">
      {viewState.isInlineMode && viewState.showMobileBatchModeToggle && (
        <div className="w-full md:hidden">
          <BatchModeSwitch
            control={productForm.form.control}
            isInlineMode={viewState.isInlineMode}
            compact
          />
        </div>
      )}
      <Button
        variant="outline"
        type="button"
        className="h-10 w-full rounded-[4px] border-neutral-700 bg-transparent text-xs font-bold uppercase tracking-wide text-neutral-300 hover:bg-neutral-800 hover:text-white md:w-auto"
        asChild
      >
        <Link href={viewState.productCancelHref} onClick={productForm.onCancel}>
          Cancelar
        </Link>
      </Button>
      <Button
        type="submit"
        className="h-10 w-full rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 md:w-[160px]"
        disabled={
          productForm.isSubmitting ||
          Boolean(productForm.isImageProcessing) ||
          (!viewState.isInlineMode && !productForm.warehouseId)
        }
      >
        {productForm.isImageProcessing ? (
          <>
            <Loader2 className="mr-2 size-3.5 animate-spin" />
            Imagem…
          </>
        ) : productForm.isSubmitting ? (
          <>
            <Loader2 className="mr-2 size-3.5 animate-spin" />
            Salvando…
          </>
        ) : (
          <>
            <CheckCircle2 className="mr-2 size-3.5" />
            {viewState.submitLabel}
          </>
        )}
      </Button>
    </div>
  </div>
);

const ProductBatchesDrawer = ({
  viewState,
}: {
  viewState: ProductFormViewState;
}) => {
  if (!viewState.batchesDrawerState) return null;

  return (
    <Drawer
      open={viewState.batchesDrawerState.isOpen}
      onOpenChange={viewState.batchesDrawerState.onOpenChange}
      direction={viewState.batchesDrawerState.direction}
    >
      <DrawerContent className="border-neutral-800 bg-[#171717] data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:max-w-xl">
        <div className="flex h-full flex-col">
          <BatchesDrawerHeader />
          <BatchesDrawerBody drawerState={viewState.batchesDrawerState} />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

const BatchesDrawerHeader = () => (
  <DrawerHeader className="border-b border-neutral-800 px-4 py-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-[4px] border border-neutral-800 bg-neutral-900">
          <Layers className="size-4 text-blue-500" />
        </div>
        <div>
          <DrawerTitle className="text-sm font-bold uppercase tracking-wide text-white">
            Gerenciar Lotes
          </DrawerTitle>
          <p className="text-[10px] text-neutral-500">
            Edite os lotes vinculados a este produto
          </p>
        </div>
      </div>
      <DrawerClose asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 rounded-[4px] text-neutral-400 hover:bg-neutral-800 hover:text-white"
        >
          <X className="size-4" />
        </Button>
      </DrawerClose>
    </div>
  </DrawerHeader>
);

const BatchesDrawerBody = ({
  drawerState,
}: {
  drawerState: BatchesDrawerProps;
}) => (
  <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
    {drawerState.isLoading && <BatchesDrawerLoading />}
    {!drawerState.isLoading && drawerState.fields.length === 0 && (
      <BatchesDrawerEmpty />
    )}
    {!drawerState.isLoading && drawerState.fields.length > 0 && (
      <BatchesDrawerForm drawerState={drawerState} />
    )}
  </div>
);

const BatchesDrawerLoading = () => (
  <div className="flex items-center justify-center rounded-[4px] border border-neutral-800 bg-neutral-900/50 p-6">
    <Loader2 className="mr-2 size-4 animate-spin text-blue-600" />
    <span className="text-xs text-neutral-400">Carregando lotes…</span>
  </div>
);

const BatchesDrawerEmpty = () => (
  <div className="rounded-[4px] border border-neutral-800 bg-neutral-900/50 p-6 text-center">
    <p className="text-xs uppercase tracking-wide text-neutral-500">
      Nenhum lote encontrado para este produto
    </p>
  </div>
);

const BatchesDrawerForm = ({
  drawerState,
}: {
  drawerState: BatchesDrawerProps;
}) => (
  <Form {...drawerState.form}>
    <Accordion type="multiple" className="space-y-3">
      {drawerState.fields.map((batch, index) => (
        <BatchesDrawerItem
          key={batch.fieldId || batch.id}
          batch={batch}
          drawerState={drawerState}
          index={index}
        />
      ))}
    </Accordion>
  </Form>
);

const BatchesDrawerItem = ({
  batch,
  drawerState,
  index,
}: {
  batch: BatchesDrawerProps["fields"][number];
  drawerState: BatchesDrawerProps;
  index: number;
}) => (
  <AccordionItem
    value={batch.fieldId || batch.id}
    className="rounded-[4px] border border-neutral-800 bg-neutral-900/30 px-3"
  >
    <AccordionTrigger className="py-3 hover:no-underline">
      <BatchesDrawerItemHeader batch={batch} />
    </AccordionTrigger>
    <AccordionContent>
      <div
        className="max-h-[70vh] overflow-y-auto pr-1"
        data-testid="batch-accordion-scroll"
      >
        <div className="space-y-4 pb-2 pt-2">
          <BatchesDrawerFields drawerState={drawerState} index={index} />
          <BatchesDrawerSaveButton
            batchId={batch.id}
            drawerState={drawerState}
            index={index}
          />
        </div>
      </div>
    </AccordionContent>
  </AccordionItem>
);

const BatchesDrawerItemHeader = ({
  batch,
}: {
  batch: BatchesDrawerProps["fields"][number];
}) => (
  <div className="flex flex-1 flex-col gap-1 text-left">
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-bold uppercase tracking-wide text-white">
        {batch.batchCode}
      </span>
      <span className="rounded-[2px] border border-neutral-800 bg-neutral-900 px-1.5 py-0.5 font-mono text-[10px] text-neutral-400">
        QTD: {batch.quantity}
      </span>
    </div>
    <div className="flex flex-wrap items-center gap-2 text-[10px] text-neutral-500">
      <span className="uppercase">{batch.warehouseName}</span>
      <span className="text-neutral-700">•</span>
      <span>
        {batch.expirationDate ? `VAL: ${batch.expirationDate}` : "SEM VALIDADE"}
      </span>
    </div>
  </div>
);

const BatchesDrawerFields = ({
  drawerState,
  index,
}: {
  drawerState: BatchesDrawerProps;
  index: number;
}) => (
  <div className="grid gap-4">
    <div className="grid gap-4 md:grid-cols-2">
      <BatchDrawerQuantityField drawerState={drawerState} index={index} />
      <BatchDrawerDateField drawerState={drawerState} index={index} />
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <BatchDrawerCurrencyField
        drawerState={drawerState}
        index={index}
        label="Custo Unitário"
        name="costPrice"
        className="h-9 rounded-[4px] border-neutral-800 bg-neutral-900 text-xs focus:border-blue-600 focus:ring-0"
      />
      <BatchDrawerCurrencyField
        drawerState={drawerState}
        index={index}
        label="Preço de Venda"
        name="sellingPrice"
        className="h-9 rounded-[4px] border-neutral-800 bg-neutral-900 text-xs font-bold text-emerald-500 focus:border-emerald-600 focus:ring-0"
      />
    </div>
    <BatchDrawerNotesField drawerState={drawerState} index={index} />
  </div>
);

const BatchDrawerQuantityField = ({
  drawerState,
  index,
}: {
  drawerState: BatchesDrawerProps;
  index: number;
}) => (
  <FormField
    control={drawerState.form.control}
    name={`batches.${index}.quantity` as const}
    render={({ field }) => (
      <FormItem>
        <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          Quantidade
        </FormLabel>
        <FormControl>
          <Input
            type="number"
            className="h-9 rounded-[4px] border-neutral-800 bg-neutral-900 text-xs focus:border-blue-600 focus:ring-0"
            {...field}
            value={field.value ?? 0}
            onChange={(event) => {
              const value = event.target.value;
              field.onChange(value === "" ? 0 : Number(value));
            }}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);

const BatchDrawerDateField = ({
  drawerState,
  index,
}: {
  drawerState: BatchesDrawerProps;
  index: number;
}) => (
  <FormField
    control={drawerState.form.control}
    name={`batches.${index}.expirationDate` as const}
    render={({ field }) => (
      <FormItem>
        <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          Validade
        </FormLabel>
        <FormControl>
          <Input
            type="date"
            className="h-9 rounded-[4px] border-neutral-800 bg-neutral-900 text-xs focus:border-blue-600 focus:ring-0"
            {...field}
            value={field.value || ""}
            onChange={(event) => field.onChange(event.target.value || "")}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);

const BatchDrawerCurrencyField = ({
  className,
  drawerState,
  index,
  label,
  name,
}: {
  className: string;
  drawerState: BatchesDrawerProps;
  index: number;
  label: string;
  name: "costPrice" | "sellingPrice";
}) => (
  <FormField
    control={drawerState.form.control}
    name={`batches.${index}.${name}` as const}
    render={({ field }) => {
      const { onChange, value, ...rest } = field;
      return (
        <FormItem>
          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            {label}
          </FormLabel>
          <FormControl>
            <CurrencyInput
              {...rest}
              value={value}
              onValueChange={onChange}
              placeholder="0,00"
              className={className}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      );
    }}
  />
);

const BatchDrawerNotesField = ({
  drawerState,
  index,
}: {
  drawerState: BatchesDrawerProps;
  index: number;
}) => (
  <FormField
    control={drawerState.form.control}
    name={`batches.${index}.notes` as const}
    render={({ field }) => (
      <FormItem>
        <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          Observações
        </FormLabel>
        <FormControl>
          <Textarea
            className="min-h-[60px] resize-none rounded-[4px] border-neutral-800 bg-neutral-900 text-xs focus:border-blue-600 focus:ring-0"
            {...field}
            value={field.value || ""}
            onChange={(event) => field.onChange(event.target.value)}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);

const BatchesDrawerSaveButton = ({
  batchId,
  drawerState,
  index,
}: {
  batchId: string;
  drawerState: BatchesDrawerProps;
  index: number;
}) => (
  <Button
    type="button"
    onClick={() => drawerState.onSave(index)}
    disabled={drawerState.updatingBatchId === batchId}
    className="h-9 w-full rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
  >
    {drawerState.updatingBatchId === batchId ? (
      <>
        <Loader2 className="mr-2 size-3.5 animate-spin" />
        Salvando…
      </>
    ) : (
      "Salvar Alterações"
    )}
  </Button>
);
