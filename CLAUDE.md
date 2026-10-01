# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A dental clinic management app, **دنتاکلینیک**. The UI is entirely in Persian (Farsi), right-to-left, and shows every date in the Jalali calendar. It runs as a single-page React 18 + TypeScript + Vite + Tailwind app with no backend: all data lives in the browser (see Data below).

`README.md` is the overview for people, `docs/architecture.md` has the full component list and step-by-step recipes, and `docs/project-structure.md` maps every file. Update that map when you add, move or remove a file.

## Commands

```bash
npm install
npm run dev         # Vite dev server
npm run build       # production build (Vite only, no type-check)
npm run typecheck   # tsc --noEmit -p tsconfig.app.json, unused code is an error
npm run lint        # eslint ., includes the kebab-case file-name rule
npm test            # vitest run
npx vitest run src/lib/date.test.ts          # one test file
npx vitest run -t "knows leap years"         # one test by name
npm run preview
```

`npm run build` does not type-check, so run `typecheck`, `lint` and `test` to verify changes.

Tests run in jsdom with the time zone pinned to Asia/Tehran (`vite.config.ts`). Tests that depend on "today" freeze the clock with `vi.setSystemTime`.

## Conventions

- Import project modules through the `@/` alias, which maps to `src/` (set in `vite.config.ts` and `tsconfig.app.json`). Use relative imports only between files of the same feature folder.
- Files and folders under `src/` are kebab-case (`patient-form.tsx`). Components keep PascalCase names in code. Lint fails otherwise.
- Use `lucide-react` for all icons and logos. Don't add UI, theme, or icon packages unless they're truly needed.
- New UI should look like the existing screens: build it from the components in `src/components/ui/`, the component classes in `src/index.css` and the color scales in `tailwind.config.js`, with the same white rounded cards, soft shadows, teal primary and Vazirmatn type. Don't introduce a new visual style.
- Write Tailwind class names out in full. Pick them from a lookup of complete names (see `src/components/ui/tones.ts`); a class assembled from pieces such as `bg-${tone}-50` is not generated.

## Architecture

**Navigation has no router.** `src/app.tsx` stores `currentPage: PageKey` in state and renders pages through a `switch`. To add a page:
1. Add its key to the `PageKey` union in `src/lib/types.ts`.
2. Create `src/features/<name>/<name>-page.tsx` and add a case in `app.tsx`.
3. Add a nav entry in `navItems` in `src/components/layout.tsx`.
4. Add it to the page list in `src/app.test.tsx`.

Pages that link elsewhere receive `onNavigate(page)` and `onOpenPatient(id)`. `onOpenPatient` sets `selectedPatientId` and switches to `patients`; `onNavigate` clears it.

**Layers:** `features/` (screens) → `components/` (shared UI) → `lib/` and `constants/` (plain TypeScript, no React). A feature folder owns one page: `<name>-page.tsx` loads data and holds state, dialogs and tabs sit beside it, and calculations go in `.ts` files with no JSX (`dashboard-stats.ts`, `ai-insights.ts`, `report-stats.ts`) so they can be tested alone. Features don't import from each other; shared code moves down a layer.

**Data:** there is no database or server. The data flows like this:
- `src/constants/seed/` holds the sample data, one typed array per table, assembled into `seedData` in `index.ts`.
  - Dates are relative to load time (`daysFromToday` / `timestampFromNow`), so "today" views always have content.
  - IDs are readable strings (`pat-01`, `inv-04`) and cross-reference each other.
  - Derived numbers must stay consistent when you edit the seed; `seed.test.ts` checks them.
- `src/lib/store.ts` (imported as `import * as db from '@/lib/store'`) is the only data API.
  - Reads: `list(table, where?)`, `get`, `first`.
  - Writes: `insert` / `insertMany` (fills column defaults, `id` and `created_at`), `update` / `updateWhere`, `remove` / `removeWhere`.
  - Query helpers: `orderBy`, plus `withOne` / `withMany` to attach related rows (e.g. `withOne(appts, 'patient', 'patients', 'patient_id')`).
  - It's synchronous and returns copies. Pages call `load()` again after writing.
- Every write is saved to localStorage under `dentaclinic:data:v1`. Settings → "بازنشانی داده‌ها" (reset data) calls `resetStore()` and reloads.
- Deletes follow the foreign-key rules in `store.ts` (`foreignKeys`: cascade or set null).
- Row shapes are the interfaces in `src/lib/types.ts`. The `Tables` map there ties table names to types.
- To add a table:
  1. Add its interface and a `Tables` entry.
  2. Add a `defaults` entry and any `foreignKeys` in `store.ts`.
  3. Add seed rows to `src/constants/seed/`.
- Bump the storage key when a change would make existing saved data invalid.

**Dates:** stored Gregorian (`YYYY-MM-DD`, `HH:MM[:SS]`, ISO timestamps for `created_at`), shown Jalali. `src/lib/date.ts` is the only file that touches `moment-jalaali` (Jalali conversion and display) and `date-fns` (Gregorian arithmetic).
- "Today" is `todayISO()`, in local time. `new Date().toISOString().split('T')[0]` gives the UTC date, which is the previous day until 03:30 in Iran.
- Display: `formatDate`, `formatDateShort`, `formatDateNumeric`, `getPersianDayName`. Weeks start on Saturday.
- Month-based figures (calendar, monthly revenue, this month vs last) use Jalali months: `currentJalaliMonth`, `shiftJalaliMonth`, `isInJalaliMonth`, `jalaliMonthGrid`.
- Every date field in a form is a `JalaliDateInput`, which takes and returns `YYYY-MM-DD`.

**Statuses:** `src/constants/status.ts` holds the label and badge colors for every status (appointment, invoice, lab order, treatment plan and item, SMS campaign and message, tooth). Render them with `StatusBadge` and `statusStyle(map, value, fallback)`; don't redefine a status map inside a component.

**Appointment slots:** working hours and slot length are in `src/constants/schedule.ts`; `src/lib/schedule.ts` derives `ALL_SLOTS`, `bookedSlots` and `findFreeSlots`. The appointments page and the assistant both use them.

**Business logic is client-side.** Nothing keeps derived fields up to date automatically. Examples:
- Invoice `balance` and `status` are written by `src/features/billing/invoice-detail.tsx`, and `syncPatientBalance` (`patient-balance.ts`) recomputes `patients.balance` from the patient's invoices.
- SMS sending in `src/features/sms/campaign-form.tsx` has no real provider. It inserts `sms_campaigns` and `sms_messages` rows marked `sent`, then decrements credits in `sms_packages`.
- The "AI assistant" (`src/features/ai-assistant/ai-insights.ts`) calls no LLM. It computes insights from the store's data and answers questions by matching Persian keywords.

A change to a derived value has to be made in every place that writes it.

**UI kit:** `src/components/ui/`. The ones to reach for first: `PageHeader`, `Tabs`, `Modal`, `StatusBadge`, `StatTile` / `MiniStat`, `SectionHeader`, `BarChart`, `ProgressBar`, `ChoiceChips`, `Skeleton`, `EmptyState`, `JalaliDateInput`.
- Toasts: call `showToast(message, 'success' | 'error' | 'info')` from `@/lib/toast`; `<ToastContainer />` is mounted once in `app.tsx`.
- Reusable Tailwind component classes are defined in `src/index.css` under `@layer components`, e.g. `card`, `btn-primary`, `btn-secondary`, `input-field`, `label-field`, `badge`, `nav-item`. Prefer them over re-spelling utility classes.
- Color scales are defined in `tailwind.config.js`. The app uses `primary` (teal), `secondary` (blue), `accent` (green, for success and completed states), `warning`, `error` and `surface` (grays).

## Localization / RTL

- `index.html` sets `lang="fa" dir="rtl"` and loads the Vazirmatn font. Layout is mirrored: the sidebar is fixed on the right (`right-0`, `border-l`). Keep that in mind when using directional utilities.
- All user-facing strings are Persian literals written inline; there is no i18n layer.
- Numbers shown to the user go through `formatNumber` or `formatCurrency` (`src/lib/format.ts`) so they use Persian digits; `formatCurrency` appends تومان. `formatTime` uses a صبح/بعدازظهر (AM/PM) suffix, `fullName` builds a person's name with a fallback, and `paymentMethodLabel` translates payment methods.
