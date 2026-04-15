-- Create sms_audit table
CREATE TABLE IF NOT EXISTS sms_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deviz_id UUID REFERENCES devize(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    status TEXT NOT NULL,
    error_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE
);

-- Add sms_sent_count to devize table to prevent abuse
ALTER TABLE devize ADD COLUMN IF NOT EXISTS sms_sent_count INTEGER DEFAULT 0;

-- RLS policies for sms_audit
ALTER TABLE sms_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sms_audit for their company" ON sms_audit
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_profiles
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert sms_audit for their company" ON sms_audit
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_profiles
            WHERE id = auth.uid()
        )
    );
