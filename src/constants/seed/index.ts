import type { Database } from '@/lib/types';
import { installments, invoiceItems, invoices, payments } from './billing';
import { clinicSettings, staff } from './clinic';
import { dentalRecords, rvgImages, treatmentPlanItems, treatmentPlanTemplates, treatmentPlans, treatments } from './clinical';
import { labOrders, labPayments, labs, labServices } from './lab';
import { smsCampaigns, smsMessages, smsPackages } from './sms';

/**
 * The browser store's initial data, one array per table. Rows refer to
 * patients, services and appointments by the ids in `ids.ts`, which do not
 * exist in the backend.
 */
export const seedData: Database = {
  clinic_settings: clinicSettings,
  staff,
  treatments,
  dental_records: dentalRecords,
  invoices,
  invoice_items: invoiceItems,
  payments,
  installments,
  rvg_images: rvgImages,
  labs,
  lab_services: labServices,
  lab_orders: labOrders,
  lab_payments: labPayments,
  treatment_plans: treatmentPlans,
  treatment_plan_items: treatmentPlanItems,
  treatment_plan_templates: treatmentPlanTemplates,
  sms_packages: smsPackages,
  sms_campaigns: smsCampaigns,
  sms_messages: smsMessages,
};

/** A fresh, mutable copy of the seed data. */
export function createSeedData(): Database {
  return structuredClone(seedData);
}
