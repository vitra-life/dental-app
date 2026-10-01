import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Mail, Package, Plus, Send } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, type TabItem } from '@/components/ui/tabs';
import * as db from '@/lib/store';
import type { Patient, SmsCampaign, SmsMessage, SmsPackage } from '@/lib/types';
import { CampaignDetail } from './campaign-detail';
import { CampaignForm } from './campaign-form';
import { SmsCampaignsTab } from './sms-campaigns-tab';
import { SmsOverviewTab } from './sms-overview-tab';
import { SmsPackageModal } from './sms-package-modal';
import { buyPackage, type SmsPackageOffer } from './sms-packages';
import { SmsPackagesTab } from './sms-packages-tab';
import { SmsReportsTab } from './sms-reports-tab';

type SmsTab = 'overview' | 'campaigns' | 'packages' | 'reports';

const tabs: TabItem<SmsTab>[] = [
  { key: 'overview', label: 'نمای کلی', icon: <BarChart3 size={16} /> },
  { key: 'campaigns', label: 'کمپین‌ها', icon: <Send size={16} /> },
  { key: 'packages', label: 'بسته‌های پیامک', icon: <Package size={16} /> },
  { key: 'reports', label: 'گزارش‌ها', icon: <Mail size={16} /> },
];

/** How many recent messages the reports tab works from. */
const RECENT_MESSAGES = 100;

export function SMSPanel() {
  const [tab, setTab] = useState<SmsTab>('overview');
  const [packages, setPackages] = useState<SmsPackage[]>([]);
  const [campaigns, setCampaigns] = useState<SmsCampaign[]>([]);
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [detailCampaign, setDetailCampaign] = useState<SmsCampaign | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const recentMessages = db.orderBy(db.list('sms_messages'), 'created_at', { ascending: false }).slice(0, RECENT_MESSAGES);
    setPackages(db.orderBy(db.list('sms_packages'), 'created_at', { ascending: false }));
    setCampaigns(db.orderBy(db.list('sms_campaigns'), 'created_at', { ascending: false }));
    setMessages(db.withOne(recentMessages, 'patient', 'patients', 'patient_id'));
    setPatients(db.orderBy(db.list('patients'), 'first_name'));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function buy(offer: SmsPackageOffer) {
    buyPackage(offer);
    load();
  }

  if (loading) {
    return <Skeleton className="h-64" />;
  }

  const remainingCredits = packages.reduce((s, p) => s + p.remaining_credits, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="پنل پیامک" subtitle="ارسال پیامک انبوه، مدیریت کمپین‌ها و بسته‌ها">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPackageModal(true)} className="btn-secondary">
            <Package size={18} />
            خرید بسته
          </button>
          <button onClick={() => setShowCampaignForm(true)} className="btn-primary">
            <Plus size={18} />
            کمپین جدید
          </button>
        </div>
      </PageHeader>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'overview' && <SmsOverviewTab packages={packages} campaigns={campaigns} onShowAllCampaigns={() => setTab('campaigns')} />}
      {tab === 'campaigns' && <SmsCampaignsTab campaigns={campaigns} onNew={() => setShowCampaignForm(true)} onOpen={setDetailCampaign} />}
      {tab === 'packages' && <SmsPackagesTab packages={packages} onBuy={buy} />}
      {tab === 'reports' && <SmsReportsTab messages={messages} />}

      {showCampaignForm && (
        <CampaignForm
          patients={patients}
          remainingCredits={remainingCredits}
          onClose={() => setShowCampaignForm(false)}
          onSaved={() => { load(); setShowCampaignForm(false); }}
        />
      )}

      {showPackageModal && <SmsPackageModal onBuy={buy} onClose={() => setShowPackageModal(false)} />}

      {detailCampaign && (
        <CampaignDetail
          campaign={detailCampaign}
          onClose={() => setDetailCampaign(null)}
          onUpdated={load}
        />
      )}
    </div>
  );
}
