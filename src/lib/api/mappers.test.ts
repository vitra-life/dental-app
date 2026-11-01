import { describe, expect, it } from 'vitest';
import { toAppointment, toAppointmentBody, toPatient, toRial, toService, toServiceBody, toToman } from './mappers';

const client = {
  id: 'c1', clinic_id: 'k', first_name: 'لیلا', last_name: 'بهرامی', phone: '09121110012', national_id: null,
  birth_date: '2010-08-27', gender: 'female' as const, email: null, blood_type: null, address: null, allergies: null,
  medical_history: null, emergency_contact: null, emergency_phone: null, insurance_company: null, insurance_number: null,
  notes: null, created_at: '2026-10-01T08:00:00.000Z', updated_at: '2026-10-01T08:00:00.000Z',
  appointment_count: 3, last_visit: '2026-10-12T20:45:00.000Z',
};

describe('money', () => {
  it('converts between Rial and Toman', () => {
    expect(toToman(25_000_000)).toBe(2_500_000);
    expect(toRial(2_500_000)).toBe(25_000_000);
  });
});

describe('toPatient', () => {
  it('keeps the fields and gives the last visit as a local date', () => {
    // 20:45 UTC is already the next day in Tehran (the tests run in Asia/Tehran).
    expect(toPatient(client)).toMatchObject({ id: 'c1', appointment_count: 3, last_visit: '2026-10-13' });
    expect(toPatient(client)).not.toHaveProperty('clinic_id');
  });
});

describe('appointments', () => {
  const dto = {
    id: 'a1', clinic_id: 'k', client_id: 'c1', service_id: 's1',
    start_time: '2026-10-14T05:30:00.000Z', duration_minutes: 45,
    status: 'pending' as const, description: 'کنترل',
    created_at: '2026-10-01T08:00:00.000Z', updated_at: '2026-10-01T08:00:00.000Z',
    client: { id: 'c1', first_name: 'لیلا', last_name: 'بهرامی', phone: '09121110012' },
    service: { id: 's1', name: 'ترمیم' },
    doctor_membership_id: 'm1', created_by_membership_id: 'm2',
    doctor: { membership_id: 'm1', full_name: 'دکتر رضایی' },
  };

  it('gives the local date and start, and the end from the duration', () => {
    expect(toAppointment(dto)).toMatchObject({
      patient_id: 'c1',
      appointment_date: '2026-10-14',
      start_time: '09:00:00',
      end_time: '09:45:00',
      duration_minutes: 45,
      notes: 'کنترل',
      staff_id: null,
      patient: { first_name: 'لیلا' },
      doctor_membership_id: 'm1',
    });
  });

  it('sends the date and time as one UTC start, with the duration', () => {
    expect(
      toAppointmentBody({ patient_id: 'c1', service_id: 's1', appointment_date: '2026-10-14', start_time: '09:00', duration_minutes: 45, notes: null, doctor_membership_id: 'm1' }),
    ).toEqual({
      client_id: 'c1',
      service_id: 's1',
      doctor_membership_id: 'm1',
      start_time: '2026-10-14T05:30:00.000Z',
      duration_minutes: 45,
      description: null,
    });
  });
});

describe('services', () => {
  it('converts prices both ways', () => {
    const service = toService({
      id: 's1', clinic_id: 'k', name: 'ویزیت', category: 'general', default_price: 3_000_000, duration_minutes: 30,
      description: null, active: true, created_at: 'x', updated_at: 'x',
    });
    expect(service.default_price).toBe(300_000);
    expect(toServiceBody({ name: 'ویزیت', default_price: 300_000 })).toEqual({ name: 'ویزیت', default_price: 3_000_000 });
  });

  it('sends only the fields given', () => {
    expect(toServiceBody({ active: false })).toEqual({ active: false });
  });
});
