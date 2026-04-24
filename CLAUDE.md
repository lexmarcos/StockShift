````md
# StockShift

Inventory mgmt frontend. Next.js 15, TS, Tailwind CSS, shadcn/ui.

# MVVM Architecture

## Required Structure

Every page:

```text
folder-name/
├── folder-name.model.ts    # Logic: state, hooks, requests
├── folder-name.view.tsx    # JSX only, no state
├── folder-name.types.ts    # Interfaces and types
├── folder-name.schema.ts   # Zod schema (if there is a form)
└── page.tsx                # ViewModel - orchestrates model and view
````

## Responsibilities

| File         | Contains                                    | Does Not Contain           |
| ------------ | ------------------------------------------- | -------------------------- |
| `.model.ts`  | State, hooks, business logic, HTTP calls    | JSX                        |
| `.view.tsx`  | Pure JSX, receives everything through props | useState, useEffect, logic |
| `.types.ts`  | Interfaces, types, enums                    | Logic, components          |
| `.schema.ts` | Zod schema for validation                   | Business logic             |
| `page.tsx`   | Imports model and view, passes props        | Complex logic              |

## Form Validation

* **Zod** schemas
* **react-hook-form** state mgmt
* Schema → `.schema.ts`

```typescript
// product.schema.ts
import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.number().positive("Price must be positive"),
});

export type ProductFormData = z.infer<typeof productSchema>;
```

## Endpoints

Check `docs/endpoints/` before HTTP impl.

# Components

## UI Components

`/components/ui`. New: Tailwind + lucide-react (`strokeWidth={2}` or `2.5`).

## Breadcrumb

### When to Use

| Route Type | Example                                   | Breadcrumb |
| ---------- | ----------------------------------------- | ---------- |
| Main       | `/products`, `/warehouses`                | No         |
| Child      | `/products/create`, `/products/[id]/edit` | Yes        |

### Impl

Child route `page.tsx`:

```typescript
import { useBreadcrumb } from "@/components/breadcrumb/use-breadcrumb";

export default function ProductCreatePage() {
  useBreadcrumb({
    title: "New Product",
    backUrl: "/products",
    section: "Products",
    subsection: "Create",
  });

  return <ProductCreateView />;
}
```

## Composite Components

Encapsulate visual patterns. **ALWAYS** use on pages.

### PageContainer

Page wrapper. Bg, padding, max-width.

```tsx
import { PageContainer } from "@/components/ui/page-container";

<PageContainer bottomPadding="fixed-bar">
  {/* content */}
</PageContainer>;
```

* `bottomPadding`: `"default"` (pb-20) | `"fixed-bar"` (pb-28 + FixedBottomBar)

### PageHeader

Title + actions.

```tsx
import { PageHeader } from "@/components/ui/page-header";

<PageHeader
  title="Products"
  subtitle="Management"
  actions={<Button>NEW</Button>}
/>;
```

### InsightCard

KPI card. Icon + label + value.

```tsx
import { InsightCard } from "@/components/ui/insight-card";

<InsightCard
  icon={Package}
  color="blue"
  label="Total"
  value={128}
  suffix="items"
/>;
```

* `color`: `"blue"` | `"emerald"` | `"amber"` | `"rose"`

### StatusCard

`border-l-4` colored by status.

```tsx
import { StatusCard } from "@/components/ui/status-card";

<StatusCard status="success" onClick={() => {}} className="p-4">
  <p className="text-sm text-white">Content</p>
</StatusCard>;
```

* `status`: `"info"` | `"success"` | `"warning"` | `"error"` | `"neutral"`

### FormSection

Form card. Icon + title.

```tsx
import { FormSection } from "@/components/ui/form-section";

<FormSection
  icon={Package}
  iconColor="text-blue-400"
  title="General Data"
  description="Basic information"
>
  <Input />
</FormSection>;
```

### EmptyState

Icon + title + desc + optional action.

```tsx
import { EmptyState } from "@/components/ui/empty-state";

<EmptyState
  icon={Package}
  title="No items"
  description="Start by adding one."
  action={{ label: "NEW", onClick: () => {} }}
/>;
```

### LoadingState

Spinner.

```tsx
import { LoadingState } from "@/components/ui/loading-state";

<LoadingState message="Loading products..." />;
```

### ErrorState

Error + retry.

```tsx
import { ErrorState } from "@/components/ui/error-state";

<ErrorState
  title="Error loading data"
  description="Please try again."
  onRetry={() => mutate()}
/>;
```

### FixedBottomBar

Fixed bottom bar. Auto sidebar offset `md:ml-[var(--sidebar-width)]`.

```tsx
import { FixedBottomBar } from "@/components/ui/fixed-bottom-bar";

<FixedBottomBar>
  <div className="mx-auto flex max-w-7xl items-center justify-end gap-3">
    <Button>SAVE</Button>
  </div>
</FixedBottomBar>;
```

### SectionLabel

Tiny uppercase label.

```tsx
import { SectionLabel } from "@/components/ui/section-label";

<SectionLabel icon={Info}>General Information</SectionLabel>;
```

### Page Templates

`.claude/templates/`:

* `list-page.template.tsx` - KPIs, search, table/cards
* `form-page.template.tsx` - FormSections + FixedBottomBar
* `detail-page.template.tsx` - StatusCard + info sections

## Responsive Design

### Order

1. Mobile (default)
2. Tablet (`md:`)
3. Desktop (`lg:`, `max-w-7xl`)

### Sidebar Fix

Sidebar = 240px. `fixed` + `left-0 right-0` → must add `md:ml-[240px]`:

```tsx
// Correct
<div className="fixed bottom-0 left-0 right-0 md:ml-[240px]">

// Incorrect - overlaps the sidebar
<div className="fixed bottom-0 left-0 right-0">
```

# Data Fetching

## SWR

Auto cache fetch.

```typescript
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const { data, error, isLoading, mutate } = useSWR("/api/products", fetcher);
```

## ky

HTTP client. Centralized config.

```typescript
import ky from "ky";

const api = ky.create({
  prefixUrl: "/api",
  headers: { "Content-Type": "application/json" },
});

// GET
const products = await api.get("products").json();

// POST
const created = await api.post("products", { json: data }).json();

// PUT
await api.put(`products/${id}`, { json: data });

// DELETE
await api.delete(`products/${id}`);
```

## Model Pattern

```typescript
// products.model.ts
import useSWR from "swr";
import ky from "ky";

const api = ky.create({ prefixUrl: "/api" });

export function useProductsModel() {
  const { data, error, isLoading, mutate } = useSWR("/api/products", (url) =>
    ky.get(url).json(),
  );

  const createProduct = async (product: CreateProductDTO) => {
    await api.post("products", { json: product });
    mutate();
  };

  return { data, error, isLoading, createProduct };
}
```

# Testing

## Framework

Vitest.

## Scope

`.model.ts` files only.

## Structure

```text
folder-name/
├── folder-name.model.ts
├── folder-name.model.test.ts  # Tests go here
├── folder-name.view.tsx
├── folder-name.types.ts
└── page.tsx
```

## Workflow

Finish page → ask:

> "Would you like to create unit tests for this page's model?"

## Example

```typescript
// products.model.test.ts
import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useProductsModel } from "./products.model";

describe("useProductsModel", () => {
  it("should fetch products", async () => {
    const { result } = renderHook(() => useProductsModel());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
  });
});
```

## Command

```bash
pnpm test
```

## Commands

* `pnpm dev` - Dev server
* `pnpm test` - Tests
* `pnpm build` - Prod build

## Universal Rules

* **Commits 1 line**
* **Dark-Only** - Bg `#0A0A0A`, no light mode
* **Mobile First**
* **MVVM required**
* **No .md files** - Unless requested
* **Ask about tests** - Offer model tests on page finish

## Responsive Design

**REQUIRED: Mobile First**

1. Mobile (default)
2. iPad/Tablet (grid)
3. Desktop (`max-w-7xl`)

**REQUIRED:** `fixed` full-width → **MUST** `md:ml-[240px]`. Sidebar = **240px** (`--sidebar-width: 240px`).

```tsx
// CORRECT
<div className="fixed bottom-0 left-0 right-0 md:ml-[240px]">
  {/* content */}
</div>

// INCORRECT - Overlapping sidebar
<div className="fixed bottom-0 left-0 right-0">
  {/* content */}
</div>
```

## Design: "Corporate Solid Dark (Vivid)"

### 1. High-Contrast Brutalism

Monochrome + **vivid accents** for attention.

* **Bg:** `#0A0A0A`
* **Surfaces:** `#171717` / `neutral-900`
* **Borders:** `#262626` / `neutral-800`
* **Accents:**
  * Primary: `#2563EB` (Blue-600)
  * Success: `#059669` (Emerald-600)
  * Warning: `#F59E0B` (Amber-500)
  * Error: `#E11D48` (Rose-600)

### 2. Geometry

* **Radius:** 4px all. No `rounded-full`.
* **Hierarchy:** `border-l-4` + vivid color = status.
* **Inputs:** `neutral-900` bg, 2px border, vivid focus.

### 3. Interaction

* **No animations.** Hover = instant color change.
* **Typography:** Sans-serif, titles **Bold**, `tracking-tighter` for numbers.
* **No shadows.** Depth via surface contrast + borders.

---

## Impl Summary

* **Container:** `max-w-7xl mx-auto`
* **Palette:** Black bg, dark gray comps, vivid accents
* **Buttons:** Uppercase + `tracking-wide`
* **Cards:** `#171717` bg, `neutral-800` borders, 4px radius
* **Icons:** Lucide, `stroke-width={2}` / `2.5`
* **Feedback:** 10% opacity bg + solid border + icon (e.g. `bg-rose-500/10 text-rose-500`)

## Detailed Docs

* [MVVM](.claude/architecture.md) - Structure + validation
* [Components](.claude/components.md) - UI, breadcrumb, responsive
* [Data Fetching](.claude/data-fetching.md) - SWR + ky
* [Testing](.claude/testing.md) - Vitest workflow

## Browser Automation

email: [pass@pass.com](mailto:pass@pass.com)
pw: test123

```
```
