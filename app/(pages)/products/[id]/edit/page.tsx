// app/products/[id]/edit/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useProductEditModel } from "./products-edit.model";
import { ProductForm } from "../../components/product-form.view";
import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function ProductEditPage() {
  const params = useParams();
  const productId = params.id as string;

  const { isLoadingProduct, product, ...modelProps } =
    useProductEditModel(productId);

  if (isLoadingProduct) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-20 border-b border-border/40 bg-card">
          <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Link
                href="/products"
                className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-muted/50 hover:bg-muted"
              >
                <span className="sr-only">Voltar</span>
              </Link>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground mb-3" />
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Carregando produto...
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-20 border-b border-border/40 bg-card">
          <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Link
                href="/products"
                className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-muted/50 hover:bg-muted"
              >
                <span className="sr-only">Voltar</span>
              </Link>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Produto não encontrado
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return <ProductForm mode="edit" {...modelProps} />;
}
