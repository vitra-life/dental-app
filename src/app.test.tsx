import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from './app';
import * as db from './lib/store';

const pages = [
  { nav: 'داشبورد', shows: 'خوش آمدید' },
  { nav: 'بیماران', shows: 'مدیریت بیماران' },
  { nav: 'نوبت‌دهی', shows: 'مدیریت نوبت‌های کلینیک' },
  { nav: 'صورتحساب', shows: 'مدیریت مالی و پرداخت‌ها' },
  { nav: 'لابراتوار', shows: 'مدیریت سفارشات و پرداخت‌های لابراتوار' },
  { nav: 'گزارش‌ها', shows: 'تحلیل عملکرد کلینیک' },
  { nav: 'دستیار هوشمند', shows: 'تحلیل و پیشنهادهای هوشمند' },
  { nav: 'پنل پیامک', shows: 'ارسال پیامک انبوه، مدیریت کمپین‌ها و بسته‌ها' },
  { nav: 'تنظیمات', shows: 'مدیریت اطلاعات کلینیک و سیستم' },
];

beforeEach(() => {
  db.resetStore();
  window.scrollTo = () => {};
});

afterEach(cleanup);

describe('App', () => {
  it.each(pages)('opens $nav from the sidebar', ({ nav, shows }) => {
    render(<App />);
    // The sidebar is rendered twice (desktop and mobile); either copy navigates.
    fireEvent.click(screen.getAllByRole('button', { name: nav })[0]);
    expect(screen.getByText(shows)).toBeTruthy();
  });

  it('opens a patient record from the appointments list', () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole('button', { name: 'نوبت‌دهی' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'علیرضا کاظمی' }));
    expect(screen.getByText('مدیریت بیماران')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'علیرضا کاظمی' })).toBeTruthy();
  });
});
