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
} from "lucide-react";
import Link from "next/link";
import { ProductFormProps } from "./product-form.types";

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
}: ProductFormProps) => {
  const hasExpiration = form.watch("hasExpiration");
  const batchesDrawerState = mode === "edit" ? batchesDrawer : undefined;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-10">
      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        open={isScannerOpen}
        onClose={closeScanner}
        onScan={handleBarcodeScan}
      />
      {/* Header Sticky - Corporate Solid */}
      <header className="sticky top-0 z-20 border-b border-border/40 bg-card">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/products"
              className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-muted/50 hover:bg-muted"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="sr-only">Voltar</span>
            </Link>
            <div className="border-l border-border/40 pl-3">
              <h1 className="text-base font-semibold tracking-tight">
                {mode === 'create' ? 'NOVO PRODUTO' : 'EDITAR PRODUTO'}
              </h1>
              <p className="text-xs text-muted-foreground hidden md:block mt-0.5">
                {mode === 'create'
                  ? 'Cadastro de item no catálogo com estoque'
                  : 'Atualização de dados do produto'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {batchesDrawerState && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => batchesDrawerState.onOpenChange(true)}
                className="rounded-sm border-border/40"
              >
                <Layers className="mr-2 h-3.5 w-3.5" />
                Ver Batches
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl py-6 px-4 md:px-6 lg:px-8">
        {!warehouseId && (
          <div className="mb-6 rounded-sm border border-amber-900/20 bg-amber-950/10 p-4">
            <p className="text-xs text-amber-200">
              ⚠️ Selecione um warehouse para criar um produto com estoque.
            </p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* COLUNA ESQUERDA - Conteúdo Principal (2/3) */}
              <div className="space-y-6 lg:col-span-2">
                {/* Informações Básicas do Produto - Corporate Solid */}
                <Card className="border border-border/50 bg-card/80 rounded-sm">
                  <CardHeader className="border-b border-border/30 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-foreground/5 border border-border/30">
                        <Package className="h-4 w-4 text-foreground/70" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold uppercase tracking-wide">
                          Detalhes do Produto
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          Informações essenciais do produto
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-5 pt-5">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                            Nome do Produto{" "}
                            <span className="text-foreground/40">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Malbec"
                              className="h-10 rounded-sm border-border/40 bg-background/50"
                              {...field}
                              ref={nameInputRef}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                            Descrição
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descreva as principais características do produto..."
                              className="min-h-[100px] resize-y rounded-sm border-border/40 bg-background/50"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-[11px] text-muted-foreground/70">
                            Informações adicionais para identificação
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Barcode Field with Scanner Button */}
                    <FormField
                      control={form.control}
                      name="barcode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                            Código de Barras
                          </FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                placeholder="Ex: 7891234567890"
                                className="h-10 rounded-sm border-border/40 bg-background/50"
                                {...field}
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={openScanner}
                              className="h-10 w-10 flex-shrink-0 rounded-sm border-border/40 hover:bg-muted"
                            >
                              <Scan className="h-4 w-4" />
                            </Button>
                          </div>
                          <FormDescription className="text-[11px] text-muted-foreground/70">
                            Clique no ícone para escanear com a câmera
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Atributos do Produto - Corporate Solid */}
                <Card className="border border-border/50 bg-card/80 rounded-sm">
                  <CardHeader className="border-b border-border/30 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-foreground/5 border border-border/30">
                        <Layers className="h-4 w-4 text-foreground/70" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold uppercase tracking-wide">
                          Atributos do Produto
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          Dimensões, peso e características
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-5">
                    <div className="grid gap-5 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="attributes.weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                              <Scale className="h-3 w-3" /> Peso
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: 1.5kg"
                                className="h-10 rounded-sm border-border/40 bg-background/50"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="attributes.dimensions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                              <Ruler className="h-3 w-3" /> Dimensões
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: 10x20x5cm"
                                className="h-10 rounded-sm border-border/40 bg-background/50"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Atributos Adicionais */}
                    <div className="space-y-3 pt-2">
                      <div className="border-t border-border/30 pt-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground/80 mb-1">
                          Atributos Adicionais
                        </h4>
                        <p className="text-[11px] text-muted-foreground/70">
                          Características específicas (cor, tamanho, material)
                        </p>
                      </div>
                      <CustomAttributesBuilder
                        attributes={customAttributes}
                        onAdd={addCustomAttribute}
                        onRemove={removeCustomAttribute}
                        onUpdate={updateCustomAttribute}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Estoque Inicial - Corporate Solid (apenas modo create) */}
                {mode === 'create' && (
                <Card className="border border-border/50 bg-card/80 rounded-sm">
                  <CardHeader className="border-b border-border/30 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-foreground/5 border border-border/30">
                        <Package className="h-4 w-4 text-foreground/70" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold uppercase tracking-wide">
                          Estoque Inicial
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          Primeira entrada de estoque
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-5">
                    {/* Quantidade */}
                    <div className="grid gap-5 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                              Quantidade{" "}
                              <span className="text-foreground/40">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                className="h-10 rounded-sm border-border/40 bg-background/50"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value) || 0)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Datas */}
                    <div className="grid gap-5 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="manufacturedDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                              <Calendar className="h-3 w-3" /> Data de Fabricação
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                className="h-10 rounded-sm border-border/40 bg-background/50"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="expirationDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                              <Calendar className="h-3 w-3" /> Data de Validade
                              {hasExpiration && (
                                <span className="text-foreground/40">*</span>
                              )}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                className="h-10 rounded-sm border-border/40 bg-background/50"
                                disabled={!hasExpiration}
                                {...field}
                              />
                            </FormControl>
                            {hasExpiration && (
                              <FormDescription className="text-[11px] text-muted-foreground/70">
                                Obrigatório quando controle de validade ativo
                              </FormDescription>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Preços */}
                    <div className="grid gap-5 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="costPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                              <DollarSign className="h-3 w-3" /> Preço de Custo
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00"
                                step="0.01"
                                className="h-10 rounded-sm border-border/40 bg-background/50"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value ? parseFloat(e.target.value) : undefined
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="sellingPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                              <DollarSign className="h-3 w-3" /> Preço de Venda
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00"
                                step="0.01"
                                className="h-10 rounded-sm border-border/40 bg-background/50"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value ? parseFloat(e.target.value) : undefined
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
                )}
              </div>

              {/* COLUNA DIREITA - Lateral (1/3) */}
              <div className="space-y-6">
                {/* Image Upload */}
                <ImageDropzone
                  value={productImage}
                  currentImageUrl={currentImageUrl}
                  onImageSelect={handleImageSelect}
                  onRemoveImage={handleImageRemove}
                  disabled={isSubmitting}
                />

                {/* Warehouse Info - Corporate Solid */}
                <Card className="border border-border/50 bg-card/80 rounded-sm">
                  <CardHeader className="border-b border-border/30 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-foreground/5 border border-border/30">
                        <Package className="h-4 w-4 text-foreground/70" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold uppercase tracking-wide">
                          Warehouse
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          Destino do estoque
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between rounded-sm border border-border/40 p-3 bg-background/30">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                          {warehouseId ? "Selecionado" : "Não selecionado"}
                        </p>
                        <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                          Selecione via menu superior
                        </p>
                      </div>
                      <div
                        className={`h-2 w-2 rounded-full ${
                          warehouseId ? "bg-green-600" : "bg-red-600"
                        }`}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Status e Configurações - Corporate Solid */}
                <Card className="border border-border/50 bg-card/80 rounded-sm">
                  <CardHeader className="border-b border-border/30 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-foreground/5 border border-border/30">
                        <Settings2 className="h-4 w-4 text-foreground/70" />
                      </div>
                      <CardTitle className="text-sm font-semibold uppercase tracking-wide">
                        Configuração
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-3 pt-4">
                    <FormField
                      control={form.control}
                      name="active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-sm border border-border/40 p-3 bg-muted/10">
                          <div className="space-y-0.5">
                            <FormLabel className="text-xs font-semibold uppercase tracking-wide">
                              {field.value ? "Ativo" : "Inativo"}
                            </FormLabel>
                            <FormDescription className="text-[11px] text-muted-foreground/70">
                              Visibilidade no sistema
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

                    <div className="rounded-sm border border-border/30 p-3 bg-background/30 space-y-3">
                      <FormField
                        control={form.control}
                        name="hasExpiration"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between">
                            <FormLabel className="text-xs font-medium cursor-pointer flex-1">
                              Controlar Validade
                            </FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="h-px bg-border/30" />
                      <FormField
                        control={form.control}
                        name="isKit"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between">
                            <FormLabel className="text-xs font-medium cursor-pointer flex-1">
                              É um Kit (Combo)
                            </FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Organização - Corporate Solid */}
                <Card className="border border-border/50 bg-card/80 rounded-sm">
                  <CardHeader className="border-b border-border/30 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-foreground/5 border border-border/30">
                        <Tag className="h-4 w-4 text-foreground/70" />
                      </div>
                      <CardTitle className="text-sm font-semibold uppercase tracking-wide">
                        Organização
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                            Categoria
                          </FormLabel>
                          <Select
                            key={field.value || 'empty'}
                            onValueChange={field.onChange}
                            value={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger className="h-10 rounded-sm border-border/40 bg-background/50">
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-sm">
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
                                    className="text-xs"
                                  >
                                    {category.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="brandId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                            Marca
                          </FormLabel>
                          <Select
                            key={field.value || 'empty'}
                            onValueChange={field.onChange}
                            value={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger className="h-10 rounded-sm border-border/40 bg-background/50">
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-sm">
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
                                    className="text-xs"
                                  >
                                    {brand.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Floating Action Bar - Corporate Solid */}
            <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-card p-4 md:relative md:border-t-0 md:bg-transparent md:p-0 md:mt-6">
              <div className="mx-auto flex w-full max-w-7xl items-center justify-end gap-3 px-4 md:px-6 lg:px-8">
                <Button
                  variant="outline"
                  type="button"
                  size="default"
                  className="hidden md:flex rounded-sm border-border/40"
                  asChild
                >
                  <Link href="/products">Cancelar</Link>
                </Button>
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
          <DrawerContent className="border-border/40 bg-card data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:max-w-xl">
            <div className="flex h-full flex-col">
              <DrawerHeader className="border-b border-border/40 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-border/40 bg-muted/30">
                      <Layers className="h-4 w-4 text-foreground/70" />
                    </div>
                    <div>
                      <DrawerTitle className="text-sm font-semibold uppercase tracking-wide">
                        Batches do Produto
                      </DrawerTitle>
                      <p className="text-[11px] text-muted-foreground">
                        Edite lotes vinculados a este item
                      </p>
                    </div>
                  </div>
                  <DrawerClose asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-sm"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </DrawerClose>
                </div>
              </DrawerHeader>

              <div className="flex-1 overflow-y-auto p-4">
                {batchesDrawerState.isLoading && (
                  <div className="flex items-center justify-center rounded-sm border border-border/40 bg-muted/30 p-6">
                    <Loader2 className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Carregando batches...
                    </span>
                  </div>
                )}

                {!batchesDrawerState.isLoading &&
                  batchesDrawerState.fields.length === 0 && (
                  <div className="rounded-sm border border-border/40 bg-muted/20 p-6 text-center">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Nenhum batch encontrado
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
                          className="rounded-sm border border-border/40 bg-background/40 px-3"
                        >
                          <AccordionTrigger className="py-3 hover:no-underline">
                            <div className="flex flex-1 flex-col gap-1 text-left">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                                  {batch.batchCode}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  Qtd {batch.quantity}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                <span>
                                  {batch.warehouseName}
                                  {batch.warehouseCode
                                    ? ` (${batch.warehouseCode})`
                                    : ""}
                                </span>
                                <span className="text-foreground/30">•</span>
                                <span>
                                  {batch.expirationDate
                                    ? `Val ${batch.expirationDate}`
                                    : "Sem validade"}
                                </span>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div
                              className="max-h-[70vh] overflow-y-auto pr-1"
                              data-testid="batch-accordion-scroll"
                            >
                              <div className="space-y-4 pb-2">
                              <div className="grid gap-3 rounded-sm border border-border/40 bg-muted/10 p-3 text-[11px] uppercase tracking-wide text-foreground/70">
                                <div className="flex items-center justify-between gap-3">
                                  <span>Produto</span>
                                  <span className="text-foreground/90">
                                    {batch.productId}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <span>Armazem</span>
                                  <span className="text-foreground/90">
                                    {batch.warehouseId}
                                  </span>
                                </div>
                              </div>

                              <div className="grid gap-4">
                                <div className="rounded-sm border border-border/40 bg-background/40 px-3 py-2">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-foreground/70">
                                    Codigo do Batch
                                  </p>
                                  <p className="text-xs text-foreground/90">
                                    {batch.batchCode?.trim() || "Sem codigo"}
                                  </p>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                  <FormField
                                    control={batchesDrawerState.form.control}
                                    name={`batches.${index}.quantity`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                                          Quantidade
                                        </FormLabel>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            className="h-9 rounded-sm border-border/40 bg-background/50 text-xs"
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
                                        <FormLabel className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                                          Validade
                                        </FormLabel>
                                        <FormControl>
                                          <Input
                                            type="date"
                                            className="h-9 rounded-sm border-border/40 bg-background/50 text-xs"
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
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                                          Custo Unitario
                                        </FormLabel>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            step="0.01"
                                            className="h-9 rounded-sm border-border/40 bg-background/50 text-xs"
                                            {...field}
                                            value={field.value ?? ""}
                                            onChange={(event) => {
                                              const value = event.target.value;
                                              field.onChange(
                                                value === ""
                                                  ? undefined
                                                  : Number(value)
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
                                    name={`batches.${index}.sellingPrice`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                                          Preco de Venda
                                        </FormLabel>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            step="0.01"
                                            className="h-9 rounded-sm border-border/40 bg-background/50 text-xs"
                                            {...field}
                                            value={field.value ?? ""}
                                            onChange={(event) => {
                                              const value = event.target.value;
                                              field.onChange(
                                                value === ""
                                                  ? undefined
                                                  : Number(value)
                                              );
                                            }}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                <FormField
                                  control={batchesDrawerState.form.control}
                                  name={`batches.${index}.notes`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                                        Observacoes
                                      </FormLabel>
                                      <FormControl>
                                        <Textarea
                                          className="min-h-[80px] resize-none rounded-sm border-border/40 bg-background/50 text-xs"
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
                                className="w-full rounded-sm bg-foreground text-background hover:bg-foreground/90 disabled:opacity-60"
                              >
                                {batchesDrawerState.updatingBatchId === batch.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-3.5 w-3.5" />
                                    Salvando...
                                  </>
                                ) : (
                                  "Salvar alteracoes"
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
