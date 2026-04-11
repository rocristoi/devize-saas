import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreditCard, CheckCircle2, AlertCircle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ro } from "date-fns/locale";
import { PageHeader } from "@/components/ui/PageHeader";

function PlanCard({ 
  title, 
  price, 
  period, 
  features, 
  planId, 
  isActive 
}: { 
  title: string, 
  price: string, 
  period: string, 
  features: string[], 
  planId: string, 
  isActive: boolean 
}) {
  return (
    <div className={`relative bg-white dark:bg-gray-900 rounded-xl p-8 border-2 transition-all duration-300 ${
      isActive 
        ? "border-blue-600 shadow-lg shadow-blue-500/10 dark:shadow-blue-500/5 transform scale-[1.02]" 
        : "border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-gray-700 shadow-sm"
    }`}>
      {isActive && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest shadow-sm">
          Abonament Curent
        </div>
      )}
      
      <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
        <div className="flex items-baseline gap-1.5">
          <span className="text-5xl font-extrabold text-gray-900 dark:text-white">{price}</span>
          <span className="text-gray-500 dark:text-gray-400 font-medium">RON / {period}</span>
        </div>
      </div>
      
      <ul className="space-y-4 mb-10 text-sm text-gray-600 dark:text-gray-300">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3">
            <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-500' : 'text-gray-400 dark:text-gray-500'}`} />
            <span className="leading-snug">{feature}</span>
          </li>
        ))}
      </ul>
      
      <div className="mt-auto">
        {!isActive ? (
          <form action="/api/payments/init" method="POST">
            <input type="hidden" name="planId" value={planId} />
            <button 
              type="submit" 
              className="w-full py-3.5 px-4 bg-gray-900 hover:bg-gray-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-sm flex justify-center items-center gap-2 group"
            >
              <CreditCard className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" />
              <span>Alege planul</span>
            </button>
          </form>
        ) : (
          <button 
            disabled
            className="w-full py-3.5 px-4 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 rounded-xl font-medium flex justify-center items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Plan Activ</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default async function AbonamentPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData?.user) redirect("/login");

  // Get company info and subscription status
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('company_id')
    .eq('id', userData.user.id)
    .single();

  const companyId = profile?.company_id;
  if (!companyId) redirect("/onboarding");

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('company_id', companyId)
    .single();

  if (!sub) return null;

  const now = new Date();
  const trialEnd = sub.trial_end ? new Date(sub.trial_end) : null;
  const isTrial = sub.status === 'trialing' && trialEnd && trialEnd > now;
  const isExpired = sub.status === 'expired' || (trialEnd && trialEnd <= now && sub.status === 'trialing');

  let daysRemaining = 0;
  if (isTrial && trialEnd) {
    daysRemaining = differenceInDays(trialEnd, now);
  }

  const features = [
    "Creare și Descărcare PDF Devize Nelimitat",
    "Istoric Devize permanent salvat în Cloud",
    "Gestiune Piese și Manoperă Nelimitată",
    "Bază de date Clienți și Vehicule",
    "Securitate garantată și Backups automate"
  ];

  return (
    <div className="w-full space-y-8">
      <PageHeader 
        title="Abonamentul Tău"
        description="Gestionează licența și accesează sistemul complet fără întreruperi."
      />

      <div className="w-full space-y-10">
        {/* Status Banner */}
        <div className={`p-5 rounded-xl border flex items-start gap-4 shadow-sm ${
          isTrial 
            ? "bg-blue-50/50 border-blue-200 dark:bg-blue-500/5 dark:border-blue-500/20"
            : isExpired
              ? "bg-red-50/50 border-red-200 dark:bg-red-500/5 dark:border-red-500/20"
              : "bg-green-50/50 border-green-200 dark:bg-green-500/5 dark:border-green-500/20"
        }`}>
          {isTrial ? (
            <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          ) : isExpired ? (
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          )}
          
          <div>
            <h3 className={`font-semibold text-lg ${
              isTrial ? "text-blue-900 dark:text-blue-300" : isExpired ? "text-red-900 dark:text-red-300" : "text-green-900 dark:text-green-300"
            }`}>
              {isTrial ? "Perioadă de probă activă" : isExpired ? "Abonament expirat" : "Abonament Activ"}
            </h3>
            <p className={`mt-1.5 leading-relaxed ${
              isTrial ? "text-blue-700/80 dark:text-blue-400/80" : isExpired ? "text-red-700/80 dark:text-red-400/80" : "text-green-700/80 dark:text-green-400/80"
            }`}>
              {isTrial && trialEnd && (
                <>Mai ai <strong>{daysRemaining}</strong> zile din perioada gratuită (până la {format(trialEnd, 'dd MMM yyyy', { locale: ro })}). Alege un plan pentru a evita blocarea aplicației.</>
              )}
              {isExpired && (
                <>Perioada ta a expirat. Te rugăm să achiziționezi un abonament pentru a debloca accesul.</>
              )}
              {sub.status === 'active' && sub.current_period_end && (
                <>Următoarea facturare: {format(new Date(sub.current_period_end), 'dd MMM yyyy', { locale: ro })}.</>
              )}
            </p>
          </div>
        </div>

        {/* Pricing Table */}
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
          <PlanCard 
            title="Lunar"
            price="80"
            period="lună"
            features={features}
            planId="lunar"
            isActive={sub.plan_id === 'lunar' && sub.status === 'active'}
          />
          
          <PlanCard 
            title="Anual (Economisești 16%)"
            price="800"
            period="an"
            features={features}
            planId="anual"
            isActive={sub.plan_id === 'anual' && sub.status === 'active'}
          />
        </div>

        <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-8 border-t border-gray-200 dark:border-gray-800">
          <p>Plățile sunt procesate în siguranță prin <strong className="text-gray-700 dark:text-gray-300">Netopia Payments</strong> (MobilPay).</p>
          <p className="mt-1">Abonamentul acoperă o singură entitate legală (Firmă / CUI). Setările recurente pot fi modificate oricând.</p>
        </div>
      </div>
    </div>
  );
}
