import { useMemo, useSyncExternalStore } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, refreshSession } from '@/lib/api/client';
import { unwrap } from '@/lib/api/errors';
import type { components } from '@/lib/api/schema';
import { clearSession, getAccessToken, hasSession, setTokens, subscribe } from '@/lib/auth/session';

export type Me = components['schemas']['MeDto'];

const meKey = ['auth', 'me'] as const;

/** Whether the user is signed in (or can be, from the stored refresh token). */
export function useSession(): boolean {
  return useSyncExternalStore(subscribe, hasSession);
}

/** The signed-in user, their clinics and their permissions in the active clinic. */
export function useMe() {
  const signedIn = useSession();
  return useQuery({
    queryKey: meKey,
    enabled: signedIn,
    staleTime: 60_000,
    queryFn: async (): Promise<Me> => {
      // After a reload only the refresh token is left.
      if (!getAccessToken() && !(await refreshSession())) throw new Error('signed out');
      return unwrap(await api.GET('/api/v1/auth/me'));
    },
  });
}

/** `can(code)` for the active clinic: true if the permission is granted. */
export function usePermissions() {
  const { data } = useMe();
  return useMemo(() => {
    const granted = new Set(data?.permissions.map((p) => p.code));
    return { can: (code: string) => granted.has(code), loaded: data !== undefined };
  }, [data]);
}

/** Whether the signed-in user holds `code` in the active clinic. */
export function useCan(code: string): boolean {
  return usePermissions().can(code);
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credentials: { mobile: string; password: string }) =>
      unwrap(await api.POST('/api/v1/auth/login', { body: credentials })),
    onSuccess: (tokens) => {
      queryClient.clear();
      setTokens(tokens);
      queryClient.setQueryData(meKey, tokens.me);
    },
  });
}

/** Signs out here; the server ends the session even if this device is offline later. */
export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.POST('/api/v1/auth/logout').catch(() => undefined);
    },
    onSettled: () => {
      clearSession();
      queryClient.clear();
    },
  });
}

/** Works in another clinic: new token, and nothing cached from the previous clinic. */
export function useSwitchClinic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (clinicId: string) =>
      unwrap(await api.POST('/api/v1/auth/switch-clinic', { body: { clinic_id: clinicId } })),
    onSuccess: (result) => {
      setTokens(result);
      queryClient.removeQueries();
      queryClient.setQueryData(meKey, result.me);
    },
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { current_password: string; new_password: string }) => {
      unwrap(await api.POST('/api/v1/auth/change-password', { body }));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: meKey }),
  });
}
