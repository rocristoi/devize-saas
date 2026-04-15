-- Add per-company SMS rate limiting
-- Tracks total SMS sent by a company; limit is 250 before they must contact support.

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS sms_sent_count INTEGER NOT NULL DEFAULT 0;
