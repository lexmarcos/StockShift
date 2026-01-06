# Batch Accordion Scroll Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a vertical scroll container to the batch accordion content so long forms are usable within the drawer.

**Architecture:** Apply a `max-h-[70vh] overflow-y-auto` wrapper inside the accordion content to avoid interfering with accordion animation. The change is UI-only and keeps existing MVVM/data flow intact.

**Tech Stack:** Next.js 15, React, Tailwind CSS, shadcn/ui, Vitest.

### Task 1: Add scroll container to batch accordion content (TDD)

**Files:**
- Modify: `app/products/components/product-form.view.tsx`
- Test: `app/products/components/product-form.view.test.tsx`

**Step 1: Write the failing test**

```tsx
render(
  <Wrapper
    {...baseProps}
    batchesDrawer={{ ...baseProps.batchesDrawer, isOpen: true }}
  />
);
fireEvent.click(screen.getByText(/batch-001/i));
const content = screen.getByText(/codigo do batch/i).closest("div");
expect(content?.className).toContain("max-h-[70vh]");
expect(content?.className).toContain("overflow-y-auto");
```

**Step 2: Run test to verify it fails**

Run: `pnpm test app/products/components/product-form.view.test.tsx`
Expected: FAIL (missing scroll classes)

**Step 3: Write minimal implementation**

```tsx
<AccordionContent>
  <div className="max-h-[70vh] overflow-y-auto pr-1">
    <div className="space-y-4 pb-2">
      {/* existing content */}
    </div>
  </div>
</AccordionContent>
```

**Step 4: Run test to verify it passes**

Run: `pnpm test app/products/components/product-form.view.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add app/products/components/product-form.view.tsx app/products/components/product-form.view.test.tsx
git commit -m "feat: add scroll to batch accordion content"
```
