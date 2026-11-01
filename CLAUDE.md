# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A dental clinic management app, **ویترا لایف**. The UI is entirely in Persian (Farsi), right-to-left, and shows every date in the Jalali calendar. It runs as a single-page React 19 + TypeScript + Vite + Tailwind CSS 4 app. Patients, appointments and services come from the backend, Dental-Api (`../Dental-Api`); the other tables still live in the browser (see Data below).

`README.md` is the overview for people, `docs/architecture.md` has the full component list and step-by-step recipes, and `docs/project-structure.md` maps every file. Update that map when you add, move or remove a file.

## Commands

```bash
npm install
npm run dev         # Vite dev server
npm run build       # production build (Vite only, no type-check)
npm run typecheck   # tsc on src/ and on vite.config.ts; unused code is an error
npm run lint        # eslint ., includes the kebab-case file-name rule
npm test            # vitest run
npx vitest run src/lib/date.test.ts          # one test file
npx vitest run -t "knows leap years"         # one test by name
npm run preview
npm run api:types   # regenerate src/lib/api/schema.d.ts from the running backend's Swagger
```

`npm run dev` needs Dental-Api on port 3000 (`npm run db:up`, `npm run db:seed` to create the dev clinic, `npm run start:dev` there; the database starts with no patients, services or appointments). `.env.development` sets `VITE_API_BASE_URL`; `.env.test` sets it for tests. Sign in with an account from Dental-Api's `npm run clinic:create`.

`npm run build` does not type-check, so run `typecheck`, `lint` and `test` to verify changes.

Tests run in jsdom with the time zone pinned to Asia/Tehran (`vite.config.ts`). Tests that depend on "today" freeze the clock with `vi.setSystemTime`.

## Conventions

- Import project modules through the `@/` alias, which maps to `src/` (set in `vite.config.ts` and, as `paths`, in `tsconfig.app.json`). Use relative imports only between files of the same feature folder.
- Files and folders under `src/` are kebab-case (`patient-form.tsx`). Components keep PascalCase names in code. Lint fails otherwise.
- Use `lucide-react` for all icons. Don't add UI, theme, or icon packages unless they're truly needed. Charts use `recharts`, imported only in `src/components/ui/charts.tsx`.
- New UI should look like the existing screens: build it from the components in `src/components/ui/`, the component classes and the color scales in `src/index.css`, with the same white cards (thin border, small shadow), cyan primary, violet for the assistant, pill tabs and filter chips, and Vazirmatn type. Don't introduce a new visual style.
- Write Tailwind class names out in full. Pick them from a lookup of complete names (see `src/components/ui/tones.ts`); a class assembled from pieces such as `bg-${tone}-50` is not generated.

## Architecture

**Navigation has no router.** `src/app.tsx` stores `currentPage: PageKey` in state and renders pages through a `switch`. To add a page:
1. Add its key to the `PageKey` union in `src/lib/types.ts`.
2. Create `src/features/<name>/<name>-page.tsx` and add a case in `app.tsx`.
3. Add a nav entry in `navItems` in `src/components/layout.tsx`.
4. Add it to the page list in `src/app.test.tsx`.

Pages that link elsewhere receive `onNavigate(page)` and `onOpenPatient(id)`. `onOpenPatient` sets `selectedPatientId` and switches to `patients`; `onNavigate` clears it. Both bump a `visit` counter that keys the patients page, so opening it always starts fresh.

**Shell:** `src/components/layout.tsx` is a full-height frame: a collapsible sidebar (the assistant is the highlighted entry under the menu), a top bar, and a `<main>` that scrolls. The window itself does not scroll, and `<main>` adds the page padding, so pages don't add their own.

**Patient record:** a full page, not a dialog. `patients-page.tsx` renders either the list or `patient-detail.tsx` (breadcrumb, summary card, tabs).

**Layers:** `features/` (screens) → `components/` (shared UI) and `data/` (API hooks) → `lib/` and `constants/` (plain TypeScript, no React). A feature folder owns one page: `<name>-page.tsx` loads data and holds state, dialogs and tabs sit beside it, and calculations go in `.ts` files with no JSX (`dashboard-stats.ts`, `ai-insights.ts`, `report-stats.ts`) so they can be tested alone. Features don't import from each other; shared code moves down a layer.

**Data from the API (patients, appointments, services):** read and written only through the TanStack Query hooks in `src/data/` (`usePatients`, `useAppointments`, `useServices`, their mutations, and `useClinicData` for summaries).
- `src/lib/api/client.ts` is a typed openapi-fetch client over `schema.d.ts`, which `npm run api:types` generates; never edit it by hand. A middleware adds the Bearer token and, on a 401, refreshes once and repeats the request (`src/lib/auth/session.ts` holds the tokens).
- **Auth and permissions:** `AuthGate` (`src/features/auth/`) shows login / change-password / clinic picker until signed in with an active clinic. `useMe()`, `usePermissions()`, `useCan(code)` are in `src/data/session.ts`. Gate pages with `PAGE_PERMISSION` and buttons with `CAN` (`src/lib/permissions.ts`); codes come from the backend's permission catalogue, which also enforces them. The active clinic lives in the server session; no clinic is sent with requests.
- Appointments require a doctor (`doctor_membership_id`, from `useDoctors()`).
- `src/lib/api/mappers.ts` converts in one place: API `client`/`client_id`/`description` ⇄ app `patient`/`patient_id`/`notes`; Rial (API) ⇄ Toman (UI); ISO timestamps ⇄ `appointment_date` + `HH:MM:SS`. Appointments are booked by date, time and `duration_minutes` (one of `APPOINTMENT_DURATIONS`, `src/constants/schedule.ts`); `end_time` is worked out from the duration. They have no price; the doctor is `doctor_membership_id`, and `staff_id` stays null.
- Mutations invalidate their query keys (`src/data/keys.ts`), so screens refresh by themselves; don't refetch by hand.
- Errors are `ApiError` (`src/lib/api/errors.ts`): show `errorMessage(error)` in a toast, or `<LoadError>` for a screen that failed to load. A 400 carries `fieldErrors`.
- Appointments load as one shared window (`appointmentWindow()`: 7 Jalali months back to 90 days ahead); `usePatientAppointments` loads one patient's full history.
- A patient's balance is not stored: `patientBalance(id)` / `patientBalances()` in `src/lib/patient-balance.ts` sum the open invoices in the browser store.
- Calculations that summarise data (`dashboard-stats.ts`, `report-stats.ts`, `ai-insights.ts`) take the API rows as arguments; the page fetches them.

**Data in the browser (every other table):** there is no server for these yet. The data flows like this:
- `src/constants/seed/` holds the sample data, one typed array per table, assembled into `seedData` in `index.ts`.
  - Dates are relative to load time (`daysFromToday` / `timestampFromNow`), so "today" views always have content.
  - IDs are readable strings (`inv-04`) and cross-reference each other. References to patients, services and appointments use `pat(n)`, `svc(n)`, `apt(n)` from `ids.ts`: the ids the backend's sample data used to have. The backend no longer creates those records, so these links point at nothing and the rows show without a patient or service name.
  - Derived numbers must stay consistent when you edit the seed; `seed.test.ts` checks them.
- `src/lib/store.ts` (imported as `import * as db from '@/lib/store'`) is the only API for these tables.
  - Reads: `list(table, where?)`, `get`, `first`.
  - Writes: `insert` / `insertMany` (fills column defaults, `id` and `created_at`), `update` / `updateWhere`, `remove` / `removeWhere`.
  - Query helpers: `orderBy`, plus `withOne` / `withMany` to attach related rows from the store (e.g. `withMany(plans, 'items', 'treatment_plan_items', 'plan_id')`), and `joinOne(rows, 'patient', patients, 'patient_id')` to attach rows from the API.
  - It's synchronous and returns copies. Pages call `load()` again after writing.
- Every write is saved to localStorage under `dentaclinic:data:v2`. Settings → "بازنشانی داده‌ها" (reset data) calls `resetStore()` and reloads.
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
- Every number field is a `NumberInput` (`value: number | null`, `null` while empty), never `<input type="number">`: it can be emptied while typing, has no up/down arrows, ignores the scroll wheel and accepts Persian digits. Decide what an empty field means when saving.

**Statuses:** `src/constants/status.ts` holds the label and badge colors (background, text and border) for every status (appointment, invoice, lab order, treatment plan and item, SMS campaign and message, tooth). Render them with `StatusBadge` and `statusStyle(map, value, fallback)`; don't redefine a status map inside a component.

**Appointment slots:** `src/lib/schedule.ts` builds each day's bookable slots from the clinic's working hours (`clinic_settings.working_hours`, edited in Settings → ساعات کاری; a closed day has none).
- `clinicWorkingHours()` reads them; `workingSlots(date, hours)`, `freeSlotsOn(date, dayAppointments, hours)` and `findFreeSlots(..., hours)` use them. Pass the hours in: without them every day is the default day from `src/constants/schedule.ts` (`ALL_SLOTS`).
- Appointments, the dashboard and the assistant all go through these, so they agree on what is free.

**Treatment plans:** `src/lib/treatment-plans.ts` holds the logic shared by three screens.
- Booking: the appointment form offers a patient's open plan items (`activePlans`, `bookableItems`); `linkAppointment` ties the item to the new appointment.
- Status: every appointment status change must call `syncPlanWithAppointment`, which completes the linked item (and the plan, once all items are done) or frees it on cancel.
- Billing: the invoice form loads a plan's done or in-progress items (`billableItems`) and stores `invoices.treatment_plan_id`.
- Templates: `treatment_plan_templates` rows (Settings → طرح درمان) keep their lines in an `items` array; `createPlanFromTemplate` turns one into a plan.

**Business logic is client-side.** Nothing keeps derived fields up to date automatically. Examples:
- Invoice `balance` and `status` are written by `src/features/billing/invoice-detail.tsx`; a patient's balance is computed from them when shown (`src/lib/patient-balance.ts`).
- SMS sending in `src/features/sms/campaign-form.tsx` has no real provider. It inserts `sms_campaigns` and `sms_messages` rows marked `sent`, then decrements credits in `sms_packages`.
- The "AI assistant" (`src/features/ai-assistant/ai-insights.ts`) calls no LLM. It computes insights from the store's data and answers questions by matching Persian keywords.

A change to a derived value has to be made in every place that writes it.

**UI kit:** `src/components/ui/`. The ones to reach for first: `PageHeader`, `Tabs` (pill segments), `Modal`, `StatusBadge`, `StatTile`, `SectionHeader`, `ProgressBar`, `ChoiceChips` (filters and form choices), `Skeleton`, `EmptyState`, `JalaliDateInput`, `NumberInput`, and the charts `AreaTrend`, `Bars` and `Donut`.
- Lists are stacks of `card` rows; a row's small actions use `btn-chip` plus its colors.
- Toasts: call `showToast(message, 'success' | 'error' | 'info')` from `@/lib/toast`; `<ToastContainer />` is mounted once in `app.tsx`.
- Reusable component classes are defined in `src/index.css` as `@utility` rules, e.g. `card`, `btn-primary`, `btn-secondary`, `btn-chip`, `input-field`, `label-field`, `badge`, `nav-item`. Prefer them over re-spelling utility classes.
- Color scales are defined in the `@theme` block of `src/index.css`. The app uses `primary` (cyan), `secondary` (blue), `accent` (emerald, for success and completed states), `warning`, `error` and `surface` (slate grays), plus Tailwind's own `violet` for the assistant.

## Tailwind CSS 4

- There is no `tailwind.config.js` or PostCSS config. Tailwind runs through the `@tailwindcss/vite` plugin, and the theme (colors, font, shadows, radii, animations) is the `@theme` block at the top of `src/index.css`. Add a color as `--color-<name>-<shade>`, a shadow as `--shadow-<name>`, an animation as `--animate-<name>` plus its `@keyframes`.
- Use the v4 utility names: `bg-linear-to-*` (not `bg-gradient-to-*`), `outline-hidden` (not `outline-none`), `rounded-xs` / `rounded-sm` (were `rounded-sm` / `rounded`), `backdrop-blur-xs` (was `backdrop-blur-sm`), `shrink-0`.
- Write gradients as `bg-linear-to-br/srgb`. Without `/srgb`, v4 blends in oklab and the gradient's middle shades differ from the rest of the app.
- The first `@layer base` block in `src/index.css` restores v3 defaults (border color, button cursor, color-picker background, time-input and option padding). Leave it in place unless you also update every element that relies on it.
- `space-y-*` puts the margin under each child except the last, so a fixed-position dialog rendered as the last child gets no margin.

## Localization / RTL

- `index.html` sets `lang="fa" dir="rtl"` and loads the Vazirmatn font. Layout is mirrored: the sidebar is fixed on the right (`right-0`, `border-l`). Keep that in mind when using directional utilities.
- All user-facing strings are Persian literals written inline; there is no i18n layer.
- Numbers shown to the user go through `formatNumber` or `formatCurrency` (`src/lib/format.ts`) so they use Persian digits; `formatCurrency` appends تومان. `formatTime` uses a صبح/بعدازظهر (AM/PM) suffix (`formatClock` is the 24-hour form for tight spots), `fullName` builds a person's name with a fallback, and `paymentMethodLabel` translates payment methods.
