# Internal Transfers Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Implement internal stock transfers between warehouses with full lifecycle management (Draft -> In Transit -> In Validation -> Completed).

**Architecture:** MVVM pattern following strict "Corporate Solid Dark" design system. Next.js App Router.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS, Shadcn UI, Zod, React Hook Form, SWR, Ky.

---

### Task 1: Setup Types and Schemas

**Files:**
- Create: `app/(pages)/transfers/transfers.types.ts`
- Create: `app/(pages)/transfers/new/new-transfer.schema.ts`
- Create: `app/(pages)/transfers/new/new-transfer.types.ts`

**Step 1: Define Shared Types**
Create `app/(pages)/transfers/transfers.types.ts` with enums and interfaces for Transfer, TransferItem, TransferStatus.

```typescript
export enum TransferStatus {
  DRAFT = "DRAFT",
  IN_TRANSIT = "IN_TRANSIT",
  IN_VALIDATION = "IN_VALIDATION",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface TransferItem {
  id: string;
  sourceBatchId: string;
  quantity: number;
  productName?: string;
  batchCode?: string;
}

export interface Transfer {
  id: string;
  code: string;
  sourceWarehouseId: string;
  sourceWarehouseName: string;
  destinationWarehouseId: string;
  destinationWarehouseName: string;
  status: TransferStatus;
  notes?: string;
  items: TransferItem[];
  createdAt: string;
  updatedAt: string;
}

export interface DiscrepancyItem {
  productName: string;
  quantitySent: number;
  quantityReceived: number;
  discrepancyType: "SHORTAGE" | "OVERAGE";
  difference: number;
}
```

**Step 2: Define New Transfer Schema**
Create `app/(pages)/transfers/new/new-transfer.schema.ts`.

```typescript
import { z } from "zod";

export const transferItemSchema = z.object({
  sourceBatchId: z.string().uuid("Lote inválido"),
  quantity: z.number().positive("Quantidade deve ser maior que zero"),
  productName: z.string().optional(), // UI helper
  batchCode: z.string().optional(), // UI helper
  availableQuantity: z.number().optional(), // UI helper
});

export const newTransferSchema = z.object({
  destinationWarehouseId: z.string().uuid("Selecione um warehouse de destino"),
  notes: z.string().optional(),
  items: z.array(transferItemSchema).min(1, "Adicione pelo menos um item"),
});

export type NewTransferSchema = z.infer<typeof newTransferSchema>;
```

**Step 3: Define New Transfer Types**
Create `app/(pages)/transfers/new/new-transfer.types.ts` extending the schema types if needed for View props.

```typescript
import { NewTransferSchema } from "./new-transfer.schema";

export interface NewTransferViewProps {
  form: any; // Use proper react-hook-form type in implementation
  onSubmit: (data: NewTransferSchema) => void;
  warehouses: { id: string; name: string }[];
  products: { id: string; name: string }[];
  batches: { id: string; code: string; quantity: number }[]; // Batches for selected product
  onSearchProduct: (query: string) => void;
  onSelectProduct: (productId: string) => void;
  isLoading: boolean;
  isSubmitting: boolean;
}
```

**Step 4: Commit**
```bash
git add app/\(pages\)/transfers/
git commit -m "feat(transfers): setup types and schemas"
```

---

### Task 2: Implement Transfer List View

**Files:**
- Create: `app/(pages)/transfers/page.tsx`
- Create: `app/(pages)/transfers/transfers.view.tsx`
- Create: `app/(pages)/transfers/transfers.model.ts`
- Test: `app/(pages)/transfers/transfers.view.test.tsx`

**Step 1: Write View Test**
Create `app/(pages)/transfers/transfers.view.test.tsx`. Test tabs switching and list rendering.

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { TransfersView } from "./transfers.view";
import { TransferStatus } from "./transfers.types";

const mockTransfers = [
  {
    id: "1",
    code: "TRF-001",
    sourceWarehouseId: "w1",
    sourceWarehouseName: "W1",
    destinationWarehouseId: "w2",
    destinationWarehouseName: "W2",
    status: TransferStatus.DRAFT,
    items: [],
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  }
];

test("renders tabs and transfer list", () => {
  render(
    <TransfersView
      transfers={mockTransfers}
      activeTab="outgoing"
      onTabChange={() => {}}
      isLoading={false}
    />
  );
  expect(screen.getByText("Enviadas")).toBeInTheDocument();
  expect(screen.getByText("TRF-001")).toBeInTheDocument();
});
```

**Step 2: Implement TransfersView**
Create `app/(pages)/transfers/transfers.view.tsx`. Use Shadcn Tabs.
- Header with Title and "Nova Transferência" button (only visible on outgoing tab).
- Tabs: "Enviadas" (outgoing) | "Recebidas" (incoming).
- List of cards using design system (border-l-4 for status).

**Step 3: Implement TransfersModel**
Create `app/(pages)/transfers/transfers.model.ts`.
- Use `useSelectedWarehouse()` hook.
- Fetch transfers using `useSWR`.
- Handle tab state.
- Provide filtered transfers based on tab (source vs destination).

**Step 4: Implement Page**
Create `app/(pages)/transfers/page.tsx` connecting Model and View.

**Step 5: Run Tests**
Run `vitest app/(pages)/transfers/transfers.view.test.tsx`

**Step 6: Commit**
```bash
git add app/\(pages\)/transfers/
git commit -m "feat(transfers): implement list view with tabs"
```

---

### Task 3: Implement New Transfer Form

**Files:**
- Create: `app/(pages)/transfers/new/page.tsx`
- Create: `app/(pages)/transfers/new/new-transfer.view.tsx`
- Create: `app/(pages)/transfers/new/new-transfer.model.ts`
- Test: `app/(pages)/transfers/new/new-transfer.view.test.tsx`

**Step 1: Write View Test**
Create `app/(pages)/transfers/new/new-transfer.view.test.tsx`.

```typescript
// Test form rendering and validation errors
test("validates required fields", async () => {
  render(<NewTransferView {...mockProps} />);
  fireEvent.click(screen.getByText("Criar Transferência"));
  expect(await screen.findByText("Selecione um warehouse de destino")).toBeInTheDocument();
});
```

**Step 2: Implement NewTransferView**
Create `app/(pages)/transfers/new/new-transfer.view.tsx`.
- Form with Destination Warehouse select.
- "Adicionar Item" section (expandable/inline).
  - Product Search (Combobox).
  - Batch Select (filtered by product).
  - Quantity Input (max = available).
- List of added items.

**Step 3: Implement NewTransferModel**
Create `app/(pages)/transfers/new/new-transfer.model.ts`.
- `useForm` with `zodResolver`.
- Fetch warehouses (exclude current).
- Search products API.
- Fetch batches for selected product.
- `onSubmit`: POST to `/stockshift/api/transfers`.

**Step 4: Implement Page**
Create `app/(pages)/transfers/new/page.tsx`.

**Step 5: Run Tests**
Run `vitest app/(pages)/transfers/new/new-transfer.view.test.tsx`

**Step 6: Commit**
```bash
git add app/\(pages\)/transfers/new/
git commit -m "feat(transfers): implement creation form"
```

---

### Task 4: Implement Transfer Detail Page

**Files:**
- Create: `app/(pages)/transfers/[id]/page.tsx`
- Create: `app/(pages)/transfers/[id]/transfer-detail.view.tsx`
- Create: `app/(pages)/transfers/[id]/transfer-detail.model.ts`
- Create: `app/(pages)/transfers/[id]/transfer-detail.types.ts`

**Step 1: View Implementation**
Create `app/(pages)/transfers/[id]/transfer-detail.view.tsx`.
- Info section (Source, Destination, Dates).
- Items list (Product, Batch, Qty).
- Action Footer:
  - Dynamic buttons based on `status` and `isSource` / `isDestination`.
  - e.g., "Executar" if DRAFT && isSource.
  - "Iniciar Validação" if IN_TRANSIT && isDestination.

**Step 2: Model Implementation**
Create `app/(pages)/transfers/[id]/transfer-detail.model.ts`.
- Fetch transfer by ID.
- Implement actions: `execute`, `cancel`, `startValidation`.
- Navigation to validation page.

**Step 3: Page Implementation**
Create `app/(pages)/transfers/[id]/page.tsx`.

**Step 4: Commit**
```bash
git add app/\(pages\)/transfers/\[id\]/
git commit -m "feat(transfers): implement detail page"
```

---

### Task 5: Implement Validation (Scanner) Page

**Files:**
- Create: `app/(pages)/transfers/[id]/validate/page.tsx`
- Create: `app/(pages)/transfers/[id]/validate/validate-transfer.view.tsx`
- Create: `app/(pages)/transfers/[id]/validate/validate-transfer.model.ts`
- Create: `app/(pages)/transfers/[id]/validate/validate-transfer.types.ts`

**Step 1: View Implementation**
Create `app/(pages)/transfers/[id]/validate/validate-transfer.view.tsx`.
- Barcode input (autofocus).
- Progress bar.
- List of expected items with status icons (Check, Circle, Warning).
- "Finalizar Validação" button.

**Step 2: Model Implementation**
Create `app/(pages)/transfers/[id]/validate/validate-transfer.model.ts`.
- `scanItem(barcode)` function calling API.
- Update local state optimistically or re-fetch.
- `finishValidation`: Fetch discrepancy report, show modal, then confirm.

**Step 3: Page Implementation**
Create `app/(pages)/transfers/[id]/validate/page.tsx`.

**Step 4: Commit**
```bash
git add app/\(pages\)/transfers/\[id\]/validate/
git commit -m "feat(transfers): implement validation scanner"
```

---

### Task 6: Sidebar Integration

**Files:**
- Modify: `components/layout/app-sidebar.tsx`

**Step 1: Add Link**
Add "Transferências" link to the sidebar config.

```typescript
{
  title: "Transferências",
  url: "/transfers",
  icon: ArrowLeftRight, // Import from lucide-react
}
```

**Step 2: Commit**
```bash
git add components/layout/app-sidebar.tsx
git commit -m "feat(transfers): add sidebar link"
```
