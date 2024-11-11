"use client";
import { useForm } from "react-hook-form";

import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/services/api/api";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { convertImageToBase64 } from "@/utils/image";
import ProductForm from "./form";
import { useState } from "react";
import { Product } from "@prisma/client";

export default function InputForm() {
  const { toast } = useToast();

  const form = useForm<Product>({
    //todo adicionar resolver zod
    defaultValues: {
      name: "",
      description: "" as string,
      price: 0,
      quantity: 0,
      categoryIDs: [],
      // attributes: [],
      imageUrl: "",
      sku: "",
    },
  });

  const createProductMutation = useMutation({
    mutationFn: (data: Product) =>
      api.products.createProduct(data),
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

  const [productImages, setProductImages] = useState<File[]>();

  const { isLoading, data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: api.categories.getAll,
  });

  const categoriesItemsCombobox = categoriesData?.map((item) => ({
    value: item.id,
    label: item.name,
  }));

  const convertPrice = (data: Product) => {
    return (data.price ?? 0) / 100;
  };

  const doConvertImage = async (file: File) => {
    if (!file || !productImages) return "";
    return await convertImageToBase64(productImages[0]);
  };

  async function onSubmit(data: Product) {
    if (!productImages) return;
    data.price = convertPrice(data);
    data.quantity = Number(data.quantity);
    data.imageUrl = await doConvertImage(productImages[0]);
    createProductMutation.mutate(data);
  }

  return (
    <div className="flex flex-1 flex-col">
      <Card className="md:w-8/12 md:p-8 p-4">
        <h1 className="text-2xl mb-4 font-bold">Criar Produto</h1>
        <ProductForm
          form={form}
          onSubmit={onSubmit}
          categoriesItemsCombobox={categoriesItemsCombobox}
          isLoading={createProductMutation.isPending}
          onImageChange={(images) => setProductImages(images)}
          inputsToShow={[
            "name",
            "description",
            "price",
            "quantity",
            "categories",
            "images",
            "sku",
            "attributes",
          ]}
        />
      </Card>
    </div>
  );
}
