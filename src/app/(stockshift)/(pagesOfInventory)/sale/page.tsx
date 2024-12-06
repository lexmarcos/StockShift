"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/services/api/api";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { useDebounce } from "use-debounce";
import { Search } from "lucide-react";
import { Command, CommandItem, CommandEmpty, CommandList } from "@/components/ui/command";
import { Product } from "@prisma/client";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { PopoverAnchor } from "@radix-ui/react-popover";

export default function SalesPage() {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  const handleAddProduct = (product: Product) => {
    setSelectedProducts((prev) => [...prev, product]);
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleDeeplink = () => {
    const deeplink =
      "infinitepaydash://infinitetap-app?amount=100&payment_method=credit&installments=1&order_id=3262&result_url=mypocapp%3A%2F%2Fexample%2Ftap_result&app_client_referrer=POCApp&af_force_deeplink=true";
    window.location.href = deeplink; // Redireciona o usuário para o deeplink
  };

  const total = selectedProducts.reduce((acc, product) => {
    return acc + (product.price != null ? product.price : 0);
  }, 0);

  const [searchProduct, setSearchProduct] = useState("");

  const [debouncedsearchProduct] = useDebounce(searchProduct, 500);

  const { data: filteredProducts } = useQuery({
    queryKey: ["get-products", debouncedsearchProduct],
    enabled: debouncedsearchProduct.length > 0,
    queryFn: () => api.products.getProductsByName(debouncedsearchProduct),
  });

  const formatoBRL = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const checkNumberNull = (number: number | null) => {
    if (number !== null) {
      return number;
    }
    return 0;
  };

  const [open, setOpen] = React.useState(false);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Venda de produtos</h1>
      <div className="mb-4">
        <form className="mb-12 relative w-full">
          <Popover open={open}>
            <PopoverAnchor className="w-full">
              <div>
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  onClick={() => setOpen(true)}
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  type="search"
                  placeholder="Procure por produtos..."
                  className="w-full appearance-none bg-background pl-8 shadow-none"
                />
              </div>
            </PopoverAnchor>
            <PopoverContent
              onPointerDownOutside={() => setOpen(false)}
              className="PopoverContent p-0"
              side="bottom"
              align="start"
              sideOffset={0}
              alignOffset={0}
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <Command className="w-full">
                <CommandList className="z-10 bg-card">
                  <CommandEmpty>Nenhum Produto encontrado</CommandEmpty>
                  {filteredProducts?.map((product) => (
                    <CommandItem key={product.id} className="p-0 z-10">
                      <div
                        className="w-full h-full p-3 flex items-end"
                        onClick={() => {
                          handleAddProduct(product);
                          setSearchProduct("");
                          setOpen(false);
                        }}
                      >
                        <img
                          src={product.imageUrl || ""}
                          alt="Imagem do produto"
                          className="w-16 h-16 object-cover rounded-sm"
                        />
                        <div className="flex flex-col h-16 justify-between ml-3">
                          <span>{product.name}</span>
                          <span>{product.quantity} unidades</span>
                          <span>{formatoBRL.format(checkNumberNull(product.price))}/unidade</span>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </form>
      </div>
      <Table className="mb-4">
        <TableHeader>
          <TableRow className="z-0">
            <TableHead>Product</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {selectedProducts.map((product) => (
            <TableRow key={product.id}>
              <TableCell>{product.name}</TableCell>
              <TableCell>{formatoBRL.format(checkNumberNull(product.price))}</TableCell>
              <TableCell>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveProduct(product.id)}
                >
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="text-right mb-4">
        <h2 className="text-xl font-bold">Total: {formatoBRL.format(checkNumberNull(total))}</h2>
      </div>

      <Button className="w-full" onClick={handleDeeplink}>
        Realizar venda
      </Button>
    </div>
  );
}
