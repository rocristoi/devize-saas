import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData?.user) redirect("/login");

  // Get company info
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('company_id, companies(service_name)')
    .eq('id', userData.user.id)
    .single();

  const companyId = profile?.company_id;
  if (!companyId) redirect("/onboarding");

  // Get current month start and end dates
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

  // 1. Devize luna curentă
  const { count: devizeCount } = await supabase
    .from('devize')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .gte('data_intrare', startOfMonth)
    .lte('data_intrare', endOfMonth);

  // 2. Clienți noi luna curentă
  const { count: clientsCount } = await supabase
    .from('clients')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .gte('created_at', startOfMonth)
    .lte('created_at', endOfMonth);

  // 3. Abonament state
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('company_id', companyId)
    .single();

  let subscriptionStateText = "Inactiv";
  let subscriptionSubtext = "Abonament neconfigurat";
  
  if (sub) {
    const trialEnd = sub.trial_end ? new Date(sub.trial_end) : null;
    const isTrial = sub.status === 'trialing' && trialEnd && trialEnd > now;
    const isExpired = sub.status === 'expired' || (trialEnd && trialEnd <= now && sub.status === 'trialing');

    if (isTrial && trialEnd) {
      subscriptionStateText = "Trial Activ";
      subscriptionSubtext = `Expiră în ${differenceInDays(trialEnd, now)} zile`;
    } else if (isExpired) {
      subscriptionStateText = "Expirat";
      subscriptionSubtext = "Aplicația necesită abonament";
    } else if (sub.status === 'active') {
      subscriptionStateText = "Plan Activ";
      subscriptionSubtext = sub.current_period_end 
        ? `Valabil până la ${format(new Date(sub.current_period_end), 'dd.MM.yyyy')}`
        : "Abonament recurent";
    }
  }

  return (
    <DashboardClient 
      devizeCount={devizeCount || 0}
      clientsCount={clientsCount || 0}
      subscriptionStateText={subscriptionStateText}
      subscriptionSubtext={subscriptionSubtext}
      companyName={(profile?.companies as any)?.service_name || "Compania Ta"}
    />
  );
}