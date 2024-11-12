import { Search } from "lucide-react";
import { Input } from "../ui/input";
import { useDebounce } from "use-debounce";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api/api";
import { Command, CommandItem, CommandEmpty, CommandList } from "../ui/command";

export default function SearchProductsBar({}) {
  const [productName, setProductName] = useState("");

  const [debouncedProductName] = useDebounce(productName, 500);

  const { data: products } = useQuery({
    queryKey: ["get-products", debouncedProductName],
    enabled: debouncedProductName.length > 0,
    queryFn: () => api.products.getProductsByName(debouncedProductName),
  });

  return (
    <form>
      <div className="relative md:w-2/3 lg:w-1/3">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          type="search"
          placeholder="Procure por produtos..."
          className="w-full appearance-none bg-background pl-8 shadow-none"
        />
        {products && (
          <div className="w-full absolute">
            <Command>
              <CommandList>
                <CommandEmpty>Nenhum Produto encontrado</CommandEmpty>
                {products?.map((product) => (
                  <CommandItem key={product.id}>{product.name}</CommandItem>
                ))}
              </CommandList>
            </Command>
          </div>
        )}
      </div>
    </form>
  );
}
