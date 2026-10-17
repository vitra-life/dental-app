import { Package } from 'lucide-react';
import { ProgressBar } from '@/components/ui/progress-bar';
import { formatDate, isPast } from '@/lib/date';
import { formatCurrency, formatNumber, percent } from '@/lib/format';
import type { SmsPackage } from '@/lib/types';
import { SMS_PACKAGE_OFFERS, type SmsPackageOffer } from './sms-packages';

interface SmsPackagesTabProps {
  packages: SmsPackage[];
  onBuy: (offer: SmsPackageOffer) => void;
}

export function SmsPackagesTab({ packages, onBuy }: SmsPackagesTabProps) {
  return (
    <div className="space-y-4">
      {/* Bundles on offer */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-surface-700 mb-4">خرید بسته پیامک</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SMS_PACKAGE_OFFERS.map((offer, i) => (
            <button
              key={i}
              onClick={() => onBuy(offer)}
              className="p-4 border border-surface-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all text-center group"
            >
              <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center mx-auto mb-3">
                <Package size={18} strokeWidth={1.8} className="text-primary-600" />
              </div>
              <p className="font-bold text-surface-800 text-sm">{formatNumber(offer.credits)} پیامک</p>
              <p className="text-xs text-surface-400 mt-1">{formatCurrency(offer.price)}</p>
              <p className="text-[10px] text-primary-500 mt-1">{offer.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Purchased bundles */}
      <div>
        <h2 className="text-sm font-semibold text-surface-700 mb-3">بسته‌های خریداری شده</h2>
        {packages.length === 0 ? (
          <p className="text-sm text-surface-400 text-center py-6">هنوز بسته‌ای خریداری نشده است</p>
        ) : (
          <div className="space-y-3">
            {packages.map((pkg) => {
              const isExpired = pkg.expiry_date !== null && isPast(pkg.expiry_date);
              return (
                <div key={pkg.id} className="card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-surface-800 text-sm">{pkg.package_name}</p>
                      <p className="text-xs text-surface-400 mt-0.5">
                        خرید: {formatDate(pkg.purchase_date)}
                        {pkg.expiry_date && ` · انقضا: ${formatDate(pkg.expiry_date)}`}
                      </p>
                    </div>
                    <span className={`badge border ${isExpired ? 'bg-error-50 text-error-600 border-error-200' : pkg.status === 'active' ? 'bg-accent-50 text-accent-700 border-accent-200' : 'bg-surface-100 text-surface-600 border-surface-200'}`}>
                      {isExpired ? 'منقضی' : pkg.status === 'active' ? 'فعال' : 'غیرفعال'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-surface-500 mb-2">
                    <span>{formatNumber(pkg.used_credits)} استفاده شده از {formatNumber(pkg.total_credits)}</span>
                    <span className="font-medium text-primary-600">{formatNumber(pkg.remaining_credits)} باقی‌مانده</span>
                  </div>
                  <ProgressBar value={percent(pkg.used_credits, pkg.total_credits)} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
