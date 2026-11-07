import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { unwrap } from '@/lib/api/errors';
import type { components } from '@/lib/api/schema';
import { keys } from './keys';

export type StaffMember = components['schemas']['StaffMemberDto'];
export type StaffAssignment = components['schemas']['StaffAssignmentDto'];
export type ReferenceItem = components['schemas']['ReferenceItemDto'];
export type NewStaffMember = components['schemas']['CreateStaffMemberDto'];
export type StaffMemberChanges = components['schemas']['UpdateStaffMemberDto'];
export type DoctorProfileInput = components['schemas']['SetDoctorProfileDto'];
export type NewStaffAssignment = components['schemas']['CreateStaffAssignmentDto'];

/** Every member of the clinic, active and inactive, in joining order. */
export function useStaff() {
  return useQuery({
    queryKey: keys.staff,
    queryFn: async () => unwrap(await api.GET('/api/v1/staff')),
  });
}

/** Which secretary or assistant works for which doctor. */
export function useStaffAssignments() {
  return useQuery({
    queryKey: keys.staffAssignments,
    queryFn: async () => unwrap(await api.GET('/api/v1/staff-assignments')),
  });
}

/** doctor, secretary, assistant: fixed, so cached for the session. */
export function useStaffTypes() {
  return useQuery({
    queryKey: keys.staffTypes,
    queryFn: async () => unwrap(await api.GET('/api/v1/staff-types')),
    staleTime: Infinity,
  });
}

/** secretary_of, assistant_of…: fixed, so cached for the session. */
export function useRelationshipTypes() {
  return useQuery({
    queryKey: keys.relationshipTypes,
    queryFn: async () => unwrap(await api.GET('/api/v1/relationship-types')),
    staleTime: Infinity,
  });
}

/**
 * Staff changes can change who is a doctor, a role's member count, and the
 * signed-in user's own permissions, so all of those refresh.
 */
function useInvalidateStaff() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all(
      [keys.staff, keys.staffAssignments, keys.doctors, keys.roles, keys.me].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    );
}

/** Answers with `temporary_password` set only when a new account was created. */
export function useCreateStaffMember() {
  const invalidate = useInvalidateStaff();
  return useMutation({
    mutationFn: async (body: NewStaffMember) => unwrap(await api.POST('/api/v1/staff', { body })),
    onSuccess: invalidate,
  });
}

/** Fails with a 409 `ApiError` (reason `last_admin`) when the clinic would lose its last active admin. */
export function useUpdateStaffMember() {
  const invalidate = useInvalidateStaff();
  return useMutation({
    mutationFn: async ({ membershipId, changes }: { membershipId: string; changes: StaffMemberChanges }) =>
      unwrap(
        await api.PATCH('/api/v1/staff/{membershipId}', { params: { path: { membershipId } }, body: changes }),
      ),
    onSuccess: invalidate,
  });
}

export function useSetDoctorProfile() {
  const invalidate = useInvalidateStaff();
  return useMutation({
    mutationFn: async ({ membershipId, profile }: { membershipId: string; profile: DoctorProfileInput }) =>
      unwrap(
        await api.PUT('/api/v1/staff/{membershipId}/doctor-profile', {
          params: { path: { membershipId } },
          body: profile,
        }),
      ),
    onSuccess: invalidate,
  });
}

/** A new temporary password, shown once. 409 with reason `self` or `other_clinics` when not allowed. */
export function useResetStaffPassword() {
  return useMutation({
    mutationFn: async (membershipId: string) =>
      unwrap(
        await api.POST('/api/v1/staff/{membershipId}/reset-password', { params: { path: { membershipId } } }),
      ).temporary_password,
  });
}

export function useCreateStaffAssignment() {
  const invalidate = useInvalidateStaff();
  return useMutation({
    mutationFn: async (body: NewStaffAssignment) => unwrap(await api.POST('/api/v1/staff-assignments', { body })),
    onSuccess: invalidate,
  });
}

export function useDeleteStaffAssignment() {
  const invalidate = useInvalidateStaff();
  return useMutation({
    mutationFn: async (id: string) => {
      unwrap(await api.DELETE('/api/v1/staff-assignments/{id}', { params: { path: { id } } }));
    },
    onSuccess: invalidate,
  });
}
