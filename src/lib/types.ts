export interface ClinicSettings {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  working_hours: Record<string, { start: string; end: string } | null> | null;
  tax_rate: number;
  currency: string;
}

export interface Staff {
  id: string;
  full_name: string;
  role: 'dentist' | 'receptionist' | 'accountant' | 'manager';
  phone: string | null;
  email: string | null;
  color: string;
  active: boolean;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  default_price: number;
  duration_minutes: number;
  description: string | null;
  active: boolean;
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
  balance: number;
  status: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  staff_id: string | null;
  service_id: string | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes: string | null;
  price: number;
  patient?: Patient;
  staff?: Staff;
  service?: Service;
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
}

export interface Invoice {
  id: string;
  patient_id: string;
  appointment_id: string | null;
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
}

export interface LabService {
  id: string;
  lab_id: string;
  name: string;
  price: number;
  description: string | null;
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
  service?: Service;
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
