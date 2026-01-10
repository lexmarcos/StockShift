# Batches Neon Badges + Default Warehouse Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ajustar a tela de batches para ter badges neon, ações com ícones, ordenação por cabeçalho e preseleção do warehouse via hook.

**Architecture:** Mudanças focadas em `batches.model.ts` (estado inicial do filtro e integração com `useSelectedWarehouse`) e em `batches.view.tsx` (estilo dos badges, ícones nas ações e cabeçalhos ordenáveis). Testes unitários cobrindo comportamento do model e interação de ordenação/ícones na view.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, SWR, Vitest, lucide.

---

### Task 1: Preseleção do warehouse pelo hook

**Files:**
- Modify: `app/batches/batches.model.ts`
- Test: `app/batches/batches.model.test.ts`

**Step 1: Write the failing test**

```ts
it("initializes warehouse filter from selected warehouse", () => {
  const setSelected = vi.fn();
  vi.mocked(useSelectedWarehouse).mockReturnValue({
    warehouseId: "wh-1",
    setWarehouseId: setSelected,
  });

  const { result } = renderHook(() => useBatchesModel());
  expect(result.current.filters.warehouseId).toBe("wh-1");
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --run app/batches/batches.model.test.ts`
Expected: FAIL (warehouseId inicial ainda vazio)

**Step 3: Write minimal implementation**

```ts
const { warehouseId } = useSelectedWarehouse();

useEffect(() => {
  if (warehouseId && !filters.warehouseId) {
    setFilters((prev) => ({ ...prev, warehouseId }));
  }
}, [warehouseId, filters.warehouseId]);
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --run app/batches/batches.model.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/batches/batches.model.ts app/batches/batches.model.test.ts
git commit -m "feat: default batches warehouse filter"
```

---

### Task 2: Badges neon + ícones nas ações

**Files:**
- Modify: `app/batches/batches.view.tsx`
- Test: `app/batches/batches.view.test.tsx`

**Step 1: Write the failing test**

```ts
it("renders action icon in table actions", () => {
  render(<BatchesView {...baseProps} batches={[mockBatch]} />);
  expect(screen.getByTestId("batch-action-view-icon")).toBeTruthy();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --run app/batches/batches.view.test.tsx`
Expected: FAIL (ícone não existe)

**Step 3: Write minimal implementation**

```tsx
import { Eye } from "lucide-react";

<Link ...>
  <Eye data-testid="batch-action-view-icon" className="mr-1 h-3.5 w-3.5" />
  <span className="hidden sm:inline">Ver</span>
</Link>
```

Atualizar `statusStyles` para neon:
```ts
const statusStyles = {
  expired: "border-red-500 text-red-400 bg-black",
  expiring: "border-yellow-400 text-yellow-300 bg-black",
  low: "border-cyan-400 text-cyan-300 bg-black",
  ok: "border-emerald-400 text-emerald-300 bg-black",
};
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --run app/batches/batches.view.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add app/batches/batches.view.tsx app/batches/batches.view.test.tsx
git commit -m "feat: add neon badges and action icons"
```

---

### Task 3: Ordenação por cabeçalho (produto, quantidade, validade)

**Files:**
- Modify: `app/batches/batches.view.tsx`
- Test: `app/batches/batches.view.test.tsx`

**Step 1: Write the failing test**

```ts
it("changes sort when clicking sortable header", () => {
  const setSortConfig = vi.fn();
  render(<BatchesView {...baseProps} setSortConfig={setSortConfig} />);

  fireEvent.click(screen.getByRole("button", { name: /produto/i }));
  expect(setSortConfig).toHaveBeenCalledWith({ key: "product", direction: "asc" });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --run app/batches/batches.view.test.tsx`
Expected: FAIL (cabeçalho não é clicável)

**Step 3: Write minimal implementation**

```tsx
const toggleSort = (key: SortConfig["key"]) => {
  if (sortConfig.key === key) {
    setSortConfig({ key, direction: sortConfig.direction === "asc" ? "desc" : "asc" });
  } else {
    setSortConfig({ key, direction: "asc" });
  }
};

<button onClick={() => toggleSort("product")} aria-label="Ordenar por produto">Produto ...</button>
```

Adicionar ícone de direção quando ativo.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --run app/batches/batches.view.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add app/batches/batches.view.tsx app/batches/batches.view.test.tsx
git commit -m "feat: add sortable headers to batches table"
```

---

### Task 4: Verificação final

**Files:**
- None

**Step 1: Run full test suite**

Run: `pnpm test`
Expected: PASS (0 failures)

**Step 2: Commit (if any final adjustments)**

```bash
git status --short
```

---

