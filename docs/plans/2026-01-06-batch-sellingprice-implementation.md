# Batch sellingPrice Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an editable `sellingPrice` field to the product edit batch drawer, mapped from the batches API and included in updates.

**Architecture:** Extend batch types and validation to include optional `sellingPrice`, map it from GET batches into the drawer form, render an editable input in the drawer, and include it in PUT updates. Keep the existing MVVM structure and drawer UI.

**Tech Stack:** Next.js 15, React Hook Form, Zod, SWR, Vitest, Tailwind.

### Task 1: Add sellingPrice to batch model and update payload (TDD)

**Files:**
- Modify: `app/products/[id]/edit/products-edit.types.ts`
- Modify: `app/products/[id]/edit/products-edit.schema.ts`
- Modify: `app/products/[id]/edit/products-edit.model.ts`
- Test: `app/products/[id]/edit/products-edit.model.test.ts`

**Step 1: Write the failing test**

```ts
const batchesResponse = {
  // ...existing fields
  data: [
    {
      // ...existing fields
      sellingPrice: 19.9,
    },
  ],
};

// Expect sellingPrice in update payload
expect(api.put).toHaveBeenCalledWith("batches/batch-1", {
  json: {
    // ...existing fields
    sellingPrice: 19.9,
  },
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test app/products/[id]/edit/products-edit.model.test.ts`
Expected: FAIL (missing sellingPrice in payload/mapping)

**Step 3: Write minimal implementation**

```ts
// app/products/[id]/edit/products-edit.types.ts
sellingPrice?: number | null;

// app/products/[id]/edit/products-edit.schema.ts
sellingPrice: z.number().optional(),

// app/products/[id]/edit/products-edit.model.ts (mapping)
sellingPrice: batch.sellingPrice ?? undefined,

// app/products/[id]/edit/products-edit.model.ts (trigger fields)
`batches.${index}.sellingPrice`,

// app/products/[id]/edit/products-edit.model.ts (payload)
sellingPrice: batch.sellingPrice ?? undefined,
```

**Step 4: Run test to verify it passes**

Run: `pnpm test app/products/[id]/edit/products-edit.model.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/products/[id]/edit/products-edit.types.ts app/products/[id]/edit/products-edit.schema.ts app/products/[id]/edit/products-edit.model.ts app/products/[id]/edit/products-edit.model.test.ts
git commit -m "feat: map batch selling price on edit"
```

### Task 2: Add sellingPrice input to drawer UI (TDD)

**Files:**
- Modify: `app/products/components/product-form.types.ts`
- Modify: `app/products/components/product-form.view.tsx`
- Test: `app/products/components/product-form.view.test.tsx`

**Step 1: Write the failing test**

```tsx
render(<Wrapper {...baseProps} />);
expect(screen.getByText(/preco de venda/i)).toBeTruthy();
```

**Step 2: Run test to verify it fails**

Run: `pnpm test app/products/components/product-form.view.test.tsx`
Expected: FAIL (label not found)

**Step 3: Write minimal implementation**

```ts
// app/products/components/product-form.types.ts
sellingPrice?: number;
```

```tsx
// app/products/components/product-form.view.tsx
<FormField
  control={batchesDrawerState.form.control}
  name={`batches.${index}.sellingPrice`}
  render={({ field }) => (
    <FormItem>
      <FormLabel className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
        Preco de Venda
      </FormLabel>
      <FormControl>
        <Input
          type="number"
          step="0.01"
          className="h-9 rounded-sm border-border/40 bg-background/50 text-xs"
          {...field}
          value={field.value ?? ""}
          onChange={(event) => {
            const value = event.target.value;
            field.onChange(value === "" ? undefined : Number(value));
          }}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Step 4: Run test to verify it passes**

Run: `pnpm test app/products/components/product-form.view.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add app/products/components/product-form.types.ts app/products/components/product-form.view.tsx app/products/components/product-form.view.test.tsx
git commit -m "feat: add batch selling price field"
```

