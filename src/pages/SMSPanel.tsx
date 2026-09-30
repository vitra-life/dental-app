import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Plus,
  Send,
  Package,
  BarChart3,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Zap,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Mail,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatNumber, formatDate, formatDateShort, getPersianDayName } from '@/lib/format';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { showToast } from '@/components/ui/Toast';
import type { SmsPackage, SmsCampaign, SmsMessage, Patient, PageKey } from '@/lib/types';

interface SMSPanelProps {
  onNavigate: (page: PageKey) => void;
}

type TabKey = 'overview' | 'campaigns' | 'packages' | 'reports';

export function SMSPanel({ onNavigate }: SMSPanelProps) {
  const [tab, setTab] = useState<TabKey>('overview');
  const [packages, setPackages] = useState<SmsPackage[]>([]);
  const [campaigns, setCampaigns] = useState<SmsCampaign[]>([]);
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [detailCampaign, setDetailCampaign] = useState<SmsCampaign | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [pkgRes, campRes, msgRes, patRes] = await Promise.all([
      supabase.from('sms_packages').select('*').order('created_at', { ascending: false }),
      supabase.from('sms_campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('sms_messages').select('*, patient:patients(*)').order('created_at', { ascending: false }).limit(100),
      supabase.from('patients').select('*').order('first_name'),
    ]);
    setPackages(pkgRes.data || []);
    setCampaigns(campRes.data || []);
    setMessages(msgRes.data || []);
    setPatients(patRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalCredits = packages.reduce((s, p) => s + p.total_credits, 0);
  const usedCredits = packages.reduce((s, p) => s + p.used_credits, 0);
  const remainingCredits = packages.reduce((s, p) => s + p.remaining_credits, 0);
  const activePackages = packages.filter((p) => p.status === 'active');

  const totalSent = campaigns.reduce((s, c) => s + c.sent_count, 0);
  const totalFailed = campaigns.reduce((s, c) => s + c.failed_count, 0);
  const totalPending = campaigns.reduce((s, c) => s + c.pending_count, 0);

  const tabs = [
    { key: 'overview' as const, label: 'نمای کلی', icon: <BarChart3 size={16} /> },
    { key: 'campaigns' as const, label: 'کمپین‌ها', icon: <Send size={16} /> },
    { key: 'packages' as const, label: 'بسته‌های پیامک', icon: <Package size={16} /> },
    { key: 'reports' as const, label: 'گزارش‌ها', icon: <Mail size={16} /> },
  ];

  if (loading) {
    return <div className="h-64 bg-white rounded-2xl border border-surface-100 animate-pulse-soft" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-surface-800">پنل پیامک</h1>
          <p className="text-sm text-surface-400 mt-1">ارسال پیامک انبوه، مدیریت کمپین‌ها و بسته‌ها</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPackageForm(true)} className="btn-secondary">
            <Package size={18} />
            خرید بسته
          </button>
          <button onClick={() => setShowCampaignForm(true)} className="btn-primary">
            <Plus size={18} />
            کمپین جدید
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-surface-100 overflow-x-auto no-scrollbar">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              tab === t.key ? 'border-primary-500 text-primary-600' : 'border-transparent text-surface-400 hover:text-surface-600'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4 animate-slide-up">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <Package size={18} className="text-primary-500" />
                </div>
                <div>
                  <p className="text-xs text-surface-500">بسته‌های فعال</p>
                  <p className="text-lg font-bold text-surface-800">{formatNumber(activePackages.length)}</p>
                </div>
              </div>
            </div>
            <div className="card p-4 animate-slide-up" style={{ animationDelay: '50ms' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center">
                  <CheckCircle2 size={18} className="text-accent-500" />
                </div>
                <div>
                  <p className="text-xs text-surface-500">پیامک‌های ارسال شده</p>
                  <p className="text-lg font-bold text-surface-800">{formatNumber(totalSent)}</p>
                </div>
              </div>
            </div>
            <div className="card p-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-error-50 flex items-center justify-center">
                  <XCircle size={18} className="text-error-500" />
                </div>
                <div>
                  <p className="text-xs text-surface-500">ناموفق</p>
                  <p className="text-lg font-bold text-surface-800">{formatNumber(totalFailed)}</p>
                </div>
              </div>
            </div>
            <div className="card p-4 animate-slide-up" style={{ animationDelay: '150ms' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning-50 flex items-center justify-center">
                  <Clock size={18} className="text-warning-500" />
                </div>
                <div>
                  <p className="text-xs text-surface-500">در انتظار</p>
                  <p className="text-lg font-bold text-surface-800">{formatNumber(totalPending)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Remaining Credits Chart */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-surface-800">باقی‌مانده پیامک</h3>
                <p className="text-xs text-surface-400 mt-0.5">موجودی فعلی بسته‌های پیامک</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <Zap size={20} className="text-primary-500" />
              </div>
            </div>

            {/* Circular progress */}
            <div className="flex flex-col items-center py-6">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="url(#smsGradient)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 52}`}
                    strokeDashoffset={`${2 * Math.PI * 52 * (1 - (totalCredits > 0 ? remainingCredits / totalCredits : 0))}`}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="smsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#14b8a6" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-surface-800">{formatNumber(remainingCredits)}</span>
                  <span className="text-xs text-surface-400 mt-1">از {formatNumber(totalCredits)} پیامک</span>
                </div>
              </div>
              <div className="flex items-center gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent-500" />
                  <span className="text-xs text-surface-500">استفاده شده: {formatNumber(usedCredits)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary-500" />
                  <span className="text-xs text-surface-500">باقی‌مانده: {formatNumber(remainingCredits)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Campaigns */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-surface-800">آخرین کمپین‌ها</h3>
              <button onClick={() => setTab('campaigns')} className="text-sm text-primary-600 font-medium">مشاهده همه</button>
            </div>
            {campaigns.length === 0 ? (
              <p className="text-sm text-surface-400 text-center py-6">هنوز کمپینی ایجاد نشده است</p>
            ) : (
              <div className="space-y-2">
                {campaigns.slice(0, 5).map((c) => {
                  const sc = campaignStatusConfig(c.status);
                  return (
                    <div key={c.id} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${sc.bg}`}>
                        <Send size={16} className={sc.text} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-700 truncate">{c.title}</p>
                        <p className="text-xs text-surface-400">{formatDate(c.created_at)}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-surface-500">{formatNumber(c.sent_count)}/{formatNumber(c.total_recipients)} ارسال</p>
                        <span className={`badge ${sc.bg} ${sc.text}`}>{sc.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Campaigns Tab */}
      {tab === 'campaigns' && (
        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <EmptyState
              icon={Send}
              title="هیچ کمپینی وجود ندارد"
              description="اولین کمپین پیامک خود را ایجاد کنید"
              action={<button onClick={() => setShowCampaignForm(true)} className="btn-primary"><Plus size={18} />کمپین جدید</button>}
            />
          ) : (
            <div className="space-y-3">
              {campaigns.map((c, i) => {
                const sc = campaignStatusConfig(c.status);
                const progress = c.total_recipients > 0 ? Math.round((c.sent_count / c.total_recipients) * 100) : 0;
                return (
                  <div
                    key={c.id}
                    className="card card-hover p-5 cursor-pointer animate-slide-up"
                    style={{ animationDelay: `${i * 50}ms` }}
                    onClick={() => setDetailCampaign(c)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-surface-800 text-sm">{c.title}</h4>
                        <p className="text-xs text-surface-400 mt-0.5">{formatDate(c.created_at)}</p>
                      </div>
                      <span className={`badge ${sc.bg} ${sc.text}`}>{sc.label}</span>
                    </div>
                    <p className="text-xs text-surface-600 bg-surface-50 rounded-lg p-3 mb-3 line-clamp-2">{c.message_body}</p>
                    <div className="flex items-center justify-between text-xs text-surface-500 mb-2">
                      <span>{formatNumber(c.sent_count)} از {formatNumber(c.total_recipients)} ارسال شد</span>
                      <span className="font-medium text-primary-600">{formatNumber(progress)}%</span>
                    </div>
                    <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-l from-primary-500 to-primary-300 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="flex items-center gap-1 text-xs text-accent-600">
                        <CheckCircle2 size={12} />
                        {formatNumber(c.sent_count)} موفق
                      </span>
                      {c.failed_count > 0 && (
                        <span className="flex items-center gap-1 text-xs text-error-600">
                          <XCircle size={12} />
                          {formatNumber(c.failed_count)} ناموفق
                        </span>
                      )}
                      {c.pending_count > 0 && (
                        <span className="flex items-center gap-1 text-xs text-warning-600">
                          <Clock size={12} />
                          {formatNumber(c.pending_count)} در انتظار
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Packages Tab */}
      {tab === 'packages' && (
        <div className="space-y-4">
          {/* Available packages to buy */}
          <div className="card p-5">
            <h3 className="font-bold text-surface-800 text-sm mb-4 flex items-center gap-2">
              <Package size={18} className="text-primary-500" />
              خرید بسته پیامک
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PREDEFINED_PACKAGES.map((pkg, i) => (
                <button
                  key={i}
                  onClick={() => buyPackage(pkg, load)}
                  className="p-4 border border-surface-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all text-center group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Package size={20} className="text-primary-600" />
                  </div>
                  <p className="font-bold text-surface-800 text-sm">{formatNumber(pkg.credits)} پیامک</p>
                  <p className="text-xs text-surface-400 mt-1">{formatCurrency(pkg.price)}</p>
                  <p className="text-[10px] text-primary-500 mt-1">{pkg.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Purchased packages */}
          <div>
            <h3 className="font-bold text-surface-800 text-sm mb-3">بسته‌های خریداری شده</h3>
            {packages.length === 0 ? (
              <p className="text-sm text-surface-400 text-center py-6">هنوز بسته‌ای خریداری نشده است</p>
            ) : (
              <div className="space-y-3">
                {packages.map((pkg, i) => {
                  const progress = pkg.total_credits > 0 ? Math.round((pkg.used_credits / pkg.total_credits) * 100) : 0;
                  const isExpired = pkg.expiry_date && new Date(pkg.expiry_date) < new Date();
                  return (
                    <div key={pkg.id} className="card p-4 animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium text-surface-800 text-sm">{pkg.package_name}</p>
                          <p className="text-xs text-surface-400 mt-0.5">
                            خرید: {formatDate(pkg.purchase_date)}
                            {pkg.expiry_date && ` • انقضا: ${formatDate(pkg.expiry_date)}`}
                          </p>
                        </div>
                        <span className={`badge ${isExpired ? 'bg-error-50 text-error-600' : pkg.status === 'active' ? 'bg-accent-50 text-accent-600' : 'bg-surface-100 text-surface-500'}`}>
                          {isExpired ? 'منقضی' : pkg.status === 'active' ? 'فعال' : 'غیرفعال'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-surface-500 mb-2">
                        <span>{formatNumber(pkg.used_credits)} استفاده شده از {formatNumber(pkg.total_credits)}</span>
                        <span className="font-medium text-primary-600">{formatNumber(pkg.remaining_credits)} باقی‌مانده</span>
                      </div>
                      <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-l from-primary-500 to-accent-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {tab === 'reports' && (
        <div className="space-y-6">
          {/* Weekly chart */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-surface-800">آمار ارسال هفته</h3>
                <p className="text-xs text-surface-400 mt-0.5">پیامک‌های ارسالی در ۷ روز اخیر</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <TrendingUp size={20} className="text-primary-500" />
              </div>
            </div>
            <div className="flex items-end justify-between gap-2 h-48">
              {getWeeklyStats(messages).map((day, i) => {
                const maxVal = Math.max(...getWeeklyStats(messages).map((d) => d.count), 1);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className="w-full bg-gradient-to-t from-primary-500 to-primary-300 rounded-t-lg transition-all duration-500 group relative"
                        style={{ height: `${(day.count / maxVal) * 100}%`, minHeight: '8px' }}
                      >
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-surface-700 opacity-0 group-hover:opacity-100 transition-opacity">
                          {formatNumber(day.count)}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-surface-500 font-medium">{day.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent messages */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-surface-800">آخرین پیامک‌ها</h3>
              <span className="text-xs text-surface-400">{formatNumber(messages.length)} پیام</span>
            </div>
            {messages.length === 0 ? (
              <p className="text-sm text-surface-400 text-center py-6">هنوز پیامی ارسال نشده است</p>
            ) : (
              <div className="space-y-2">
                {messages.slice(0, 20).map((msg) => {
                  const sc = messageStatusConfig(msg.status);
                  return (
                    <div key={msg.id} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${sc.bg}`}>
                        {msg.status === 'sent' ? <CheckCircle2 size={16} className={sc.text} /> : msg.status === 'failed' ? <XCircle size={16} className={sc.text} /> : <Clock size={16} className={sc.text} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-700 truncate">{msg.phone_number}</p>
                        <p className="text-xs text-surface-400 truncate">{msg.message_body}</p>
                      </div>
                      <div className="text-left">
                        <span className={`badge ${sc.bg} ${sc.text}`}>{sc.label}</span>
                        <p className="text-[10px] text-surface-400 mt-1">{msg.sent_at ? formatDateShort(msg.sent_at) : formatDateShort(msg.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Campaign Form Modal */}
      {showCampaignForm && (
        <CampaignForm
          patients={patients}
          remainingCredits={remainingCredits}
          onClose={() => setShowCampaignForm(false)}
          onSaved={() => { load(); setShowCampaignForm(false); }}
        />
      )}

      {/* Package Form Modal */}
      {showPackageForm && (
        <Modal open onClose={() => setShowPackageForm(false)} title="خرید بسته پیامک" size="md">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {PREDEFINED_PACKAGES.map((pkg, i) => (
                <button
                  key={i}
                  onClick={() => { buyPackage(pkg, load); setShowPackageForm(false); }}
                  className="p-4 border border-surface-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all text-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center mx-auto mb-2">
                    <Package size={20} className="text-primary-600" />
                  </div>
                  <p className="font-bold text-surface-800 text-sm">{formatNumber(pkg.credits)} پیامک</p>
                  <p className="text-xs text-surface-400 mt-1">{formatCurrency(pkg.price)}</p>
                  <p className="text-[10px] text-primary-500 mt-1">{pkg.label}</p>
                </button>
              ))}
            </div>
            <button onClick={() => setShowPackageForm(false)} className="btn-secondary w-full">انصراف</button>
          </div>
        </Modal>
      )}

      {/* Campaign Detail Modal */}
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

const PREDEFINED_PACKAGES = [
  { credits: 500, price: 75000, label: 'کوچک' },
  { credits: 1000, price: 130000, label: 'متوسط' },
  { credits: 5000, price: 550000, label: 'بزرگ' },
  { credits: 10000, price: 950000, label: 'سازمانی' },
];

async function buyPackage(pkg: { credits: number; price: number; label: string }, reload: () => Promise<void>) {
  const { error } = await supabase.from('sms_packages').insert({
    package_name: `بسته ${pkg.label} (${formatNumber(pkg.credits)} پیامک)`,
    total_credits: pkg.credits,
    used_credits: 0,
    remaining_credits: pkg.credits,
    price: pkg.price,
    status: 'active',
    expiry_date: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
  });
  if (error) showToast('خطا در خرید بسته', 'error');
  else { showToast(`بسته ${pkg.label} خریداری شد`); await reload(); }
}

function campaignStatusConfig(status: string): { label: string; bg: string; text: string } {
  switch (status) {
    case 'completed': return { label: 'تکمیل شده', bg: 'bg-accent-50', text: 'text-accent-600' };
    case 'sending': return { label: 'در حال ارسال', bg: 'bg-warning-50', text: 'text-warning-600' };
    case 'scheduled': return { label: 'زمان‌بندی شده', bg: 'bg-secondary-50', text: 'text-secondary-600' };
    case 'cancelled': return { label: 'لغو شده', bg: 'bg-error-50', text: 'text-error-600' };
    default: return { label: 'پیش‌نویس', bg: 'bg-surface-100', text: 'text-surface-500' };
  }
}

function messageStatusConfig(status: string): { label: string; bg: string; text: string } {
  switch (status) {
    case 'sent': return { label: 'ارسال شد', bg: 'bg-accent-50', text: 'text-accent-600' };
    case 'failed': return { label: 'ناموفق', bg: 'bg-error-50', text: 'text-error-600' };
    default: return { label: 'در انتظار', bg: 'bg-warning-50', text: 'text-warning-600' };
  }
}

function getWeeklyStats(messages: SmsMessage[]): { label: string; count: number }[] {
  const result: { label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const count = messages.filter((m) => {
      const msgDate = (m.sent_at || m.created_at).split('T')[0];
      return msgDate === dateStr;
    }).length;
    result.push({ label: getPersianDayName(d), count });
  }
  return result;
}

function CampaignForm({ patients, remainingCredits, onClose, onSaved }: {
  patients: Patient[];
  remainingCredits: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<'all' | 'active' | 'inactive' | 'debtors' | 'custom'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  const targetPatients = patients.filter((p) => {
    if (target === 'all') return true;
    if (target === 'active') return p.status === 'active';
    if (target === 'inactive') return p.status !== 'active';
    if (target === 'debtors') return p.balance > 0;
    return true;
  });

  const recipientCount = target === 'custom' ? selectedIds.size : targetPatients.length;
  const messageLength = message.length;
  const smsCount = Math.ceil(messageLength / 70) || 1;
  const totalNeeded = recipientCount * smsCount;

  async function handleSend() {
    if (!title.trim() || !message.trim()) { showToast('عنوان و متن پیام الزامی است', 'error'); return; }
    if (recipientCount === 0) { showToast('گیرنده‌ای انتخاب نشده است', 'error'); return; }
    if (totalNeeded > remainingCredits) { showToast(`موجودی کافی نیست. ${formatNumber(totalNeeded)} پیامک نیاز است`, 'error'); return; }

    setSending(true);

    const recipients = target === 'custom'
      ? patients.filter((p) => selectedIds.has(p.id))
      : targetPatients;

    const { data: campaign, error: campError } = await supabase.from('sms_campaigns').insert({
      title: title.trim(),
      message_body: message.trim(),
      target_filter: { type: target },
      total_recipients: recipients.length,
      sent_count: 0,
      failed_count: 0,
      pending_count: recipients.length,
      status: 'sending',
    }).select().single();

    if (campError || !campaign) { showToast('خطا در ایجاد کمپین', 'error'); setSending(false); return; }

    const msgInserts = recipients.map((p) => ({
      campaign_id: campaign.id,
      patient_id: p.id,
      phone_number: p.phone,
      message_body: message.trim(),
      status: 'sent' as const,
      sent_at: new Date().toISOString(),
    }));

    const { error: msgError } = await supabase.from('sms_messages').insert(msgInserts);

    if (msgError) {
      await supabase.from('sms_campaigns').update({ status: 'cancelled', failed_count: recipients.length, pending_count: 0 }).eq('id', campaign.id);
      showToast('خطا در ارسال پیامک‌ها', 'error');
      setSending(false);
      return;
    }

    await supabase.from('sms_campaigns').update({
      status: 'completed',
      sent_count: recipients.length,
      pending_count: 0,
      sent_at: new Date().toISOString(),
    }).eq('id', campaign.id);

    const activePkg = await supabase.from('sms_packages').select('*').eq('status', 'active').order('created_at', { ascending: true }).maybeSingle();
    if (activePkg.data) {
      const newUsed = activePkg.data.used_credits + totalNeeded;
      const newRemaining = Math.max(0, activePkg.data.remaining_credits - totalNeeded);
      await supabase.from('sms_packages').update({
        used_credits: newUsed,
        remaining_credits: newRemaining,
        status: newRemaining <= 0 ? 'expired' : 'active',
      }).eq('id', activePkg.data.id);
    }

    showToast(`${formatNumber(recipients.length)} پیامک ارسال شد`);
    setSending(false);
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title="کمپین پیامک جدید" size="lg">
      <div className="space-y-4">
        <div>
          <label className="label-field">عنوان کمپین *</label>
          <input className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلا: یادآوری چکاپ دوره‌ای" />
        </div>
        <div>
          <label className="label-field">متن پیام *</label>
          <textarea className="input-field min-h-[100px]" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="متن پیامک خود را وارد کنید..." />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-surface-400">{formatNumber(messageLength)} کاراکتر</span>
            <span className="text-xs text-surface-400">{formatNumber(smsCount)} پیامک برای هر گیرنده</span>
          </div>
        </div>
        <div>
          <label className="label-field">گروه هدف</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {([
              { key: 'all', label: 'همه بیماران' },
              { key: 'active', label: 'بیماران فعال' },
              { key: 'inactive', label: 'غیرفعال' },
              { key: 'debtors', label: 'بدهکار' },
            ] as const).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setTarget(opt.key)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  target === opt.key ? 'bg-primary-50 text-primary-600 border border-primary-200' : 'bg-surface-50 text-surface-400 border border-surface-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {target === 'custom' && (
          <div className="max-h-48 overflow-y-auto space-y-1 p-2 bg-surface-50 rounded-xl">
            {patients.map((p) => (
              <label key={p.id} className="flex items-center gap-2 p-2 hover:bg-white rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.has(p.id)}
                  onChange={(e) => {
                    const next = new Set(selectedIds);
                    if (e.target.checked) next.add(p.id);
                    else next.delete(p.id);
                    setSelectedIds(next);
                  }}
                  className="w-4 h-4 accent-primary-500"
                />
                <span className="text-sm text-surface-700">{p.first_name} {p.last_name} - {p.phone}</span>
              </label>
            ))}
          </div>
        )}

        {/* Summary */}
        <div className="p-4 bg-primary-50 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-surface-600">تعداد گیرندگان</span>
            <span className="font-bold text-surface-800">{formatNumber(recipientCount)} نفر</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-surface-600">کل پیامک‌های مورد نیاز</span>
            <span className="font-bold text-surface-800">{formatNumber(totalNeeded)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-surface-600">موجودی فعلی</span>
            <span className={`font-bold ${totalNeeded > remainingCredits ? 'text-error-600' : 'text-accent-600'}`}>{formatNumber(remainingCredits)}</span>
          </div>
          {totalNeeded > remainingCredits && (
            <div className="flex items-center gap-2 text-xs text-error-600 mt-2">
              <AlertTriangle size={14} />
              موجودی کافی نیست. لطفاً بسته پیامک خریداری کنید.
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleSend} disabled={sending || totalNeeded > remainingCredits} className="btn-primary flex-1">
            <Send size={18} />
            {sending ? 'در حال ارسال...' : `ارسال به ${formatNumber(recipientCount)} نفر`}
          </button>
          <button onClick={onClose} className="btn-secondary">انصراف</button>
        </div>
      </div>
    </Modal>
  );
}

function CampaignDetail({ campaign, onClose, onUpdated }: {
  campaign: SmsCampaign;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('sms_messages').select('*, patient:patients(*)').eq('campaign_id', campaign.id).order('created_at', { ascending: false }).then(({ data }) => {
      setMessages(data || []);
      setLoading(false);
    });
  }, [campaign.id]);

  async function cancelCampaign() {
    const { error } = await supabase.from('sms_campaigns').update({ status: 'cancelled' }).eq('id', campaign.id);
    if (error) showToast('خطا', 'error');
    else { showToast('کمپین لغو شد'); onUpdated(); onClose(); }
  }

  async function deleteCampaign() {
    await supabase.from('sms_messages').delete().eq('campaign_id', campaign.id);
    const { error } = await supabase.from('sms_campaigns').delete().eq('id', campaign.id);
    if (error) showToast('خطا در حذف', 'error');
    else { showToast('کمپین حذف شد'); onUpdated(); onClose(); }
  }

  const sc = campaignStatusConfig(campaign.status);

  return (
    <Modal open onClose={onClose} title={campaign.title} size="lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-surface-50 rounded-xl">
          <div>
            <p className="text-xs text-surface-400">وضعیت</p>
            <span className={`badge ${sc.bg} ${sc.text} mt-1`}>{sc.label}</span>
          </div>
          <div>
            <p className="text-xs text-surface-400">گیرندگان</p>
            <p className="text-sm font-bold text-surface-800 mt-1">{formatNumber(campaign.total_recipients)} نفر</p>
          </div>
          <div>
            <p className="text-xs text-surface-400">ارسال شده</p>
            <p className="text-sm font-bold text-accent-600 mt-1">{formatNumber(campaign.sent_count)}</p>
          </div>
          <div>
            <p className="text-xs text-surface-400">ناموفق</p>
            <p className="text-sm font-bold text-error-600 mt-1">{formatNumber(campaign.failed_count)}</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-surface-400 mb-2">متن پیام</p>
          <div className="p-3 bg-surface-50 rounded-xl text-sm text-surface-700">{campaign.message_body}</div>
        </div>

        <div>
          <p className="text-xs text-surface-400 mb-2">لیست گیرندگان</p>
          {loading ? (
            <div className="h-32 bg-surface-50 rounded-xl animate-pulse-soft" />
          ) : messages.length === 0 ? (
            <p className="text-sm text-surface-400 text-center py-4">پیامی ثبت نشده</p>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {messages.map((msg) => {
                const msc = messageStatusConfig(msg.status);
                return (
                  <div key={msg.id} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${msc.bg}`}>
                      {msg.status === 'sent' ? <CheckCircle2 size={14} className={msc.text} /> : msg.status === 'failed' ? <XCircle size={14} className={msc.text} /> : <Clock size={14} className={msc.text} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-700">{msg.patient ? `${msg.patient.first_name} ${msg.patient.last_name}` : msg.phone_number}</p>
                      <p className="text-xs text-surface-400">{msg.phone_number}</p>
                    </div>
                    <span className={`badge ${msc.bg} ${msc.text}`}>{msc.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {(campaign.status === 'draft' || campaign.status === 'sending') && (
          <button onClick={cancelCampaign} className="btn-secondary w-full">
            لغو کمپین
          </button>
        )}
        <button onClick={deleteCampaign} className="flex items-center justify-center gap-2 w-full p-2.5 rounded-xl text-error-500 hover:bg-error-50 transition-colors text-sm">
          <Trash2 size={16} />
          حذف کمپین
        </button>
      </div>
    </Modal>
  );
}
