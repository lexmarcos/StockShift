# Sidebar Navigation (Route Group `(pages)`) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a left sidebar navigation (desktop) and a drawer menu (mobile) for internal pages using the `(pages)` route group, without changing URLs.

**Architecture:** Move internal routes under `app/(pages)/` and add an app shell layout that renders a reusable sidebar component. The layout controls the mobile drawer state. Each item uses Next.js links and highlights the active route via `usePathname()`.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui (Sheet), lucide-react.

### Task 1: Create reusable sidebar component

**Files:**
- Create: `components/layout/app-sidebar.tsx`

**Step 1: Write the failing test**

Create test:
`components/layout/app-sidebar.test.tsx`

```tsx
it("highlights active route", () => {
  // mock usePathname to return "/products"
  // render AppSidebar
  // expect Products item to have active styles/aria-current
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test components/layout/app-sidebar.test.tsx`  
Expected: FAIL (component not found).

**Step 3: Implement minimal component**

```tsx
export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = [
    { href: "/products", label: "Produtos", icon: Package },
    { href: "/batches", label: "Batches", icon: Layers },
    { href: "/brands", label: "Marcas", icon: Tag },
    { href: "/categories", label: "Categorias", icon: Folder },
    { href: "/stock-movements", label: "Movimentações", icon: ArrowLeftRight },
  ];
  // render list, active item uses aria-current
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test components/layout/app-sidebar.test.tsx`  
Expected: PASS.

**Step 5: Commit**

```bash
git add components/layout/app-sidebar.tsx components/layout/app-sidebar.test.tsx
git commit -m "feat: add reusable app sidebar"
```

### Task 2: Add `(pages)` layout with sidebar and drawer

**Files:**
- Create: `app/(pages)/layout.tsx`

**Step 1: Write failing test**

Skip (layout integration; no existing tests).

**Step 2: Implement layout**

- Desktop: `aside` fixed width, content `max-w-7xl`.
- Mobile: add menu button to open `Sheet` drawer.
- Use `AppSidebar` inside both desktop and drawer.

**Step 3: Commit**

```bash
git add app/(pages)/layout.tsx
git commit -m "feat: add pages layout with sidebar shell"
```

### Task 3: Move internal routes to `(pages)`

**Files:**
- Move: `app/products` → `app/(pages)/products`
- Move: `app/batches` → `app/(pages)/batches`
- Move: `app/brands` → `app/(pages)/brands`
- Move: `app/categories` → `app/(pages)/categories`
- Move: `app/stock-movements` → `app/(pages)/stock-movements`

**Step 1: Move directories**

Use shell moves (preserve git history).

**Step 2: Fix imports if needed**

Update any absolute imports that reference moved paths if required (likely none, due to aliasing).

**Step 3: Commit**

```bash
git add app/(pages)
git commit -m "refactor: move internal pages into route group"
```

### Task 4: Final verification

**Step 1: Run full test suite**

Run: `pnpm test`  
Expected: PASS (note existing baseline failures; proceed as instructed).

**Step 2: Final commit (if needed)**

If fixes required:
```bash
git add <files>
git commit -m "fix: address sidebar integration issues"
```
