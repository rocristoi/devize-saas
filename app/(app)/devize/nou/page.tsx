import { CreateDevizForm } from "@/components/deviz/CreateDevizForm";
import { PageHeader } from "@/components/ui/PageHeader";

export default function DevizNouPage() {
  return (
    <div className="w-full space-y-6">
      <PageHeader 
        title="Deviz Nou"
        description="Completează detaliile pentru a genera un deviz nou."
      />
      
      <CreateDevizForm />
    </div>
  );
}
