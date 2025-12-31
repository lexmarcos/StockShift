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
    <div className="min-h-screen bg-muted/40 pb-24 md:pb-10">
      {/* Header Sticky */}
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/products"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Voltar</span>
            </Link>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                Novo Produto
              </h1>
              <p className="text-sm text-muted-foreground hidden md:block">
                Preencha os detalhes para cadastrar um item no catálogo.
              </p>
            </div>
          </div>

          {/* Desktop Save Button (Optional placement) */}
          <div className="hidden md:block">
            {/* Pode colocar ações extras aqui se desejar */}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl py-8 px-4 md:px-6 lg:px-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* COLUNA ESQUERDA - Conteúdo Principal (2/3) */}
              <div className="space-y-8 lg:col-span-2">
                {/* Informações Básicas */}
                <Card className="border-border shadow-sm hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 bg-gradient-to-br from-card via-card to-card/95 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <IconBox icon={Package} colorScheme="blue" />
                      <div>
                        <CardTitle className="text-base font-semibold">
                          Detalhes do Produto
                        </CardTitle>
                        <CardDescription>
                          Informações essenciais de exibição.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <Separator className="w-auto" />
                  <CardContent className="grid gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Nome do Produto{" "}
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Malbec"
                              className="h-11"
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
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descreva as principais características do produto..."
                              className="min-h-[120px] resize-y"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Uma boa descrição ajuda na identificação e SEO.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Atributos do Produto */}
                <Card className="border-border shadow-sm hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <IconBox icon={Layers} colorScheme="purple" />
                      <div>
                        <CardTitle className="text-base font-semibold">
                          Atributos do Produto
                        </CardTitle>
                        <CardDescription>
                          Dimensões, peso e características customizadas.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <Separator className="w-auto" />
                  <CardContent className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="attributes.weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Scale className="h-3.5 w-3.5" /> Peso
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: 1.5kg" {...field} />
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
                            <FormLabel className="flex items-center gap-2">
                              <Ruler className="h-3.5 w-3.5" /> Dimensões
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: 10x20x5cm" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Atributos Adicionais */}
                    <div className="space-y-4">
                      <Separator />
                      <div>
                        <h4 className="text-sm font-medium mb-1">
                          Atributos Adicionais
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Adicione características específicas (cor, tamanho,
                          material, etc.)
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
              <div className="space-y-8">
                {/* Status e Configurações */}
                <Card className="border-border shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <IconBox icon={Settings2} colorScheme="lime" />
                      <div>
                        <CardTitle className="text-base font-semibold">
                          Estado e configuração
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <FormField
                      control={form.control}
                      name="active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-card">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-medium">
                              {field.value
                                ? "Produto Ativo"
                                : "Produto Inativo"}
                            </FormLabel>
                            <FormDescription className="text-xs">
                              Visibilidade no sistema.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-green-600"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="continuousMode"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-card">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-medium flex items-center gap-2">
                              <Zap className="h-3.5 w-3.5 text-amber-500" />
                              Cadastro Contínuo
                            </FormLabel>
                            <FormDescription className="text-xs">
                              Adicionar vários produtos seguidos
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

                    <div className="rounded-lg border p-3 shadow-sm bg-muted/20 space-y-3">
                      <FormField
                        control={form.control}
                        name="hasExpiration"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between">
                            <FormLabel className="text-sm font-normal cursor-pointer flex-1">
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
                      <Separator />
                      <FormField
                        control={form.control}
                        name="isKit"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between">
                            <FormLabel className="text-sm font-normal cursor-pointer flex-1">
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

                {/* Organização */}
                <Card className="border-border shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <IconBox icon={Tag} colorScheme="orange" />
                      <CardTitle className="text-base font-semibold">
                        Organização
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isLoadingCategories ? (
                                <div className="flex items-center justify-center p-2 text-sm text-muted-foreground">
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Carregando...
                                </div>
                              ) : (
                                categories.map((category) => (
                                  <SelectItem
                                    key={category.id}
                                    value={category.id}
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
                          <FormLabel>Marca</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isLoadingBrands ? (
                                <div className="flex items-center justify-center p-2 text-sm text-muted-foreground">
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Carregando...
                                </div>
                              ) : (
                                brands.map((brand) => (
                                  <SelectItem
                                    key={brand.id}
                                    value={brand.id}
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

                {/* Inventário */}
                <Card className="border-border shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <IconBox icon={Barcode} colorScheme="slate" />
                      <CardTitle className="text-base font-semibold">
                        Inventário
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="barcode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código de Barras</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input
                                placeholder="EAN / GTIN"
                                className="font-mono h-10 flex-1"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 shrink-0"
                                onClick={openScanner}
                              >
                                <Camera className="h-4 w-4" />
                                <span className="sr-only">
                                  Escanear código de barras
                                </span>
                              </Button>
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs">
                            Deixe vazio se não houver código de barras
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Floating Action Bar - Mobile Fixed / Desktop Inline or Fixed */}
            <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:relative md:border-t-0 md:bg-transparent md:p-0 md:mt-8">
              <div className="mx-auto flex w-full max-w-5xl items-center justify-end gap-4 px-4 md:px-6 lg:px-8">
                <Button
                  variant="outline"
                  type="button"
                  size="lg"
                  className="hidden md:flex"
                  asChild
                >
                  <Link href="/products">Cancelar</Link>
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full md:w-auto md:min-w-[150px] shadow-lg shadow-primary/20"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Salvar Produto
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </main>

      {/* Scanner Dialog */}
      <Dialog open={isScannerOpen} onOpenChange={closeScanner}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Escanear Código de Barras
            </DialogTitle>
            <DialogDescription>
              Aponte a câmera para o código de barras do produto.
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-square w-full overflow-hidden rounded-lg">
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
