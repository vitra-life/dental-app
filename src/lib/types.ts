/** Opening and closing time (`HH:MM`) per weekday; `null` on a day the clinic is closed. */
export type WorkingHours = Record<string, { start: string; end: string } | null>;

export interface ClinicSettings {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  /** `null` until hours are set; the default working day then applies to every day. */
  working_hours: WorkingHours | null;
  tax_rate: number;
  currency: string;
  created_at: string;
}

export interface Staff {
  id: string;
  full_name: string;
  role: 'dentist' | 'receptionist' | 'accountant' | 'manager';
  phone: string | null;
  email: string | null;
  color: string;
  active: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  default_price: number;
  duration_minutes: number;
  description: string | null;
  active: boolean;
  created_at: string;
}

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  national_id: string | null;
  phone: string;
  email: string | null;
  birth_date: string | null;
  gender: string;
  address: string | null;
  blood_type: string | null;
  allergies: string | null;
  medical_history: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  insurance_company: string | null;
  insurance_number: string | null;
  notes: string | null;
  created_at: string;
  /** How many appointments the patient has, in any status. Computed by the API. */
  appointment_count: number;
  /** Local date (`YYYY-MM-DD`) of the latest completed appointment. Computed by the API. */
  last_visit: string | null;
}

/** The patient fields that come with an appointment. */
export type AppointmentPatient = Pick<Patient, 'id' | 'first_name' | 'last_name' | 'phone'>;

export interface Appointment {
  id: string;
  patient_id: string;
  staff_id: string | null;
  service_id: string | null;
  appointment_date: string;
  start_time: string;
  /** Worked out from `start_time` + `duration_minutes`; the API stores only the duration. */
  end_time: string;
  duration_minutes: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes: string | null;
  created_at: string;
  patient?: AppointmentPatient;
  staff?: Staff;
  service?: Pick<Service, 'id' | 'name'>;
}

export interface Treatment {
  id: string;
  patient_id: string;
  appointment_id: string | null;
  staff_id: string | null;
  service_id: string | null;
  tooth_number: number | null;
  description: string | null;
  status: string;
  cost: number;
  treatment_date: string;
  notes: string | null;
  created_at: string;
  service?: Service;
  staff?: Staff;
}

export interface DentalRecord {
  id: string;
  patient_id: string;
  tooth_number: number;
  status: 'healthy' | 'treated' | 'in_progress' | 'planned' | 'extracted' | 'decayed';
  treatment_type: string | null;
  treatment_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  patient_id: string;
  appointment_id: string | null;
  /** The treatment plan this invoice bills, if any. */
  treatment_plan_id: string | null;
  invoice_number: string | null;
  subtotal: number;
  tax_amount: number;
  discount: number;
  total: number;
  paid_amount: number;
  balance: number;
  status: 'unpaid' | 'partial' | 'paid' | 'overdue';
  payment_type: 'full' | 'installment';
  installment_count: number;
  notes: string | null;
  created_at: string;
  patient?: Patient;
  items?: InvoiceItem[];
  installments?: Installment[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  service_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  patient_id: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'online' | 'transfer';
  payment_date: string;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
}

export interface Installment {
  id: string;
  invoice_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  paid: boolean;
  paid_date: string | null;
  payment_id: string | null;
  created_at: string;
}

export interface RvgImage {
  id: string;
  patient_id: string;
  image_url: string;
  image_type: string;
  tooth_number: number | null;
  description: string | null;
  device_info: string | null;
  created_at: string;
}

export interface Lab {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  balance: number;
  active: boolean;
  created_at: string;
}

export interface LabService {
  id: string;
  lab_id: string;
  name: string;
  price: number;
  description: string | null;
  created_at: string;
}

export interface LabOrder {
  id: string;
  lab_id: string;
  patient_id: string;
  staff_id: string | null;
  service_name: string;
  tooth_numbers: string | null;
  description: string | null;
  price: number;
  status: 'pending' | 'in_progress' | 'ready' | 'delivered';
  order_date: string;
  due_date: string | null;
  delivered_date: string | null;
  notes: string | null;
  created_at: string;
  lab?: Lab;
  patient?: Patient;
}

export interface LabPayment {
  id: string;
  lab_id: string;
  lab_order_id: string | null;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
}

export interface TreatmentPlan {
  id: string;
  patient_id: string;
  title: string;
  total_estimated_cost: number;
  status: 'active' | 'completed' | 'cancelled';
  start_date: string;
  target_end_date: string | null;
  notes: string | null;
  created_at: string;
  items?: TreatmentPlanItem[];
  patient?: Patient;
}

export interface TreatmentPlanItem {
  id: string;
  plan_id: string;
  patient_id: string;
  service_id: string | null;
  tooth_number: number | null;
  description: string | null;
  estimated_cost: number;
  actual_cost: number | null;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  appointment_id: string | null;
  installment_id: string | null;
  due_date: string | null;
  completed_date: string | null;
  sort_order: number;
  notes: string | null;
  created_at: string;
  service?: Service;
}

/** A reusable list of services a new treatment plan can start from. */
export interface TreatmentPlanTemplate {
  id: string;
  name: string;
  description: string | null;
  items: { service_id: string | null; description: string; price: number }[];
  active: boolean;
  created_at: string;
}

export interface SmsPackage {
  id: string;
  package_name: string;
  total_credits: number;
  used_credits: number;
  remaining_credits: number;
  purchase_date: string;
  expiry_date: string | null;
  price: number;
  status: string;
  created_at: string;
}

export interface SmsCampaign {
  id: string;
  title: string;
  message_body: string;
  target_filter: Record<string, unknown> | null;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  pending_count: number;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'cancelled';
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface SmsMessage {
  id: string;
  campaign_id: string | null;
  patient_id: string | null;
  phone_number: string;
  message_body: string;
  status: 'pending' | 'sent' | 'failed';
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
  patient?: Patient;
}

/**
 * Every table kept in the browser store, keyed by name, mapped to its row type.
 * Patients, appointments and services come from Dental-Api instead (`src/data/`).
 */
export interface Tables {
  clinic_settings: ClinicSettings;
  staff: Staff;
  treatments: Treatment;
  dental_records: DentalRecord;
  invoices: Invoice;
  invoice_items: InvoiceItem;
  payments: Payment;
  installments: Installment;
  rvg_images: RvgImage;
  labs: Lab;
  lab_services: LabService;
  lab_orders: LabOrder;
  lab_payments: LabPayment;
  treatment_plans: TreatmentPlan;
  treatment_plan_items: TreatmentPlanItem;
  treatment_plan_templates: TreatmentPlanTemplate;
  sms_packages: SmsPackage;
  sms_campaigns: SmsCampaign;
  sms_messages: SmsMessage;
}

export type TableName = keyof Tables;

export type Database = { [K in TableName]: Tables[K][] };

export type PageKey =
  | 'dashboard'
  | 'patients'
  | 'appointments'
  | 'billing'
  | 'lab'
  | 'reports'
  | 'ai'
  | 'sms'
  | 'settings';
