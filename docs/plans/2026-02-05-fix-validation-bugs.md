# Fix Transfer Validation Bugs Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix critical bugs in the transfer validation process preventing users from completing transfers and displaying incorrect progress/status.

**Context:** The validation page has broken progress calculation ("NaN%"), "NaN itens" count, API type mismatches for `ValidationLogEntry`, status enum misalignment (`PENDING_VALIDATION`), and reliance on non-existent fields (`productName` in logs).

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, SWR, Ky.

---

## Task 1: Fix Type Definitions

**Files:**

- Modify: `app/(pages)/transfers/transfers.types.ts`

**Step 1: Update TransferStatus Enum**
Add `PENDING_VALIDATION` to `TransferStatus` enum to match backend response.

```typescript
export enum TransferStatus {
  // ... existing
  PENDING_VALIDATION = "PENDING_VALIDATION", // Add this
  // IN_VALIDATION might need to be deprecated or mapped
}
```

**Step 2: Update ValidationLogEntry Interface**
Remove `productName` and ensure `transferItemId` is present, matching existing API response.

```typescript
export interface ValidationLogEntry {
  id: string;
  transferItemId: string;
  barcode: string;
  validatedByUserId: string;
  validatedAt: string;
  valid: boolean;
  // productName: string; // REMOVE THIS - Not in API
}
```

**Step 3: Update TransferItem Interface**
Ensure `quantitySent` and `quantityReceived` are available.

```typescript
export interface TransferItem {
  // ...
  quantitySent: number; // Ensure this exists
  quantityReceived: number; // Ensure this exists
  // ...
}
```

**Step 4: Commit**

```bash
git add app/(pages)/transfers/transfers.types.ts
git commit -m "fix(transfers): align types with backend response"
```

---

## Task 2: Fix Validation Logic & Model

**Files:**

- Modify: `app/(pages)/transfers/[id]/validate/validate-transfer.model.ts`

**Step 1: Fix NaN Progress & Item Mapping**
Update `expectedItems` derivation to use `quantitySent` instead of `quantity` and map logs using `transferItemId`.

```typescript
// IN: useValidateTransferModel

const expectedItems: ExpectedItem[] = useMemo(() => {
  if (!transfer) return [];

  // Map logs by transferItemId
  const scannedCounts: Record<string, number> = {};
  validationLogs.forEach((log) => {
    if (log.valid && log.transferItemId) {
      scannedCounts[log.transferItemId] =
        (scannedCounts[log.transferItemId] || 0) + 1;
    }
  });

  return transfer.items.map((item) => ({
    id: item.id,
    productName: item.productName || "Produto desconhecido",
    batchCode: item.batchCode || "Sem lote",
    // Fix: use quantitySent
    expectedQuantity: item.quantitySent || item.quantity || 0,
    // Fix: use ID based mapping
    scannedQuantity: scannedCounts[item.id] || 0,
  }));
}, [transfer, validationLogs]);
```

**Step 2: Commit**

```bash
git add app/(pages)/transfers/[id]/validate/validate-transfer.model.ts
git commit -m "fix(transfers): fix validation progress calculation and item mapping"
```

---

## Task 3: Fix List View "NaN" & Status Display

**Files:**

- Modify: `app/(pages)/transfers/transfers.view.tsx`
- Modify: `app/(pages)/transfers/transfers.types.ts` (if needed for status mapping)

**Step 1: Fix "NaN itens"**
Update the item count display logic.

```tsx
// Before: {transfer.items?.length ?? "NaN"}
// After: {transfer.items?.length || 0}
```

**Step 2: Fix Status Color Mapping**
Update `statusConfig` to handle `PENDING_VALIDATION`.

```typescript
const statusConfig: Record<TransferStatus | string, ...> = {
  // ...
  [TransferStatus.PENDING_VALIDATION]: { color: "border-purple-500", label: "Aguardando Validação" },
  // ...
}
```

**Step 3: Commit**

```bash
git add app/(pages)/transfers/transfers.view.tsx
git commit -m "fix(transfers): fix nan items count and status display"
```

---

## Task 4: Fix Validation Page View (Optional Tweak)

**Files:**

- Modify: `app/(pages)/transfers/[id]/validate/validate-transfer.view.tsx`

**Step 1: Verify Status Display**
Ensure the header displays the correct status label for `PENDING_VALIDATION`.

**Step 2: Commit (if changes needed)**

```bash
git add app/(pages)/transfers/[id]/validate/validate-transfer.view.tsx
git commit -m "fix(transfers): adjust validation page status display"
```

---

## Task 5: Verify Fixes

**Step 1: Run Tests**
Run `pnpm test -- app/(pages)/transfers/`

**Step 2: Manual Verification Check**

- Progress bar should show correct %.
- Scanned items should increment correctly.
- List view should show proper item count.
