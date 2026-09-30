/*
# Dental Clinic Management System - Complete Schema

## Overview
Creates the full database schema for a comprehensive dental clinic management system including patients, appointments, treatments, billing, dental records, RVG images, laboratory management, and services.

## New Tables
1. `clinic_settings` - Clinic configuration (name, address, phone, working hours)
2. `staff` - Staff members (doctors, receptionists, accountants)
3. `services` - Treatment services with default prices and durations
4. `patients` - Patient records with medical history
5. `appointments` - Appointment scheduling
6. `treatments` - Treatment records linked to appointments/patients
7. `dental_records` - Per-tooth treatment records (tooth number, status, notes)
8. `invoices` - Billing invoices
9. `invoice_items` - Line items on invoices
10. `payments` - Payment records (cash, card, installment)
11. `installments` - Installment plan tracking
12. `rvg_images` - Radiology images per patient
13. `labs` - Laboratory definitions
14. `lab_services` - Services offered by labs with prices
15. `lab_orders` - Lab orders for dental work
16. `lab_payments` - Payments made to labs

## Security
- RLS enabled on all tables
- Single-tenant app (no auth) - all policies use `TO anon, authenticated`
- All data is shared/public within the clinic
*/

-- Clinic Settings
CREATE TABLE IF NOT EXISTS clinic_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'کلینیک دندانپزشکی',
  address text,
  phone text,
  email text,
  logo_url text,
  working_hours jsonb DEFAULT '{"sat":{"start":"09:00","end":"18:00"},"sun":{"start":"09:00","end":"18:00"},"mon":{"start":"09:00","end":"18:00"},"tue":{"start":"09:00","end":"18:00"},"wed":{"start":"09:00","end":"18:00"},"thu":{"start":"09:00","end":"14:00"},"fri":null}'::jsonb,
  tax_rate numeric DEFAULT 0,
  currency text DEFAULT 'تومان',
  created_at timestamptz DEFAULT now()
);

-- Staff
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'dentist',
  phone text,
  email text,
  color text DEFAULT '#3b82f6',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Services (treatment catalog)
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  default_price numeric NOT NULL DEFAULT 0,
  duration_minutes int DEFAULT 30,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Patients
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  national_id text,
  phone text NOT NULL,
  email text,
  birth_date date,
  gender text DEFAULT 'male',
  address text,
  blood_type text,
  allergies text,
  medical_history text,
  emergency_contact text,
  emergency_phone text,
  insurance_company text,
  insurance_number text,
  notes text,
  balance numeric DEFAULT 0,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  appointment_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text DEFAULT 'pending',
  notes text,
  price numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Treatments (treatment records)
CREATE TABLE IF NOT EXISTS treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  staff_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  tooth_number int,
  description text,
  status text DEFAULT 'completed',
  cost numeric DEFAULT 0,
  treatment_date date DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Dental Records (per-tooth)
CREATE TABLE IF NOT EXISTS dental_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  tooth_number int NOT NULL,
  status text DEFAULT 'healthy',
  treatment_type text,
  treatment_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  invoice_number text,
  subtotal numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  total numeric DEFAULT 0,
  paid_amount numeric DEFAULT 0,
  balance numeric DEFAULT 0,
  status text DEFAULT 'unpaid',
  payment_type text DEFAULT 'full',
  installment_count int DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Invoice Items
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity int DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_method text DEFAULT 'cash',
  payment_date date DEFAULT CURRENT_DATE,
  reference_number text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Installments
CREATE TABLE IF NOT EXISTS installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
  installment_number int NOT NULL,
  amount numeric NOT NULL,
  due_date date NOT NULL,
  paid boolean DEFAULT false,
  paid_date date,
  payment_id uuid REFERENCES payments(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- RVG Images
CREATE TABLE IF NOT EXISTS rvg_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  image_type text DEFAULT 'rvg',
  tooth_number int,
  description text,
  device_info text,
  created_at timestamptz DEFAULT now()
);

-- Labs
CREATE TABLE IF NOT EXISTS labs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text,
  phone text,
  email text,
  address text,
  balance numeric DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Lab Services
CREATE TABLE IF NOT EXISTS lab_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid REFERENCES labs(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Lab Orders
CREATE TABLE IF NOT EXISTS lab_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid REFERENCES labs(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  service_name text NOT NULL,
  tooth_numbers text,
  description text,
  price numeric NOT NULL DEFAULT 0,
  status text DEFAULT 'pending',
  order_date date DEFAULT CURRENT_DATE,
  due_date date,
  delivered_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Lab Payments
CREATE TABLE IF NOT EXISTS lab_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid REFERENCES labs(id) ON DELETE CASCADE,
  lab_order_id uuid REFERENCES lab_orders(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  payment_method text DEFAULT 'cash',
  payment_date date DEFAULT CURRENT_DATE,
  reference_number text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dental_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rvg_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_payments ENABLE ROW LEVEL SECURITY;

-- Policies for all tables (single-tenant, no auth)
-- clinic_settings
DROP POLICY IF EXISTS "anon_crud_clinic_settings" ON clinic_settings;
CREATE POLICY "anon_select_clinic_settings" ON clinic_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_clinic_settings" ON clinic_settings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_clinic_settings" ON clinic_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_clinic_settings" ON clinic_settings FOR DELETE TO anon, authenticated USING (true);

-- staff
DROP POLICY IF EXISTS "anon_select_staff" ON staff;
CREATE POLICY "anon_select_staff" ON staff FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_staff" ON staff FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_staff" ON staff FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_staff" ON staff FOR DELETE TO anon, authenticated USING (true);

-- services
CREATE POLICY "anon_select_services" ON services FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_services" ON services FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_services" ON services FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_services" ON services FOR DELETE TO anon, authenticated USING (true);

-- patients
CREATE POLICY "anon_select_patients" ON patients FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_patients" ON patients FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_patients" ON patients FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_patients" ON patients FOR DELETE TO anon, authenticated USING (true);

-- appointments
CREATE POLICY "anon_select_appointments" ON appointments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_appointments" ON appointments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_appointments" ON appointments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_appointments" ON appointments FOR DELETE TO anon, authenticated USING (true);

-- treatments
CREATE POLICY "anon_select_treatments" ON treatments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_treatments" ON treatments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_treatments" ON treatments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_treatments" ON treatments FOR DELETE TO anon, authenticated USING (true);

-- dental_records
CREATE POLICY "anon_select_dental_records" ON dental_records FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_dental_records" ON dental_records FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_dental_records" ON dental_records FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_dental_records" ON dental_records FOR DELETE TO anon, authenticated USING (true);

-- invoices
CREATE POLICY "anon_select_invoices" ON invoices FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_invoices" ON invoices FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_invoices" ON invoices FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_invoices" ON invoices FOR DELETE TO anon, authenticated USING (true);

-- invoice_items
CREATE POLICY "anon_select_invoice_items" ON invoice_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_invoice_items" ON invoice_items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_invoice_items" ON invoice_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_invoice_items" ON invoice_items FOR DELETE TO anon, authenticated USING (true);

-- payments
CREATE POLICY "anon_select_payments" ON payments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_payments" ON payments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_payments" ON payments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_payments" ON payments FOR DELETE TO anon, authenticated USING (true);

-- installments
CREATE POLICY "anon_select_installments" ON installments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_installments" ON installments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_installments" ON installments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_installments" ON installments FOR DELETE TO anon, authenticated USING (true);

-- rvg_images
CREATE POLICY "anon_select_rvg_images" ON rvg_images FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_rvg_images" ON rvg_images FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_rvg_images" ON rvg_images FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_rvg_images" ON rvg_images FOR DELETE TO anon, authenticated USING (true);

-- labs
CREATE POLICY "anon_select_labs" ON labs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_labs" ON labs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_labs" ON labs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_labs" ON labs FOR DELETE TO anon, authenticated USING (true);

-- lab_services
CREATE POLICY "anon_select_lab_services" ON lab_services FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_lab_services" ON lab_services FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_lab_services" ON lab_services FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_lab_services" ON lab_services FOR DELETE TO anon, authenticated USING (true);

-- lab_orders
CREATE POLICY "anon_select_lab_orders" ON lab_orders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_lab_orders" ON lab_orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_lab_orders" ON lab_orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_lab_orders" ON lab_orders FOR DELETE TO anon, authenticated USING (true);

-- lab_payments
CREATE POLICY "anon_select_lab_payments" ON lab_payments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_lab_payments" ON lab_payments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_lab_payments" ON lab_payments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_lab_payments" ON lab_payments FOR DELETE TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_staff ON appointments(staff_id);
CREATE INDEX IF NOT EXISTS idx_treatments_patient ON treatments(patient_id);
CREATE INDEX IF NOT EXISTS idx_dental_records_patient ON dental_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_rvg_images_patient ON rvg_images(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_lab ON lab_orders(lab_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_patient ON lab_orders(patient_id);
