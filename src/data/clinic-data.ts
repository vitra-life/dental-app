import { useAppointments } from './appointments';
import { usePatients } from './patients';
import { useServices } from './services';

/**
 * Patients, the shared window of appointments, and services together, for
 * screens that summarise all three (dashboard, reports, assistant).
 * `data` is undefined until all three have loaded.
 */
export function useClinicData() {
  const patients = usePatients();
  const appointments = useAppointments();
  const services = useServices();
  const queries = [patients, appointments, services];
  const ready = patients.data && appointments.data && services.data;
  return {
    data: ready ? { patients: patients.data!, appointments: appointments.data!, services: services.data! } : undefined,
    error: queries.find((q) => q.error)?.error ?? null,
    refetch: () => Promise.all(queries.map((q) => q.refetch())),
  };
}
