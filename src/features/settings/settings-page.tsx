import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, type TabItem } from '@/components/ui/tabs';
import { ClinicTab } from './clinic-tab';
import { HoursTab } from './hours-tab';
import { NotificationsTab } from './notifications-tab';
import { PlansTab } from './plans-tab';
import { ServicesTab } from './services-tab';
import { StaffTab } from './staff-tab';

type SettingsTab = 'clinic' | 'hours' | 'staff' | 'services' | 'plans' | 'notifications';

const tabs: TabItem<SettingsTab>[] = [
  { key: 'clinic', label: 'اطلاعات کلینیک' },
  { key: 'hours', label: 'ساعات کاری' },
  { key: 'staff', label: 'پرسنل' },
  { key: 'services', label: 'کاتالوگ خدمات' },
  { key: 'plans', label: 'طرح درمان' },
  { key: 'notifications', label: 'اعلان‌ها' },
];

export function Settings() {
  const [tab, setTab] = useState<SettingsTab>('clinic');

  return (
    <div className="space-y-5">
      <PageHeader title="تنظیمات" subtitle="مدیریت اطلاعات کلینیک" />

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'clinic' && <ClinicTab />}
      {tab === 'hours' && <HoursTab />}
      {tab === 'staff' && <StaffTab />}
      {tab === 'services' && <ServicesTab />}
      {tab === 'plans' && <PlansTab />}
      {tab === 'notifications' && <NotificationsTab />}
    </div>
  );
}
