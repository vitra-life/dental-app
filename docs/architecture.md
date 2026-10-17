# Architecture

This document explains how the app is put together and gives step-by-step recipes for the most common changes.

## The big picture

The app is a single page. Patients, appointments and services come from the backend, Dental-Api; every other table still lives in the browser. Three layers sit on top of each other:

1. **Data**
   - `src/data/`: TanStack Query hooks for the tables served by Dental-Api, over the typed client in `src/lib/api/`.
   - `src/lib/store.ts` + `src/constants/seed/`: an in-memory copy of every other table, seeded from sample data and saved to localStorage.
2. **Domain helpers** (`src/lib/`, `src/constants/`): dates, formatting, appointment slots, revenue figures and status definitions. They are plain TypeScript with no React.
3. **Screens** (`src/features/`, `src/components/`): React components that read through the hooks and the store, show the data and write changes back.

A screen never calls `fetch`, localStorage or the seed files directly.

## Navigation

There is no router. `src/app.tsx` keeps the current page in state (`currentPage: PageKey`) and renders the matching page component inside `Layout`.

`Layout` is a full-height frame: a sidebar that can be collapsed to icons, a top bar, and a `<main>` area that scrolls and adds the page padding. The window itself never scrolls.

Two callbacks are passed down to the pages that need them:

- `onNavigate(page)` switches page.
- `onOpenPatient(patientId)` switches to the patients page and opens that patient's record.

The patient record is a full page: the patients page shows either the list or the record, with a breadcrumb back to the list.

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
| `Tabs` | A segmented tab bar (pills on a soft track) |
| `Modal` | A dialog |
| `StatusBadge` | A coloured pill for a status from `constants/status.ts` |
| `StatTile` | A summary figure: label, value, optional note and icon |
| `SectionHeader`, `IconBox` | The title row of a card, and a tinted icon square |
| `AreaTrend`, `Bars`, `Donut` | Charts (the only place `recharts` is imported) |
| `ProgressBar` | A thin progress bar |
| `ChoiceChips` | A single-choice row of pill buttons: list filters and form choices |
| `JalaliDateInput` | Every date field (see Dates below) |
| `Avatar` | Initials on a soft gradient tile |
| `Skeleton`, `SkeletonList` | Loading placeholders |
| `EmptyState` | The "nothing here yet" block |
| `ToastContainer` | Renders toasts; call `showToast()` from `lib/toast.ts` to show one |

Reusable classes (`card`, `btn-primary`, `btn-secondary`, `btn-ghost`, `btn-danger`, `btn-chip`, `input-field`, `label-field`, `badge`, `stat-card`, `nav-item`) are defined in `src/index.css` as `@utility` rules. The colour scales are in the `@theme` block of the same file; the app uses `primary` (cyan), `secondary`, `accent`, `warning`, `error` and `surface`, plus Tailwind's `violet` for the assistant.

The project uses Tailwind CSS 4, which has no `tailwind.config.js`: the theme lives in CSS and Tailwind runs as a Vite plugin. Two things to remember when writing classes:

- Write gradients as `bg-linear-to-br/srgb`. The `/srgb` keeps the blend the same as the rest of the app.
- The first `@layer base` block in `src/index.css` restores a few defaults that Tailwind 4 changed (border colour, button cursor, some input padding). Leave it in place.

Tailwind only sees class names that are written out in full. Build a class from a lookup table of complete names (as `components/ui/tones.ts` does), never by joining pieces such as `bg-${tone}-50`.

## Data

### Data from the API

Patients, appointments and services are read and written only through the hooks in `src/data/`:

| Hook | What it gives |
|---|---|
| `usePatients()` | Every patient, newest first (the API pages the list; the hook reads all pages) |
| `usePatient(id)` | One patient |
| `useAppointments(range?)` | Appointments in the shared window (7 Jalali months back to 90 days ahead), by date and time, with `patient` and `service` attached |
| `usePatientAppointments(id)` | One patient's whole history, newest first |
| `useServices()` | The service catalogue; filter on `active` for booking lists |
| `useClinicData()` | The three together, for the dashboard, reports and assistant |

Writes are mutations (`useCreatePatient`, `useUpdatePatient`, `useCreateAppointment`, `useUpdateAppointment`, `useSetAppointmentStatus`, `useCreateService`, `useUpdateService`, `useDeleteService`). Call `mutateAsync` in a `try`, toast the result, and let the mutation's invalidation refresh the screens.

Things to know:

- **Types** come from the backend's Swagger. After an API change, run `npm run api:types` with the backend running, then fix what TypeScript reports.
- **Mapping** happens only in `src/lib/api/mappers.ts`. The API says `client`, `description` and Rial; the app says `patient`, `notes` and Toman. Appointment times arrive as UTC timestamps and become `appointment_date` + `start_time` / `end_time` in local time.
- **Errors** are `ApiError`s. `errorMessage(error)` gives a Persian message; a 400's `fieldErrors` names the invalid fields; `<LoadError>` replaces a screen whose data failed to load.
- **The clinic** is sent as the `x-clinic-id` header from `VITE_CLINIC_ID` until login exists. The generated types leave that header out, because the client's middleware adds it.
- **A patient's balance** is computed from the invoices in the browser store (`src/lib/patient-balance.ts`), not stored.

### The store

`src/lib/store.ts` is imported as `import * as db from '@/lib/store'`.

- **Reads:** `db.list(table, where?)`, `db.get(table, id)`, `db.first(table, where?)`.
- **Writes:** `db.insert`, `db.insertMany`, `db.update`, `db.updateWhere`, `db.remove`, `db.removeWhere`.
- **Query helpers:** `db.orderBy(rows, key, { ascending })`, `db.withOne(rows, 'lab', 'labs', 'lab_id')` to attach a parent row from the store, `db.withMany(rows, 'items', 'treatment_plan_items', 'plan_id')` to attach child rows, and `db.joinOne(rows, 'patient', patients, 'patient_id')` to attach rows that come from the API.

Things to know:

- The store is synchronous and returns copies. After a write, a page calls its own `load()` again to refresh what it shows.
- `insert` fills in the `id`, `created_at` and the column defaults listed in `defaults`.
- `remove` follows the rules in `foreignKeys`: child rows are either deleted with their parent (cascade) or have the reference cleared (set null).
- Nothing recalculates derived values for you, except that patient balances are computed from the invoices whenever they are shown.

### The sample data

`src/constants/seed/` holds one file per area. Rows that point at patients, services or appointments use `pat(n)`, `svc(n)` and `apt(n)` from `ids.ts`: the ids the backend's sample data used to have. The backend no longer creates those records, so these links point at nothing and the rows show without a patient or service name. `seed.test.ts` checks that the numbers agree: payments match `paid_amount`, items and instalments match the totals, and every reference points at a row that exists (patient, service and appointment references only need to be one of the `ids.ts` ids). Run `npm test` after editing the seed.

### Saved data

Everything in the store is saved under the localStorage key `dentaclinic:data:v2`. If you change a table in a way that makes old saved data invalid, bump the version in that key so browsers start again from the seed.

## Appointment slots and working hours

The clinic's opening hours per weekday are stored in `clinic_settings.working_hours` and edited in Settings → ساعات کاری. `src/lib/schedule.ts` turns them into bookable half-hour slots:

| Need | Use |
|---|---|
| The saved hours | `clinicWorkingHours()` |
| A day's slots (none on a closed day) | `workingSlots(date, hours)` |
| A day's free slots | `freeSlotsOn(date, thatDaysAppointments, hours)` |
| The next free slots | `findFreeSlots(appointments, days, limit, hours)` |

## Treatment plans

A plan belongs to a patient and has items. `src/lib/treatment-plans.ts` connects plans to the rest of the app:

- **Booking:** the appointment form lists the patient's open plan items. Choosing one fills in the service and price, and saving calls `linkAppointment`.
- **Status:** when an appointment's status changes, `syncPlanWithAppointment` completes the linked item (and the plan, when it was the last one) or frees the item if the appointment is cancelled.
- **Billing:** the invoice form can load a plan's done or in-progress items as invoice lines; the invoice keeps the plan in `treatment_plan_id`.
- **Templates:** Settings → طرح درمان holds reusable templates. `createPlanFromTemplate` creates a plan with one item per template line.

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

If the table is served by Dental-Api: run `npm run api:types`, add a mapper in `src/lib/api/mappers.ts` if the shapes differ, and a hooks file in `src/data/` with its query keys in `keys.ts`.

For a table kept in the browser:

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
