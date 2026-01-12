# Global Breadcrumb Navigation System Implementation Plan

> **For Copilot:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Implement a global breadcrumb navigation system using Context API that appears automatically on detail pages (depth 2+) with back button, navigation path, and entity title.

**Architecture:** Three-layer architecture with BreadcrumbContext managing global state, useBreadcrumb hook providing interface for pages, and Breadcrumb component rendering the UI. Pages register breadcrumb data via hook in their model layer, and the component reads from context to render.

**Tech Stack:** React Context API, Next.js 15 App Router, TypeScript, Tailwind CSS, lucide-react icons

**Design Reference:** `docs/plans/2026-01-11-global-breadcrumb-design.md`

---

## Task 1: Create TypeScript Types

**Files:**
- Create: `components/breadcrumb/breadcrumb.types.ts`

**Step 1: Create types file with interfaces**

```typescript
export interface BreadcrumbData {
  title: string;
  backUrl: string;
  section?: string;
  subsection?: string;
}

export interface BreadcrumbContextValue {
  breadcrumb: BreadcrumbData | null;
  setBreadcrumb: (data: BreadcrumbData) => void;
  clearBreadcrumb: () => void;
}

export interface UseBreadcrumbParams {
  title: string;
  backUrl: string;
  section?: string;
  subsection?: string;
}
```

**Step 2: Commit types**

```bash
git add components/breadcrumb/breadcrumb.types.ts
git commit -m "feat: add breadcrumb TypeScript types and interfaces"
```

---

## Task 2: Create BreadcrumbContext

**Files:**
- Create: `components/breadcrumb/breadcrumb-context.tsx`
- Reference: `components/breadcrumb/breadcrumb.types.ts`

**Step 1: Create context file with route sections map**

```typescript
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BreadcrumbData, BreadcrumbContextValue } from "./breadcrumb.types";

const ROUTE_SECTIONS: Record<string, { section: string; subsection: string }> = {
  products: { section: "Inventário", subsection: "Detalhes" },
  batches: { section: "Inventário", subsection: "Lote" },
  "stock-movements": { section: "Movimentação", subsection: "Detalhes" },
  warehouses: { section: "Armazéns", subsection: "Detalhes" },
  categories: { section: "Configurações", subsection: "Categoria" },
  brands: { section: "Configurações", subsection: "Marca" },
};

const BreadcrumbContext = createContext<BreadcrumbContextValue | undefined>(
  undefined
);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [breadcrumb, setBreadcrumbState] = useState<BreadcrumbData | null>(null);
  const pathname = usePathname();

  // Auto-clear breadcrumb on shallow routes (depth <= 1)
  useEffect(() => {
    const pathSegments = pathname.split("/").filter(Boolean);
    const depth = pathSegments.length;

    if (depth <= 1) {
      setBreadcrumbState(null);
    }
  }, [pathname]);

  const setBreadcrumb = (data: BreadcrumbData) => {
    // Infer section/subsection if not provided
    const pathSegments = pathname.split("/").filter(Boolean);
    const firstSegment = pathSegments[0];
    const routeInfo = ROUTE_SECTIONS[firstSegment];

    const finalData: BreadcrumbData = {
      ...data,
      section: data.section || routeInfo?.section || "Navegação",
      subsection: data.subsection || routeInfo?.subsection || "Detalhes",
    };

    setBreadcrumbState(finalData);
  };

  const clearBreadcrumb = () => {
    setBreadcrumbState(null);
  };

  return (
    <BreadcrumbContext.Provider
      value={{ breadcrumb, setBreadcrumb, clearBreadcrumb }}
    >
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbContext() {
  const context = useContext(BreadcrumbContext);
  if (context === undefined) {
    throw new Error(
      "useBreadcrumbContext must be used within a BreadcrumbProvider"
    );
  }
  return context;
}
```

**Step 2: Commit context**

```bash
git add components/breadcrumb/breadcrumb-context.tsx
git commit -m "feat: add BreadcrumbContext with auto-clear and section inference"
```

---

## Task 3: Create useBreadcrumb Hook

**Files:**
- Create: `components/breadcrumb/use-breadcrumb.ts`
- Reference: `components/breadcrumb/breadcrumb-context.tsx`
- Reference: `components/breadcrumb/breadcrumb.types.ts`

**Step 1: Create hook file**

```typescript
"use client";

import { useEffect } from "react";
import { useBreadcrumbContext } from "./breadcrumb-context";
import { UseBreadcrumbParams } from "./breadcrumb.types";

export function useBreadcrumb(params: UseBreadcrumbParams): void {
  const { setBreadcrumb, clearBreadcrumb } = useBreadcrumbContext();
  const { title, backUrl, section, subsection } = params;

  useEffect(() => {
    setBreadcrumb({
      title,
      backUrl,
      section,
      subsection,
    });

    return () => {
      clearBreadcrumb();
    };
  }, [title, backUrl, section, subsection, setBreadcrumb, clearBreadcrumb]);
}
```

**Step 2: Commit hook**

```bash
git add components/breadcrumb/use-breadcrumb.ts
git commit -m "feat: add useBreadcrumb hook with reactive updates and cleanup"
```

---

## Task 4: Create Breadcrumb Visual Component

**Files:**
- Create: `components/breadcrumb/breadcrumb.tsx`
- Reference: `components/breadcrumb/breadcrumb-context.tsx`

**Step 1: Create breadcrumb component**

```typescript
"use client";

import { useBreadcrumbContext } from "./breadcrumb-context";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Breadcrumb() {
  const { breadcrumb } = useBreadcrumbContext();

  if (!breadcrumb) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="sticky top-0 z-30 border-b border-neutral-800 bg-[#0A0A0A]/95 backdrop-blur-sm md:ml-[240px]"
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href={breadcrumb.backUrl} aria-label="Voltar para lista">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-[4px] border border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                {breadcrumb.section}
              </span>
              <span className="text-[10px] text-neutral-700">/</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">
                {breadcrumb.subsection}
              </span>
            </div>
            <h1 className="mt-0.5 text-sm font-bold uppercase tracking-wide text-white">
              {breadcrumb.title}
            </h1>
          </div>
        </div>
      </div>
    </nav>
  );
}
```

**Step 2: Commit component**

```bash
git add components/breadcrumb/breadcrumb.tsx
git commit -m "feat: add Breadcrumb visual component with sticky header and responsive design"
```

---

## Task 5: Create Barrel Export

**Files:**
- Create: `components/breadcrumb/index.ts`

**Step 1: Create index file**

```typescript
export { Breadcrumb } from "./breadcrumb";
export { BreadcrumbProvider } from "./breadcrumb-context";
export { useBreadcrumb } from "./use-breadcrumb";
export type {
  BreadcrumbData,
  BreadcrumbContextValue,
  UseBreadcrumbParams,
} from "./breadcrumb.types";
```

**Step 2: Commit barrel export**

```bash
git add components/breadcrumb/index.ts
git commit -m "feat: add breadcrumb barrel export for clean imports"
```

---

## Task 6: Integrate into Layout

**Files:**
- Modify: `app/(pages)/layout.tsx`

**Step 1: Read current layout**

```bash
cat app/(pages)/layout.tsx
```

Expected: Layout with Header component and children

**Step 2: Add imports and wrap with provider**

Modify `app/(pages)/layout.tsx`:

```typescript
"use client";

import { X } from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { useMobileMenu } from "@/components/layout/mobile-menu-context";
import { Header } from "@/components/header/header";
import { BreadcrumbProvider, Breadcrumb } from "@/components/breadcrumb";

export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen, closeMenu } = useMobileMenu();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden w-60 flex-col border-r border-border/40 bg-card/80 p-4 md:flex fixed">
          <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
            Navegação
          </div>
          <AppSidebar />
        </aside>

        <BreadcrumbProvider>
          <div className="flex min-w-0 flex-1 flex-col md:ml-[var(--sidebar-width)]">
            <Header />
            <Breadcrumb />
            {children}
          </div>
        </BreadcrumbProvider>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={closeMenu} />
          <div className="absolute inset-y-0 left-0 w-64 border-r border-border/40 bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
                Navegação
              </span>
              <button
                type="button"
                onClick={closeMenu}
                className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-border/60 bg-foreground/5 text-foreground"
                aria-label="Fechar menu"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <AppSidebar onNavigate={closeMenu} />
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 3: Test layout renders**

Run: `pnpm dev`
Expected: App starts without errors, layout renders normally

**Step 4: Commit layout integration**

```bash
git add app/(pages)/layout.tsx
git commit -m "feat: integrate BreadcrumbProvider and Breadcrumb component into pages layout"
```

---

## Task 7: Migrate Products Detail Page

**Files:**
- Modify: `app/(pages)/products/[id]/products-detail.model.ts`
- Modify: `app/(pages)/products/[id]/products-detail.view.tsx`

**Step 1: Read current model**

```bash
cat app/(pages)/products/\[id\]/products-detail.model.ts
```

**Step 2: Add useBreadcrumb to model**

Add import at top of `app/(pages)/products/[id]/products-detail.model.ts`:

```typescript
import { useBreadcrumb } from "@/components/breadcrumb";
```

Add hook call inside the model function (after the useSWR hook):

```typescript
useBreadcrumb({
  title: product?.name || "Carregando...",
  backUrl: "/products",
});
```

**Step 3: Remove header from view**

In `app/(pages)/products/[id]/products-detail.view.tsx`, remove lines 116-144 (the entire header element):

Delete:
```typescript
<header className="sticky top-0 z-30 border-b border-neutral-800 bg-[#0A0A0A]/95 backdrop-blur-sm">
  <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
    <div className="flex items-center gap-4">
      <Link href="/products">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-[4px] border border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Link>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            Inventário
          </span>
          <span className="text-[10px] text-neutral-700">/</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">
            Detalhes
          </span>
        </div>
        <h1 className="text-sm font-bold uppercase tracking-wide text-white mt-0.5">
          {product.name}
        </h1>
      </div>
    </div>
  </div>
</header>
```

**Step 4: Test products detail page**

Run: `pnpm dev`
Navigate to: `http://localhost:3000/products` then click any product
Expected: Breadcrumb appears at top with product name, back button works

**Step 5: Commit products migration**

```bash
git add app/(pages)/products/[id]/products-detail.model.ts app/(pages)/products/[id]/products-detail.view.tsx
git commit -m "feat: migrate products detail page to use global breadcrumb system"
```

---

## Task 8: Migrate Batches Detail Page

**Files:**
- Modify: `app/(pages)/batches/[id]/batches-detail.model.ts`
- Modify: `app/(pages)/batches/[id]/batches-detail.view.tsx`

**Step 1: Read current batches model**

```bash
cat app/(pages)/batches/\[id\]/batches-detail.model.ts
```

**Step 2: Add useBreadcrumb to batches model**

Add import at top of `app/(pages)/batches/[id]/batches-detail.model.ts`:

```typescript
import { useBreadcrumb } from "@/components/breadcrumb";
```

Add hook call inside the model function:

```typescript
useBreadcrumb({
  title: batch?.code || "Carregando...",
  backUrl: "/batches",
});
```

**Step 3: Remove header from batches view if exists**

Check `app/(pages)/batches/[id]/batches-detail.view.tsx` for any sticky header elements and remove them.

**Step 4: Test batches detail page**

Navigate to: `http://localhost:3000/batches/[any-id]`
Expected: Breadcrumb appears with batch code, section shows "Inventário / Lote"

**Step 5: Commit batches migration**

```bash
git add app/(pages)/batches/[id]/batches-detail.model.ts app/(pages)/batches/[id]/batches-detail.view.tsx
git commit -m "feat: migrate batches detail page to use global breadcrumb system"
```

---

## Task 9: Migrate Stock Movements Detail Page

**Files:**
- Modify: `app/(pages)/stock-movements/[id]/stock-movements-detail.model.ts` (if exists)
- Modify: `app/(pages)/stock-movements/[id]/page.tsx`

**Step 1: Check if stock movements detail exists**

```bash
ls -la app/(pages)/stock-movements/\[id\]/
```

**Step 2: Add breadcrumb to stock movements**

If model exists, add to model file. Otherwise add directly in page.tsx:

```typescript
import { useBreadcrumb } from "@/components/breadcrumb";

// Inside component/model:
useBreadcrumb({
  title: movement?.description || `Movimentação #${movementId}`,
  backUrl: "/stock-movements",
});
```

**Step 3: Test stock movements detail**

Navigate to: `http://localhost:3000/stock-movements/[any-id]`
Expected: Breadcrumb appears, section shows "Movimentação / Detalhes"

**Step 4: Commit stock movements migration**

```bash
git add app/(pages)/stock-movements/[id]/*
git commit -m "feat: migrate stock movements detail page to use global breadcrumb system"
```

---

## Task 10: Migrate Edit Pages

**Files:**
- Modify: `app/(pages)/products/[id]/edit/page.tsx` (or model if exists)
- Modify: `app/(pages)/batches/[id]/edit/page.tsx` (or model if exists)

**Step 1: Add breadcrumb to products edit**

In products edit model or page:

```typescript
import { useBreadcrumb } from "@/components/breadcrumb";

useBreadcrumb({
  title: product?.name || "Carregando...",
  backUrl: `/products/${productId}`,
  section: "Inventário",
  subsection: "Edição",
});
```

**Step 2: Add breadcrumb to batches edit**

In batches edit model or page:

```typescript
import { useBreadcrumb } from "@/components/breadcrumb";

useBreadcrumb({
  title: batch?.code || "Carregando...",
  backUrl: `/batches/${batchId}`,
  section: "Inventário",
  subsection: "Edição",
});
```

**Step 3: Test edit pages**

Navigate to edit pages and verify breadcrumb shows "Edição" subsection

**Step 4: Commit edit pages migration**

```bash
git add app/(pages)/products/[id]/edit/* app/(pages)/batches/[id]/edit/*
git commit -m "feat: migrate edit pages to use global breadcrumb with custom subsection"
```

---

## Task 11: Manual Testing Validation

**Step 1: Test navigation flow**

1. Start at `/products` → breadcrumb should NOT appear
2. Click a product → breadcrumb APPEARS with product name
3. Click back button → returns to `/products`, breadcrumb disappears
4. Navigate to `/batches/[id]` → breadcrumb updates to batch info
5. Test on mobile (< 768px) → breadcrumb is responsive
6. Test on desktop (> 768px) → breadcrumb doesn't overlap sidebar

**Step 2: Test edge cases**

1. Reload page on `/products/[id]` → breadcrumb appears correctly
2. Navigate between detail pages quickly → breadcrumb updates
3. Test with non-existent product → breadcrumb shows error title
4. Test loading state → breadcrumb shows "Carregando..."

**Step 3: Document test results**

Create a summary of any issues found and resolutions.

---

## Task 12: Final Cleanup and Documentation

**Step 1: Remove unused imports**

Check all modified files for unused imports and remove them.

**Step 2: Verify all files follow MVVM**

- Model files: contain hook calls
- View files: no breadcrumb logic, just rendering
- Page files: orchestrate model and view

**Step 3: Final commit**

```bash
git add .
git commit -m "chore: final cleanup and documentation for global breadcrumb system"
```

---

## Success Criteria

✅ Breadcrumb appears on all routes with depth 2+
✅ Breadcrumb does NOT appear on routes with depth 1
✅ Back button navigates correctly
✅ Section/subsection inferred automatically
✅ Breadcrumb updates reactively when data loads
✅ Mobile responsive (no sidebar overlap)
✅ Desktop has correct sidebar compensation (md:ml-[240px])
✅ No console errors
✅ All migrated pages use the hook in model layer
✅ All migrated pages removed their individual headers

---

## Rollback Plan

If issues occur:

1. Revert layout changes: `git revert <commit-hash>` (Task 6)
2. Keep breadcrumb components but don't use them
3. Restore individual headers in pages
4. Debug in isolation with a single page first

---

## Additional Notes

- **MVVM Compliance**: All hook calls are in `.model.ts` files, never in `.view.tsx`
- **Sidebar Rule**: Every sticky full-width element MUST have `md:ml-[240px]`
- **Inference**: If section/subsection not provided, automatically inferred from ROUTE_SECTIONS map
- **Performance**: Context only re-renders when breadcrumb data changes (navigation events)
- **Future Pages**: Any new detail page just needs to call `useBreadcrumb()` in its model
