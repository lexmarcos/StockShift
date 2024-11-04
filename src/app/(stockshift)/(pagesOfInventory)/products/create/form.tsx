"use client";
import { UseFormReturn } from "react-hook-form";

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
import { ReloadIcon } from "@radix-ui/react-icons";
import { Card } from "@/components/ui/card";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { MultipleCombobox } from "@/components/multipleCombobox/multipleCombobox";
import { ProductOptionalDefaults } from "../../../../../../prisma/generated/zod";
import InputCurrency from "@/components/InputCurrency/InputCurrency";
import Image from "next/image";
import { useEffect } from "react";
import { InputsNames } from "./types";

interface IFormCreateProductPage {
  form: UseFormReturn<ProductOptionalDefaults>;
  onSubmit?: (data: ProductOptionalDefaults) => Promise<void>;
  categoriesItemsCombobox:
    | {
        value: string;
        label: string;
      }[]
    | undefined;
  isLoading?: boolean;
  onImageChange?: (images: File[]) => void;
  inputsToShow?: InputsNames[];
  readonly?: boolean;
}

export default function ProductForm({
  form,
  onSubmit,
  categoriesItemsCombobox,
  isLoading,
  onImageChange,
  inputsToShow,
  readonly,
}: IFormCreateProductPage) {
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

  useEffect(() => {
    if (!onImageChange) return;
    onImageChange(acceptedFiles);
  }, [acceptedFiles, onImageChange]);

  const renderSelectedImageOrCaptions = () => {
    if (acceptedFiles.length === 0) {
      return (
        <p>
          Arraste e solte a imagem do produto aqui ou clique para selecionar a
          imagem
        </p>
      );
    }
    return (
      <Image
        src={URL.createObjectURL(acceptedFiles[0])}
        alt="Imagem do produto"
        className="object-cover"
        width="100"
        height="100"
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
        {isDragActive ? (
          <p>Solte a imagem aqui...</p>
        ) : (
          renderSelectedImageOrCaptions()
        )}
        {fileRejections.length > 0 && (
          <div className="mt-3">
            <span className="text-red-600">
              Somente 1 imagem por produto. tente novamente
            </span>
          </div>
        )}
      </Card>
    );
  };

  const doSubmit = () => {
    if (onSubmit) {
      return form.handleSubmit(onSubmit);
    }
    return undefined;
  };

  const hasInput = (name: InputsNames) => {
    return inputsToShow?.includes(name);
  };

  const inputsByName = {
    description: (
      <FormField
        control={form.control}
        name="description"
        render={({ field: { value, ...rest } }) => (
          <FormItem>
            <FormLabel>Descrição</FormLabel>
            <FormControl>
              <Input
                placeholder="Descrição do produto"
                value={value as string}
                {...rest}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    ),
    sku: (
      <FormField
        control={form.control}
        name="sku"
        render={({ field: { value, ...rest } }) => (
          <FormItem>
            <FormLabel>SKU (código de barras)</FormLabel>
            <FormControl>
              <Input
                placeholder="Código de referência do produto"
                value={value as string}
                {...rest}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    ),
    price: (
      <FormField
        control={form.control}
        name="price"
        render={({ field: { onChange, value } }) => (
          <FormItem>
            <FormLabel>Preço</FormLabel>
            <FormControl>
              <InputCurrency
                inputMode="decimal"
                value={value && value > 0 ? value : ""}
                onValueChange={({ floatValue }, _) => onChange(floatValue)}
                placeholder="Preço em reais"
                customInput={Input}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    ),
    quantity: (
      <FormField
        control={form.control}
        name="quantity"
        render={({ field: { onChange, value, ...rest } }) => (
          <FormItem>
            <FormLabel>Quantidade</FormLabel>
            <FormControl>
              <Input
                value={value && value > 0 ? value : ""}
                placeholder="Quantia dos produtos"
                {...rest}
                type="number"
                onChange={(e) => onChange(e.target.valueAsNumber)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    ),
    categories: (
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
                placeholder="Agrupe os produtos de mesma categoria"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    ),
    images: (
      <FormField
        control={form.control}
        name="imageUrl"
        render={() => (
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
    ),
  } as Record<InputsNames, JSX.Element>;

  const getInputByName = (name: InputsNames) => {
    if (!hasInput(name)) return null;
    return inputsByName[name];
  };

  const hasPriceAndQuantityInputs = hasInput("price") && hasInput("quantity");

  return (
    <div className={cn([readonly && "cursor-default pointer-events-none"])}>
      <Form {...form}>
        <form onSubmit={doSubmit()} className="space-y-3 w-full">
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
          {getInputByName("description")}
          <div
            className={cn([
              "grid gap-4",
              hasPriceAndQuantityInputs && "grid-cols-2",
            ])}
          >
            {getInputByName("price")}
            {getInputByName("quantity")}
          </div>
          {getInputByName("categories")}
          {getInputByName("sku")}
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
          {getInputByName("images")}
          <div className="w-full flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {!isLoading ? (
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
    </div>
  );
}
