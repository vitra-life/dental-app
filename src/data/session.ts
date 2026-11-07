import { useMemo, useSyncExternalStore } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, refreshSession } from '@/lib/api/client';
import { unwrap } from '@/lib/api/errors';
import type { components } from '@/lib/api/schema';
import { clearSession, getAccessToken, hasSession, setTokens, subscribe } from '@/lib/auth/session';
import { keys } from './keys';

export type Me = components['schemas']['MeDto'];

const meKey = keys.me;

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

export type MeClinic = Me['clinics'][number];
export type MeWorkspace = MeClinic['workspaces'][number];

/** `can(code)` for the active workspace: true if it holds the permission. */
export function usePermissions() {
  const { data } = useMe();
  return useMemo(() => {
    const granted = new Set(data?.permissions);
    return { can: (code: string) => granted.has(code), granted, loaded: data !== undefined };
  }, [data]);
}

/** Whether the active workspace holds `code`. */
export function useCan(code: string): boolean {
  return usePermissions().can(code);
}

/** The active clinic and workspace, from `/auth/me`. */
export function useActiveWorkspace(): { clinic: MeClinic | null; workspace: MeWorkspace | null } {
  const { data: me } = useMe();
  const clinic = me?.clinics.find((c) => c.clinic_id === me.active_clinic_id) ?? null;
  const workspace = clinic?.workspaces.find((w) => w.id === me?.active_workspace_id) ?? null;
  return { clinic, workspace };
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

/**
 * Works in another workspace (and maybe another clinic): new token, and
 * nothing cached from the previous one, since it may have seen other data.
 */
export function useSwitchWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (workspaceId: string) =>
      unwrap(await api.POST('/api/v1/auth/switch-workspace', { body: { workspace_id: workspaceId } })),
    onSuccess: (result) => {
      // Drop everything the previous workspace loaded, but update `me` in
      // place: the screens are subscribed to that query.
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== meKey[0] });
      queryClient.setQueryData(meKey, result.me);
      setTokens(result);
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
