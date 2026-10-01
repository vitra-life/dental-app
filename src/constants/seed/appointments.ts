import type { Appointment } from '@/lib/types';
import { daysFromToday, timestampFromNow } from '@/lib/date';

function appointment(
  id: string,
  patient_id: string,
  staff_id: string,
  service_id: string,
  day: number,
  start: string,
  end: string,
  status: Appointment['status'],
  price: number,
  notes: string | null = null,
): Appointment {
  return {
    id,
    patient_id,
    staff_id,
    service_id,
    appointment_date: daysFromToday(day),
    start_time: `${start}:00`,
    end_time: `${end}:00`,
    status,
    price,
    notes,
    created_at: timestampFromNow(Math.min(day, 0) - 7),
  };
}

// `day` is relative to today: 0 = today, -1 = yesterday, 3 = in three days.
export const appointments: Appointment[] = [
  // Older visits
  appointment('apt-01', 'pat-01', 'stf-01', 'svc-03', -150, '10:00', '10:45', 'completed', 2_800_000),
  appointment('apt-02', 'pat-11', 'stf-02', 'svc-01', -240, '11:00', '11:30', 'completed', 300_000),
  appointment('apt-03', 'pat-07', 'stf-02', 'svc-06', -100, '14:00', '15:00', 'completed', 4_500_000),
  appointment('apt-04', 'pat-06', 'stf-01', 'svc-08', -70, '09:00', '10:30', 'completed', 35_000_000),
  appointment('apt-05', 'pat-05', 'stf-03', 'svc-09', -65, '16:00', '17:00', 'completed', 5_000_000),
  appointment('apt-06', 'pat-02', 'stf-01', 'svc-07', -40, '12:00', '13:00', 'completed', 12_000_000),
  appointment('apt-07', 'pat-10', 'stf-02', 'svc-05', -35, '10:00', '10:30', 'completed', 1_500_000),
  appointment('apt-08', 'pat-03', 'stf-02', 'svc-04', -20, '15:00', '16:00', 'completed', 6_300_000),
  appointment('apt-09', 'pat-01', 'stf-03', 'svc-02', -10, '09:30', '10:15', 'completed', 1_200_000),

  // Last week
  appointment('apt-10', 'pat-09', 'stf-01', 'svc-03', -6, '11:00', '11:45', 'completed', 2_500_000),
  appointment('apt-11', 'pat-05', 'stf-03', 'svc-01', -5, '09:00', '09:30', 'no_show', 300_000),
  appointment('apt-12', 'pat-04', 'stf-02', 'svc-02', -3, '13:00', '13:45', 'completed', 1_200_000),
  appointment('apt-13', 'pat-07', 'stf-01', 'svc-01', -3, '10:00', '10:30', 'cancelled', 300_000, 'بیمار تماس گرفت و لغو کرد'),
  appointment('apt-14', 'pat-12', 'stf-03', 'svc-01', -2, '16:00', '16:30', 'completed', 300_000),
  appointment('apt-15', 'pat-08', 'stf-02', 'svc-05', -1, '14:00', '14:30', 'completed', 1_800_000),
  appointment('apt-16', 'pat-02', 'stf-01', 'svc-01', -1, '17:00', '17:30', 'completed', 300_000, 'کنترل روکش'),

  // Today
  appointment('apt-17', 'pat-03', 'stf-02', 'svc-04', 0, '09:00', '10:00', 'completed', 6_000_000, 'جلسه دوم درمان ریشه'),
  appointment('apt-18', 'pat-06', 'stf-01', 'svc-01', 0, '10:00', '10:30', 'completed', 300_000, 'کنترل ایمپلنت'),
  appointment('apt-19', 'pat-10', 'stf-03', 'svc-02', 0, '11:00', '11:45', 'confirmed', 1_200_000),
  appointment('apt-20', 'pat-12', 'stf-01', 'svc-03', 0, '13:30', '14:15', 'pending', 2_500_000),
  appointment('apt-21', 'pat-08', 'stf-02', 'svc-09', 0, '15:00', '16:00', 'pending', 5_000_000),
  appointment('apt-22', 'pat-09', 'stf-03', 'svc-01', 0, '16:30', '17:00', 'cancelled', 300_000),

  // Upcoming
  appointment('apt-23', 'pat-01', 'stf-01', 'svc-07', 1, '09:30', '10:30', 'confirmed', 12_000_000),
  appointment('apt-24', 'pat-04', 'stf-02', 'svc-03', 1, '12:00', '12:45', 'pending', 2_500_000),
  appointment('apt-25', 'pat-06', 'stf-01', 'svc-07', 2, '10:00', '11:00', 'confirmed', 12_000_000),
  appointment('apt-26', 'pat-05', 'stf-03', 'svc-02', 4, '17:00', '17:45', 'pending', 1_200_000),
  appointment('apt-27', 'pat-02', 'stf-02', 'svc-04', 6, '14:00', '15:00', 'pending', 6_000_000),
  appointment('apt-28', 'pat-12', 'stf-03', 'svc-10', 9, '11:00', '11:45', 'pending', 60_000_000, 'مشاوره ارتودنسی'),
];
