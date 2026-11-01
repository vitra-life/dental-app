import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { unwrap } from '@/lib/api/errors';
import { toAppointment, toAppointmentBody, type AppointmentInput } from '@/lib/api/mappers';
import { daysFromToday, jalaliMonthsFromToday, joinTimestamp } from '@/lib/date';
import type { Appointment } from '@/lib/types';
import { keys } from './keys';

/**
 * The days every screen loads: from 7 Jalali months ago to 90 days ahead.
 * The dashboard, reports and assistant look back 6 months; the appointment list
 * and calendar look ahead. One shared range means one request and one cache entry.
 */
export function appointmentWindow(): { from: string; to: string } {
  return { from: jalaliMonthsFromToday(-7), to: daysFromToday(90) };
}

const byStart = (a: Appointment, b: Appointment) =>
  a.appointment_date.localeCompare(b.appointment_date) || a.start_time.localeCompare(b.start_time);

/** Appointments in the shared window (or the given days, `YYYY-MM-DD`, `to` excluded), by date and time. */
export function useAppointments(range = appointmentWindow()) {
  const { from, to } = range;
  return useQuery({
    queryKey: keys.appointmentRange(from, to),
    queryFn: async () => {
      const query = { from: joinTimestamp(from, '00:00'), to: joinTimestamp(to, '00:00') };
      const rows = unwrap(await api.GET('/api/v1/appointments', { params: { query } }));
      return rows.map(toAppointment).sort(byStart);
    },
  });
}

/** All of one patient's appointments, newest first. */
export function usePatientAppointments(patientId: string) {
  return useQuery({
    queryKey: keys.patientAppointments(patientId),
    queryFn: async () => {
      const rows = unwrap(await api.GET('/api/v1/appointments', { params: { query: { client_id: patientId } } }));
      return rows.map(toAppointment).sort(byStart).reverse();
    },
  });
}

/** Booking, editing or a status change also changes patients' visit counts and last visits. */
function useInvalidateAfterWrite() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: keys.appointments }),
      queryClient.invalidateQueries({ queryKey: keys.patients }),
    ]);
}

export function useCreateAppointment() {
  const invalidate = useInvalidateAfterWrite();
  return useMutation({
    mutationFn: async (input: AppointmentInput) =>
      toAppointment(unwrap(await api.POST('/api/v1/appointments', { body: toAppointmentBody(input) }))),
    onSuccess: invalidate,
  });
}

/** Edit or reschedule a pending or confirmed appointment. */
export function useUpdateAppointment() {
  const invalidate = useInvalidateAfterWrite();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: AppointmentInput }) =>
      toAppointment(unwrap(await api.PATCH('/api/v1/appointments/{id}', { params: { path: { id } }, body: toAppointmentBody(input) }))),
    onSuccess: invalidate,
  });
}

/** Confirm, complete, mark a no-show, or cancel (cancelling has its own endpoint and permission). */
export function useSetAppointmentStatus() {
  const invalidate = useInvalidateAfterWrite();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Exclude<Appointment['status'], 'pending'> }) => {
      const path = { params: { path: { id } } };
      const result =
        status === 'cancelled'
          ? await api.POST('/api/v1/appointments/{id}/cancel', path)
          : await api.PATCH('/api/v1/appointments/{id}/status', { ...path, body: { status } });
      return toAppointment(unwrap(result));
    },
    onSuccess: invalidate,
  });
}
