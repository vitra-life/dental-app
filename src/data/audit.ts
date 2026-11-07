import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { unwrap } from '@/lib/api/errors';
import type { components } from '@/lib/api/schema';
import { keys } from './keys';

export type AuditLogEntry = components['schemas']['AuditLogDto'];

export const AUDIT_PAGE_SIZE = 25;

/** One page of the audit log, newest first, optionally for one action. */
export function useAuditLogs(page: number, action: string | null) {
  return useQuery({
    queryKey: keys.auditLogs(page, action),
    queryFn: async () =>
      unwrap(
        await api.GET('/api/v1/audit-logs', {
          params: { query: { page, page_size: AUDIT_PAGE_SIZE, ...(action ? { action } : {}) } },
        }),
      ),
    placeholderData: keepPreviousData,
  });
}
