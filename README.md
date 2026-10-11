# ویترا لایف (Vitra Life)

A dental clinic management app. The interface is in Persian, laid out right-to-left, and every date is shown in the Jalali (Persian) calendar.

It covers patients and their records, treatment plans, appointments, billing with instalments, lab orders, reports, a smart assistant, an SMS panel and clinic settings.

The app has no backend. It starts from sample data and saves every change in the browser's localStorage, so each browser has its own copy of the data.

## Getting started

You need Node.js 20.19 or newer (on Node 22: 22.12 or newer), as Vite 8 requires.

```bash
npm install
npm run dev
```

Then open the address Vite prints (by default http://localhost:5173).

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

`npm run build` does not type-check. Run `typecheck`, `lint` and `test` before you merge.

## Tech stack

- React 19, TypeScript 6 and Vite 8
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
    ├── store.ts          the data layer (reads, writes, localStorage)
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

- The sample data lives in `src/constants/seed/`. Its dates are relative to the day the app loads, so "today" always has appointments.
- `src/lib/store.ts` is the only way to read or change data. It loads the sample data on first run, then keeps every change in localStorage under the key `dentaclinic:data:v1`.
- To discard your changes, open Settings → اطلاعات کلینیک and press "بازنشانی داده‌ها" (reset data).
- Dates are stored as Gregorian values (`YYYY-MM-DD`) and shown as Jalali dates. All conversion goes through `src/lib/date.ts`.

## Things that are simulated

- **SMS:** campaigns are recorded and credits are deducted, but no message is sent.
- **Smart assistant:** it computes its insights from the stored data and answers questions by matching keywords. It does not call an AI model.
- **Notification switches** in Settings are not saved.

## More documentation

- [docs/project-structure.md](docs/project-structure.md): every folder and file, and where new code goes.
- [docs/architecture.md](docs/architecture.md): how the code is organised and how to add a page, a table, a status or a date field.
- [CLAUDE.md](CLAUDE.md): working notes for AI coding assistants.
