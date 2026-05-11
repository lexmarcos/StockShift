# React Doctor Progress

- Initial score: 66/100 (`react-doctor-before.json`, 1095 warnings, 0 errors).
- Final score: 95/100 (`react-doctor-final.json`, 41 warnings, 0 errors).
- React Doctor version used for saved reports: 0.1.4.

## Diagnostics Fixed

- Removed hydration-prone `new Date(...)` usage from JSX render paths.
- Replaced chained `filter().map()` / `map().filter()` patterns with single-pass logic.
- Removed unused exported types and unused UI imports.
- Added missing passive listener handling for visual viewport scroll.
- Removed `useSearchParams` from client models/pages by passing page query values as props.
- Reworked chart tooltip rendering to avoid memoized JSX before early return.
- Code-split direct Recharts usage in dashboard and sales chart views.
- Replaced related AI-fill modal state with a reducer.
- Replaced online-status effect state with `useSyncExternalStore`.
- Removed redundant draft state updates and transient total pulse state.
- Replaced inline mobile filter render helpers and new-product badge helper with stable JSX/component usage.

## Commands Run

- `npx -y react-doctor@latest . --json --full --offline > react-doctor-before.json`
- `/home/lexmarcos/.npm/_npx/81e833f6d16d6127/node_modules/.bin/react-doctor . --json --full --offline > react-doctor-final.json`
- `pnpm test`
- `pnpm test 'app/(pages)/sales/infinitepay/callback/infinitepay-callback.model.test.ts' 'app/(pages)/sales/infinitepay/result/infinitepay-result.model.test.ts'`
- `pnpm lint`
- `NEXT_PUBLIC_API_URL=http://localhost:9000 pnpm build`

Note: refreshing via `npx -y react-doctor@latest` hit registry DNS/network restrictions, and network escalation for downloading/executing `@latest` was rejected. Final verification used the cached local React Doctor 0.1.4 binary, which matches the version recorded in the before report.

## Remaining Warnings

- Large view components and boolean prop clusters remain. Splitting these broad pages would be product-level refactoring with higher regression risk, and the target score is already met.
- `isLoading` state in login/register/change-password remains because it represents async request state, not a React transition.
- Some effect warnings remain where effects synchronize form state, selected warehouse filters, file previews, or client-only draft validation. These are behavior-bearing effects, not safe cosmetic moves.
- The remaining client-side redirects depend on client-only draft/localStorage validation and toast feedback.
- `components/ui/chart.tsx` still statically wraps Recharts as a shared shadcn-style API; page-level direct Recharts imports were code-split without changing that shared public wrapper.
