# Midnight Inventory — Project Guidelines

This document is the source of truth for design, UX, structure, and implementation decisions. Read it before making UI or layout changes. When a new requirement is confirmed, add it here before implementing it.

## Product direction

- Build an inventory information system using React, TypeScript, Vite, Tailwind CSS v4, shadcn-compatible structure, Animate UI-compatible motion, and a local SQLite server.
- Keep the application focused on four major pages:
  - Dashboard
  - Products
  - Product Details
  - Reorder Center
  - Inventory Reports
- Keep CRUD behavior behind `client/src/lib/api.ts`. Pages must not access `localStorage` directly.
- Store product records in SQLite through the local HTTP server. Reorder requests and recent activity remain in localStorage for now.

## Reference image rules

- `Image Reference/image.png` is a layout and proportion reference only.
- Do not copy its placeholder content, labels, profile names, settings, logout items, avatars, or skeleton data.
- Use the reference to understand spacing, navigation placement, content alignment, and the relationship between the sidebar and main content.
- Do not treat the screenshot’s frame as permission to add a large outer shell around the Dashboard.

## Application shell and sidebar

- The app should occupy the viewport directly; do not add a large rounded outer wrapper around the entire Dashboard.
- The sidebar and main content belong directly to the page body.
- The sidebar must remain functional and collapsible.
- Expanded sidebar:
  - Shows the logo and “Midnight Inventory” title.
  - Shows navigation labels.
  - Shows the lower “Inventory team” label.
- Collapsed sidebar:
  - Shows the logo only in the brand area.
  - Shows icons without navigation text.
  - Shows the `MI` mark without the “Inventory team” text.
- Sidebar navigation must contain only:
  - Dashboard
  - Products
  - Product Details
  - Inventory Reports
- Use React Router links. Do not use regular `href` navigation for internal routes because it causes page reloads and visual flashes.
- Do not change sidebar sizing, height, collapse behavior, or lower identity behavior when making unrelated Dashboard changes.
- Keep Documentation as a lower sidebar destination above the Inventory team identity. It documents the API-layer boundary only; do not expose every project file.

## Reorder Center

- The sidebar navigation label is “Reorder Center”; Product Details remains a contextual route reached by selecting a product name in the Products table.
- `/reorder` shows only products with stock quantity less than or equal to 10.
- The page includes reorder KPIs, search, category and supplier filters, and an opaque bordered rounded table with Product, Category, Supplier, Current Stock, Status, Reorder Priority, and Actions columns.
- Priority is Critical for 0–3 units, High for 4–6 units, and Medium for 7–10 units.
- The Edit product action reuses the existing themed product modal. No browser-native confirmation dialogs are allowed.

## Dashboard layout

- Keep four KPI tiles across the top on desktop, with enough spacing that values and labels never feel compressed.
- Use rounded, consistent KPI surfaces.
- Keep “Products by category” and “Stock check” as the two primary lower Dashboard components.
- These are boxed components, not tables.
- Do not add Recent activity or another Dashboard component unless explicitly approved.
- Do not force arbitrary height that creates empty visual space. The composition should fit the default viewport through intentional spacing and useful content.

## Products and tables

- The `/products` page is the primary visible table workspace.
- Show four operational KPIs above the Products table: Total products, Active products, Low-stock items, and Inventory value.
- Place search and category/status filters between the KPI row and the main table.
- The Products table must clearly show product name, category, supplier, price, stock quantity, status, and actions.
- Use proper table headers, aligned numeric columns, readable row spacing, and visible edit/delete actions.
- Add and Edit use themed modal forms, not separate pages.
- Delete uses a themed in-app confirmation dialog, never the browser’s native confirmation prompt.
- Reports may use tables for analytical summaries, but do not move the Products table into the Dashboard.

## Visual language

- Theme name: Modern Midnight Inventory.
- Use deep charcoal/navy backgrounds, graphite surfaces, subtle borders, electric lime for primary actions, amber for warnings, and coral for destructive actions.
- Use consistent rounded corners, targeting approximately 8px for controls and panels.
- Keep the UI professional and enterprise-level:
  - Clear hierarchy
  - Dense but readable information
  - Predictable alignment
  - Strong table structure
  - Minimal decorative content
  - Consistent loading, empty, error, and success states
- Avoid generic dashboard mosaics, oversized decorative shells, random gradients, excessive pills, and ornamental copy.

## Motion and accessibility

- Motion should clarify state changes: sidebar expansion, modal entrance/exit, button feedback, and route transitions.
- Respect `prefers-reduced-motion`.
- Dialogs need accessible labels, focus behavior, keyboard operation, and escape/close handling.
- Interactive elements need visible focus states and useful accessible names.

## Code organization

- Keep `client/src/App.tsx` limited to application routing.
- Put reusable UI primitives in `client/src/components/ui/`.
- Put shared layout components in `client/src/components/layout/`.
- Put page-level features in `client/src/pages/`.
- Put product-specific components in `client/src/components/products/`.
- Put storage/API logic and formatters in `client/src/lib/`.
- Keep types in `client/src/types/`.
- Prefer readable, multi-line TypeScript over compressed one-line components.
- Reuse existing components and styles before introducing new abstractions.

## Verification before completion

- Run `npm run build`.
- Run `npm test`.
- Verify the requested visual change without changing unrelated areas.
- For layout changes, check desktop and mobile behavior.
- If visual browser tooling is available, inspect a screenshot before claiming visual completion.
- Report changed files, behavior preserved, verification performed, and known limitations.
