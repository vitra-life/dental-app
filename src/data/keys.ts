/** Query keys. A mutation invalidates a prefix, e.g. `['appointments']` refreshes every appointment query. */
export const keys = {
  patients: ['clients'] as const,
  patient: (id: string) => ['clients', id] as const,
  appointments: ['appointments'] as const,
  appointmentRange: (from: string, to: string) => ['appointments', 'range', from, to] as const,
  patientAppointments: (patientId: string) => ['appointments', 'patient', patientId] as const,
  services: ['services'] as const,
  doctors: ['doctors'] as const,
  me: ['auth', 'me'] as const,
  staff: ['staff'] as const,
  staffAssignments: ['staff-assignments'] as const,
  staffTypes: ['reference', 'staff-types'] as const,
  relationshipTypes: ['reference', 'relationship-types'] as const,
  roles: ['roles'] as const,
  permissionCatalog: ['reference', 'permissions'] as const,
  auditLogs: (page: number, action: string | null) => ['audit-logs', page, action] as const,
};
