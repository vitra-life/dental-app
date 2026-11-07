import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './app';
import { apt, pat, svc } from './constants/seed/ids';
import { createQueryClient } from './data/query-client';
import { clearSession, setTokens } from './lib/auth/session';
import { joinTimestamp, todayISO } from './lib/date';
import { CAN } from './lib/permissions';
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
  doctor_membership_id: 'membership', created_by_membership_id: 'membership',
  doctor: { membership_id: 'membership', full_name: 'دکتر سارا احمدی' },
});

/** The permissions the active workspace holds; every item unless a test narrows it. */
let granted: string[];
const allCodes: string[] = Object.values(CAN);
const adminWorkspace = {
  id: 'ws-admin', kind: 'clinic', doctor_membership_id: null, doctor_name: null, relationship_type: null,
  is_admin: true, label: 'مدیر کلینیک',
};
const assistantWorkspace = {
  id: 'ws-assistant', kind: 'staff', doctor_membership_id: 'doctor', doctor_name: 'دکتر الف', relationship_type: 'assistant_of',
  is_admin: false, label: 'دستیار پزشک: دکتر الف',
};
/** The user's workspaces, and the one the session works in (null: not chosen yet). */
let workspaces: (typeof adminWorkspace | typeof assistantWorkspace)[];
let activeWorkspace: string | null;
const member = {
  membership_id: 'membership', user_id: 'user', full_name: 'سارا احمدی', mobile: '09120000000', is_active: true,
  joined_at: stamp, staff_types: ['doctor'], doctor_profile: null,
  workspaces: [{ ...adminWorkspace, membership_id: 'membership', member_name: 'سارا احمدی', is_active: true, permissions: [] }],
};
const me = () => ({
  user: { id: 'user', full_name: 'سارا احمدی', mobile: '09120000000', must_change_password: false },
  clinics: [{ clinic_id: 'clinic', clinic_name: 'کلینیک ویترا', membership_id: 'membership', staff_types: ['doctor'], workspaces }],
  active_workspace_id: activeWorkspace,
  active_clinic_id: activeWorkspace ? 'clinic' : null,
  permissions: activeWorkspace ? granted : [],
});

/** Answers the app's requests the way Dental-Api would. */
async function fakeApi(input: RequestInfo | URL): Promise<Response> {
  const request = input instanceof Request ? input : new Request(String(input));
  const { pathname } = new URL(request.url);
  const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
  if (pathname === '/api/v1/auth/switch-workspace') {
    activeWorkspace = ((await request.json()) as { workspace_id: string }).workspace_id;
    return json({ access_token: 'access-2', token_type: 'Bearer', expires_in: 900, me: me() });
  }
  if (pathname === '/api/v1/auth/me') return json(me());
  if (pathname === '/api/v1/doctors') return json([{ membership_id: 'membership', full_name: 'دکتر سارا احمدی', specialty: null }]);
  if (pathname === '/api/v1/clients') return json({ items: [client], total: 1, page: 1, page_size: 100 });
  if (pathname === '/api/v1/services') return json([service]);
  if (pathname === '/api/v1/appointments') return json([appointment()]);
  if (pathname === '/api/v1/staff') return json([member]);
  if (pathname === '/api/v1/staff-types') return json([{ id: 't1', code: 'doctor', name: 'پزشک' }]);
  if (pathname === '/api/v1/relationship-types') return json([]);
  if (pathname === '/api/v1/permission-templates') return json([]);
  if (pathname === '/api/v1/permissions') return json([]);
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
  granted = allCodes;
  workspaces = [adminWorkspace];
  activeWorkspace = adminWorkspace.id;
  setTokens({ access_token: 'access', refresh_token: 'refresh' });
  vi.stubGlobal('fetch', vi.fn(fakeApi));
});

afterEach(() => {
  cleanup();
  clearSession();
  vi.unstubAllGlobals();
});

describe('App', () => {
  it.each(pages)('opens $nav from the sidebar', async ({ nav, title }) => {
    renderApp();
    await pageTitle('داشبورد');
    openFromSidebar(nav);
    expect(await pageTitle(title)).toBeTruthy();
  });

  it('asks a signed-out user to log in', async () => {
    clearSession();
    renderApp();
    expect(await screen.findByRole('button', { name: 'ورود' })).toBeTruthy();
  });

  it('shows only the pages and actions the workspace grants', async () => {
    granted = ['dashboard.view', 'client.view'];
    renderApp();
    await pageTitle('داشبورد');
    expect(screen.queryAllByRole('button', { name: /^تنظیمات/ })).toHaveLength(0);
    expect(screen.queryAllByRole('button', { name: /^نوبت‌دهی/ })).toHaveLength(0);

    openFromSidebar('بیماران');
    expect(await pageTitle('بیماران')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'بیمار جدید' })).toBeNull();
  });

  it('shows each appointment action only with its own item', async () => {
    granted = ['appointment.view', 'appointment.confirm'];
    renderApp();
    expect(await pageTitle('نوبت‌دهی')).toBeTruthy();
    // The row actions (not the status filter chips of the same name).
    const action = (name: string) => screen.queryAllByRole('button', { name }).filter((b) => b.className.includes('btn-chip'));
    await screen.findByRole('button', { name: 'تأیید' });
    expect(action('تأیید')).toHaveLength(1);
    expect(action('انجام شد')).toHaveLength(0);
    expect(action('لغو')).toHaveLength(0);
    expect(screen.queryByRole('button', { name: 'حذف نوبت' })).toBeNull();
    expect(screen.queryByRole('button', { name: /نوبت جدید/ })).toBeNull();
  });

  it('asks which workspace to work in, then opens it', async () => {
    workspaces = [adminWorkspace, assistantWorkspace];
    activeWorkspace = null;
    renderApp();
    fireEvent.click(await screen.findByRole('button', { name: /دستیار پزشک: دکتر الف/ }));
    expect(await pageTitle('داشبورد')).toBeTruthy();
    expect(activeWorkspace).toBe(assistantWorkspace.id);
  });

  it('switches workspace from the top bar', async () => {
    workspaces = [adminWorkspace, assistantWorkspace];
    renderApp();
    await pageTitle('داشبورد');
    const switcher = screen.getByRole('button', { name: 'جایگاه کاری' });
    expect(switcher.textContent).toContain('مدیر کلینیک');
    fireEvent.click(switcher);
    fireEvent.click(screen.getByRole('button', { name: 'دستیار پزشک: دکتر الف' }));
    expect(await screen.findByText('دستیار پزشک: دکتر الف', { selector: 'button[aria-label] span' })).toBeTruthy();
    expect(activeWorkspace).toBe(assistantWorkspace.id);
  });

  it('opens a patient record from the appointments list and returns to the patient list', async () => {
    renderApp();
    await pageTitle('داشبورد');
    openFromSidebar('نوبت‌دهی');
    fireEvent.click((await screen.findAllByRole('button', { name: 'علیرضا کاظمی' }))[0]);
    expect(await pageTitle('علیرضا کاظمی')).toBeTruthy();

    openFromSidebar('بیماران');
    expect(await pageTitle('بیماران')).toBeTruthy();
  });

  it('opens a patient record from the patient list and goes back by the breadcrumb', async () => {
    renderApp();
    await pageTitle('داشبورد');
    openFromSidebar('بیماران');
    fireEvent.click(await screen.findByText('علیرضا کاظمی'));
    expect(await pageTitle('علیرضا کاظمی')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'بازگشت' }));
    expect(await pageTitle('بیماران')).toBeTruthy();
  });

  it('shows the staff list read-only with only staff.view', async () => {
    granted = ['dashboard.view', 'staff.view'];
    renderApp();
    await pageTitle('داشبورد');
    openFromSidebar('تنظیمات');
    expect(await screen.findByText('۰۹۱۲۰۰۰۰۰۰۰', { exact: false }).catch(() => screen.findByText('09120000000'))).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'عضو جدید' })).toBeNull();
    // Only the staff tab is granted, so the templates and audit tabs are hidden.
    expect(screen.queryByRole('button', { name: 'الگوهای دسترسی' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'گزارش رویدادها' })).toBeNull();
  });

  it('lets a staff manager add people and open the permission templates', async () => {
    renderApp();
    await pageTitle('داشبورد');
    openFromSidebar('تنظیمات');
    fireEvent.click(await screen.findByRole('button', { name: 'پرسنل و جایگاه‌ها' }));
    expect(await screen.findByRole('button', { name: 'عضو جدید' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'الگوهای دسترسی' }));
    expect(await screen.findByRole('button', { name: 'الگوی جدید' })).toBeTruthy();
  });
});
