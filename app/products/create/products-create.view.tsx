"use client";

import { CustomAttributesBuilder } from "@/components/product/custom-attributes-builder";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { IconBox } from "@/components/ui/icon-box";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import {
  ArrowLeft,
  Barcode,
  Camera,
  CheckCircle2,
  Layers,
  Loader2,
  Package,
  Ruler,
  Scale,
  Settings2,
  Tag,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { UseFormReturn } from "react-hook-form";
import { ProductCreateFormData } from "./products-create.schema";
import { Brand, Category, CustomAttribute } from "./products-create.types";

interface ProductCreateViewProps {
  form: UseFormReturn<ProductCreateFormData>;
  onSubmit: (data: ProductCreateFormData) => void;
  isSubmitting: boolean;
  categories: Category[];
  isLoadingCategories: boolean;
  brands: Brand[];
  isLoadingBrands: boolean;
  customAttributes: CustomAttribute[];
  addCustomAttribute: () => void;
  removeCustomAttribute: (index: number) => void;
  updateCustomAttribute: (
    index: number,
    field: "key" | "value",
    value: string
  ) => void;
  nameInputRef: React.RefObject<HTMLInputElement | null>;
  isScannerOpen: boolean;
  openScanner: () => void;
  closeScanner: () => void;
  handleBarcodeScanned: (barcode: string) => void;
}

export const ProductCreateView = ({
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
  isScannerOpen,
  openScanner,
  closeScanner,
  handleBarcodeScanned,
}: ProductCreateViewProps) => {
  const onScan = (detectedCodes: IDetectedBarcode[]) => {
    if (detectedCodes.length > 0) {
      handleBarcodeScanned(detectedCodes[0].rawValue);
    }
  };
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-10">
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
                NOVO PRODUTO
              </h1>
              <p className="text-xs text-muted-foreground hidden md:block mt-0.5">
                Cadastro de item no catálogo
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl py-6 px-4 md:px-6 lg:px-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* COLUNA ESQUERDA - Conteúdo Principal (2/3) */}
              <div className="space-y-6 lg:col-span-2">
                {/* Informações Básicas - Corporate Solid */}
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
                          Informações essenciais de exibição
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
              </div>

              {/* COLUNA DIREITA - Lateral (1/3) */}
              <div className="space-y-6">
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
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-10 rounded-sm border-border/40 bg-background/50">
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-sm">
                              {isLoadingCategories ? (
                                <div className="flex items-center justify-center p-2 text-xs text-muted-foreground">
                                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                  Carregando...
                                </div>
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
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-10 rounded-sm border-border/40 bg-background/50">
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-sm">
                              {isLoadingBrands ? (
                                <div className="flex items-center justify-center p-2 text-xs text-muted-foreground">
                                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                  Carregando...
                                </div>
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

                {/* Inventário - Corporate Solid */}
                <Card className="border border-border/50 bg-card/80 rounded-sm">
                  <CardHeader className="border-b border-border/30 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-foreground/5 border border-border/30">
                        <Barcode className="h-4 w-4 text-foreground/70" />
                      </div>
                      <CardTitle className="text-sm font-semibold uppercase tracking-wide">
                        Inventário
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <FormField
                      control={form.control}
                      name="barcode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                            Código de Barras
                          </FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input
                                placeholder="EAN / GTIN"
                                className="font-mono h-10 flex-1 rounded-sm border-border/40 bg-background/50 text-xs"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 shrink-0 rounded-sm border-border/40"
                                onClick={openScanner}
                              >
                                <Camera className="h-3.5 w-3.5" />
                                <span className="sr-only">
                                  Escanear código de barras
                                </span>
                              </Button>
                            </div>
                          </FormControl>
                          <FormDescription className="text-[11px] text-muted-foreground/70">
                            Opcional - deixe vazio se não houver
                          </FormDescription>
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
                  className="w-full md:w-auto md:min-w-[160px] rounded-sm bg-foreground text-background hover:bg-foreground/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                      Salvar Produto
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </main>

      {/* Scanner Dialog - Corporate Solid */}
      <Dialog open={isScannerOpen} onOpenChange={closeScanner}>
        <DialogContent className="sm:max-w-md rounded-sm border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
              <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-foreground/5 border border-border/30">
                <Camera className="h-3.5 w-3.5" />
              </div>
              Escanear Código de Barras
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground/70">
              Aponte a câmera para o código de barras do produto
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-square w-full overflow-hidden rounded-sm border border-border/30">
            {isScannerOpen && (
              <Scanner
                onScan={onScan}
                formats={[
                  "ean_13",
                  "ean_8",
                  "code_128",
                  "code_39",
                  "code_93",
                  "upc_a",
                  "upc_e",
                  "itf",
                  "codabar",
                ]}
                components={{
                  finder: true,
                }}
                styles={{
                  container: {
                    width: "100%",
                    height: "100%",
                  },
                  video: {
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  },
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
