# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A dental clinic management app, **دنتاکلینیک**. The UI is entirely in Persian (Farsi) and right-to-left. It was generated in Bolt (`bolt-vite-react-ts` template) and runs as a single-page React 18 + TypeScript + Vite + Tailwind app with no backend: all data lives in the browser (see Data below). It has no test suite.

## Commands

```bash
npm install
npm run dev         # Vite dev server
npm run build       # production build (Vite only, no type-check)
npm run typecheck   # tsc --noEmit -p tsconfig.app.json
npm run lint        # eslint .
npm run preview
```

`npm run build` does not type-check, so run `typecheck` and `lint` to verify changes.

## Conventions (from `.bolt/prompt`)

- Import project modules through the `@/` alias, which maps to `src/` (set in `vite.config.ts`). Don't use deep relative paths.
- Use `lucide-react` for all icons and logos. Don't add UI, theme, or icon packages unless they're truly needed.
- Designs should look polished and production-ready, not generic templates.

## Architecture

**Navigation has no router.** `src/App.tsx` stores `currentPage: PageKey` in state and renders pages through a `switch`. To add a page:
1. Add its key to the `PageKey` union in `src/lib/types.ts`.
2. Add a case in `App.tsx`.
3. Add a nav entry in `navItems` in `src/components/Layout.tsx`.

Pages receive `onNavigate(page)` and, for cross-page links, `onOpenPatient(id)`. `onOpenPatient` sets `selectedPatientId` and switches to `patients`.

**Data:** there is no database or server. The data flows like this:
- `src/constants/` holds the sample data, one typed array per table, assembled into `seedData` in `index.ts`.
  - Dates are relative to load time (`dateOffset` / `timestampOffset` in `dates.ts`), so "today" views always have content.
  - IDs are readable strings (`pat-01`, `inv-04`) and cross-reference each other.
  - Derived numbers must stay consistent when you edit the seed: `patients.balance` equals the sum of open invoice balances, and payments add up to each invoice's `paid_amount`.
- `src/lib/store.ts` (imported as `import * as db from '@/lib/store'`) is the only data API.
  - Reads: `list(table, where?)`, `get`, `first`.
  - Writes: `insert` / `insertMany` (fills column defaults, `id` and `created_at`), `update` / `updateWhere`, `remove` / `removeWhere`.
  - Query helpers: `orderBy`, plus `withOne` / `withMany` to attach related rows (e.g. `withOne(appts, 'patient', 'patients', 'patient_id')`).
  - It's synchronous and returns copies. Pages call `load()` again after writing.
- Every write is saved to localStorage under `dentaclinic:data:v1`. Settings → "بازنشانی داده‌ها" (reset data) calls `resetStore()` and reloads.
- Deletes follow the foreign-key rules in `store.ts` (`foreignKeys`: cascade or set null), matching the old SQL schema.
- Row shapes are the interfaces in `src/lib/types.ts`. The `Tables` map there ties table names to types.
- To add a table:
  1. Add its interface and a `Tables` entry.
  2. Add a `defaults` entry and any `foreignKeys` in `store.ts`.
  3. Add seed rows to `src/constants/`.
- Bump the storage key when a change would make existing saved data invalid.

**Business logic is client-side.** Nothing keeps derived fields up to date automatically. Examples:
- Invoice `balance` and `status` are written by `src/pages/Billing.tsx`, and `syncPatientBalance` there recomputes `patients.balance` from the patient's invoices.
- SMS sending in `src/pages/SMSPanel.tsx` has no real provider. It inserts `sms_campaigns` and `sms_messages` rows marked `sent`, then decrements credits in `sms_packages`.
- The "AI assistant" (`src/pages/AIAssistant.tsx`) calls no LLM. It computes insights from the store's data and answers questions by matching Persian keywords.

A change to a derived value has to be made in every page that writes it.

**UI kit:**
- Shared primitives: `src/components/ui/` (Modal, StatCard, EmptyState, Toast).
- Toasts use a module-level singleton. Call `showToast(message, 'success' | 'error' | 'info')` from anywhere; `<ToastContainer />` is mounted once in `App.tsx`.
- Reusable Tailwind component classes are defined in `src/index.css` under `@layer components`, e.g. `card`, `btn-primary`, `btn-secondary`, `input-field`, `label-field`, `badge`, `nav-item`. Prefer them over re-spelling utility classes.
- Color scales `primary`, `surface`, `success`, `warning`, `error`, and so on are defined in `tailwind.config.js`.
- `src/components/DentalChart.tsx` is the per-tooth chart used in patient records.

## Localization / RTL

- `index.html` sets `lang="fa" dir="rtl"` and loads the Vazirmatn font. Layout is mirrored: the sidebar is fixed on the right (`right-0`, `border-l`). Keep that in mind when using directional utilities.
- All user-facing strings are Persian literals written inline; there is no i18n layer.
- Use the helpers in `src/lib/format.ts` for display:
  - `formatCurrency` uses `fa-IR` digits and appends تومان.
  - `formatDate` and `formatDateShort` output Persian calendar dates through `Intl`.
  - `formatTime` uses a صبح/بعدازظهر (AM/PM) suffix.
  - `getPersianDayName` gives weekday names, with the week starting on Saturday.
- Dates are stored as ISO/Gregorian values: `YYYY-MM-DD` for dates, `HH:MM:SS` for appointment times, and ISO timestamps for `created_at`.
