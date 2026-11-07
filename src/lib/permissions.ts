import type { PageKey } from '@/lib/types';

/**
 * The permission catalogue codes the app checks (the backend's
 * `permission-catalog.ts` defines them, one `resource.action` item per
 * action). Pages need their `view` item; every button needs its own item.
 * The backend enforces the same codes on its endpoints.
 */
export const CAN = {
  viewDashboard: 'dashboard.view',
  viewClients: 'client.view',
  createClient: 'client.create',
  updateClient: 'client.update',
  deleteClient: 'client.delete',
  viewMedicalRecord: 'medical_record.view',
  viewAppointments: 'appointment.view',
  bookAppointment: 'appointment.create',
  updateAppointment: 'appointment.update',
  confirmAppointment: 'appointment.confirm',
  completeAppointment: 'appointment.complete',
  markNoShow: 'appointment.no_show',
  cancelAppointment: 'appointment.cancel',
  deleteAppointment: 'appointment.delete',
  viewServices: 'service.view',
  createService: 'service.create',
  updateService: 'service.update',
  deleteService: 'service.delete',
  viewStaff: 'staff.view',
  createStaff: 'staff.create',
  updateStaff: 'staff.update',
  resetStaffPassword: 'staff.reset_password',
  updateDoctorProfile: 'doctor_profile.update',
  createWorkspace: 'workspace.create',
  updateWorkspace: 'workspace.update',
  deleteWorkspace: 'workspace.delete',
  viewTemplates: 'permission_template.view',
  createTemplate: 'permission_template.create',
  updateTemplate: 'permission_template.update',
  deleteTemplate: 'permission_template.delete',
  viewAudit: 'audit_log.view',
  viewInvoices: 'invoice.view',
  createInvoice: 'invoice.create',
  updateInvoice: 'invoice.update',
  createPayment: 'payment.create',
  payInstallment: 'installment.pay',
  viewLabOrders: 'lab_order.view',
  createLabOrder: 'lab_order.create',
  updateLabOrder: 'lab_order.update',
  createLabPayment: 'lab_payment.create',
  createLab: 'lab.create',
  updateLab: 'lab.update',
  viewSmsCampaigns: 'sms_campaign.view',
  createSmsCampaign: 'sms_campaign.create',
  updateSmsCampaign: 'sms_campaign.update',
  deleteSmsCampaign: 'sms_campaign.delete',
  buySmsPackage: 'sms_package.purchase',
  viewTreatments: 'treatment.view',
  createTreatment: 'treatment.create',
  viewDentalChart: 'dental_chart.view',
  updateDentalChart: 'dental_chart.update',
  viewXrays: 'xray.view',
  uploadXray: 'xray.upload',
  deleteXray: 'xray.delete',
  viewTreatmentPlans: 'treatment_plan.view',
  createTreatmentPlan: 'treatment_plan.create',
  updateTreatmentPlan: 'treatment_plan.update',
  deleteTreatmentPlan: 'treatment_plan.delete',
  viewPlanTemplates: 'treatment_plan_template.view',
  createPlanTemplate: 'treatment_plan_template.create',
  updatePlanTemplate: 'treatment_plan_template.update',
  deletePlanTemplate: 'treatment_plan_template.delete',
  viewClinicSettings: 'clinic_settings.view',
  updateClinicSettings: 'clinic_settings.update',
  viewReports: 'report.view',
  useAssistant: 'assistant.view',
} as const;

/** The settings tabs and the item that shows each. */
export const SETTINGS_TAB_PERMISSION = {
  clinic: CAN.viewClinicSettings,
  hours: CAN.viewClinicSettings,
  staff: CAN.viewStaff,
  templates: CAN.viewTemplates,
  services: CAN.viewServices,
  plans: CAN.viewPlanTemplates,
  audit: CAN.viewAudit,
  notifications: CAN.viewClinicSettings,
} as const;

/** The item each page needs; settings opens with any of its tabs' items. */
const PAGE_PERMISSION: Record<Exclude<PageKey, 'settings'>, string> = {
  dashboard: CAN.viewDashboard,
  patients: CAN.viewClients,
  appointments: CAN.viewAppointments,
  billing: CAN.viewInvoices,
  lab: CAN.viewLabOrders,
  reports: CAN.viewReports,
  ai: CAN.useAssistant,
  sms: CAN.viewSmsCampaigns,
};

/** Whether the active workspace may open `page`. */
export function canOpen(can: (code: string) => boolean, page: PageKey): boolean {
  if (page === 'settings') return Object.values(SETTINGS_TAB_PERMISSION).some(can);
  return can(PAGE_PERMISSION[page]);
}
