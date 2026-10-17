# ویترا لایف (Vitra Life)

A dental clinic management app. The interface is in Persian, laid out right-to-left, and every date is shown in the Jalali (Persian) calendar.

It covers patients and their records, treatment plans, appointments, billing with instalments, lab orders, reports, a smart assistant, an SMS panel and clinic settings.

Patients, appointments and services come from the backend, [Dental-Api](../Dental-Api). The other areas (billing, lab, SMS, treatment plans, staff, clinic settings) have no API yet: they start from sample data and keep every change in the browser's localStorage.

## Getting started

You need Node.js 20.19 or newer (on Node 22: 22.12 or newer), as Vite 8 requires, and Dental-Api running on port 3000:

```bash
# in ../Dental-Api
npm run db:up
npm run db:seed        # creates the dev clinic the app acts for (no sample data)
npm run start:dev

# here
npm install
npm run dev
```

Then open the address Vite prints (by default http://localhost:5173).

The API address and the clinic to act for come from `.env.development`:

| Variable | Meaning |
|---|---|
| `VITE_API_BASE_URL` | Dental-Api's base URL, without `/api/v1` (`http://localhost:3000`) |
| `VITE_CLINIC_ID` | Temporary: the clinic sent as the `x-clinic-id` header until login exists. The default is the clinic `npm run db:seed` creates |

For another environment, copy `.env.example` to `.env.production.local` or set the variables in CI.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Starts the dev server with hot reload |
| `npm run build` | Builds the production bundle into `dist/` |
| `npm run preview` | Serves the production build locally |
| `npm run typecheck` | Type-checks the project |
| `npm run lint` | Lints the project, including file-name rules |
| `npm test` | Runs the tests once |
| `npm run test:watch` | Runs the tests on every change |
| `npm run api:types` | Regenerates `src/lib/api/schema.d.ts` from the running backend's Swagger; run it after an API change |

`npm run build` does not type-check. Run `typecheck`, `lint` and `test` before you merge.

## Tech stack

- React 19, TypeScript 6 and Vite 8
- TanStack Query for server data, with an openapi-fetch client typed from the backend's Swagger (openapi-typescript)
- Tailwind CSS 4 for styling (configured in `src/index.css`, no config file), lucide-react for icons
- recharts for charts
- moment-jalaali for the Jalali calendar and date-fns for date arithmetic
- Vitest and Testing Library for tests

## Project layout

```
src/
├── main.tsx, app.tsx     entry point and page switching
├── index.css             Tailwind theme and shared component classes
├── components/
│   ├── layout.tsx        collapsible sidebar, top bar and the scrolling page area
│   └── ui/               shared building blocks (modal, tabs, date input, charts…)
├── features/             one folder per page
├── data/                 React Query hooks for patients, appointments and services
│   ├── dashboard/        ├── lab/
│   ├── patients/         ├── reports/
│   ├── appointments/     ├── ai-assistant/
│   ├── billing/          ├── sms/
│   └── settings/
├── constants/
│   ├── seed/             the sample data, one file per area
│   ├── status.ts         labels and colours for every status
│   ├── service-categories.ts   the categories a service can have
│   └── schedule.ts       working hours and slot length
└── lib/
    ├── api/              typed API client, error handling, API ⇄ app mappers
    ├── env.ts            the `VITE_*` settings
    ├── store.ts          the browser store for tables without an API (reads, writes, localStorage)
    ├── patient-balance.ts   what each patient owes, from the invoices
    ├── types.ts          row types for every table
    ├── date.ts           all date handling
    ├── format.ts         numbers, money, times, names
    ├── schedule.ts       appointment slots from the clinic's working hours
    ├── treatment-plans.ts   linking plans to appointments and invoices; plan templates
    ├── revenue.ts        monthly revenue figures
    └── toast.ts          `showToast()`
```

Files and folders under `src/` are kebab-case (`patient-form.tsx`); lint enforces this.

## How the data works

- **Patients, appointments and services** are read and written through the hooks in `src/data/`, which call Dental-Api and cache the answers. Money is shown in Toman and stored by the API in Rial; `src/lib/api/mappers.ts` converts.
- **Everything else** goes through `src/lib/store.ts`. It loads the sample data in `src/constants/seed/` on first run, then keeps every change in localStorage under the key `dentaclinic:data:v2`. Those sample rows refer to patients and services by ids that don't exist in the backend, so they show without a patient or service name.
- To discard local changes, open Settings → اطلاعات کلینیک and press "بازنشانی داده‌ها" (reset data). Patients, appointments and services are only what you add through the app; `npm run db:seed` never adds or removes them.
- Dates are stored as Gregorian values (`YYYY-MM-DD`) and shown as Jalali dates. All conversion goes through `src/lib/date.ts`.

## Things that are simulated

- **SMS:** campaigns are recorded and credits are deducted, but no message is sent.
- **Smart assistant:** it computes its insights from the stored data and answers questions by matching keywords. It does not call an AI model.
- **Notification switches** in Settings are not saved.

## More documentation

- [docs/project-structure.md](docs/project-structure.md): every folder and file, and where new code goes.
- [docs/architecture.md](docs/architecture.md): how the code is organised and how to add a page, a table, a status or a date field.
- [CLAUDE.md](CLAUDE.md): working notes for AI coding assistants.
