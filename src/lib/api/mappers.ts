import { joinTimestamp, splitTimestamp } from '@/lib/date';
import type { Appointment, Patient, Service } from '@/lib/types';
import type { components } from './schema';

/**
 * Converts between API rows and the app's row types. The UI keeps its own
 * names (`patient`, `notes`) and shows money in Toman; the API says `client`
 * and `description` and stores Rial.
 */

type Schemas = components['schemas'];

export const toToman = (rial: number) => Math.round(rial / 10);
export const toRial = (toman: number) => Math.round(toman * 10);

// ── Patients (API: clients) ─────────────────────────────────────────────

/** The editable fields of a patient, as the patient form holds them. */
export type PatientInput = Omit<Patient, 'id' | 'created_at' | 'appointment_count' | 'last_visit'>;

export function toPatient(dto: Schemas['ClientDto']): Patient {
  return {
    id: dto.id,
    first_name: dto.first_name,
    last_name: dto.last_name,
    national_id: dto.national_id,
    phone: dto.phone,
    email: dto.email,
    birth_date: dto.birth_date,
    gender: dto.gender,
    address: dto.address,
    blood_type: dto.blood_type,
    allergies: dto.allergies,
    medical_history: dto.medical_history,
    emergency_contact: dto.emergency_contact,
    emergency_phone: dto.emergency_phone,
    insurance_company: dto.insurance_company,
    insurance_number: dto.insurance_number,
    notes: dto.notes,
    created_at: dto.created_at,
    appointment_count: dto.appointment_count,
    last_visit: dto.last_visit ? splitTimestamp(dto.last_visit).date : null,
  };
}

export function toClientBody(input: PatientInput): Schemas['CreateClientDto'] {
  return {
    ...input,
    gender: input.gender as Schemas['CreateClientDto']['gender'],
    blood_type: input.blood_type as Schemas['CreateClientDto']['blood_type'],
  };
}

// ── Appointments ────────────────────────────────────────────────────────

/** The fields the booking form sends: the chosen date, the time on that date (`HH:MM`) and a duration. */
export interface AppointmentInput {
  patient_id: string;
  service_id: string;
  appointment_date: string;
  start_time: string;
  duration_minutes: number;
  /** The doctor's membership id (from `GET /doctors`). */
  doctor_membership_id: string;
  notes: string | null;
}

const MINUTE = 60_000;

export function toAppointment(dto: Schemas['AppointmentDto']): Appointment {
  const start = splitTimestamp(dto.start_time);
  const end = new Date(new Date(dto.start_time).getTime() + dto.duration_minutes * MINUTE).toISOString();
  return {
    id: dto.id,
    patient_id: dto.client_id,
    staff_id: null, // the local staff list is not linked to the API; see `doctor`
    service_id: dto.service_id,
    doctor_membership_id: dto.doctor_membership_id,
    appointment_date: start.date,
    start_time: start.time,
    end_time: splitTimestamp(end).time,
    duration_minutes: dto.duration_minutes,
    status: dto.status,
    notes: dto.description,
    created_at: dto.created_at,
    patient: dto.client,
    service: dto.service,
    doctor: dto.doctor,
  };
}

export function toAppointmentBody(input: AppointmentInput): Schemas['CreateAppointmentDto'] {
  return {
    client_id: input.patient_id,
    service_id: input.service_id,
    doctor_membership_id: input.doctor_membership_id,
    start_time: joinTimestamp(input.appointment_date, input.start_time),
    // The API accepts only APPOINTMENT_DURATIONS; the form offers nothing else.
    duration_minutes: input.duration_minutes as Schemas['CreateAppointmentDto']['duration_minutes'],
    description: input.notes,
  };
}

// ── Services ────────────────────────────────────────────────────────────

/** The editable fields of a service. */
export type ServiceInput = Omit<Service, 'id' | 'created_at'>;

export function toService(dto: Schemas['ServiceDto']): Service {
  return {
    id: dto.id,
    name: dto.name,
    category: dto.category,
    default_price: toToman(dto.default_price),
    duration_minutes: dto.duration_minutes,
    description: dto.description,
    active: dto.active,
    created_at: dto.created_at,
  };
}

/** Only the given fields, so a partial edit (e.g. the active toggle) changes nothing else. */
export function toServiceBody(input: Partial<ServiceInput>): Schemas['UpdateServiceDto'] {
  const { default_price, category, ...rest } = input;
  return {
    ...rest,
    ...(category === undefined ? {} : { category: category as Schemas['ServiceDto']['category'] }),
    ...(default_price === undefined ? {} : { default_price: toRial(default_price) }),
  };
}
