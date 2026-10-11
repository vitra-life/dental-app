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
├── vite-env.d.ts           Vite type declarations
├── components/             UI shared by more than one page
├── features/               one folder per page
├── constants/              fixed data: sample data, statuses, working hours
└── lib/                    logic with no UI: data store, dates, formatting
```

Dependencies point one way: `features` → `components` → `lib` and `constants`. Features do not import from each other.

### `src/components/`

```
components/
├── layout.tsx              sidebar, mobile menu and top bar around every page
└── ui/
    ├── modal.tsx               dialog
    ├── page-header.tsx         page title, subtitle and action buttons
    ├── tabs.tsx                underlined tab bar
    ├── section-header.tsx      title row of a card
    ├── icon-box.tsx            tinted square holding an icon
    ├── tones.ts                the colour pairs icon boxes and tiles use
    ├── stat-card.tsx           large summary figure (dashboard)
    ├── stat-tile.tsx           medium and compact summary figures
    ├── status-badge.tsx        coloured pill for a status
    ├── avatar.tsx              initials on a gradient tile
    ├── bar-chart.tsx           vertical bar chart
    ├── progress-bar.tsx        thin horizontal progress bar
    ├── choice-chips.tsx        single-choice row of pill buttons
    ├── jalali-date-input.tsx   Jalali date field with a calendar popover
    ├── skeleton.tsx            loading placeholders
    ├── empty-state.tsx         "nothing here yet" block
    └── toast.tsx               renders toast messages
```

### `src/features/`

Each folder is one page. The `*-page.tsx` file is the entry point that `app.tsx` renders.

```
features/
├── dashboard/
│   ├── dashboard-page.tsx          welcome banner, figures, weekly charts, today's appointments
│   └── dashboard-stats.ts          computes everything the dashboard shows
│
├── patients/
│   ├── patients-page.tsx           searchable patient list
│   ├── patient-form.tsx            add or edit a patient
│   ├── patient-detail.tsx          patient record dialog and its tabs
│   ├── patient-info-tab.tsx        contact, medical and insurance details
│   ├── dental-chart.tsx            per-tooth chart and tooth history
│   ├── rvg-manager.tsx             radiology images
│   ├── patient-lab-orders.tsx      the patient's lab orders
│   ├── treatment-history.tsx       treatments done
│   └── treatment-plan-tab.tsx      treatment plans and their items
│
├── appointments/
│   ├── appointments-page.tsx           day summary and view switch
│   ├── appointment-list-view.tsx       day list with free time slots
│   ├── appointment-calendar-view.tsx   Jalali month calendar and week strip
│   └── appointment-form.tsx            book an appointment
│
├── billing/
│   ├── billing-page.tsx            invoice list, figures, instalment reminders
│   ├── invoice-form.tsx            create an invoice, optionally in instalments
│   ├── invoice-detail.tsx          invoice items, instalments, payments
│   ├── patient-balance.ts          keeps a patient's balance equal to what they owe
│   └── patient-balance.test.ts
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
│   ├── ai-assistant-page.tsx       question box, free slots, insights, patient segments
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
    ├── staff-tab.tsx               staff list
    ├── services-tab.tsx            service catalogue and prices
    ├── plans-tab.tsx               read-only list of all treatment plans
    └── notifications-tab.tsx       reminder switches (not saved yet)
```

### `src/constants/`

```
constants/
├── status.ts               label and colours for every status (appointment, invoice, lab order…)
├── schedule.ts             working hours and slot length
└── seed/                   the sample data the app starts with
    ├── index.ts            gathers every table into `seedData`
    ├── clinic.ts           clinic settings, staff, services
    ├── patients.ts         patients
    ├── appointments.ts     appointments around today
    ├── billing.ts          invoices, invoice items, payments, instalments
    ├── clinical.ts         treatments, tooth records, radiology images, treatment plans
    ├── lab.ts              labs, lab services, lab orders, lab payments
    ├── sms.ts              SMS bundles, campaigns, messages
    └── seed.test.ts        checks that the sample numbers agree with each other
```

### `src/lib/`

```
lib/
├── store.ts                the data layer: read, write, delete, save to localStorage
├── store.test.ts
├── types.ts                row types for every table, and `PageKey`
├── date.ts                 all date handling: Gregorian storage, Jalali display
├── date.test.ts
├── format.ts               numbers, money, times, names, payment-method labels
├── format.test.ts
├── schedule.ts             appointment slots: all, booked, next free
├── schedule.test.ts
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
| A status, a fixed list or a setting | `src/constants/` |
| Sample rows | `src/constants/seed/` |
