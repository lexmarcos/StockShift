import { UseFormReturn } from "react-hook-form";
import { ProductCreateFormData } from "./products-create.schema";
import { Category, CustomAttribute } from "./products-create.types";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  Package,
  Barcode,
  Tag,
  Save,
  ArrowLeft,
  Layers,
  Scale,
  Ruler,
  Info,
  CheckCircle2,
  Zap
} from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { CustomAttributesBuilder } from "@/components/product/custom-attributes-builder";

interface ProductCreateViewProps {
  form: UseFormReturn<ProductCreateFormData>;
  onSubmit: (data: ProductCreateFormData) => void;
  isSubmitting: boolean;
  categories: Category[];
  isLoadingCategories: boolean;
  customAttributes: CustomAttribute[];
  addCustomAttribute: () => void;
  removeCustomAttribute: (index: number) => void;
  updateCustomAttribute: (index: number, field: "key" | "value", value: string) => void;
  nameInputRef: React.RefObject<HTMLInputElement | null>;
}

export const ProductCreateView = ({
  form,
  onSubmit,
  isSubmitting,
  categories,
  isLoadingCategories,
  customAttributes,
  addCustomAttribute,
  removeCustomAttribute,
  updateCustomAttribute,
  nameInputRef,
}: ProductCreateViewProps) => {
  return (
    <div className="min-h-screen bg-muted/40 pb-24 md:pb-10">
      {/* Header Sticky */}
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6 md:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/products"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Voltar</span>
            </Link>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Novo Produto</h1>
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

      <main className="container max-w-5xl py-8 px-4 sm:px-6 md:px-8 lg:px-12">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              
              {/* COLUNA ESQUERDA - Conteúdo Principal (2/3) */}
              <div className="space-y-8 lg:col-span-2">
                
                {/* Informações Básicas */}
                <Card className="border-border shadow-sm hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 bg-gradient-to-br from-card via-card to-card/95 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold">Detalhes do Produto</CardTitle>
                        <CardDescription>Informações essenciais de exibição.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <Separator className="mb-6 mx-6 w-auto" />
                  <CardContent className="grid gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Produto <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Smartphone Galaxy S24 Ultra"
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
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600 dark:from-purple-900/30 dark:to-purple-800/20 dark:text-purple-400">
                        <Layers className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold">Atributos do Produto</CardTitle>
                        <CardDescription>Dimensões, peso e características customizadas.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <Separator className="mb-6 mx-6 w-auto" />
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
                        <h4 className="text-sm font-medium mb-1">Atributos Adicionais</h4>
                        <p className="text-xs text-muted-foreground">
                          Adicione características específicas (cor, tamanho, material, etc.)
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
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Estado e Configuração
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <FormField
                      control={form.control}
                      name="active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-card">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-medium">
                              {field.value ? "Produto Ativo" : "Produto Inativo"}
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
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                            <FormLabel className="text-sm font-normal cursor-pointer flex-1">Controlar Validade</FormLabel>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                            <FormLabel className="text-sm font-normal cursor-pointer flex-1">É um Kit (Combo)</FormLabel>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                        <Tag className="h-4 w-4 text-orange-500" />
                        <CardTitle className="text-base font-semibold">Organização</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
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
                                  <SelectItem key={category.id} value={category.id}>
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
                  </CardContent>
                </Card>

                {/* Inventário */}
                <Card className="border-border shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                  <CardHeader>
                     <div className="flex items-center gap-2">
                        <Barcode className="h-4 w-4 text-slate-500" />
                        <CardTitle className="text-base font-semibold">Inventário</CardTitle>
                     </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel>SKU</FormLabel>
                            <span className="text-[10px] uppercase text-muted-foreground font-mono bg-muted px-1 rounded">Único</span>
                          </div>
                          <FormControl>
                            <div className="relative">
                                <Input placeholder="PROD-001" className="font-mono h-10 pl-8" {...field} />
                                <Info className="h-4 w-4 absolute left-2.5 top-3 text-muted-foreground/50" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="barcode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código de Barras</FormLabel>
                          <FormControl>
                            <Input placeholder="EAN / GTIN" className="font-mono h-10" {...field} />
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
              <div className="container flex max-w-5xl items-center justify-end gap-4 px-4 sm:px-6 md:px-8 lg:px-12">
                <Button variant="outline" type="button" className="hidden md:flex" asChild>
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
    </div>
  );
};