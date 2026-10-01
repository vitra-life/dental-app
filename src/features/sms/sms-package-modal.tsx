import { Package } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatNumber } from '@/lib/format';
import { SMS_PACKAGE_OFFERS, type SmsPackageOffer } from './sms-packages';

interface SmsPackageModalProps {
  onBuy: (offer: SmsPackageOffer) => void;
  onClose: () => void;
}

export function SmsPackageModal({ onBuy, onClose }: SmsPackageModalProps) {
  return (
    <Modal open onClose={onClose} title="خرید بسته پیامک" size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {SMS_PACKAGE_OFFERS.map((offer, i) => (
            <button
              key={i}
              onClick={() => { onBuy(offer); onClose(); }}
              className="p-4 border border-surface-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center mx-auto mb-2">
                <Package size={20} className="text-primary-600" />
              </div>
              <p className="font-bold text-surface-800 text-sm">{formatNumber(offer.credits)} پیامک</p>
              <p className="text-xs text-surface-400 mt-1">{formatCurrency(offer.price)}</p>
              <p className="text-[10px] text-primary-500 mt-1">{offer.label}</p>
            </button>
          ))}
        </div>
        <button onClick={onClose} className="btn-secondary w-full">انصراف</button>
      </div>
    </Modal>
  );
}
