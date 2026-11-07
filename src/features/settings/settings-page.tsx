import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, type TabItem } from '@/components/ui/tabs';
import { usePermissions } from '@/data/session';
import { SETTINGS_TAB_PERMISSION } from '@/lib/permissions';
import { AuditTab } from './audit-tab';
import { ClinicTab } from './clinic-tab';
import { HoursTab } from './hours-tab';
import { NotificationsTab } from './notifications-tab';
import { PlansTab } from './plans-tab';
import { TemplatesTab } from './templates-tab';
import { ServicesTab } from './services-tab';
import { StaffTab } from './staff-tab';

type SettingsTab = keyof typeof SETTINGS_TAB_PERMISSION;

/** Each tab is shown when the active workspace holds its view item. */
const allTabs: TabItem<SettingsTab>[] = [
  { key: 'clinic', label: 'اطلاعات کلینیک' },
  { key: 'hours', label: 'ساعات کاری' },
  { key: 'staff', label: 'پرسنل و جایگاه‌ها' },
  { key: 'templates', label: 'الگوهای دسترسی' },
  { key: 'services', label: 'کاتالوگ خدمات' },
  { key: 'plans', label: 'طرح درمان' },
  { key: 'audit', label: 'گزارش رویدادها' },
  { key: 'notifications', label: 'اعلان‌ها' },
];

export function Settings() {
  const { can } = usePermissions();
  const tabs = allTabs.filter((t) => can(SETTINGS_TAB_PERMISSION[t.key]));
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
      {tab === 'templates' && <TemplatesTab />}
      {tab === 'services' && <ServicesTab />}
      {tab === 'plans' && <PlansTab />}
      {tab === 'audit' && <AuditTab />}
      {tab === 'notifications' && <NotificationsTab />}
    </div>
  );
}
