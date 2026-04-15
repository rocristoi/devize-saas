import { PageHeader } from '@/components/ui/PageHeader';
import { PaymentResultClient } from '@/components/billing/PaymentResultClient';

export default function PaymentResultPage() {
  return (
    <div className="w-full space-y-8">
      <PageHeader
        title="Rezultat Plată"
        description="Statusul tranzacției tale."
      />
      <PaymentResultClient />
    </div>
  );
}
