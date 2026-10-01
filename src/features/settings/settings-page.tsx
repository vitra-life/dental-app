import { useState } from 'react';
import { Bell, Building2, ClipboardList, Settings as SettingsIcon, User } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, type TabItem } from '@/components/ui/tabs';
import { ClinicTab } from './clinic-tab';
import { NotificationsTab } from './notifications-tab';
import { PlansTab } from './plans-tab';
import { ServicesTab } from './services-tab';
import { StaffTab } from './staff-tab';

type SettingsTab = 'clinic' | 'staff' | 'services' | 'plans' | 'notifications';

const tabs: TabItem<SettingsTab>[] = [
  { key: 'clinic', label: 'اطلاعات کلینیک', icon: <Building2 size={16} /> },
  { key: 'staff', label: 'پرسنل', icon: <User size={16} /> },
  { key: 'services', label: 'خدمات', icon: <SettingsIcon size={16} /> },
  { key: 'plans', label: 'طرح‌های درمان', icon: <ClipboardList size={16} /> },
  { key: 'notifications', label: 'اعلان‌ها', icon: <Bell size={16} /> },
];

export function Settings() {
  const [tab, setTab] = useState<SettingsTab>('clinic');

  return (
    <div className="space-y-6">
      <PageHeader title="تنظیمات" subtitle="مدیریت اطلاعات کلینیک و سیستم" />

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'clinic' && <ClinicTab />}
      {tab === 'staff' && <StaffTab />}
      {tab === 'services' && <ServicesTab />}
      {tab === 'plans' && <PlansTab />}
      {tab === 'notifications' && <NotificationsTab />}
    </div>
  );
}
