/*
# SMS Panel Schema

1. New Tables
- `sms_packages`: Stores purchased SMS credit packages. Each row represents a bundle bought (e.g. 1000 SMS). Tracks total credits, used credits, and remaining.
- `sms_campaigns`: Stores SMS campaign definitions. Each campaign has a title, message body, target audience filter, status, and stats (sent/failed/pending counts).
- `sms_messages`: Individual SMS messages sent under a campaign. Each row tracks recipient phone, patient link, delivery status, and sent timestamp.

2. Columns
- sms_packages: id, package_name, total_credits, used_credits, remaining_credits, purchase_date, expiry_date, price, status, created_at
- sms_campaigns: id, title, message_body, target_filter (jsonb for audience criteria), total_recipients, sent_count, failed_count, pending_count, status (draft/scheduled/sending/completed/cancelled), scheduled_at, sent_at, created_at
- sms_messages: id, campaign_id, patient_id, phone_number, message_body, status (pending/sent/failed), sent_at, error_message, created_at

3. Security
- Enable RLS on all tables.
- Allow anon + authenticated CRUD (single-tenant, no auth screen).
*/

CREATE TABLE IF NOT EXISTS sms_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_name text NOT NULL DEFAULT 'بسته پیامک',
  total_credits integer NOT NULL DEFAULT 0,
  used_credits integer NOT NULL DEFAULT 0,
  remaining_credits integer NOT NULL DEFAULT 0,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  expiry_date date,
  price numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sms_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_sms_packages" ON sms_packages;
CREATE POLICY "anon_select_sms_packages" ON sms_packages FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_sms_packages" ON sms_packages;
CREATE POLICY "anon_insert_sms_packages" ON sms_packages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_sms_packages" ON sms_packages;
CREATE POLICY "anon_update_sms_packages" ON sms_packages FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_sms_packages" ON sms_packages;
CREATE POLICY "anon_delete_sms_packages" ON sms_packages FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS sms_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message_body text NOT NULL,
  target_filter jsonb,
  total_recipients integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  pending_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sms_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_sms_campaigns" ON sms_campaigns;
CREATE POLICY "anon_select_sms_campaigns" ON sms_campaigns FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_sms_campaigns" ON sms_campaigns;
CREATE POLICY "anon_insert_sms_campaigns" ON sms_campaigns FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_sms_campaigns" ON sms_campaigns;
CREATE POLICY "anon_update_sms_campaigns" ON sms_campaigns FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_sms_campaigns" ON sms_campaigns;
CREATE POLICY "anon_delete_sms_campaigns" ON sms_campaigns FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS sms_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES sms_campaigns(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  phone_number text NOT NULL,
  message_body text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_sms_messages" ON sms_messages;
CREATE POLICY "anon_select_sms_messages" ON sms_messages FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_sms_messages" ON sms_messages;
CREATE POLICY "anon_insert_sms_messages" ON sms_messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_sms_messages" ON sms_messages;
CREATE POLICY "anon_update_sms_messages" ON sms_messages FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_sms_messages" ON sms_messages;
CREATE POLICY "anon_delete_sms_messages" ON sms_messages FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_sms_messages_campaign_id ON sms_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sms_campaigns_status ON sms_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_sms_packages_status ON sms_packages(status);

-- Seed a default package so the panel isn't empty on first load
INSERT INTO sms_packages (package_name, total_credits, used_credits, remaining_credits, price, status)
SELECT 'بسته آزمایشی', 1000, 0, 1000, 0, 'active'
WHERE NOT EXISTS (SELECT 1 FROM sms_packages LIMIT 1);