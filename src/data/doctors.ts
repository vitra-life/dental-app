import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { unwrap } from '@/lib/api/errors';
import { keys } from './keys';

/** The active clinic's doctors, for the booking form. */
export function useDoctors() {
  return useQuery({
    queryKey: keys.doctors,
    queryFn: async () => unwrap(await api.GET('/api/v1/doctors')),
    staleTime: 5 * 60_000,
  });
}
