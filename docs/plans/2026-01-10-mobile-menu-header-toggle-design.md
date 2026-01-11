# Mobile Menu Header Toggle - Design

**Purpose**
Ensure the existing header menu button opens the same mobile sidebar drawer used by the `(pages)` layout, and remove the redundant local menu button in that layout. This fixes the current disconnect where the header toggles its own state without affecting the drawer.

**Architecture**
Introduce a shared `MobileMenuProvider` context (`components/layout/mobile-menu-context.tsx`) with `isOpen`, `openMenu`, `closeMenu`, and `toggleMenu`. The provider will wrap the app in `app/layout.tsx`, so both the header and `(pages)` layout consume the same state. The header model will call `toggleMenu` from context, and the `(pages)` layout will render the overlay drawer when `isOpen` is true. This removes local state from the layout and ensures the button in the header is the single entry point on mobile.

**Data Flow**
1) User taps header menu button.
2) `Header` → `useHeaderModel` → `useMobileMenu().toggleMenu()`.
3) `(pages)` layout reads `isOpen` and conditionally renders the drawer.
4) Drawer closes via overlay click, close button, or navigation click, each calling `closeMenu`.

**UI/UX Constraints**
- Corporate solid dark palette, no animations, subtle borders.
- Rounded corners max 4px.
- Mobile-first layout; desktop sidebar remains visible.

**Testing**
Add tests to confirm:
- `useHeaderModel` calls `toggleMenu`.
- `(pages)` layout renders the drawer when `isOpen` and no longer renders the local menu button.

