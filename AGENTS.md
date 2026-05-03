# StockShift Frontend

Next.js 15, TS, Tailwind CSS, shadcn/ui.

## Architecture (MVVM)
- Structure: Every page needs `.model.ts` (logic), `.view.tsx` (pure JSX), `.types.ts` (interfaces), `.schema.ts` (Zod), and `page.tsx` (ViewModel).
- Responsibilities: NO JSX in models. NO state/hooks/logic in views.
- Forms: Validate with Zod schemas and `react-hook-form`.

## Code Style
- Types: Explicit everywhere. No `any`.
- Endpoints: Always check `docs/endpoints/` before making API calls.
- Functions: 4-20 lines. Split if longer.
- Files: under 500 lines. Split by responsibility.
- One thing per function, one responsibility per module (SRP).
- Names: specific and unique. Avoid `data`, `handler`, `Manager`.
  Prefer names that return <5 grep hits in the codebase.
- Types: explicit. No `any`, no `Dict`, no untyped functions.
- No code duplication. Extract shared logic into a function/module.
- Early returns over nested ifs. Max 2 levels of indentation.
- Exception messages must include the offending value and expected shape.

## Dependencies

- Inject dependencies through constructor/parameter, not global/import.
- Wrap third-party libs behind a thin interface owned by this project.

## Components & UI
- Base: `/components/ui` using Tailwind + lucide-react (strokeWidth 2 or 2.5).
- Breadcrumbs: Use `useBreadcrumb` hook ONLY in child routes (e.g., `/products/[id]/edit`).
- Composites: Use standard wrappers `<PageContainer>`, `<PageHeader>`, `<FixedBottomBar>`.
- Feedback: Always handle loading (`<LoadingState>`), errors (`<ErrorState>`), and no-data (`<EmptyState>`), and format forms with `<FormSection>`.

## Responsive & Design System
- Layout: Mobile First -> Tablet (`md:`) -> Desktop (`max-w-7xl`).
- Sidebar Fix: Any `fixed` full-width element MUST include `md:ml-[240px]` to clear the sidebar.
- Theme: Dark-only brutalism. Background `#0A0A0A`, surfaces `#171717`, borders `neutral-800`.
- Accents: Primary `#2563EB`, Success `#059669`, Warning `#F59E0B`, Error `#E11D48`.
- Geometry & Interaction: 4px border radius everywhere. No shadows. No `rounded-full`. No animations (instant hover changes). Bold titles.

## Data Fetching
- Libraries: `swr` for caching + `ky` for HTTP requests.
- Encapsulation: All `useSWR` and `ky.get/.post` calls must be inside standard hooks in `.model.ts`.

## Tests
- Scope: Unit test `.model.ts` files ONLY.
- Workflow: Always ask to create model tests immediately after finishing a page implementation.
- Runner: Vitest (`pnpm test`).
- Every new function gets a test. Bug fixes get a regression test.
- Mock external I/O (API, DB, filesystem) with named fake classes,
  not inline stubs.
- Tests must be F.I.R.S.T: fast, independent, repeatable,
  self-validating, timely.

## Workflow & Commands
- Commands: `pnpm dev` (Dev), `pnpm test` (Test), `pnpm build` (Build).
- Automation defaults: email `pass@pass.com` / pw `test123`.
- If you use `pnpm build`, go to the `stockshift-frontend` GNU screen and restart `pnpm dev`