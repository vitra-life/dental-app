import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearSession, getAccessToken, getRefreshToken, setTokens } from '@/lib/auth/session';
import { api } from './client';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

/** A fake API: `/auth/refresh` answers `refresh()`, everything else needs the token `fresh`. */
function stubApi(refresh: () => Response) {
  const fetch = vi.fn(async (request: Request) => {
    if (new URL(request.url).pathname === '/api/v1/auth/refresh') return refresh();
    return request.headers.get('authorization') === 'Bearer fresh' ? json([]) : json({ message: 'expired' }, 401);
  });
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

const authPaths = (fetch: ReturnType<typeof stubApi>) =>
  fetch.mock.calls.map(([request]) => new URL(request.url).pathname);

beforeEach(() => setTokens({ access_token: 'stale', refresh_token: 'refresh-1' }));

afterEach(() => {
  clearSession();
  vi.unstubAllGlobals();
});

describe('api client', () => {
  it('refreshes an expired token once and repeats the request', async () => {
    const fetch = stubApi(() => json({ access_token: 'fresh', refresh_token: 'refresh-2' }));

    const { data, response } = await api.GET('/api/v1/services');

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
    expect(authPaths(fetch)).toEqual(['/api/v1/services', '/api/v1/auth/refresh', '/api/v1/services']);
    expect(getAccessToken()).toBe('fresh');
    expect(getRefreshToken()).toBe('refresh-2');
  });

  it('shares one refresh between requests that fail together', async () => {
    const fetch = stubApi(() => json({ access_token: 'fresh', refresh_token: 'refresh-2' }));

    await Promise.all([api.GET('/api/v1/services'), api.GET('/api/v1/doctors')]);

    expect(authPaths(fetch).filter((path) => path === '/api/v1/auth/refresh')).toHaveLength(1);
  });

  it('signs the user out when the refresh is refused', async () => {
    stubApi(() => json({ message: 'revoked' }, 401));

    const { response } = await api.GET('/api/v1/services');

    expect(response.status).toBe(401);
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });
});
