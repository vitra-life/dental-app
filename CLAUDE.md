# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A dental clinic management app, **دنتاکلینیک**. The UI is entirely in Persian (Farsi) and right-to-left. It was generated in Bolt (`bolt-vite-react-ts` template) and runs as a single-page React 18 + TypeScript + Vite + Tailwind app on top of Supabase. It has no custom backend and no test suite.

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

**Data access:** every page calls the shared client in `src/lib/supabase.ts` directly with `supabase.from(...)`. There is no data layer, no React Query, and no global store. Each page defines a `load` callback (`useCallback` plus `Promise.all` across several tables) and uses PostgREST embedded selects for relations, e.g. `select('*, patient:patients(*), staff:staff(*)')`. Table row shapes live as hand-written interfaces in `src/lib/types.ts`, not generated types. Keep them in sync with the migrations.

**Business logic is client-side.** The database has no triggers or functions that keep derived fields up to date. Examples:
- `patients.balance` and the invoice `balance`/`status` are recalculated and written by `src/pages/Billing.tsx` when invoices or payments change.
- SMS sending in `src/pages/SMSPanel.tsx` has no real provider. It inserts `sms_campaigns` and `sms_messages` rows marked `sent`, then decrements credits in `sms_packages`.
- The "AI assistant" (`src/pages/AIAssistant.tsx`) calls no LLM. It computes insights from Supabase data and answers questions by matching Persian keywords.

A change to a derived value has to be made in every page that writes it.

**Supabase schema:** the source of truth is `supabase/migrations/*.sql`. It's single-tenant with no auth: `persistSession: false`, and RLS is enabled but every policy is `TO anon, authenticated USING (true)`. New tables should follow the same pattern: an explanatory comment block at the top, `CREATE TABLE IF NOT EXISTS`, and `DROP POLICY IF EXISTS` before each `CREATE POLICY`. The client reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env`, which is gitignored.

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
- Dates are stored in the database as ISO/Gregorian values.
