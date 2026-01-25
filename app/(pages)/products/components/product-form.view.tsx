"use client";

import { CustomAttributesBuilder } from "@/components/product/custom-attributes-builder";
import { BarcodeScannerModal } from "@/components/product/barcode-scanner-modal";
import { ProductAiFillModal } from "@/components/product/product-ai-fill-modal";
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
  X,
  Zap,
  Scan,
  Box,
  Barcode,
  Info,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { ProductFormProps } from "./product-form.types";
import { cn } from "@/lib/utils";

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
  batchesDrawer,
  isAiModalOpen,
  openAiModal,
  closeAiModal,
  handleAiFill,
}: ProductFormProps) => {
  const hasExpiration = form.watch("hasExpiration");
  
  const costPrice = form.watch("costPrice") || 0;
  const sellingPrice = form.watch("sellingPrice") || 0;
  const profit = sellingPrice - costPrice;
  const margin = costPrice > 0 ? (profit / costPrice) * 100 : 0;
  const isProfitable = profit > 0;

  const batchesDrawerState = mode === "edit" ? batchesDrawer : undefined;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24 md:pb-20 font-sans text-neutral-200">
      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        open={isScannerOpen}
        onClose={closeScanner}
        onScan={handleBarcodeScan}
      />
      
      <main className="mx-auto w-full max-w-7xl py-8 px-4 md:px-6 lg:px-8">
        {/* AI Fill Modal */}
        {mode === 'create' && isAiModalOpen !== undefined && closeAiModal && handleAiFill && (
          <ProductAiFillModal
            open={isAiModalOpen}
            onClose={closeAiModal}
            onConfirm={handleAiFill}
            categories={categories}
            brands={brands}
          />
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left Column - Main Content */}
              <div className="space-y-6 lg:col-span-2">
                
                {/* Basic Info Card */}
                <Card className="rounded-[4px] border border-neutral-800 bg-[#171717]">
                  <CardHeader className="border-b border-neutral-800 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Box className="h-4 w-4 text-blue-500" />
                        <CardTitle className="text-sm font-bold uppercase tracking-wide text-white">
                          Informações Básicas
                        </CardTitle>
                      </div>

                      {mode === 'create' && openAiModal && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={openAiModal}
                          className="h-7 gap-2 rounded-[4px] border-indigo-500/30 bg-indigo-500/10 text-[10px] font-bold uppercase tracking-wide text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300"
                        >
                          <Sparkles className="h-3 w-3" />
                          Preencher com IA
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-5">
                    <FormField
                      control={form.control}
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
                              ref={nameInputRef}
                            />
                          </FormControl>
                          <FormMessage className="text-xs text-rose-500" />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="barcode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                              <Barcode className="h-3 w-3" /> Código de Barras
                            </FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input
                                  placeholder="EAN / UPC / CODE128"
                                  className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0 font-mono"
                                  {...field}
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={openScanner}
                                className="h-10 w-10 shrink-0 rounded-[4px] border-neutral-800 bg-neutral-900 hover:bg-neutral-800 hover:text-white"
                              >
                                <Scan className="h-4 w-4" />
                              </Button>
                            </div>
                            <FormMessage className="text-xs text-rose-500" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                            Descrição Detalhada
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Especificações técnicas, detalhes de uso, etc..."
                              className="min-h-[100px] resize-y rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs text-rose-500" />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Attributes & Dimensions Card */}
                <Card className="rounded-[4px] border border-neutral-800 bg-[#171717]">
                  <CardHeader className="border-b border-neutral-800 pb-4">
                    <div className="flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-blue-500" />
                      <CardTitle className="text-sm font-bold uppercase tracking-wide text-white">
                        Dimensões e Atributos
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="attributes.weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                              <Scale className="h-3 w-3" /> Peso
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="EX: 1.5 KG"
                                className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-xs text-rose-500" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="attributes.dimensions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                              <Box className="h-3 w-3" /> Dimensões (C x L x A)
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="EX: 10 x 20 x 5 CM"
                                className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-xs text-rose-500" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="pt-4 border-t border-neutral-800">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-white mb-4">Atributos Personalizados</h4>
                      <CustomAttributesBuilder
                        attributes={customAttributes}
                        onAdd={addCustomAttribute}
                        onRemove={removeCustomAttribute}
                        onUpdate={updateCustomAttribute}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Inventory & Pricing Card */}
                <Card className="rounded-[4px] border border-neutral-800 bg-[#171717]">
                  <CardHeader className="border-b border-neutral-800 pb-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-emerald-500" />
                      <CardTitle className="text-sm font-bold uppercase tracking-wide text-white">
                        Estoque e Precificação
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {/* Pricing Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="costPrice"
                        render={({ field }) => {
                          const { onChange, value, ...rest } = field;
                          return (
                            <FormItem>
                              <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                Preço de Custo
                              </FormLabel>
                              <FormControl>
                                <CurrencyInput
                                  {...rest}
                                  value={value}
                                  onValueChange={onChange}
                                  placeholder="0,00"
                                  className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0 text-white"
                                />
                              </FormControl>
                              <FormMessage className="text-xs text-rose-500" />
                            </FormItem>
                          );
                        }}
                      />
                      <FormField
                        control={form.control}
                        name="sellingPrice"
                        render={({ field }) => {
                          const { onChange, value, ...rest } = field;
                          return (
                            <FormItem>
                              <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                Preço de Venda
                              </FormLabel>
                              <FormControl>
                                <CurrencyInput
                                  {...rest}
                                  value={value}
                                  onValueChange={onChange}
                                  placeholder="0,00"
                                  className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-emerald-600 focus:ring-0 text-emerald-500 font-bold"
                                />
                              </FormControl>
                              <FormMessage className="text-xs text-rose-500" />
                            </FormItem>
                          );
                        }}
                      />
                    </div>

                    <div className={cn(
                      "mt-4 rounded-[4px] border px-4 py-3 flex items-center justify-between",
                      isProfitable ? "border-emerald-900/30 bg-emerald-950/10" : "border-rose-900/30 bg-rose-950/10"
                    )}>
                      <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                        Lucro Estimado
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm font-bold font-mono",
                          isProfitable ? "text-emerald-500" : "text-rose-500"
                        )}>
                          {(profit / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                        <div className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded border ml-1",
                          isProfitable ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500" : "border-rose-500/30 bg-rose-500/10 text-rose-500"
                        )}>
                          {margin.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    {/* Inventory Row (Only in Create Mode) */}
                    {mode === 'create' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <FormField
                          control={form.control}
                          name="quantity"
                          render={({ field }) => {
                            const { onChange, value, ...rest } = field;
                            return (
                              <FormItem>
                                <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                  Qtd. Inicial <span className="text-rose-500">*</span>
                                </FormLabel>
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
                                <FormMessage className="text-xs text-rose-500" />
                              </FormItem>
                            );
                          }}
                        />
                        <FormField
                          control={form.control}
                          name="manufacturedDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                                <Calendar className="h-3 w-3" /> Fabricação
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
                        <FormField
                          control={form.control}
                          name="expirationDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                                <Calendar className="h-3 w-3" /> Validade
                                {hasExpiration && <span className="text-rose-500">*</span>}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0 disabled:opacity-50"
                                  disabled={!hasExpiration}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-xs text-rose-500" />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-6">
                
                {/* Image Upload */}
                <Card className="rounded-[4px] border border-neutral-800 bg-[#171717]">
                  <CardHeader className="border-b border-neutral-800 pb-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-wide text-white">
                      Imagem do Produto
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ImageDropzone
                      value={productImage}
                      currentImageUrl={currentImageUrl}
                      onImageSelect={handleImageSelect}
                      onRemoveImage={handleImageRemove}
                      disabled={isSubmitting}
                    />
                  </CardContent>
                </Card>

                {/* Organization Card */}
                <Card className="rounded-[4px] border border-neutral-800 bg-[#171717]">
                  <CardHeader className="border-b border-neutral-800 pb-4">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-amber-500" />
                      <CardTitle className="text-sm font-bold uppercase tracking-wide text-white">
                        Categorização
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 gap-5">
                      <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                              <Layers className="h-3 w-3 text-amber-500/70" />
                              Categoria
                            </FormLabel>
                            <Select
                              key={field.value || 'empty'}
                              onValueChange={field.onChange}
                              value={field.value || undefined}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full h-11 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:ring-0 focus:border-blue-600 transition-colors">
                                  <SelectValue placeholder="Selecione a categoria..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300 max-h-[300px]">
                                {isLoadingCategories ? (
                                  <>
                                    {field.value && (
                                      <SelectItem value={field.value} className="text-xs">
                                        Carregando...
                                      </SelectItem>
                                    )}
                                    <div className="flex items-center justify-center p-2 text-xs text-muted-foreground">
                                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                      Carregando...
                                    </div>
                                  </>
                                ) : (
                                  categories.map((category) => (
                                    <SelectItem
                                      key={category.id}
                                      value={category.id}
                                      className="text-xs focus:bg-neutral-800 focus:text-white py-2.5"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-amber-500/50" />
                                        {category.name}
                                      </div>
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs text-rose-500" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="brandId"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                              <CheckCircle2 className="h-3 w-3 text-blue-500/70" />
                              Marca / Fabricante
                            </FormLabel>
                            <Select
                              key={field.value || 'empty'}
                              onValueChange={field.onChange}
                              value={field.value || undefined}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full h-11 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:ring-0 focus:border-blue-600 transition-colors">
                                  <SelectValue placeholder="Selecione a marca..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300 max-h-[300px]">
                                {isLoadingBrands ? (
                                  <>
                                    {field.value && (
                                      <SelectItem value={field.value} className="text-xs">
                                        Carregando...
                                      </SelectItem>
                                    )}
                                    <div className="flex items-center justify-center p-2 text-xs text-muted-foreground">
                                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                      Carregando...
                                    </div>
                                  </>
                                ) : (
                                  brands.map((brand) => (
                                    <SelectItem
                                      key={brand.id}
                                      value={brand.id}
                                      className="text-xs focus:bg-neutral-800 focus:text-white py-2.5"
                                    >
                                      <div className="flex items-center gap-2">
                                        {brand.logoUrl ? (
                                           <img
                                             src={brand.logoUrl}
                                             alt={brand.name}
                                             className="h-4 w-4 object-contain rounded-[2px]"
                                           />
                                        ) : (
                                           <div className="h-4 w-4 rounded-[2px] bg-neutral-800 flex items-center justify-center text-[8px] font-bold text-neutral-500">
                                             {brand.name.substring(0, 1)}
                                           </div>
                                        )}
                                        {brand.name}
                                      </div>
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs text-rose-500" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Settings Card */}
                <Card className="rounded-[4px] border border-neutral-800 bg-[#171717]">
                  <CardHeader className="border-b border-neutral-800 pb-4">
                    <div className="flex items-center gap-2">
                      <Settings2 className="h-4 w-4 text-neutral-500" />
                      <CardTitle className="text-sm font-bold uppercase tracking-wide text-white">
                        Configurações
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <FormField
                      control={form.control}
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
                            <Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-blue-600" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {mode === 'create' && (
                      <FormField
                        control={form.control}
                        name="continuousMode"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-[4px] border border-neutral-800 bg-neutral-900 p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-xs font-bold uppercase tracking-wide text-white flex items-center gap-2">
                                <Zap className="h-3 w-3 text-amber-500" />
                                Modo Contínuo
                              </FormLabel>
                              <FormDescription className="text-[10px] text-neutral-500">
                                Manter na tela após salvar
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-amber-500" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}

                    <div className="rounded-[4px] border border-neutral-800 bg-neutral-900/50 p-3 space-y-3">
                      <FormField
                        control={form.control}
                        name="hasExpiration"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <FormLabel className="text-xs font-medium text-neutral-400 cursor-pointer">
                              Controlar Validade
                            </FormLabel>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-blue-600 scale-90" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="h-px bg-neutral-800" />
                      <FormField
                        control={form.control}
                        name="isKit"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <FormLabel className="text-xs font-medium text-neutral-400 cursor-pointer">
                              É um Kit (Combo)
                            </FormLabel>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-blue-600 scale-90" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

              </div>
            </div>

            {/* Footer Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-800 bg-[#0A0A0A]/95 backdrop-blur-sm p-4 md:ml-[var(--sidebar-width)]">
              <div className="mx-auto flex w-full max-w-7xl flex-col md:flex-row items-center md:justify-end gap-3 px-4 md:px-6 lg:px-8">
                <Button
                  variant="outline"
                  type="button"
                  className="h-10 w-full md:w-auto rounded-[4px] border-neutral-700 bg-transparent text-xs font-bold uppercase tracking-wide text-neutral-300 hover:bg-neutral-800 hover:text-white"
                  asChild
                >
                  <Link href="/products">Cancelar</Link>
                </Button>
                <Button
                  type="submit"
                  className="h-10 w-full md:w-[160px] rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)]"
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
              </div>
            </div>
          </form>
        </Form>
      </main>

      {batchesDrawerState && (
        <Drawer
          open={batchesDrawerState.isOpen}
          onOpenChange={batchesDrawerState.onOpenChange}
          direction={batchesDrawerState.direction}
        >
          <DrawerContent className="border-neutral-800 bg-[#171717] data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:max-w-xl">
            <div className="flex h-full flex-col">
              <DrawerHeader className="border-b border-neutral-800 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-neutral-900 border border-neutral-800">
                      <Layers className="h-4 w-4 text-blue-500" />
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
                      className="h-8 w-8 rounded-[4px] text-neutral-400 hover:bg-neutral-800 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </DrawerClose>
                </div>
              </DrawerHeader>

              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {batchesDrawerState.isLoading && (
                  <div className="flex items-center justify-center rounded-[4px] border border-neutral-800 bg-neutral-900/50 p-6">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-xs text-neutral-400">
                      Carregando lotes...
                    </span>
                  </div>
                )}

                {!batchesDrawerState.isLoading &&
                  batchesDrawerState.fields.length === 0 && (
                  <div className="rounded-[4px] border border-neutral-800 bg-neutral-900/50 p-6 text-center">
                    <p className="text-xs uppercase tracking-wide text-neutral-500">
                      Nenhum lote encontrado para este produto
                    </p>
                  </div>
                )}

                {!batchesDrawerState.isLoading &&
                  batchesDrawerState.fields.length > 0 && (
                  <Form {...batchesDrawerState.form}>
                    <Accordion type="multiple" className="space-y-3">
                      {batchesDrawerState.fields.map((batch, index) => (
                        <AccordionItem
                          key={batch.fieldId || batch.id}
                          value={batch.fieldId || batch.id}
                          className="rounded-[4px] border border-neutral-800 bg-neutral-900/30 px-3"
                        >
                          <AccordionTrigger className="py-3 hover:no-underline">
                            <div className="flex flex-1 flex-col gap-1 text-left">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-xs font-bold uppercase tracking-wide text-white">
                                  {batch.batchCode}
                                </span>
                                <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-1.5 py-0.5 rounded-[2px] border border-neutral-800">
                                  QTD: {batch.quantity}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-[10px] text-neutral-500">
                                <span className="uppercase">
                                  {batch.warehouseName}
                                </span>
                                <span className="text-neutral-700">•</span>
                                <span>
                                  {batch.expirationDate
                                    ? `VAL: ${batch.expirationDate}`
                                    : "SEM VALIDADE"}
                                </span>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div
                              className="max-h-[70vh] overflow-y-auto pr-1"
                              data-testid="batch-accordion-scroll"
                            >
                              <div className="space-y-4 pb-2 pt-2">
                              
                              <div className="grid gap-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                  <FormField
                                    control={batchesDrawerState.form.control}
                                    name={`batches.${index}.quantity`}
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
                                              field.onChange(
                                                value === "" ? 0 : Number(value)
                                              );
                                            }}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={batchesDrawerState.form.control}
                                    name={`batches.${index}.expirationDate`}
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
                                            onChange={(event) =>
                                              field.onChange(
                                                event.target.value || ""
                                              )
                                            }
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                  <FormField
                                    control={batchesDrawerState.form.control}
                                    name={`batches.${index}.costPrice`}
                                    render={({ field }) => {
                                      const { onChange, value, ...rest } = field;
                                      return (
                                        <FormItem>
                                          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                            Custo Unitário
                                          </FormLabel>
                                          <FormControl>
                                            <CurrencyInput
                                              {...rest}
                                              value={value}
                                              onValueChange={onChange}
                                              placeholder="0,00"
                                              className="h-9 rounded-[4px] border-neutral-800 bg-neutral-900 text-xs focus:border-blue-600 focus:ring-0"
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      );
                                    }}
                                  />
                                  <FormField
                                    control={batchesDrawerState.form.control}
                                    name={`batches.${index}.sellingPrice`}
                                    render={({ field }) => {
                                      const { onChange, value, ...rest } = field;
                                      return (
                                        <FormItem>
                                          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                            Preço de Venda
                                          </FormLabel>
                                          <FormControl>
                                            <CurrencyInput
                                              {...rest}
                                              value={value}
                                              onValueChange={onChange}
                                              placeholder="0,00"
                                              className="h-9 rounded-[4px] border-neutral-800 bg-neutral-900 text-xs focus:border-emerald-600 focus:ring-0 text-emerald-500 font-bold"
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      );
                                    }}
                                  />
                                </div>

                                <FormField
                                  control={batchesDrawerState.form.control}
                                  name={`batches.${index}.notes`}
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
                                          onChange={(event) =>
                                            field.onChange(event.target.value)
                                          }
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <Button
                                type="button"
                                onClick={() => batchesDrawerState.onSave(index)}
                                disabled={
                                  batchesDrawerState.updatingBatchId === batch.id
                                }
                                className="w-full h-9 rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 shadow-[0_0_15px_-5px_rgba(37,99,235,0.3)]"
                              >
                                {batchesDrawerState.updatingBatchId === batch.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                    Salvando...
                                  </>
                                ) : (
                                  "Salvar Alterações"
                                )}
                              </Button>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </Form>
                )}
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
};
