import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/services/api/api";
import {
  Barcode,
  Boxes,
  CalendarClock,
  DollarSign,
  Minus,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface IDrawerCategoriesProps {
  isOpen: boolean;
  onClose: () => void;
  sku: string;
}

export function DrawerOfProduct({
  isOpen,
  onClose,
  sku,
}: IDrawerCategoriesProps) {
  const [quantity, setQuantity] = useState(1);

  const createCategoryMutation = useMutation({
    mutationFn: (data: any) => api.products.updateProduct(data),
    onSuccess: () => {
      onClose();
    },
  });

  const { data: product } = useQuery({
    queryKey: ["get-products-by-sku"],
    queryFn: () => api.products.getProductBySKU(sku),
    enabled: sku.length > 0,
  });

  const getNewQuantityOfProduct = () => {
    if (product && product.quantity) {
      return product.quantity + quantity;
    }
  };

  function onSubmit() {
    createCategoryMutation.mutate({
      ...product,
      quantity: getNewQuantityOfProduct(),
    });
  }

  const decreaseQuantity = () => {
    setQuantity((prev) => {
      if (prev === 1) return prev;
      return prev - 1;
    });
  };

  return (
    <Drawer open={isOpen} onClose={onClose} shouldScaleBackground>
      <DrawerContent>
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader>
            <DrawerTitle>{product?.name}</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 flex">
            <img
              className="w-36 rounded-md"
              src={product?.imageUrl || ""}
              alt="Imagem do produto"
              width={180}
            />
            <div className="ml-3 flex flex-col gap-3 justify-center">
              <div className="flex gap-2">
                <Boxes /> <span>{product?.quantity}</span>
              </div>
              <div className="flex gap-2">
                <DollarSign /> <span>{product?.price}</span>
              </div>
              <div className="flex gap-2">
                <Barcode /> <span>{product?.sku}</span>
              </div>
              <div className="flex gap-2">
                <CalendarClock />{" "}
                <span>
                  {product && new Date(product?.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
        <DrawerFooter className="flex items-center w-full">
          <div className="flex justify-center gap-1">
            <Button
              variant="ghost"
              disabled={quantity === 1}
              onClick={() => decreaseQuantity()}
            >
              <Minus />
            </Button>
            <Input
              className="w-2/6 text-center"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
            />
            <Button
              variant="ghost"
              onClick={() => setQuantity((prev) => prev + 1)}
            >
              <Plus />
            </Button>
          </div>
        </DrawerFooter>
        <Button
          className="w-full rounded-none"
          size="lg"
          onClick={() => onSubmit()}
          autoFocus
        >
          Adicionar ao estoque
        </Button>
      </DrawerContent>
    </Drawer>
  );
}
