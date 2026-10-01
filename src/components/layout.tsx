import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Receipt,
  FlaskConical,
  BarChart3,
  Sparkles,
  Settings,
  Menu,
  X,
  Stethoscope,
  Bell,
  Search,
  MessageSquare,
} from 'lucide-react';
import type { PageKey } from '@/lib/types';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
}

const navItems: { key: PageKey; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'داشبورد', icon: <LayoutDashboard size={20} /> },
  { key: 'patients', label: 'بیماران', icon: <Users size={20} /> },
  { key: 'appointments', label: 'نوبت‌دهی', icon: <CalendarDays size={20} /> },
  { key: 'billing', label: 'صورتحساب', icon: <Receipt size={20} /> },
  { key: 'lab', label: 'لابراتوار', icon: <FlaskConical size={20} /> },
  { key: 'reports', label: 'گزارش‌ها', icon: <BarChart3 size={20} /> },
  { key: 'ai', label: 'دستیار هوشمند', icon: <Sparkles size={20} /> },
  { key: 'sms', label: 'پنل پیامک', icon: <MessageSquare size={20} /> },
  { key: 'settings', label: 'تنظیمات', icon: <Settings size={20} /> },
];

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [currentPage]);

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 fixed inset-y-0 right-0 bg-white border-l border-surface-100 z-30">
        <div className="flex items-center gap-3 px-5 h-16 border-b border-surface-100">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br/srgb from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-200">
            <Stethoscope className="text-white" size={22} />
          </div>
          <div>
            <h1 className="font-bold text-surface-800 text-base leading-tight">دنتاکلینیک</h1>
            <p className="text-[11px] text-surface-400 leading-tight">سیستم مدیریت دندانپزشکی</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`nav-item w-full ${currentPage === item.key ? 'nav-item-active' : 'nav-item-inactive'}`}
            >
              {item.icon}
              <span>{item.label}</span>
              {currentPage === item.key && (
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-l-full" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-surface-100">
          <div className="flex items-center gap-3 p-2">
            <div className="w-9 h-9 rounded-full bg-linear-to-br/srgb from-secondary-400 to-secondary-600 flex items-center justify-center text-white text-sm font-bold">
              س
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-700 truncate">دکتر سارا احمدی</p>
              <p className="text-[11px] text-surface-400 truncate">مدیر کلینیک</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-surface-900/40 backdrop-blur-xs z-40 animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 right-0 w-72 bg-white z-50 transform transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-surface-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br/srgb from-primary-500 to-primary-700 flex items-center justify-center">
              <Stethoscope className="text-white" size={22} />
            </div>
            <div>
              <h1 className="font-bold text-surface-800 text-base leading-tight">دنتاکلینیک</h1>
              <p className="text-[11px] text-surface-400">سیستم مدیریت</p>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-surface-100">
            <X size={20} className="text-surface-500" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`nav-item w-full ${currentPage === item.key ? 'nav-item-active' : 'nav-item-inactive'}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:mr-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header
          className={`sticky top-0 z-20 h-16 flex items-center justify-between px-4 lg:px-8 transition-all duration-300 ${
            scrolled ? 'glass border-b border-surface-100' : 'bg-transparent'
          }`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-surface-100"
            >
              <Menu size={22} className="text-surface-600" />
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-surface-100 rounded-xl px-3.5 py-2 w-64">
              <Search size={16} className="text-surface-400" />
              <input
                type="text"
                placeholder="جستجو..."
                className="bg-transparent text-sm outline-hidden flex-1 placeholder:text-surface-400 text-surface-700"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative p-2.5 rounded-xl hover:bg-surface-100 transition-colors">
              <Bell size={20} className="text-surface-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error-500 rounded-full" />
            </button>
            <div className="w-9 h-9 rounded-full bg-linear-to-br/srgb from-secondary-400 to-secondary-600 flex items-center justify-center text-white text-sm font-bold">
              س
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 lg:px-8 py-6 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
