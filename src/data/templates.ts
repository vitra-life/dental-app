import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { unwrap } from '@/lib/api/errors';
import type { components } from '@/lib/api/schema';
import { keys } from './keys';

export type PermissionTemplate = components['schemas']['PermissionTemplateDto'];
export type PermissionGroup = components['schemas']['PermissionGroupDto'];

/** The clinic's permission templates, each with its item codes. */
export function useTemplates({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: keys.templates,
    enabled,
    queryFn: async () => unwrap(await api.GET('/api/v1/permission-templates')),
  });
}

/** The permission catalogue: every action, in groups, with Persian labels. */
export function usePermissionCatalog() {
  return useQuery({
    queryKey: keys.permissionCatalog,
    queryFn: async () => unwrap(await api.GET('/api/v1/permissions')),
    staleTime: Infinity,
  });
}

function useInvalidateTemplates() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: keys.templates });
}

/** Creates a template and sets its items in one go. */
export function useCreateTemplate() {
  const invalidate = useInvalidateTemplates();
  return useMutation({
    mutationFn: async ({ code, name, permissions }: { code: string; name: string; permissions: string[] }) => {
      const template = unwrap(await api.POST('/api/v1/permission-templates', { body: { code, name } }));
      return unwrap(
        await api.PUT('/api/v1/permission-templates/{id}/permissions', {
          params: { path: { id: template.id } },
          body: { permissions },
        }),
      );
    },
    onSuccess: invalidate,
  });
}

/** Renames a template and replaces its items. */
export function useUpdateTemplate() {
  const invalidate = useInvalidateTemplates();
  return useMutation({
    mutationFn: async ({ id, name, permissions }: { id: string; name: string; permissions: string[] }) => {
      const path = { params: { path: { id } } };
      unwrap(await api.PATCH('/api/v1/permission-templates/{id}', { ...path, body: { name } }));
      return unwrap(await api.PUT('/api/v1/permission-templates/{id}/permissions', { ...path, body: { permissions } }));
    },
    onSuccess: invalidate,
  });
}

/** Workspaces it was applied to keep their copies of its items. */
export function useDeleteTemplate() {
  const invalidate = useInvalidateTemplates();
  return useMutation({
    mutationFn: async (id: string) => {
      unwrap(await api.DELETE('/api/v1/permission-templates/{id}', { params: { path: { id } } }));
    },
    onSuccess: invalidate,
  });
}
