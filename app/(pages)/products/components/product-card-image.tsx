"use client";

import { Package } from "lucide-react";
import { RemoteImage } from "@/components/ui/remote-image";
import type { Product } from "../products.types";
import { useProductImageUrl } from "../products.model";

// Leaf ViewModel: resolves its own thumbnail via the SWR-backed hook so the
// pure products view stays free of hooks/data fetching. The warehouse list
// omits imageUrl, so the image is fetched per product and cached/invalidated
// by SWR (see useProductImageUrl).
export const ProductCardImage = ({ product }: { product: Product }) => {
  const imageUrl = useProductImageUrl(product);
  if (imageUrl) {
    return (
      <span className="relative block w-10 h-15 shrink-0 overflow-hidden rounded-[4px] border border-neutral-800 bg-neutral-900">
        <RemoteImage
          src={imageUrl}
          alt={`Foto de ${product.name}`}
          fill
          sizes="120px"
          className="object-cover"
        />
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label="Produto sem foto"
      className="flex size-10 shrink-0 items-center justify-center rounded-[4px] border border-neutral-800 bg-neutral-900 text-neutral-600"
    >
      <Package className="size-4" strokeWidth={2} />
    </span>
  );
};
