import { useState, useEffect } from 'react';
import { AreaTrend, Bars, Donut } from '@/components/ui/charts';
import { PageHeader } from '@/components/ui/page-header';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton, SkeletonList } from '@/components/ui/skeleton';
import { StatTile } from '@/components/ui/stat-tile';
import { StatusBadge } from '@/components/ui/status-badge';
import { statusStyle, treatmentPlanStatus } from '@/constants/status';
import { formatCurrency, formatNumber, fullName, percent } from '@/lib/format';
import { loadReportStats, type ReportStats } from './report-stats';

const planHeaders = ['بیمار', 'عنوان طرح', 'مرحله', 'جمع کل', 'انجام‌شده', 'مانده', 'وضعیت'];

export function Reports() {
  const [data, setData] = useState<ReportStats | null>(null);

  useEffect(() => {
    setData(loadReportStats());
  }, []);

  if (!data) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SkeletonList count={4} className="h-20" />
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  const completionRate = percent(data.completedAppointments, data.totalAppointments);
  const maxStaffAppointments = Math.max(...data.staffStats.map((s) => s.appointments), 1);

  return (
    <div className="space-y-5">
      <PageHeader title="گزارش‌ها" subtitle="تحلیل عملکرد کلینیک" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile label="کل درآمد دریافتی" value={formatCurrency(data.totalRevenue)} valueClassName="text-accent-600" />
        <StatTile label="در انتظار دریافت" value={formatCurrency(data.pendingPayments)} valueClassName="text-warning-600" />
        <StatTile
          label="ویزیت انجام‌شده"
          value={formatNumber(data.completedAppointments)}
          sub={<>{formatNumber(completionRate)}٪ از {formatNumber(data.totalAppointments)} نوبت · {formatNumber(data.cancelledAppointments)} لغو</>}
          valueClassName="text-primary-600"
        />
        <StatTile label="طرح درمان فعال" value={formatNumber(data.activePlans)} sub={<>{formatNumber(data.totalPatients)} بیمار</>} valueClassName="text-violet-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <SectionHeader title="درآمد ماهانه (تومان)" note="۶ ماه اخیر" />
          <AreaTrend data={data.monthlyRevenue.map((m) => ({ label: m.month, value: m.amount }))} height={220} format={formatCurrency} />
        </div>
        <div className="card p-5">
          <SectionHeader title="رشد بیماران" note="بیمار جدید در ماه" />
          <Bars data={data.monthlyActivity.map((m) => ({ label: m.month, value: m.newPatients }))} height={220} format={(v) => `${formatNumber(v)} بیمار جدید`} barSize={20} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <SectionHeader title="پرکاربردترین خدمات" />
          {data.serviceStats.length === 0 ? (
            <p className="text-sm text-surface-400 text-center py-10">هنوز ویزیتی انجام نشده است</p>
          ) : (
            <Donut data={data.serviceStats.map((s) => ({ label: s.name, value: s.count }))} height={200} format={(v) => `${formatNumber(v)} ویزیت`} />
          )}
        </div>
        <div className="lg:col-span-2 card p-5">
          <SectionHeader title="تعداد نوبت‌ها در ماه" note="۶ ماه اخیر" />
          <Bars data={data.monthlyActivity.map((m) => ({ label: m.month, value: m.appointments }))} height={220} format={(v) => `${formatNumber(v)} نوبت`} barSize={24} color="#06b6d4" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <SectionHeader title="نوبت‌های هفته" note="۷ روز اخیر" />
          <Bars data={data.weeklyAppointments.map((w) => ({ label: w.day, value: w.count }))} height={200} format={(v) => `${formatNumber(v)} نوبت`} />
        </div>
        <div className="card p-5">
          <SectionHeader title="عملکرد دندانپزشکان" note="تعداد نوبت‌ها" />
          <div className="space-y-3">
            {data.staffStats.map((s) => (
              <div key={s.name} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: s.color }}>
                  {s.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-surface-700 truncate">{s.name}</span>
                    <span className="text-xs text-surface-400 shrink-0">{formatNumber(s.appointments)} نوبت</span>
                  </div>
                  <ProgressBar value={(s.appointments / maxStaffAppointments) * 100} color={s.color} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <SectionHeader title="عملکرد طرح‌های درمان" />
        {data.plans.length === 0 ? (
          <p className="text-sm text-surface-400 text-center py-6">هنوز طرح درمانی ثبت نشده است</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100">
                  {planHeaders.map((h) => (
                    <th key={h} className="text-xs font-medium text-surface-500 py-2 px-3 text-right whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.plans.map((plan) => {
                  const items = plan.items ?? [];
                  const completed = items.filter((i) => i.status === 'completed');
                  const done = completed.reduce((sum, i) => sum + (i.actual_cost ?? i.estimated_cost), 0);
                  const progress = percent(completed.length, items.length);
                  return (
                    <tr key={plan.id} className="border-b border-surface-50 hover:bg-surface-50 transition-colors">
                      <td className="py-3 px-3 font-medium text-surface-700 whitespace-nowrap">{fullName(plan.patient)}</td>
                      <td className="py-3 px-3 text-surface-600 text-xs whitespace-nowrap">{plan.title}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16">
                            <ProgressBar value={progress} />
                          </div>
                          <span className="text-xs text-surface-500">{formatNumber(progress)}٪</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-medium whitespace-nowrap">{formatCurrency(plan.total_estimated_cost)}</td>
                      <td className="py-3 px-3 text-accent-600 font-medium whitespace-nowrap">{formatCurrency(done)}</td>
                      <td className="py-3 px-3 text-warning-600 font-medium whitespace-nowrap">{formatCurrency(Math.max(plan.total_estimated_cost - done, 0))}</td>
                      <td className="py-3 px-3">
                        <StatusBadge status={statusStyle(treatmentPlanStatus, plan.status, 'cancelled')} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
