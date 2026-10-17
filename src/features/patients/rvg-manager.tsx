import { useState, useEffect, useCallback } from 'react';
import { Image, Plus } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { SkeletonList } from '@/components/ui/skeleton';
import { NumberInput } from '@/components/ui/number-input';
import { formatNumber } from '@/lib/format';
import * as db from '@/lib/store';
import { showToast } from '@/lib/toast';
import type { RvgImage } from '@/lib/types';

export function RvgManager({ patientId }: { patientId: string }) {
  const [images, setImages] = useState<RvgImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageDesc, setImageDesc] = useState('');
  const [toothNum, setToothNum] = useState<number | null>(null);

  const load = useCallback(() => {
    setImages(db.orderBy(db.list('rvg_images', (r) => r.patient_id === patientId), 'created_at', { ascending: false }));
    setLoading(false);
  }, [patientId]);

  useEffect(() => { load(); }, [load]);

  function addImage() {
    if (!imageUrl) { showToast('آدرس تصویر را وارد کنید', 'error'); return; }
    db.insert('rvg_images', {
      patient_id: patientId,
      image_url: imageUrl,
      description: imageDesc || null,
      tooth_number: toothNum,
      image_type: 'rvg',
    });
    showToast('تصویر ثبت شد');
    setImageUrl('');
    setImageDesc('');
    setToothNum(null);
    setShowAdd(false);
    load();
  }

  function deleteImage(id: string) {
    db.remove('rvg_images', id);
    showToast('تصویر حذف شد');
    load();
  }

  return (
    <div className="card p-5">
      <SectionHeader
        title={`تصاویر رادیوگرافی (${formatNumber(images.length)})`}
        aside={
          <div className="flex gap-2">
            <button onClick={() => showToast('دستگاه RVG متصل نیست', 'info')} className="btn-secondary text-xs px-3 py-1.5">اتصال به RVG</button>
            <button onClick={() => setShowAdd(!showAdd)} className="btn-primary text-xs px-3 py-1.5">
              <Plus size={14} />
              افزودن تصویر
            </button>
          </div>
        }
      />

      {showAdd && (
        <div className="p-4 mb-4 bg-surface-50 rounded-xl space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="label-field">آدرس تصویر</label>
              <input className="input-field" dir="ltr" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className="label-field">شماره دندان</label>
              <NumberInput value={toothNum} onChange={setToothNum} placeholder="مثلا: ۱۸" />
            </div>
            <div>
              <label className="label-field">توضیحات</label>
              <input className="input-field" value={imageDesc} onChange={(e) => setImageDesc(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={addImage} className="btn-primary">ثبت</button>
            <button onClick={() => setShowAdd(false)} className="btn-secondary">انصراف</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <SkeletonList count={3} className="aspect-square" variant="inset" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((img) => (
            <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl border border-surface-100 bg-surface-100">
              <img src={img.image_url} alt={img.description || 'RVG'} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-linear-to-t/srgb from-surface-900/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <p className="text-white text-xs font-medium">{img.description || 'تصویر RVG'}</p>
                {img.tooth_number && <p className="text-white/70 text-[11px]">دندان شماره {formatNumber(img.tooth_number)}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <a href={img.image_url} target="_blank" rel="noreferrer" className="px-2.5 py-1 bg-white/20 text-white text-xs rounded-lg hover:bg-white/30">مشاهده</a>
                  <button onClick={() => deleteImage(img.id)} className="px-2.5 py-1 bg-error-500/80 text-white text-xs rounded-lg hover:bg-error-500">حذف</button>
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={() => setShowAdd(true)}
            className="aspect-square bg-surface-50 rounded-xl flex flex-col items-center justify-center text-surface-400 border-2 border-dashed border-surface-200 hover:bg-surface-100 transition-colors"
          >
            <Image size={30} strokeWidth={1.5} className="mb-2" />
            <span className="text-xs">افزودن تصویر</span>
          </button>
        </div>
      )}
    </div>
  );
}
