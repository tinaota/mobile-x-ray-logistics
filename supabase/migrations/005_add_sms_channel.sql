-- ============================================================
-- 005 — Add SMS channel support to messages table
-- ============================================================

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'in_app'
    CHECK (channel IN ('in_app', 'sms')),
  ADD COLUMN IF NOT EXISTS sms_sid TEXT;

-- Allow patient role for incoming Twilio SMS
ALTER TABLE messages
  DROP CONSTRAINT IF EXISTS messages_sender_role_check;

ALTER TABLE messages
  ADD CONSTRAINT messages_sender_role_check
    CHECK (sender_role IN ('dispatcher', 'technician', 'patient'));
