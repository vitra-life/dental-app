import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, type TabItem } from '@/components/ui/tabs';
import { usePermissions } from '@/data/session';
import { CAN } from '@/lib/permissions';
import { AuditTab } from './audit-tab';
import { ClinicTab } from './clinic-tab';
import { HoursTab } from './hours-tab';
import { NotificationsTab } from './notifications-tab';
import { PlansTab } from './plans-tab';
import { RolesTab } from './roles-tab';
import { ServicesTab } from './services-tab';
import { StaffTab } from './staff-tab';

type SettingsTab = 'clinic' | 'hours' | 'staff' | 'roles' | 'services' | 'plans' | 'audit' | 'notifications';

/**
 * Each tab with the permission that shows it (notifications has none yet).
 * Tabs that load from the API need the action their endpoint checks.
 */
const allTabs: (TabItem<SettingsTab> & { permission?: string })[] = [
  { key: 'clinic', label: 'اطلاعات کلینیک', permission: CAN.settingsClinic },
  { key: 'hours', label: 'ساعات کاری', permission: CAN.settingsHours },
  { key: 'staff', label: 'پرسنل', permission: CAN.viewStaff },
  { key: 'roles', label: 'نقش‌ها و دسترسی‌ها', permission: CAN.viewRoles },
  { key: 'services', label: 'کاتالوگ خدمات', permission: CAN.settingsServices },
  { key: 'plans', label: 'طرح درمان', permission: CAN.settingsPlans },
  { key: 'audit', label: 'گزارش رویدادها', permission: CAN.viewAudit },
  { key: 'notifications', label: 'اعلان‌ها' },
];

export function Settings() {
  const { can } = usePermissions();
  const tabs = allTabs.filter((t) => !t.permission || can(t.permission));
  const [chosen, setTab] = useState<SettingsTab>('clinic');
  // Falls back to the first visible tab when the chosen one isn't granted.
  const tab = tabs.some((t) => t.key === chosen) ? chosen : (tabs[0]?.key ?? 'notifications');

  return (
    <div className="space-y-5">
      <PageHeader title="تنظیمات" subtitle="مدیریت اطلاعات کلینیک" />

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'clinic' && <ClinicTab />}
      {tab === 'hours' && <HoursTab />}
      {tab === 'staff' && <StaffTab />}
      {tab === 'roles' && <RolesTab />}
      {tab === 'services' && <ServicesTab />}
      {tab === 'plans' && <PlansTab />}
      {tab === 'audit' && <AuditTab />}
      {tab === 'notifications' && <NotificationsTab />}
    </div>
  );
}
