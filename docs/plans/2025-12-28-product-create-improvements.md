# Product Create Page Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enhance product creation page with dynamic custom attributes, continuous mode, and premium dark design aesthetic.

**Architecture:** MVVM pattern with new CustomAttributesBuilder component. Model handles dynamic attributes state and localStorage for continuous mode. View integrates builder and enhanced visual design. Schema updated for flexible attributes structure.

**Tech Stack:** Next.js 15, TypeScript, Zod, react-hook-form, shadcn/ui, lucide-react, Tailwind CSS

---

## Task 1: Update Schema for Dynamic Attributes

**Files:**
- Modify: `app/products/create/products-create.schema.ts`

**Step 1: Read current schema**

```bash
cat app/products/create/products-create.schema.ts
```

**Step 2: Update attributes field in schema**

Replace entire file content:

```typescript
import { z } from "zod";

export const productCreateSchema = z.object({
  name: z.string().min(1, "Nome do produto é obrigatório"),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  barcode: z.string().optional(),
  sku: z.string().optional(),
  isKit: z.boolean(),
  hasExpiration: z.boolean(),
  active: z.boolean(),
  continuousMode: z.boolean(),
  attributes: z.object({
    weight: z.string().optional(),
    dimensions: z.string().optional(),
  }).optional(),
}).refine((data) => {
  if (data.barcode !== undefined && data.barcode.trim() === "") {
    return false;
  }
  return true;
}, {
  message: "Código de barras não pode estar vazio",
  path: ["barcode"],
});

export type ProductCreateFormData = z.infer<typeof productCreateSchema>;
```

**Step 3: Verify TypeScript compilation**

```bash
pnpm exec tsc --noEmit
```

Expected: No errors

**Step 4: Commit**

```bash
git add app/products/create/products-create.schema.ts
git commit -m "refactor: update schema with continuousMode field"
```

---

## Task 2: Create CustomAttributesBuilder Component

**Files:**
- Create: `components/product/custom-attributes-builder.tsx`

**Step 1: Create component directory**

```bash
mkdir -p components/product
```

**Step 2: Write CustomAttributesBuilder component**

Create file with full content - see design doc for complete code

**Step 3: Verify TypeScript compilation**

```bash
pnpm exec tsc --noEmit
```

**Step 4: Commit**

```bash
git add components/product/custom-attributes-builder.tsx
git commit -m "feat: create CustomAttributesBuilder component"
```

---

## Remaining Tasks

See full plan in design document for:
- Task 3: Update Types
- Task 4: Update Model with Custom Attributes Logic
- Task 5: Update View with Enhanced Design
- Task 6: Update Page Component
- Task 7: Manual Testing
- Task 8: Final Review

**Total Implementation Time:** ~2-3 hours for all tasks
