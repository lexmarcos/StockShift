"use client";
import { useState } from "react";
import ItemCards from "@/app/(stockshift)/(pagesOfInventory)/templates/create/itemCard";
import {
  Barcode,
  Boxes,
  DollarSign,
  ImageIcon,
  Layers3,
  List,
  Notebook,
} from "lucide-react";
import ProductForm from "../../products/create/form";
import { useForm } from "react-hook-form";
import {
  ProductOptionalDefaults,
  ProductOptionalDefaultsSchema,
} from "../../../../../../prisma/generated/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/services/api/api";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { InputsNames } from "../../products/create/types";

export default function CreateTemplate() {
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
      inventoryId: "",
      sku: "",
    },
  });

  const { isLoading, data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: api.categories.getAll,
  });

  const categoriesItemsCombobox = categoriesData?.map((item) => ({
    value: item.id,
    label: item.name,
  }));

  const [commonAttributes, setCommonAttributes] = useState<InputsNames[]>([]);

  const selectItem = (value: InputsNames) => {
    setCommonAttributes((prevState) => {
      if (prevState.includes(value)) {
        return prevState.filter((item) => item !== value);
      }
      return [...prevState, value];
    });
  };

  const checkIfItemIsSelected = (value: InputsNames) => {
    return commonAttributes.includes(value);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-5">
        <ItemCards
          checkIsSelected={checkIfItemIsSelected}
          selectItem={selectItem}
          icon={<Notebook />}
          title="Descrição"
          value="description"
          description="Uma boa descrição ajuda a diferenciar o produto"
        />
        <ItemCards
          checkIsSelected={checkIfItemIsSelected}
          selectItem={selectItem}
          icon={<DollarSign />}
          title="Preço"
          value="price"
          description="O Valor que o produto tem"
        />
        <ItemCards
          checkIsSelected={checkIfItemIsSelected}
          selectItem={selectItem}
          icon={<Boxes />}
          title="Quantidade"
          value="quantity"
          description="Identifica quantos desse produto o estoque tem"
        />
        <ItemCards
          checkIsSelected={checkIfItemIsSelected}
          selectItem={selectItem}
          icon={<ImageIcon />}
          title="Imagem"
          value="images"
          description="Melhora a visualização do produto"
        />
        <ItemCards
          checkIsSelected={checkIfItemIsSelected}
          selectItem={selectItem}
          icon={<Barcode />}
          title="SKU"
          value="sku"
          description="O código da referência do seu produto"
        />
        <ItemCards
          checkIsSelected={checkIfItemIsSelected}
          selectItem={selectItem}
          icon={<List />}
          title="Atributos"
          value="attributes"
          description="São excelentes para diferenciar o produto"
        />
        <ItemCards
          checkIsSelected={checkIfItemIsSelected}
          selectItem={selectItem}
          icon={<Layers3 />}
          title="Categorias"
          value="categories"
          description="Ajudam a agrupar os produtos por tipos"
        />
      </div>
      <Card className="p-6 lg:px-12 lg:pt-12 col-span-2">
        <h1 className="text-2xl font-bold mb-5">Pré visualização</h1>
        <ProductForm
          readonly
          form={form}
          categoriesItemsCombobox={categoriesItemsCombobox}
          inputsToShow={commonAttributes}
        />
      </Card>
    </div>
  );
}
