# Brand Management Interface Design

**Date**: 2025-12-30
**Status**: Approved
**Type**: Feature Implementation

## Overview

Single-page brand management interface with table listing and modal-based create/edit functionality. Brands are simple entities with only name and logo URL fields.

## Architecture & Page Structure

### File Structure
```
app/brands/
├── page.tsx              # ViewModel - orchestrates model & view
├── brands.model.ts       # All logic, state, hooks, API calls
├── brands.view.tsx       # Pure JSX/UI components
├── brands.types.ts       # TypeScript interfaces
└── brands.schema.ts      # Zod validation for form
```

### Key Architectural Decisions

1. **Single State Management**: The model manages both table data (from SWR) and modal state (open/closed, create/edit mode, selected brand)

2. **Optimistic Updates**: Use SWR's `mutate` to update UI immediately, rollback on error

3. **Modal Component**: Reusable modal serves both create and edit modes, determined by whether a `selectedBrand` exists in state

4. **Client-Side Operations**: Search and sorting are client-side for instant feedback since API returns all brands at once

5. **Responsive Pattern**: Mobile-first with sticky header, main content area with table, and floating action button for "New Brand" on mobile

## Data Management & API Integration

### SWR Data Fetching
```typescript
const { data, error, isLoading, mutate } = useSWR<BrandsResponse>(
  'brands',
  async () => api.get('brands').json<BrandsResponse>()
);
```

### CRUD Operations Flow

**Create Brand:**
- Validate form with Zod schema
- POST to `/api/brands` with `{ name, logoUrl }`
- On success: call `mutate()` to refresh data, close modal, show toast
- On error: display error message (e.g., duplicate name)

**Edit Brand:**
- Pre-populate modal with selected brand data
- PUT to `/api/brands/{id}` with updated fields
- Optimistic update: immediately update UI, rollback on failure
- Handle duplicate name validation

**Delete Brand:**
- Show confirmation dialog (shadcn AlertDialog)
- DELETE to `/api/brands/{id}`
- If error (brand has products): show specific error message
- On success: optimistically remove from list

### State Management in Model
```typescript
const [isModalOpen, setIsModalOpen] = useState(false);
const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
const [searchQuery, setSearchQuery] = useState("");
const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
```

Model exposes: `openCreateModal()`, `openEditModal(brand)`, `handleDelete(id)`, and computed values like `filteredAndSortedBrands`.

## UI Components & Layout

### Page Layout Structure

**Sticky Header:**
- Page title "Marcas" with icon
- Description: "Gerencie as marcas dos produtos"
- Desktop: "Nova Marca" button in header
- Mobile: Floating action button (FAB) at bottom-right

**Main Content - Data Table:**
- Search input at top: "Buscar por nome..."
- Table columns:
  - **Logo**: Thumbnail (48x48) with fallback placeholder icon
  - **Nome**: Brand name (sortable)
  - **Criado em**: Creation date formatted (sortable)
  - **Ações**: Edit and Delete icon buttons
- Column headers clickable for sorting with arrow indicators
- Responsive: On mobile, simplified card layout instead of table

**Empty State:**
- Icon (Package or Tag)
- "Nenhuma marca cadastrada"
- "Adicione sua primeira marca para organizar produtos"
- Primary button: "Criar Marca"

**Modal Form (shadcn Dialog):**
- Dynamic title: "Nova Marca" or "Editar Marca"
- Fields:
  - Name input (required, max 255 chars)
  - Logo URL input (optional, max 500 chars)
  - Logo preview below URL field (shows when valid URL)
- Footer: Cancel + Save buttons
- Loading state on submit

**Visual Style**: "Dark Premium Tech" design with cards, rounded corners, subtle shadows, and the icon-box pattern from products page.

## Features & User Interactions

### Search Functionality
- Real-time client-side filtering as user types
- Case-insensitive search on brand name
- Shows "Nenhum resultado encontrado" if search returns empty

### Sorting Implementation
- Click column header to toggle sort direction
- Visual indicator: arrow up/down icon next to column name
- Default: Sort by name (A-Z)
- Sortable columns: Name (alphabetical), Created At (chronological)
- Logic in model: `useMemo` to compute sorted array

### CRUD Interactions

**Create Flow:**
1. Click "Nova Marca" → Modal opens with empty form
2. Fill name (required), optionally add logo URL
3. Preview updates in real-time as URL is typed
4. Click "Salvar" → Loading state → Success toast → Modal closes → Table refreshes

**Edit Flow:**
1. Click edit icon on row → Modal opens pre-filled
2. Modify fields → Save → Optimistic UI update
3. If duplicate name error: show inline error, keep modal open

**Delete Flow:**
1. Click delete icon → Confirmation AlertDialog appears
2. "Tem certeza que deseja excluir 'Natura'?"
3. Confirm → API call → Success: remove from table
4. Error (has products): Toast with specific message

**Logo Preview Logic:**
- When URL changes, validate if it's a valid URL format
- Show `<img>` with the URL, fallback to placeholder on error
- Size: 120x120 preview in modal

## Validation & Error Handling

### Form Validation (Zod Schema)
```typescript
brandSchema = z.object({
  name: z.string()
    .min(1, "Nome é obrigatório")
    .max(255, "Nome deve ter no máximo 255 caracteres"),
  logoUrl: z.string()
    .url("URL inválida")
    .max(500, "URL deve ter no máximo 500 caracteres")
    .optional()
    .or(z.literal("")) // Allow empty string
});
```

### Error Scenarios & Handling

**400 - Duplicate Name:**
- API returns: "Já existe uma marca com este nome"
- Show inline error on name field
- Keep modal open for correction

**404 - Brand Not Found (on edit/delete):**
- Toast error: "Marca não encontrada"
- Refresh table data via `mutate()`

**400 - Cannot Delete (has products):**
- API returns: "Não é possível deletar marca com produtos vinculados"
- Show detailed toast: "Esta marca possui produtos. Remova-os primeiro."

**403 - Forbidden:**
- Hide action buttons based on permissions
- If API still returns 403: "Você não tem permissão para esta ação"

**Network Errors:**
- Generic toast: "Erro de conexão. Tente novamente."
- Retry option via SWR

### Loading States
- Initial page load: Skeleton table rows
- Submitting form: Disable inputs, show spinner on button
- Deleting: Optimistic removal with rollback on error

### Edge Cases
- Empty brand list: Show empty state
- Invalid logo URL: Show broken image icon in preview
- Long brand names: Truncate with ellipsis in table

## Technical Requirements

### Dependencies (Already Installed)
- `react-hook-form` - Form state management
- `@hookform/resolvers/zod` - Zod integration
- `zod` - Schema validation
- `swr` - Data fetching and cache
- `ky` - HTTP client
- `sonner` - Toast notifications
- `lucide-react` - Icons

### shadcn/ui Components Used
- Dialog (modal)
- AlertDialog (delete confirmation)
- Table
- Form components (Input, Button, etc.)
- Card (for mobile layout)
- Badge (optional, for status)

## API Endpoints

Following `/docs/endpoints/brands.md`:

- `GET /api/brands` - List all brands
- `POST /api/brands` - Create brand
- `GET /api/brands/{id}` - Get single brand
- `PUT /api/brands/{id}` - Update brand
- `DELETE /api/brands/{id}` - Delete brand (soft delete)

## Success Criteria

- [ ] Users can view all brands in a sortable, searchable table
- [ ] Users can create new brands via modal form
- [ ] Users can edit existing brands via modal form
- [ ] Users can delete brands (with confirmation)
- [ ] Logo preview works correctly in modal
- [ ] Appropriate error messages for all failure scenarios
- [ ] Mobile-responsive layout (table → cards on small screens)
- [ ] Loading states for all async operations
- [ ] Follows MVVM architecture pattern
- [ ] Supports light/dark mode
- [ ] All text in Portuguese (BR)
