import { useMemo, useState } from 'react';
import { Link2 } from 'lucide-react';
import { JalaliDateInput } from '@/components/ui/jalali-date-input';
import { Modal } from '@/components/ui/modal';
import { APPOINTMENT_DURATIONS, DEFAULT_APPOINTMENT_DURATION } from '@/constants/schedule';
import { useCreateAppointment } from '@/data/appointments';
import { useDoctors } from '@/data/doctors';
import { useMe } from '@/data/session';
import { errorMessage, errorReason } from '@/lib/api/errors';
import { formatNumber } from '@/lib/format';
import { bookableDuration } from '@/lib/schedule';
import { showToast } from '@/lib/toast';
import { activePlans, bookableItems, linkAppointment, planItemLabel } from '@/lib/treatment-plans';
import type { Patient, Service } from '@/lib/types';

interface AppointmentFormProps {
  /** The day to prefill, `YYYY-MM-DD`. */
  date: string;
  /** Time to prefill, `HH:MM`. */
  startTime: string;
  patients: Patient[];
  services: Service[];
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Books an appointment: a patient, a service, the doctor, the date, the time
 * on that date (together the start) and how long it lasts.
 */
export function AppointmentForm({ date, startTime, patients, services, onClose, onSaved }: AppointmentFormProps) {
  const createAppointment = useCreateAppointment();
  const { data: doctors = [] } = useDoctors();
  const { data: me } = useMe();
  const myMembership = me?.clinics.find((c) => c.clinic_id === me.active_clinic_id)?.membership_id;
  const [form, setForm] = useState({
    patient_id: '',
    plan_item_id: '',
    service_id: '',
    doctor_membership_id: '',
    appointment_date: date,
    start_time: startTime,
    duration_minutes: DEFAULT_APPOINTMENT_DURATION,
    notes: '',
  });

  /** The patient's active plans that still have something to book. */
  const plans = useMemo(
    () => (form.patient_id ? activePlans(form.patient_id, services).map((plan) => ({ plan, items: bookableItems(plan) })).filter((p) => p.items.length > 0) : []),
    [form.patient_id, services],
  );

  /** Fills the service and its length from the chosen plan item. */
  function selectPlanItem(itemId: string) {
    const item = plans.flatMap((p) => p.items).find((i) => i.id === itemId);
    if (!item) {
      setForm({ ...form, plan_item_id: '' });
      return;
    }
    setForm({
      ...form,
      plan_item_id: itemId,
      service_id: item.service_id ?? form.service_id,
      duration_minutes: bookableDuration(item.service?.duration_minutes),
    });
  }

  function selectService(serviceId: string) {
    const service = services.find((s) => s.id === serviceId);
    setForm({ ...form, service_id: serviceId, duration_minutes: service ? bookableDuration(service.duration_minutes) : form.duration_minutes });
  }

  /** Until a doctor is picked: the user themselves if they are a doctor, or the only doctor. */
  const doctorId =
    form.doctor_membership_id ||
    doctors.find((d) => d.membership_id === myMembership)?.membership_id ||
    (doctors.length === 1 ? doctors[0].membership_id : '');

  async function save() {
    if (!form.patient_id || !form.service_id || !doctorId || !form.appointment_date || !form.start_time) {
      showToast('بیمار، خدمت، پزشک، تاریخ و ساعت را انتخاب کنید', 'error');
      return;
    }
    try {
      const appointment = await createAppointment.mutateAsync({
        patient_id: form.patient_id,
        service_id: form.service_id,
        doctor_membership_id: doctorId,
        appointment_date: form.appointment_date,
        start_time: form.start_time,
        duration_minutes: form.duration_minutes,
        notes: form.notes || null,
      });
      if (form.plan_item_id) linkAppointment(form.plan_item_id, appointment.id);
      showToast('نوبت ثبت شد');
      onSaved();
    } catch (error) {
      const reason = errorReason(error);
      showToast(
        reason === 'overlap'
          ? 'پزشک در این زمان نوبت دیگری دارد'
          : reason === 'doctor_not_allowed'
            ? 'شما فقط برای پزشکان خود می‌توانید نوبت ثبت کنید'
            : errorMessage(error),
        'error',
      );
    }
  }

  return (
    <Modal open onClose={onClose} title="ثبت نوبت جدید" size="md">
      <div className="space-y-4">
        <div>
          <label className="label-field">بیمار *</label>
          <select className="input-field" value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value, plan_item_id: '' })}>
            <option value="">-- انتخاب بیمار --</option>
            {patients.map((p) => <option key={p.id} value={p.id}>{p.first_name} {p.last_name} - {p.phone}</option>)}
          </select>
        </div>
        {plans.length > 0 && (
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-3">
            <label className="flex items-center gap-1.5 text-xs font-medium text-primary-700 mb-1">
              <Link2 size={13} />
              اتصال به طرح درمان
            </label>
            <select className="input-field border-primary-200 rounded-lg" value={form.plan_item_id} onChange={(e) => selectPlanItem(e.target.value)}>
              <option value="">بدون طرح درمان</option>
              {plans.map(({ plan, items }) => (
                <optgroup key={plan.id} label={plan.title}>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {planItemLabel(item)}{item.tooth_number ? ` (دندان ${item.tooth_number})` : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="label-field">خدمت / نوع درمان *</label>
          <select className="input-field" value={form.service_id} onChange={(e) => selectService(e.target.value)}>
            <option value="">-- انتخاب خدمت --</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label-field">پزشک *</label>
          <select className="input-field" value={doctorId} onChange={(e) => setForm({ ...form, doctor_membership_id: e.target.value })}>
            <option value="">-- انتخاب پزشک --</option>
            {doctors.map((d) => (
              <option key={d.membership_id} value={d.membership_id}>
                {d.full_name}{d.specialty ? ` (${d.specialty})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="label-field">تاریخ *</label>
            <JalaliDateInput value={form.appointment_date} onChange={(appointment_date) => setForm({ ...form, appointment_date })} clearable={false} />
          </div>
          <div>
            {/* The time on the chosen date; date and time together are the appointment's start. */}
            <label className="label-field">ساعت *</label>
            <input type="time" className="input-field text-center" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label-field">مدت زمان (دقیقه)</label>
          <select className="input-field" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}>
            {APPOINTMENT_DURATIONS.map((minutes) => <option key={minutes} value={minutes}>{formatNumber(minutes)} دقیقه</option>)}
          </select>
        </div>
        <div>
          <label className="label-field">یادداشت</label>
          <textarea className="input-field min-h-[80px] resize-none" placeholder="توضیحات اضافی..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div className="flex items-center gap-3 pt-1">
          <button onClick={save} disabled={createAppointment.isPending} className="btn-primary flex-1 py-2.5">{createAppointment.isPending ? 'در حال ثبت...' : 'ثبت نوبت'}</button>
          <button onClick={onClose} className="btn-secondary flex-1 py-2.5">انصراف</button>
        </div>
      </div>
    </Modal>
  );
}
