import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './app';
import { apt, pat, svc } from './constants/seed/ids';
import { createQueryClient } from './data/query-client';
import { joinTimestamp, todayISO } from './lib/date';
import * as db from './lib/store';

// What the stubbed API returns: one patient with one appointment today.
const stamp = '2026-01-01T00:00:00.000Z';
const client = {
  id: pat(3), clinic_id: 'clinic', first_name: 'علیرضا', last_name: 'کاظمی', phone: '09121110003', national_id: null,
  birth_date: null, gender: 'male', email: null, blood_type: null, address: null, allergies: null, medical_history: null,
  emergency_contact: null, emergency_phone: null, insurance_company: null, insurance_number: null, notes: null,
  created_at: stamp, updated_at: stamp, appointment_count: 1, last_visit: null,
};
const service = {
  id: svc(4), clinic_id: 'clinic', name: 'عصب‌کشی', category: 'endodontics', default_price: 60_000_000, duration_minutes: 60,
  description: null, active: true, created_at: stamp, updated_at: stamp,
};
const appointment = () => ({
  id: apt(17), clinic_id: 'clinic', client_id: client.id, service_id: service.id,
  start_time: joinTimestamp(todayISO(), '23:00'), duration_minutes: 30,
  status: 'pending', description: null, created_at: stamp, updated_at: stamp,
  client: { id: client.id, first_name: client.first_name, last_name: client.last_name, phone: client.phone },
  service: { id: service.id, name: service.name },
});

/** Answers the app's GET requests the way Dental-Api would. */
async function fakeApi(input: RequestInfo | URL): Promise<Response> {
  const { pathname } = new URL(input instanceof Request ? input.url : String(input));
  const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
  if (pathname === '/api/v1/clients') return json({ items: [client], total: 1, page: 1, page_size: 100 });
  if (pathname === '/api/v1/services') return json([service]);
  if (pathname === '/api/v1/appointments') return json([appointment()]);
  return new Response(null, { status: 404 });
}

const renderApp = () =>
  render(
    <QueryClientProvider client={createQueryClient()}>
      <App />
    </QueryClientProvider>,
  );

// The sidebar entry (matched from its start: the assistant's also carries a badge) and the page title it opens.
const pages = [
  { nav: 'داشبورد', title: 'داشبورد' },
  { nav: 'بیماران', title: 'بیماران' },
  { nav: 'نوبت‌دهی', title: 'نوبت‌دهی' },
  { nav: 'صورتحساب', title: 'صورتحساب' },
  { nav: 'لابراتوار', title: 'لابراتوار' },
  { nav: 'گزارش‌ها', title: 'گزارش‌ها' },
  { nav: 'دستیار هوشمند', title: 'دستیار هوشمند' },
  { nav: 'پنل پیامک', title: 'پنل پیامک' },
  { nav: 'تنظیمات', title: 'تنظیمات' },
];

// The sidebar is rendered twice (desktop and mobile); either copy navigates.
const openFromSidebar = (nav: string) => fireEvent.click(screen.getAllByRole('button', { name: new RegExp(`^${nav}`) })[0]);
// Pages show a skeleton until their data arrives, so the title is awaited.
const pageTitle = (name: string) => screen.findByRole('heading', { level: 1, name });

beforeEach(() => {
  db.resetStore();
  vi.stubGlobal('fetch', vi.fn(fakeApi));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('App', () => {
  it.each(pages)('opens $nav from the sidebar', async ({ nav, title }) => {
    renderApp();
    openFromSidebar(nav);
    expect(await pageTitle(title)).toBeTruthy();
  });

  it('opens a patient record from the appointments list and returns to the patient list', async () => {
    renderApp();
    openFromSidebar('نوبت‌دهی');
    fireEvent.click((await screen.findAllByRole('button', { name: 'علیرضا کاظمی' }))[0]);
    expect(await pageTitle('علیرضا کاظمی')).toBeTruthy();

    openFromSidebar('بیماران');
    expect(await pageTitle('بیماران')).toBeTruthy();
  });

  it('opens a patient record from the patient list and goes back by the breadcrumb', async () => {
    renderApp();
    openFromSidebar('بیماران');
    fireEvent.click(await screen.findByText('علیرضا کاظمی'));
    expect(await pageTitle('علیرضا کاظمی')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'بازگشت' }));
    expect(await pageTitle('بیماران')).toBeTruthy();
  });
});
