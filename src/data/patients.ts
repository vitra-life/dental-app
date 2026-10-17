import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { unwrap } from '@/lib/api/errors';
import { toClientBody, toPatient, type PatientInput } from '@/lib/api/mappers';
import type { Patient } from '@/lib/types';
import { keys } from './keys';

const PAGE_SIZE = 100;

/** Every patient of the clinic, newest first. The API pages the list; this reads all pages. */
async function fetchAllPatients(): Promise<Patient[]> {
  const patients: Patient[] = [];
  for (let page = 1; ; page++) {
    const result = unwrap(await api.GET('/api/v1/clients', { params: { query: { page, page_size: PAGE_SIZE } } }));
    patients.push(...result.items.map(toPatient));
    if (result.items.length < PAGE_SIZE || patients.length >= result.total) return patients;
  }
}

export function usePatients() {
  return useQuery({ queryKey: keys.patients, queryFn: fetchAllPatients });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: keys.patient(id),
    queryFn: async () => toPatient(unwrap(await api.GET('/api/v1/clients/{id}', { params: { path: { id } } }))),
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PatientInput) => toPatient(unwrap(await api.POST('/api/v1/clients', { body: toClientBody(input) }))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.patients }),
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: PatientInput }) =>
      toPatient(unwrap(await api.PATCH('/api/v1/clients/{id}', { params: { path: { id } }, body: toClientBody(input) }))),
    onSuccess: async () => {
      // Appointments carry the patient's name and phone.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: keys.patients }),
        queryClient.invalidateQueries({ queryKey: keys.appointments }),
      ]);
    },
  });
}
