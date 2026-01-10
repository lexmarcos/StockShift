# Product Delete Confirmation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add delete action to product listing with conditional double confirmation when stock exists in the current warehouse.

**Architecture:** Extend `app/products/products.model.ts` to own deletion state, batch lookup, and delete mutation; extend `app/products/products.types.ts` for batch types and view props; update `app/products/products.view.tsx` to render delete action + dialogs with warning block. Use ky for API calls and SWR `mutate` to refresh product list.

**Tech Stack:** Next.js 15, TypeScript, SWR, ky, shadcn/ui (AlertDialog), lucide-react, Tailwind CSS.

### Task 1: Add types for delete flow + batches

**Files:**
- Modify: `app/products/products.types.ts`

**Step 1: Write the failing test**

Skip (no existing unit tests for `products.types.ts` and task is pure typing).

**Step 2: Update types**

Add:
```ts
export interface Batch {
  id: string;
  productId: string;
  productName: string;
  warehouseId: string;
  quantity: number;
  batchNumber: string;
  expirationDate: string | null;
}

export interface ProductsViewProps {
  // existing props...
  onOpenDeleteDialog: (product: Product) => void;
  onConfirmDelete: () => void;
  onSecondConfirmDelete: () => void;
  onCloseDeleteDialog: () => void;
  onCloseSecondConfirm: () => void;
  deleteDialogOpen: boolean;
  secondConfirmOpen: boolean;
  deleteProduct: Product | null;
  deleteBatches: Batch[];
  isCheckingDeleteBatches: boolean;
  isDeletingProduct: boolean;
}
```

**Step 3: Commit**

```bash
git add app/products/products.types.ts
git commit -m "feat: add types for product delete confirmation"
```

### Task 2: Extend model with delete flow and batch check

**Files:**
- Modify: `app/products/products.model.ts`

**Step 1: Write the failing test**

Add new tests for the model file first (create):  
`app/products/products.model.test.ts`

Test cases to add:
```ts
it("opens delete dialog and loads batches for current warehouse", async () => {
  // mock useSelectedWarehouse to return warehouseId
  // mock api.get batches/product/{id}
  // assert deleteDialogOpen true and deleteBatches filtered to warehouse
});

it("skips second confirmation when no batches in current warehouse", async () => {
  // mock empty batches for warehouse
  // call onConfirmDelete and ensure delete triggers directly
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test app/products/products.model.test.ts`  
Expected: FAIL (model doesn't support delete flow).

**Step 3: Implement minimal model changes**

Add state and handlers:
```ts
const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [secondConfirmOpen, setSecondConfirmOpen] = useState(false);
const [deleteBatches, setDeleteBatches] = useState<Batch[]>([]);
const [isCheckingDeleteBatches, setIsCheckingDeleteBatches] = useState(false);
const [isDeletingProduct, setIsDeletingProduct] = useState(false);

const openDeleteDialog = async (product: Product) => { ... }
const closeDeleteDialog = () => { ... }
const closeSecondConfirm = () => { ... }
const confirmDelete = async () => { ... } // opens second modal if batches exist
const finalDelete = async () => { ... } // calls DELETE /products/{id}
```

- Use `api.get("batches/product/{productId}")` to fetch batches, filter by `warehouseId` and `quantity > 0`.
- Use `toast` for success/error.
- Use SWR `mutate` to refresh list after delete.

**Step 4: Run tests**

Run: `pnpm test app/products/products.model.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add app/products/products.model.ts app/products/products.model.test.ts
git commit -m "feat: add product delete flow to products model"
```

### Task 3: Update view with delete action + dialogs

**Files:**
- Modify: `app/products/products.view.tsx`

**Step 1: Write the failing test**

Skip (no existing view test for products list).

**Step 2: Update view**

Add delete action buttons in desktop and mobile:
```tsx
<Button variant="ghost" size="icon" ... onClick={() => onOpenDeleteDialog(product)}>
  <Trash2 ... />
</Button>
```

Render two `AlertDialog` components:
1) First confirmation modal
2) Second confirmation modal (only used when `deleteBatches.length > 0`)

Warning block in modal:
```tsx
<div className="rounded-sm border border-yellow-200/60 bg-yellow-100/80 text-yellow-900 text-xs p-3">
  ...
</div>
```

**Step 3: Commit**

```bash
git add app/products/products.view.tsx
git commit -m "feat: add delete confirmation modals to products view"
```

### Task 4: Wire ViewModel page

**Files:**
- Modify: `app/products/page.tsx`

**Step 1: Update props**

Pass all new model handlers/flags into the view component.

**Step 2: Commit**

```bash
git add app/products/page.tsx
git commit -m "feat: wire delete flow props in products page"
```

### Task 5: Final verification

**Step 1: Run full test suite**

Run: `pnpm test`  
Expected: PASS (note existing warnings about DialogContent).

**Step 2: Final commit (if needed)**

If any fixes required, commit:
```bash
git add <files>
git commit -m "fix: address delete flow issues"
```

### Task 6: Review checklist
- Desktop and mobile delete actions visible.
- First modal opens and fetches batches.
- Warning block appears only when batches exist in current warehouse.
- Second modal appears only when batches exist.
- Delete without stock uses only first modal.
- Toasts show success/error.
- No new animations introduced.
