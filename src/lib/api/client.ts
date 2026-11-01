import createClient, { type Middleware } from 'openapi-fetch';
import { clearSession, getAccessToken, getRefreshToken, setTokens } from '@/lib/auth/session';
import { env } from '@/lib/env';
import type { paths } from './schema';

/** Fetched per request rather than once at import, so tests can stub it. */
const fetchNow = (request: Request) => globalThis.fetch(request);

/** Requests that must not trigger a refresh (they are the refresh, or need no token). */
const isAuthRequest = (url: string) => /\/api\/v1\/auth\/(login|refresh)$/.test(new URL(url).pathname);

let refreshing: Promise<boolean> | null = null;

/**
 * Exchanges the stored refresh token for new tokens. Requests that fail at
 * the same moment share one refresh. A failed refresh signs the user out.
 */
export function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;
    const response = await fetchNow(
      new Request(`${env.apiBaseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }),
    ).catch(() => null);
    if (!response?.ok) {
      // A network error keeps the session (maybe the device is offline); a refusal ends it.
      if (response) clearSession();
      return false;
    }
    setTokens(await response.json());
    return true;
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

/** Copies of outgoing requests, so one can be sent again after a refresh (a body can only be read once). */
const originals = new WeakMap<Request, Request>();

/** Adds the access token; on a 401, refreshes once and repeats the request. */
const authMiddleware: Middleware = {
  onRequest({ request }) {
    const token = getAccessToken();
    if (token) request.headers.set('authorization', `Bearer ${token}`);
    originals.set(request, request.clone());
    return request;
  },
  async onResponse({ request, response }) {
    if (response.status !== 401 || isAuthRequest(request.url) || !getRefreshToken()) return response;
    const original = originals.get(request);
    if (!original || !(await refreshSession())) return response;
    original.headers.set('authorization', `Bearer ${getAccessToken()}`);
    return fetchNow(original);
  },
};

/**
 * Typed client for Dental-Api. Paths, bodies and responses come from
 * `schema.d.ts`, generated from the backend's Swagger by `npm run api:types`.
 */
export const api = createClient<paths>({ baseUrl: env.apiBaseUrl, fetch: fetchNow });
api.use(authMiddleware);
