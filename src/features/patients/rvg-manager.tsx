import { useState, useEffect, useCallback } from 'react';
import { Image, Plus } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonList } from '@/components/ui/skeleton';
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
  const [toothNum, setToothNum] = useState('');

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
      tooth_number: toothNum ? parseInt(toothNum) : null,
      image_type: 'rvg',
    });
    showToast('تصویر ثبت شد');
    setImageUrl('');
    setImageDesc('');
    setToothNum('');
    setShowAdd(false);
    load();
  }

  function deleteImage(id: string) {
    db.remove('rvg_images', id);
    showToast('تصویر حذف شد');
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-surface-500">{formatNumber(images.length)} تصویر ثبت شده</p>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary">
          <Plus size={16} />
          افزودن تصویر
        </button>
      </div>

      {showAdd && (
        <div className="p-4 bg-surface-50 rounded-xl space-y-3 animate-slide-down">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="label-field">آدرس تصویر</label>
              <input className="input-field" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className="label-field">شماره دندان</label>
              <input type="number" className="input-field" value={toothNum} onChange={(e) => setToothNum(e.target.value)} placeholder="مثلا: ۱۸" />
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <SkeletonList count={3} className="h-40" variant="inset" />
        </div>
      ) : images.length === 0 ? (
        <EmptyState icon={Image} title="هیچ تصویری ثبت نشده" description="تصاویر رادیولوژی بیمار را اینجا اضافه کنید" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img) => (
            <div key={img.id} className="group relative overflow-hidden rounded-xl border border-surface-100 bg-surface-50">
              <img src={img.image_url} alt={img.description || 'RVG'} className="w-full h-40 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-900/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <p className="text-white text-xs font-medium">{img.description || 'تصویر RVG'}</p>
                {img.tooth_number && <p className="text-white/70 text-[11px]">دندان شماره {formatNumber(img.tooth_number)}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <a href={img.image_url} target="_blank" rel="noreferrer" className="px-2.5 py-1 bg-white/20 text-white text-xs rounded-lg hover:bg-white/30">مشاهده</a>
                  <button onClick={() => deleteImage(img.id)} className="px-2.5 py-1 bg-error-500/80 text-white text-xs rounded-lg hover:bg-error-500">حذف</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
