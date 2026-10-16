import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api/errors';

/** The app's one query cache. A 4xx answer will not change on retry, so only other failures are retried once. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => !(error instanceof ApiError && error.status < 500) && failureCount < 1,
      },
    },
  });
}
