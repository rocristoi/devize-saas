DROP POLICY IF EXISTS "Users can insert sms_audit for their company" ON sms_audit;
DROP POLICY IF EXISTS "Users can view sms_audit for their company" ON sms_audit;

CREATE POLICY "Company isolation for sms_audit log" ON sms_audit FOR ALL USING (company_id = public.get_my_company_id());
