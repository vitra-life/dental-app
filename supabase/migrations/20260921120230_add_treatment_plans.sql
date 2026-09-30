/*
# Add treatment_plans table

## Overview
Creates a treatment_plans table to track multi-step treatment plans for patients.
Each plan has items (services) with estimated costs, status tracking, and can be linked to appointments and invoices/installments.

## New Tables
1. `treatment_plans` - Overall treatment plan for a patient (name, total cost, status, dates)
2. `treatment_plan_items` - Individual items within a plan (service, tooth, cost, status, linked appointment)

## Security
- RLS enabled, single-tenant (no auth), policies for anon+authenticated CRUD
*/

CREATE TABLE IF NOT EXISTS treatment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'طرح درمان',
  total_estimated_cost numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  start_date date DEFAULT CURRENT_DATE,
  target_end_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS treatment_plan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  tooth_number int,
  description text,
  estimated_cost numeric NOT NULL DEFAULT 0,
  actual_cost numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'planned',
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  installment_id uuid REFERENCES installments(id) ON DELETE SET NULL,
  due_date date,
  completed_date date,
  sort_order int DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plan_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_treatment_plans" ON treatment_plans FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_treatment_plans" ON treatment_plans FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_treatment_plans" ON treatment_plans FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_treatment_plans" ON treatment_plans FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "anon_select_tpi" ON treatment_plan_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_tpi" ON treatment_plan_items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_tpi" ON treatment_plan_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_tpi" ON treatment_plan_items FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_tp_patient ON treatment_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_tpi_plan ON treatment_plan_items(plan_id);
CREATE INDEX IF NOT EXISTS idx_tpi_patient ON treatment_plan_items(patient_id);
