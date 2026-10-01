# Architecture

This document explains how the app is put together and gives step-by-step recipes for the most common changes.

## The big picture

The app is a single page with no server. Three layers sit on top of each other:

1. **Data** (`src/lib/store.ts` + `src/constants/seed/`): an in-memory copy of every table, seeded from sample data and saved to localStorage.
2. **Domain helpers** (`src/lib/`, `src/constants/`): dates, formatting, appointment slots, revenue figures and status definitions. They are plain TypeScript with no React.
3. **Screens** (`src/features/`, `src/components/`): React components that read through the store, show the data and write changes back.

A screen never talks to localStorage or to the seed files directly.

## Navigation

There is no router. `src/app.tsx` keeps the current page in state (`currentPage: PageKey`) and renders the matching page component.

Two callbacks are passed down to the pages that need them:

- `onNavigate(page)` switches page.
- `onOpenPatient(patientId)` switches to the patients page and opens that patient's record.

## Features

Each folder in `src/features/` owns one page:

| File | Role |
|---|---|
| `<name>-page.tsx` | The page component: loads data, holds page state, lays out the screen |
| `<thing>-form.tsx`, `<thing>-detail.tsx` | Dialogs opened from the page |
| `<name>-tab.tsx` | One tab of a tabbed page |
| `<name>-stats.ts`, other `.ts` files | Calculations with no JSX, so they can be tested alone |

A feature may import from `components/`, `constants/` and `lib/`. Features should not import from each other; shared code belongs in one of those three folders.

## Shared UI (`src/components/ui/`)

| Component | Use it for |
|---|---|
| `PageHeader` | The title, subtitle and action buttons at the top of a page |
| `Tabs` | An underlined tab bar |
| `Modal` | A dialog |
| `StatusBadge` | A coloured pill for a status from `constants/status.ts` |
| `StatCard`, `StatTile`, `MiniStat` | Summary figures (large, medium, compact) |
| `SectionHeader`, `IconBox` | The title row of a card and its tinted icon square |
| `BarChart`, `ProgressBar` | Simple charts |
| `ChoiceChips` | A single-choice row of pill buttons |
| `JalaliDateInput` | Every date field (see Dates below) |
| `Avatar` | Initials on a soft gradient tile |
| `Skeleton`, `SkeletonList` | Loading placeholders |
| `EmptyState` | The "nothing here yet" block |
| `ToastContainer` | Renders toasts; call `showToast()` from `lib/toast.ts` to show one |

Reusable classes (`card`, `btn-primary`, `btn-secondary`, `btn-ghost`, `btn-danger`, `input-field`, `label-field`, `badge`, `stat-card`, `nav-item`) are defined in `src/index.css` as `@utility` rules. The colour scales are in the `@theme` block of the same file; the app uses `primary`, `secondary`, `accent`, `warning`, `error` and `surface`.

The project uses Tailwind CSS 4, which has no `tailwind.config.js`: the theme lives in CSS and Tailwind runs as a Vite plugin. Two things to remember when writing classes:

- Write gradients as `bg-linear-to-br/srgb`. The `/srgb` keeps the blend the same as the rest of the app.
- The first `@layer base` block in `src/index.css` restores a few defaults that Tailwind 4 changed (border colour, button cursor, some input padding). Leave it in place.

Tailwind only sees class names that are written out in full. Build a class from a lookup table of complete names (as `components/ui/tones.ts` does), never by joining pieces such as `bg-${tone}-50`.

## Data

### The store

`src/lib/store.ts` is imported as `import * as db from '@/lib/store'`.

- **Reads:** `db.list(table, where?)`, `db.get(table, id)`, `db.first(table, where?)`.
- **Writes:** `db.insert`, `db.insertMany`, `db.update`, `db.updateWhere`, `db.remove`, `db.removeWhere`.
- **Query helpers:** `db.orderBy(rows, key, { ascending })`, `db.withOne(rows, 'patient', 'patients', 'patient_id')` to attach a parent row, `db.withMany(rows, 'items', 'treatment_plan_items', 'plan_id')` to attach child rows.

Things to know:

- The store is synchronous and returns copies. After a write, a page calls its own `load()` again to refresh what it shows.
- `insert` fills in the `id`, `created_at` and the column defaults listed in `defaults`.
- `remove` follows the rules in `foreignKeys`: child rows are either deleted with their parent (cascade) or have the reference cleared (set null).
- Nothing recalculates derived values for you. If you change an invoice's `balance`, call `syncPatientBalance` (in `features/billing/patient-balance.ts`).

### The sample data

`src/constants/seed/` holds one file per area. `seed.test.ts` checks that the numbers agree: patient balances match their open invoices, payments match `paid_amount`, and every reference points at a row that exists. Run `npm test` after editing the seed.

### Saved data

Everything is saved under the localStorage key `dentaclinic:data:v1`. If you change a table in a way that makes old saved data invalid, bump the version in that key so browsers start again from the seed.

## Dates

- **Stored:** Gregorian. Calendar dates are `YYYY-MM-DD`, appointment times are `HH:MM` or `HH:MM:SS`, and `created_at` is an ISO timestamp.
- **Shown:** Jalali, with Persian digits.

All of it goes through `src/lib/date.ts`:

| Need | Use |
|---|---|
| Today, or a day relative to today | `todayISO()`, `daysFromToday(n)`, `addDaysISO(date, n)` |
| Days until a date, overdue checks | `daysUntil(date)`, `isPast(date)` |
| Show a date | `formatDate` (`۹ مهر ۱۴۰۵`), `formatDateShort` (`۹ مهر`), `formatDateNumeric` (`۱۴۰۵/۰۷/۰۹`) |
| Weekday name | `getPersianDayName(date)` |
| Month views | `currentJalaliMonth()`, `shiftJalaliMonth`, `jalaliMonthGrid`, `formatJalaliMonth`, `isInJalaliMonth` |
| A date field in a form | `<JalaliDateInput value={iso} onChange={setIso} />` |

Do not use `new Date().toISOString().split('T')[0]` for "today". It returns the UTC date, which is yesterday for the first hours of the day in Iran.

## Recipes

### Add a page

1. Add its key to the `PageKey` union in `src/lib/types.ts`.
2. Create `src/features/<name>/<name>-page.tsx`.
3. Add a `case` for it in `src/app.tsx`.
4. Add a sidebar entry to `navItems` in `src/components/layout.tsx`.
5. Add it to the list in `src/app.test.tsx`.

### Add a table

1. Add its row interface to `src/lib/types.ts` and an entry to the `Tables` map there.
2. In `src/lib/store.ts`, add its column defaults to `defaults` and its references to `foreignKeys`.
3. Add sample rows in `src/constants/seed/` and include them in `seed/index.ts`.

### Add or change a status

Edit the matching map in `src/constants/status.ts` (label, badge colours, optional icon), and add the value to the type in `src/lib/types.ts`. Every screen that shows that status picks the change up through `StatusBadge`.

### Add a date field

Store it as `YYYY-MM-DD`, edit it with `JalaliDateInput` and show it with `formatDate`.

## Checks

Run all four before merging:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```
