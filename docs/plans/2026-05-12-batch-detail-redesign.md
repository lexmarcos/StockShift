# Batch Detail Page Redesign — "Hero Expiration"

## Problem
- Batch code repeated multiple times on screen
- Buttons not mobile-ready
- Page not mobile-first
- No emphasis on batch expiration
- Information too spaced out

## Design

### Priority: Validade + Estoque → Financeiro → Info secundária

### Section 1 — Header
- Title: product name (not batch code)
- Subtitle: "Detalhe do lote"
- Desktop: Edit/Delete buttons in header
- Mobile: Clean header, actions in FixedBottomBar

### Section 2 — Hero Card (Expiration + Stock)
- Single card combining the two most important pieces of info
- Batch code as small mono badge + status badge (once only)
- Left: Expiration countdown (big number + "dias restantes" + date)
- Right: Stock quantity (big number + "unidades" + low stock threshold)
- Bottom: Status description text
- No stock meter bar
- Colors dynamic by status (emerald/amber/rose)
- On mobile: two blocks stack vertically

### Section 3 — Financial Grid (2x2)
- Cost unit / Selling unit / Margin / Total invested
- No separate icon boxes — direct labels + bold values
- Margin with dynamic color

### Section 4 — Info Section
- Product link
- Warehouse name + link
- Origin movement code + link (or "Criado manualmente")
- Dates: manufacture, registration, last update — compact inline

### Section 5 — FixedBottomBar (mobile only)
- Edit (primary blue) + Delete (outline rose)
- Hidden on md+
