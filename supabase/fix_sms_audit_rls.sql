DROP POLICY IF EXISTS "Users can insert sms_audit for their company" ON sms_audit;
DROP POLICY IF EXISTS "Users can view sms_audit for their company" ON sms_audit;

CREATE POLICY "Users can view sms_audit for their company" ON sms_audit
    FOR SELECT TO authenticated USING (
        company_id IN (
            SELECT company_id FROM user_profiles
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert sms_audit for their company" ON sms_audit
    FOR INSERT TO authenticated WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_profiles
            WHERE id = auth.uid()
        )
    );
