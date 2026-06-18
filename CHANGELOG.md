# Changelog

### Added

- Added production-only Microsoft Clarity tracking.
- Added AI product image prompt generation, including prompt management, price overlay controls, image sharing support, and a dedicated prompt generation page.
- Added a stock movement detail page with model, view, types, and focused tests.
- Added IndexedDB-backed stock movement draft persistence and runtime recovery tracking.
- Added stock movement submit progress feedback.
- Added product form image processing locks to prevent submitting while images are still being processed.

### Changed

- Redesigned the main operational views for batches, products, catalog setup, sales, stock movements, system administration, transfers, and warehouses.
- Modernized the product detail page with a restructured layout and fixed bottom action bar.
- Moved product prompt generation out of the product prompt list flow and into its own page.
- Split product image dropzone UI states for clearer current, selected, removed, and processing behavior.
- Centralized dynamic chart component loading for the sales chart.
- Improved batch model state handling and authentication submit loading state clarity.

### Fixed

- Fixed Recharts client-only loading issues.
- Stabilized warehouse client hydration.
- Refined stock movement draft routing and cleaned up lingering debounce timers in tests.
- Fixed uploaded company logo preview rendering.
- Fixed iOS PWA product prompt sharing flows by restoring touch interaction, returning to the prompt list, and blocking unsupported file sharing when needed.
- Preserved product image removal state when a replacement file picker is cancelled.
- Autofilled prompt pricing from the latest batch after async batch data loads.
- Fixed prompt share cleanup callback types so production builds pass type checking.

### Maintenance

- Added a React Doctor report.
- Updated project agent instructions.
- Expanded model and browser tests around product prompts, stock movement details, draft storage, and image handling.
