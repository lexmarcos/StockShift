# System Page UX Refactor Design
Date: 2026-01-28
Status: Approved

## Overview
Refactor the System Management page (`/system`) to adhere strictly to the "Mobile First" and "Dark-Only" design principles. The goal is to improve usability for admins on all devices, moving away from a desktop-centric table view to an adaptive interface.

## 1. Architecture & Data Model
### Enhanced State Management
The `useSystemModel` will be updated to support granular filtering.
```typescript
interface FilterState {
  search: string;
  roleId: string | "all";
  status: "all" | "active" | "inactive";
}
```

### Derived Data
- **Initials Generator**: Helper function to create 2-letter avatars from names for card views.
- **Combined Filtering**: The `filteredAndSortedUsers` memo logic will include Role and Status checks.

## 2. Adaptive User Interface (Mobile First)
We will use a "Responsive Switcher" pattern using Tailwind breakpoints.

### Mobile View (`md:hidden`)
- **Layout**: Grid of Cards (1 column).
- **User Card Component**:
  - **Header**: Avatar (Initials) + Name + Status Badge (Top-right).
  - **Body**: Email + Role Tags + Warehouse.
  - **Footer**: Full-width "Edit" button (primary touch target) + "More" menu.
- **Styling**: High contrast borders (`border-border`), `#0A0A0A` background, no shadows.

### Desktop View (`md:block`)
- **Layout**: Enhanced Data Table.
- **Features**: Sortable columns, density optimized for information scanning.

### Adaptive Toolbar
- **Mobile**: Stacked layout. Search on top, horizontal scrollable "Chip" filters below.
- **Desktop**: Single row. Search + Dropdown Filters + "New User" button.

## 3. Interaction Design
### Forms (Create/Edit)
- **Mobile**: Full-screen layout or highly optimized Dialog.
  - Sticky footer for "Save/Cancel" buttons to avoid keyboard overlap issues.
  - **Role Selection**: Checkbox stack or large Toggle Group instead of tiny dropdowns.
- **Desktop**: Standard centered Modal.

### Feedback & Safety
- **Loading**: `UserCardSkeleton` for mobile view to match layout.
- **Empty States**: specialized messages based on active filters (e.g., "No inactive admins found") with a "Clear Filters" action.
- **Destructive Actions**: Use a bottom `Drawer` for confirmation on mobile (easier reach) vs `AlertDialog` on desktop.

## 4. Implementation Plan
1. **Update Model**: Add `FilterState` and update filtering logic.
2. **Create Components**:
   - `UserCard.tsx` (Mobile item)
   - `UserCardSkeleton.tsx`
   - `FilterBar.tsx` (Adaptive)
3. **Refactor View**: Implement the `md:hidden`/`md:block` switch and integrate new components.
4. **Refactor Modals**: Improve form responsiveness.
