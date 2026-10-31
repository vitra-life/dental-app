import { useEffect, useRef, useState } from 'react';
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
  Bell,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  LogOut,
  Building2,
  type LucideIcon,
} from 'lucide-react';
import logo from '@/assets/vitra-life-logo.svg';
import { useLogout, useMe, usePermissions, useSwitchClinic } from '@/data/session';
import { PAGE_PERMISSION } from '@/lib/permissions';
import type { PageKey } from '@/lib/types';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
}

const navItems: { key: PageKey; label: string; icon: LucideIcon }[] = [
  { key: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { key: 'patients', label: 'بیماران', icon: Users },
  { key: 'appointments', label: 'نوبت‌دهی', icon: CalendarDays },
  { key: 'billing', label: 'صورتحساب', icon: Receipt },
  { key: 'lab', label: 'لابراتوار', icon: FlaskConical },
  { key: 'reports', label: 'گزارش‌ها', icon: BarChart3 },
  { key: 'sms', label: 'پنل پیامک', icon: MessageSquare },
  { key: 'settings', label: 'تنظیمات', icon: Settings },
];

const COLLAPSED_KEY = 'dentaclinic:sidebar-collapsed';

interface SidebarContentProps {
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
  collapsed: boolean;
}

/** The signed-in user's name, their roles in the active clinic, and the active clinic. */
function useSignedInUser() {
  const { data: me } = useMe();
  const clinic = me?.clinics.find((c) => c.clinic_id === me.active_clinic_id);
  return {
    name: me?.user.full_name ?? '',
    initial: me?.user.full_name.trim().charAt(0) ?? '',
    roles: clinic?.roles.map((r) => r.name).join('، ') ?? '',
    clinicName: clinic?.clinic_name ?? 'سیستم مدیریت دندانپزشکی',
    otherClinics: me?.clinics.filter((c) => c.clinic_id !== me.active_clinic_id) ?? [],
  };
}

/** The user box: who is signed in, and a menu to switch clinic or log out. */
function UserMenu({ collapsed }: { collapsed: boolean }) {
  const user = useSignedInUser();
  const logout = useLogout();
  const switchClinic = useSwitchClinic();
  const [open, setOpen] = useState(false);
  return (
    <div className={`relative p-3 border-t border-surface-100 ${collapsed ? 'flex justify-center' : ''}`}>
      {open && (
        <div className="absolute bottom-full right-3 left-3 mb-2 min-w-48 bg-white border border-surface-200 rounded-xl shadow-lg p-1 z-30">
          {user.otherClinics.length > 0 && <p className="text-xs text-surface-400 px-3 pt-2 pb-1">رفتن به کلینیک</p>}
          {user.otherClinics.map((clinic) => (
            <button
              key={clinic.clinic_id}
              disabled={switchClinic.isPending}
              onClick={() => switchClinic.mutate(clinic.clinic_id, { onSettled: () => setOpen(false) })}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-surface-700 hover:bg-surface-50"
            >
              <Building2 size={16} className="text-surface-400" />
              <span className="truncate">{clinic.clinic_name}</span>
            </button>
          ))}
          <button
            onClick={() => logout.mutate()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-error-600 hover:bg-error-50"
          >
            <LogOut size={16} />
            خروج
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        title={collapsed ? user.name : undefined}
        className={`w-full flex items-center gap-3 rounded-xl hover:bg-surface-50 text-right ${collapsed ? 'justify-center' : 'px-2 py-1.5'}`}
      >
        <div className="w-8 h-8 rounded-full bg-linear-to-br/srgb from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-bold shrink-0">{user.initial}</div>
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-surface-700 truncate">{user.name}</p>
              <p className="text-xs text-surface-400 truncate">{user.roles}</p>
            </div>
            <ChevronDown size={16} className={`text-surface-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>
    </div>
  );
}

/** The menu, the assistant entry and the signed-in user: shared by the desktop sidebar and the mobile drawer. */
function SidebarContent({ currentPage, onNavigate, collapsed }: SidebarContentProps) {
  const aiActive = currentPage === 'ai';
  const { can } = usePermissions();
  return (
    <>
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.filter(({ key }) => can(PAGE_PERMISSION[key])).map(({ key, label, icon: Icon }) => {
          const active = currentPage === key;
          return (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              title={collapsed ? label : undefined}
              className={`nav-item w-full ${collapsed ? 'justify-center' : ''} ${active ? 'nav-item-active' : 'nav-item-inactive'}`}
            >
              <Icon size={20} strokeWidth={1.8} className={`shrink-0 ${active ? 'text-primary-600' : ''}`} />
              {!collapsed && <span>{label}</span>}
              {!collapsed && active && <span className="mr-auto w-1.5 h-1.5 rounded-full bg-primary-500" />}
            </button>
          );
        })}

        {can(PAGE_PERMISSION.ai) && <div className="pt-2 mt-1 border-t border-surface-100">
          <button
            onClick={() => onNavigate('ai')}
            title={collapsed ? 'دستیار هوشمند' : undefined}
            className={`nav-item w-full font-semibold bg-linear-to-l/srgb ${collapsed ? 'justify-center' : ''} ${
              aiActive ? 'from-violet-500 to-primary-500 text-white shadow-md' : 'from-violet-50 to-primary-50 text-violet-700 hover:from-violet-100 hover:to-primary-100'
            }`}
          >
            <Sparkles size={20} strokeWidth={1.8} className="shrink-0" />
            {!collapsed && <span>دستیار هوشمند</span>}
            {!collapsed && !aiActive && <span className="mr-auto text-xs bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full font-medium">جدید</span>}
          </button>
        </div>}
      </nav>

      <UserMenu collapsed={collapsed} />
    </>
  );
}

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const mainRef = useRef<HTMLElement>(null);
  const { clinicName, initial } = useSignedInUser();

  // The page scrolls inside <main>, so a new page starts from its top.
  useEffect(() => {
    setMobileOpen(false);
    mainRef.current?.scrollTo?.(0, 0);
  }, [currentPage]);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
    } catch {
      // The preference just isn't remembered.
    }
  };

  return (
    <div className="flex h-screen bg-surface-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-60'} hidden md:flex flex-col bg-white border-l border-surface-200 transition-all duration-200 ease-in-out shrink-0 h-full z-20`}>
        <div className={`flex items-center gap-3 p-4 border-b border-surface-100 ${collapsed ? 'flex-col' : ''}`}>
          <img src={logo} alt="" className="w-8 h-8 shrink-0" />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-surface-800 truncate">ویترا لایف</p>
              <p className="text-xs text-surface-400 truncate">{clinicName}</p>
            </div>
          )}
          <button onClick={toggleCollapsed} title={collapsed ? 'باز کردن منو' : 'جمع کردن منو'} className="p-1 rounded-lg hover:bg-surface-100 text-surface-400 transition-colors shrink-0">
            <ChevronRight size={16} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <SidebarContent currentPage={currentPage} onNavigate={onNavigate} collapsed={collapsed} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setMobileOpen(false)} />}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-60 flex flex-col bg-white border-l border-surface-200 transform transition-transform duration-200 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 p-4 border-b border-surface-100">
          <img src={logo} alt="" className="w-8 h-8 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-surface-800 truncate">ویترا لایف</p>
            <p className="text-xs text-surface-400 truncate">{clinicName}</p>
          </div>
          <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg text-surface-400 hover:bg-surface-100">
            <X size={20} />
          </button>
        </div>
        <SidebarContent currentPage={currentPage} onNavigate={onNavigate} collapsed={false} />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-surface-200 flex items-center justify-between px-4 md:px-6 shrink-0 z-10">
          <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-surface-100 text-surface-500">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-3 mr-auto">
            <button className="relative p-2 rounded-lg hover:bg-surface-100 text-surface-500 transition-colors">
              <Bell size={20} strokeWidth={1.8} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error-500 rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-semibold">{initial}</div>
          </div>
        </header>
        <main ref={mainRef} className="flex-1 overflow-y-auto">
          <div key={currentPage} className="p-4 md:p-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
