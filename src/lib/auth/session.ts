/**
 * Where the login tokens live:
 * - the access token (15 minutes) only in memory;
 * - the refresh token (30 days, replaced on every use) in localStorage, so a
 *   reload keeps the user signed in. Cookies can't be used: the app and the
 *   API are on different sites, and browsers block those cookies.
 *
 * Plain TypeScript: React reads it through `useSession` in `src/data/session.ts`.
 */

const REFRESH_KEY = 'vitra:refresh-token';

let accessToken: string | null = null;
const listeners = new Set<() => void>();

function readRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

function writeRefreshToken(token: string | null) {
  try {
    if (token) localStorage.setItem(REFRESH_KEY, token);
    else localStorage.removeItem(REFRESH_KEY);
  } catch {
    // Storage unavailable: the session lasts until the tab closes.
  }
}

export const getAccessToken = () => accessToken;
export const getRefreshToken = readRefreshToken;

/** Whether the user is signed in, or can be from the stored refresh token. */
export const hasSession = () => accessToken !== null || readRefreshToken() !== null;

export function setTokens(tokens: { access_token: string; refresh_token?: string }) {
  accessToken = tokens.access_token;
  if (tokens.refresh_token) writeRefreshToken(tokens.refresh_token);
  listeners.forEach((listener) => listener());
}

export function clearSession() {
  accessToken = null;
  writeRefreshToken(null);
  listeners.forEach((listener) => listener());
}

/** Runs `listener` whenever the tokens change. Returns the unsubscribe function. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
