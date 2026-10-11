import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from './app';
import * as db from './lib/store';

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
const pageTitle = (name: string) => screen.getByRole('heading', { level: 1, name });

beforeEach(() => {
  db.resetStore();
});

afterEach(cleanup);

describe('App', () => {
  it.each(pages)('opens $nav from the sidebar', ({ nav, title }) => {
    render(<App />);
    openFromSidebar(nav);
    expect(pageTitle(title)).toBeTruthy();
  });

  it('opens a patient record from the appointments list and returns to the patient list', () => {
    render(<App />);
    openFromSidebar('نوبت‌دهی');
    fireEvent.click(screen.getAllByRole('button', { name: 'علیرضا کاظمی' })[0]);
    expect(pageTitle('علیرضا کاظمی')).toBeTruthy();

    openFromSidebar('بیماران');
    expect(pageTitle('بیماران')).toBeTruthy();
  });

  it('opens a patient record from the patient list and goes back by the breadcrumb', () => {
    render(<App />);
    openFromSidebar('بیماران');
    fireEvent.click(screen.getByText('علیرضا کاظمی'));
    expect(pageTitle('علیرضا کاظمی')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'بازگشت' }));
    expect(pageTitle('بیماران')).toBeTruthy();
  });
});
