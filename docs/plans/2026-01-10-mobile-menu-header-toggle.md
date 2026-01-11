# Mobile Menu Header Toggle Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the existing header menu button open the mobile sidebar drawer, and remove the redundant menu button from the `(pages)` layout.

**Architecture:** Introduce a `MobileMenuProvider` context in `app/layout.tsx` so both `components/header` and `app/(pages)/layout.tsx` share a single open/close state. The header model will call `toggleMenu`, and the `(pages)` layout will render the drawer based on `isOpen`. This removes the disconnected local state that currently prevents the drawer from opening.

**Tech Stack:** React 19, Next.js 15, TypeScript, Vitest, React Testing Library.

### Task 1: Add failing tests for header toggle + pages layout drawer

**Files:**
- Create: `components/header/header.model.test.ts`
- Create: `app/(pages)/layout.test.tsx`

**Step 1: Write the failing test (header model uses mobile menu context)**

```typescript
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHeaderModel } from "./header.model";

const toggleMenuMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/products",
}));

vi.mock("swr", () => ({
  default: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
}));

vi.mock("@/lib/contexts/auth-context", () => ({
  useAuth: () => ({
    user: null,
    logout: vi.fn(),
  }),
}));

vi.mock("@/lib/contexts/warehouse-context", () => ({
  useWarehouse: () => ({
    selectedWarehouseId: "wh-1",
    setSelectedWarehouseId: vi.fn(),
  }),
}));

vi.mock(
  "@/components/layout/mobile-menu-context",
  () => ({
    useMobileMenu: () => ({
      isOpen: false,
      openMenu: vi.fn(),
      closeMenu: vi.fn(),
      toggleMenu: toggleMenuMock,
    }),
  }),
  { virtual: true }
);

describe("useHeaderModel", () => {
  it("calls mobile menu toggle when opening menu", () => {
    const { result } = renderHook(() => useHeaderModel());

    act(() => {
      result.current.onToggleMobileMenu();
    });

    expect(toggleMenuMock).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test components/header/header.model.test.ts`

Expected: FAIL — `toggleMenuMock` not called (header still toggles local state).

**Step 3: Write the failing test (pages layout uses context + no local menu button)**

```typescript
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import PagesLayout from "./layout";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/products",
}));

vi.mock(
  "@/components/layout/mobile-menu-context",
  () => ({
    useMobileMenu: () => ({
      isOpen: true,
      openMenu: vi.fn(),
      closeMenu: vi.fn(),
      toggleMenu: vi.fn(),
    }),
  }),
  { virtual: true }
);

afterEach(() => cleanup());

describe("PagesLayout", () => {
  it("renders the drawer when mobile menu context is open and removes local menu button", () => {
    render(
      <PagesLayout>
        <div>Child</div>
      </PagesLayout>
    );

    expect(screen.queryByLabelText(/abrir menu/i)).toBeNull();
    expect(screen.getByLabelText(/fechar menu/i)).toBeTruthy();
  });
});
```

**Step 4: Run test to verify it fails**

Run: `pnpm test "app/(pages)/layout.test.tsx"`

Expected: FAIL — `Fechar menu` not found because drawer still uses local state + layout still has menu button.

**Step 5: Commit**

```bash
git add components/header/header.model.test.ts app/(pages)/layout.test.tsx
git commit -m "test: add failing tests for mobile menu wiring"
```

### Task 2: Create shared mobile menu context + wire header model

**Files:**
- Create: `components/layout/mobile-menu-context.tsx`
- Modify: `components/header/header.model.ts`
- Modify: `components/header/header.types.ts`

**Step 1: Minimal implementation (context provider + hook)**

```typescript
"use client";

import { createContext, useContext, useMemo, useState } from "react";

type MobileMenuContextValue = {
  isOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
};

const MobileMenuContext = createContext<MobileMenuContextValue | null>(null);

export const MobileMenuProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo(
    () => ({
      isOpen,
      openMenu: () => setIsOpen(true),
      closeMenu: () => setIsOpen(false),
      toggleMenu: () => setIsOpen((prev) => !prev),
    }),
    [isOpen]
  );

  return <MobileMenuContext.Provider value={value}>{children}</MobileMenuContext.Provider>;
};

export const useMobileMenu = () => {
  const context = useContext(MobileMenuContext);
  if (!context) {
    throw new Error("useMobileMenu must be used within MobileMenuProvider");
  }
  return context;
};
```

**Step 2: Wire header model to use context**

Update `components/header/header.model.ts`:
- Import `useMobileMenu`.
- Remove `useState` + `isMobileMenuOpen`.
- Replace `toggleMobileMenu` to call `toggleMenu` from context.
- Remove `isMobileMenuOpen` from returned object.

**Step 3: Update types**

In `components/header/header.types.ts`, remove `isMobileMenuOpen` from `HeaderViewProps` (view does not use it).

**Step 4: Run tests to verify they still fail (layout test should still fail)**

Run: `pnpm test components/header/header.model.test.ts`

Expected: PASS — header model now calls `toggleMenu`.

**Step 5: Commit**

```bash
git add components/layout/mobile-menu-context.tsx components/header/header.model.ts components/header/header.types.ts
git commit -m "feat: add mobile menu context and wire header toggle"
```

### Task 3: Wire `(pages)` layout to context + remove local menu button

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/(pages)/layout.tsx`

**Step 1: Wrap app with `MobileMenuProvider`**

Update `app/layout.tsx` to wrap `LayoutContent` and `children`:

```tsx
<MobileMenuProvider>
  <LayoutContent>{children}</LayoutContent>
</MobileMenuProvider>
```

**Step 2: Replace local state with context in `app/(pages)/layout.tsx`**

- Remove `useState` import and `menuOpen` state.
- Remove the `md:hidden` top bar with the local menu button.
- Use `const { isOpen, closeMenu } = useMobileMenu()`.
- Render overlay when `isOpen` is true, using `closeMenu` for backdrop, close button, and `AppSidebar` navigation.

**Step 3: Run test to verify it passes**

Run: `pnpm test "app/(pages)/layout.test.tsx"`

Expected: PASS — no local menu button, drawer renders with `isOpen`.

**Step 4: Run full related tests**

Run: `pnpm test components/header/header.model.test.ts app/(pages)/layout.test.tsx`

Expected: PASS.

**Step 5: Commit**

```bash
git add app/layout.tsx app/(pages)/layout.tsx
git commit -m "feat: connect mobile drawer to header toggle"
```

### Task 4: Verification sweep

**Step 1: Sanity check existing layout + header behavior**
- Manually confirm header menu button opens drawer on mobile view.
- Confirm drawer closes on overlay click, close button, and navigation click.

**Step 2: Optional full test run (if desired)**
Run: `pnpm test`

Expected: Existing failures may remain (known in workspace), but new tests should be green.

