import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { unwrap } from '@/lib/api/errors';
import { toService, toServiceBody, type ServiceInput } from '@/lib/api/mappers';
import { keys } from './keys';

/** The whole service catalogue, ordered by name; filter on `active` for booking lists. */
export function useServices() {
  return useQuery({
    queryKey: keys.services,
    queryFn: async () => unwrap(await api.GET('/api/v1/services')).map(toService),
  });
}

function useInvalidateServices() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: keys.services }),
      // Appointments carry the service name.
      queryClient.invalidateQueries({ queryKey: keys.appointments }),
    ]);
}

export function useCreateService() {
  const invalidate = useInvalidateServices();
  return useMutation({
    mutationFn: async (input: ServiceInput) => {
      const body = { ...toServiceBody(input), name: input.name };
      return toService(unwrap(await api.POST('/api/v1/services', { body })));
    },
    onSuccess: invalidate,
  });
}

/** Any subset of fields, e.g. `{ active: false }` for the toggle. */
export function useUpdateService() {
  const invalidate = useInvalidateServices();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<ServiceInput> }) =>
      toService(unwrap(await api.PATCH('/api/v1/services/{id}', { params: { path: { id } }, body: toServiceBody(input) }))),
    onSuccess: invalidate,
  });
}

/** Fails with a 409 `ApiError` when the service has appointments. */
export function useDeleteService() {
  const invalidate = useInvalidateServices();
  return useMutation({
    mutationFn: async (id: string) => {
      unwrap(await api.DELETE('/api/v1/services/{id}', { params: { path: { id } } }));
    },
    onSuccess: invalidate,
  });
}
