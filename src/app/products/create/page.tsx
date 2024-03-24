"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/app/services/api/api";
import { useToast } from "@/components/ui/use-toast";
import { ReloadIcon } from "@radix-ui/react-icons";
import { Card } from "@/components/ui/card";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { convertImageToBase64 } from "@/utils/image";
import { MultipleCombobox } from "@/components/multipleCombobox/multipleCombobox";
import {
  ProductOptionalDefaults,
  ProductOptionalDefaultsSchema,
} from "../../../../prisma/generated/zod";

export default function InputForm() {
  const { toast } = useToast();

  const getUserIdInLocalStorage = () => {
    if (typeof window === "undefined") return "";
    const user = localStorage.getItem("user");
    if (user) {
      const userParsed = JSON.parse(user);
      return userParsed.id;
    }
    return "";
  };

  const form = useForm<ProductOptionalDefaults>({
    resolver: zodResolver(ProductOptionalDefaultsSchema),
    defaultValues: {
      name: "",
      description: "" as string,
      price: 0,
      quantity: 0,
      categoryIDs: [],
      attributes: [],
      imageUrl: "",
      userId: getUserIdInLocalStorage(),
    },
  });

  const createProductMutation = useMutation({
    mutationFn: (data: ProductOptionalDefaults) => api.products.createProduct(data),
    onSuccess: () => {
      toast({
        color: "green",
        title: "Produto criado com sucesso",
        description: "Você pode vê-lo na lista de produtos",
      });
    },
    onError: () => {
      // toast.error("Erro ao criar produto");
    },
  });

  const { isLoading, data } = useQuery({
    queryKey: ["categories"],
    queryFn: api.categories.getAll,
  });

  const categoriesItemsCombobox = data?.map((item) => ({
    value: item.id,
    label: item.name,
  }));

  async function onSubmit(data: ProductOptionalDefaults) {
    data.price = Number(data.price);
    data.quantity = Number(data.quantity);
    data.imageUrl = await convertImageToBase64(acceptedFiles[0]);
    createProductMutation.mutate(data);
  }

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    acceptedFiles,
    isFileDialogActive,
    fileRejections,
  } = useDropzone({
    maxFiles: 1,
    accept: {
      "image/jpeg": [".jpeg", ".png"],
    },
  });

  const renderSelectedImageOrCaptions = () => {
    if (acceptedFiles.length === 0) {
      return <p>Arraste e solte a imagem do produto aqui ou clique para selecionar a imagem</p>;
    }
    return (
      <img
        src={URL.createObjectURL(acceptedFiles[0])}
        alt="Imagem do produto"
        className="object-cover"
        width="100"
      />
    );
  };

  const renderDragAndDropImage = () => {
    return (
      <Card
        className={cn([
          "p-6 transition duration-300 cursor-pointer",
          isDragActive ? "border-green-600 border-2" : null,
          isFileDialogActive ? "border-white border-2" : null,
        ])}
      >
        {isDragActive ? <p>Solte a imagem aqui...</p> : renderSelectedImageOrCaptions()}
        {fileRejections.length > 0 && (
          <div className="mt-3">
            <span className="text-red-600">Somente 1 imagem por produto. tente novamente</span>
          </div>
        )}
      </Card>
    );
  };

  console.log(form.formState.errors);

  return (
    <div className="flex items-center justify-center h-screen">
      <Card className="w-6/12 p-8">
        <h1 className="text-2xl mb-4 font-bold">Criar Produto</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 w-full">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do produto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field: { value, ...rest } }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Descrição do produto" value={value as string} {...rest} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field: { onChange, ...rest } }) => (
                <FormItem>
                  <FormLabel>Preço</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Preço do produto"
                      type="number"
                      {...rest}
                      value={rest.value?.toString() || ""}
                      onChange={(e) => onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                  <FormLabel>Quantidade</FormLabel>
                  <FormControl>
                    <Input
                      value={value?.toString() || ""}
                      placeholder="Quantos produtos você tem?"
                      {...rest}
                      type="number"
                      onChange={(e) => onChange(e.target.valueAsNumber || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryIDs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categorias</FormLabel>
                  <FormControl>
                    <MultipleCombobox
                      value={field.value as string[]}
                      onChange={field.onChange}
                      items={categoriesItemsCombobox || []}
                      placeholder={"Frameworks"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* <FormField
              control={form.control}
              name="attributes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Atributos</FormLabel>
                  <FormControl>
                    <Input placeholder="Atributos do seu produto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            /> */}
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field: { value, ...rest } }) => (
                <FormItem>
                  <FormLabel>Imagem</FormLabel>
                  <FormControl>
                    <div {...getRootProps()}>
                      <input {...getInputProps()} />
                      {renderDragAndDropImage()}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="w-full flex justify-end">
              <Button type="submit" disabled={createProductMutation.isPending}>
                {!createProductMutation.isPending ? (
                  "Criar produto"
                ) : (
                  <>
                    <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                    <span>Criando produto...</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}
