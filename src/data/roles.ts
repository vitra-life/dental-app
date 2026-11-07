import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { unwrap } from '@/lib/api/errors';
import type { components } from '@/lib/api/schema';
import { keys } from './keys';

export type Role = components['schemas']['RoleDto'];
export type RoleGrant = components['schemas']['RoleGrantDto'];
export type PermissionNode = components['schemas']['PermissionNodeDto'];

/** System roles and this clinic's own, each with its grants and member count. */
export function useRoles() {
  return useQuery({
    queryKey: keys.roles,
    queryFn: async () => unwrap(await api.GET('/api/v1/roles')),
  });
}

/** The permission catalogue as a tree (pages → features → actions) with Persian labels. */
export function usePermissionCatalog() {
  return useQuery({
    queryKey: keys.permissionCatalog,
    queryFn: async () => unwrap(await api.GET('/api/v1/permissions')),
    staleTime: Infinity,
  });
}

/** A role change can change the signed-in user's own permissions too. */
function useInvalidateRoles() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([keys.roles, keys.staff, keys.me].map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}

/** Creates a custom role and sets its grants in one go. */
export function useCreateRole() {
  const invalidate = useInvalidateRoles();
  return useMutation({
    mutationFn: async ({ code, name, permissions }: { code: string; name: string; permissions: RoleGrant[] }) => {
      const role = unwrap(await api.POST('/api/v1/roles', { body: { code, name } }));
      return unwrap(
        await api.PUT('/api/v1/roles/{id}/permissions', { params: { path: { id: role.id } }, body: { permissions } }),
      );
    },
    onSuccess: invalidate,
  });
}

/** Renames a custom role and replaces its grants. */
export function useUpdateRole() {
  const invalidate = useInvalidateRoles();
  return useMutation({
    mutationFn: async ({ id, name, permissions }: { id: string; name: string; permissions: RoleGrant[] }) => {
      const path = { params: { path: { id } } };
      unwrap(await api.PATCH('/api/v1/roles/{id}', { ...path, body: { name } }));
      return unwrap(await api.PUT('/api/v1/roles/{id}/permissions', { ...path, body: { permissions } }));
    },
    onSuccess: invalidate,
  });
}

/** Fails with a 409 `ApiError` while anyone holds the role. */
export function useDeleteRole() {
  const invalidate = useInvalidateRoles();
  return useMutation({
    mutationFn: async (id: string) => {
      unwrap(await api.DELETE('/api/v1/roles/{id}', { params: { path: { id } } }));
    },
    onSuccess: invalidate,
  });
}
