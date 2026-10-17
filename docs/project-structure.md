# Project structure

A map of every folder and file in the project and what each one is for. For how the pieces work together, see [architecture.md](architecture.md).

## Top level

```
.
├── index.html              HTML shell: sets Persian + right-to-left, loads the Vazirmatn font
├── package.json            scripts and dependencies
├── package-lock.json       exact dependency versions
├── vite.config.ts          build config: React and Tailwind plugins, the `@/` alias, the test setup
├── eslint.config.js        lint rules, including kebab-case file names
├── tsconfig.json           points at the two configs below
├── tsconfig.app.json       TypeScript settings for `src/`
├── tsconfig.node.json      TypeScript settings for `vite.config.ts`
├── .gitignore              files git should not track
├── .env.development        API base URL and dev clinic id for `npm run dev` (committed, no secrets)
├── .env.test               the same for `npm test`
├── .env.example            the variables, documented, for other environments
├── README.md               overview and getting started
├── CLAUDE.md               working notes for AI coding assistants
├── docs/                   longer documentation
└── src/                    all application code
```

Not in git: `node_modules/` (installed packages) and `dist/` (the production build).

## `docs/`

| File | Contents |
|---|---|
| `architecture.md` | How the layers fit together, the data and date rules, and recipes for common changes |
| `project-structure.md` | This file |

## `src/`

```
src/
├── main.tsx                mounts the app
├── app.tsx                 holds the current page and renders it
├── app.test.tsx            smoke test: opens every page from the sidebar
├── index.css               Tailwind theme (colours, shadows, radii, animations) and shared classes
├── assets/                 images: `vitra-life-logo.svg`, the logo and favicon
├── vite-env.d.ts           Vite type declarations, including the `VITE_*` variables
├── components/             UI shared by more than one page
├── features/               one folder per page
├── data/                   React Query hooks for the data that comes from Dental-Api
├── constants/              fixed data: sample data, statuses, working hours
└── lib/                    logic with no UI: API client, data store, dates, formatting
```

Dependencies point one way: `features` → `components` and `data` → `lib` and `constants`. Features do not import from each other.

### `src/data/`

```
data/
├── query-client.ts         the React Query cache and its retry rules
├── keys.ts                 query keys; mutations invalidate by prefix
├── patients.ts             usePatients (all pages), usePatient, useCreatePatient, useUpdatePatient
├── appointments.ts         useAppointments (shared window), usePatientAppointments, create, update, status
├── services.ts             useServices, useCreateService, useUpdateService, useDeleteService
└── clinic-data.ts          useClinicData: patients, appointments and services together, for summaries
```

### `src/components/`

```
components/
├── layout.tsx              collapsible sidebar, mobile menu, top bar and the scrolling page area
└── ui/
    ├── modal.tsx               dialog
    ├── page-header.tsx         page title, subtitle and action buttons
    ├── tabs.tsx                segmented (pill) tab bar
    ├── section-header.tsx      title row of a card
    ├── icon-box.tsx            tinted square holding an icon
    ├── tones.ts                the colour pairs icon boxes and tiles use
    ├── stat-tile.tsx           summary figure: label, value, note, icon
    ├── status-badge.tsx        coloured pill for a status
    ├── avatar.tsx              initials on a gradient tile
    ├── charts.tsx              area, bar and donut charts (recharts)
    ├── progress-bar.tsx        thin horizontal progress bar
    ├── choice-chips.tsx        single-choice row of pill buttons (filters, form choices)
    ├── jalali-date-input.tsx   Jalali date field with a calendar popover
    ├── skeleton.tsx            loading placeholders
    ├── empty-state.tsx         "nothing here yet" block
    ├── load-error.tsx          shown when a screen's data could not be loaded, with a retry button
    └── toast.tsx               renders toast messages
```

### `src/features/`

Each folder is one page. The `*-page.tsx` file is the entry point that `app.tsx` renders.

```
features/
├── dashboard/
│   ├── dashboard-page.tsx          figures, revenue and service charts, today's appointments, assistant notes
│   └── dashboard-stats.ts          computes everything the dashboard shows
│
├── patients/
│   ├── patients-page.tsx           patient cards with search and balance filters; shows the record when one is open
│   ├── patient-form.tsx            add or edit a patient
│   ├── patient-detail.tsx          patient record page: breadcrumb, summary card, tabs
│   ├── patient-info-tab.tsx        base details, allergies, medical history, emergency contact
│   ├── patient-history-tab.tsx     treatments, appointments, invoices and lab orders in one tab
│   ├── dental-chart.tsx            per-tooth chart and tooth history
│   ├── rvg-manager.tsx             radiology images
│   ├── patient-lab-orders.tsx      the patient's lab orders
│   ├── treatment-history.tsx       treatments done
│   └── treatment-plan-tab.tsx      treatment plans and their items; new plans can start from a template
│
├── appointments/
│   ├── appointments-page.tsx           today's figures and the list / day / calendar switch
│   ├── appointment-list-view.tsx       every appointment, filtered by period and status, with status actions
│   ├── appointment-day-view.tsx        one day: nearby days, free slots, that day's appointments
│   ├── appointment-calendar-view.tsx   Jalali month calendar beside the selected day's list
│   └── appointment-form.tsx            book an appointment, optionally for a treatment-plan item
│
├── billing/
│   ├── billing-page.tsx            invoice cards, figures, instalment reminders
│   ├── invoice-form.tsx            create an invoice, optionally from a treatment plan and in instalments
│   └── invoice-detail.tsx          invoice items, instalments, payments
│
├── lab/
│   ├── lab-page.tsx                orders, labs and payments tabs
│   ├── lab-form.tsx                add a lab
│   ├── lab-order-form.tsx          place a lab order
│   └── lab-payment-form.tsx        record a payment to a lab
│
├── reports/
│   ├── reports-page.tsx            revenue, appointment, service and staff charts
│   └── report-stats.ts             computes the report figures
│
├── ai-assistant/
│   ├── ai-assistant-page.tsx       chat with the assistant; insights, free slots and segments beside it
│   └── ai-insights.ts              builds the insights and answers questions by keyword
│
├── sms/
│   ├── sms-panel-page.tsx          tabs and dialogs of the SMS panel
│   ├── sms-overview-tab.tsx        credit balance and recent campaigns
│   ├── sms-campaigns-tab.tsx       campaign list
│   ├── sms-packages-tab.tsx        bundles on offer and bundles bought
│   ├── sms-reports-tab.tsx         weekly sending chart and recent messages
│   ├── sms-package-modal.tsx       buy-a-bundle dialog
│   ├── sms-packages.ts             the bundles on offer and the purchase action
│   ├── campaign-form.tsx           write and send a campaign
│   └── campaign-detail.tsx         a campaign's recipients and status
│
└── settings/
    ├── settings-page.tsx           tab container
    ├── clinic-tab.tsx              clinic details and the reset-data button
    ├── hours-tab.tsx               opening hours per weekday
    ├── staff-tab.tsx               staff list
    ├── services-tab.tsx            service catalogue table with category filters
    ├── service-form.tsx            add or edit a service
    ├── plans-tab.tsx               treatment-plan templates, and a read-only list of all plans
    ├── template-form.tsx           add or edit a template
    └── notifications-tab.tsx       reminder switches (not saved yet)
```

### `src/constants/`

```
constants/
├── status.ts               label and colours for every status (appointment, invoice, lab order…)
├── schedule.ts             default working day and slot length
├── service-categories.ts   the categories a service can have
└── seed/                   the sample data the browser store starts with
    ├── index.ts            gathers every table into `seedData`
    ├── ids.ts              `pat(n)`, `svc(n)`, `apt(n)`: the fixed ids of the backend's dev seed
    ├── clinic.ts           clinic settings, staff
    ├── billing.ts          invoices, invoice items, payments, instalments
    ├── clinical.ts         treatments, tooth records, radiology images, treatment plans and templates
    ├── lab.ts              labs, lab services, lab orders, lab payments
    ├── sms.ts              SMS bundles, campaigns, messages
    └── seed.test.ts        checks that the sample numbers agree with each other
```

### `src/lib/`

```
lib/
├── env.ts                  reads `VITE_API_BASE_URL` and `VITE_CLINIC_ID`; fails at startup if one is missing
├── api/
│   ├── schema.d.ts         generated from the backend's Swagger by `npm run api:types`; do not edit
│   ├── client.ts           the typed openapi-fetch client; adds the `x-clinic-id` header
│   ├── errors.ts           `ApiError`, `unwrap()`, Persian messages per status
│   ├── mappers.ts          API rows ⇄ app rows: names, Rial ⇄ Toman, timestamps ⇄ date and time
│   └── mappers.test.ts
├── store.ts                the browser store for tables without an API: read, write, delete, localStorage
├── store.test.ts
├── patient-balance.ts      what each patient owes, summed from the invoices in the store
├── patient-balance.test.ts
├── types.ts                row types for every table, and `PageKey`
├── date.ts                 all date handling: Gregorian storage, Jalali display
├── date.test.ts
├── format.ts               numbers, money, times, names, payment-method labels
├── format.test.ts
├── schedule.ts             appointment slots from the clinic's working hours: all, booked, free
├── schedule.test.ts
├── treatment-plans.ts      links plans to appointments and invoices; creates plans from templates
├── treatment-plans.test.ts
├── revenue.ts              revenue per Jalali month and month-over-month change
└── toast.ts                `showToast()`
```

## Naming rules

- Files and folders under `src/` are kebab-case: `patient-form.tsx`, `ai-assistant/`. Lint fails otherwise.
- Components keep PascalCase names in code: `patient-form.tsx` exports `PatientForm`.
- A page's entry file ends in `-page.tsx`; tabs end in `-tab.tsx`; dialogs end in `-form.tsx`, `-detail.tsx` or `-modal.tsx`.
- Files with JSX use `.tsx`; files with only logic use `.ts`.
- A test sits beside the file it tests, with `.test` before the extension.

## Where does new code go?

| You are adding | Put it in |
|---|---|
| A new page | `src/features/<name>/<name>-page.tsx` |
| A dialog or tab used by one page | that page's feature folder |
| A component used by two or more pages | `src/components/ui/` |
| A calculation with no JSX, used by one page | a `.ts` file in that feature folder |
| Logic used by several pages | `src/lib/` |
| A hook that reads or writes the API | `src/data/` |
| A status, a fixed list or a setting | `src/constants/` |
| Sample rows for a table without an API | `src/constants/seed/` |
| Sample patients, services or appointments | the backend's dev seed (`prisma/seed.ts` in Dental-Api) |
