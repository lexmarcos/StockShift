"use client";
import { useState } from "react";
import ItemCards from "@/app/(stockshift)/(pagesOfInventory)/templates/create/itemCard";
import {
  Barcode,
  Boxes,
  ImageIcon,
  Layers3,
  List,
  Notebook,
} from "lucide-react";

export default function CreateTemplate() {
  const [commonAttributes, setCommonAttributes] = useState<string[]>([]);

  const selectItem = (value: string) => {
    setCommonAttributes((prevState) => {
      if (prevState.includes(value)) {
        return prevState.filter((item) => item !== value);
      }
      return [...prevState, value];
    });
  };

  const checkIfItemIsSelected = (value: string) => {
    return commonAttributes.includes(value);
  };

  return (
    <div className="grid grid-cols-3 gap-3">
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
          value="image"
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
    </div>
  );
}
