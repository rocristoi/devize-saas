"use client";

import { useMemo, useState } from "react";
import { ClientInfo, VehicleInfo, DevizPart, DevizLabor } from "@/types/deviz";
import { ClientInfoForm } from "./ClientInfoForm";
import { VehicleInfoForm } from "./VehicleInfoForm";
import { DevizPartsTable } from "./DevizPartsTable";
import { DevizLaborTable } from "./DevizLaborTable";
import { saveDeviz } from "@/app/actions/deviz";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function CreateDevizForm() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    nume: "",
    cuiCnp: "",
    locatie: "",
    strada: "",
    numarTelefon: "",
    dataIntrare: new Date().toISOString().split("T")[0],
    dataIesire: "",
    motivIntrare: "",
    observatii: "",
  });

  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo>({
    marca: "",
    model: "",
    numarInmatriculare: "",
    seriaSasiu: "",
    anFabricatie: "",
    culoare: "",
    capacitateCilindrica: "",
    km: "",
    nivelCarburant: "",
  });

  const [parts, setParts] = useState<DevizPart[]>([]);
  const [labor, setLabor] = useState<DevizLabor[]>([]);

  const handleClientChange = (field: keyof ClientInfo, value: string) => {
    setClientInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleSetClient = (partialClient: Partial<ClientInfo>) => {
    setClientInfo(prev => ({ ...prev, ...partialClient }));
  };

  const handleVehicleChange = (field: keyof VehicleInfo, value: string) => {
    setVehicleInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleSetVehicle = (partialVehicle: Partial<VehicleInfo>) => {
    setVehicleInfo(prev => ({ ...prev, ...partialVehicle }));
  };

  // Summaries
  const sumParts = useMemo(
    () => parts.reduce((acc, p) => acc + p.total, 0),
    [parts],
  );
  const sumLabor = useMemo(
    () => labor.reduce((acc, l) => acc + l.total, 0),
    [labor],
  );
  const totalGeneral = sumParts + sumLabor;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSaving) return;
    setIsSaving(true);

    try {
      const response = await saveDeviz({
        client: clientInfo,
        vehicle: vehicleInfo,
        parts: parts,
        labor: labor,
        totals: {
          parts: sumParts,
          labor: sumLabor,
          total: totalGeneral,
        },
      });

      if (response.success && response.devizId) {
        toast.success("Deviz salvat cu succes!");
        // Redirect to deviz preview/print screen
        router.push(`/devize/${response.devizId}`);
      } else {
        toast.error(response.error || "Eroare la salvare");
        setIsSaving(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("A apărut o eroare neașteptată la salvarea devizului.");
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ClientInfoForm clientInfo={clientInfo} onChange={handleClientChange} onSetClient={handleSetClient} />
      <VehicleInfoForm
        vehicleInfo={vehicleInfo}
        onChange={handleVehicleChange}
        onSetVehicle={handleSetVehicle}
      />

      <div className="space-y-6">
        <DevizPartsTable parts={parts} onChange={setParts} />
        <DevizLaborTable labor={labor} onChange={setLabor} />
      </div>

      {/* Totals Section */}
      <div className="card-container flex justify-end">
        <div className="w-full md:w-1/3 space-y-3">
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Total Piese:</span>
            <span className="font-medium">{sumParts.toFixed(2)} RON</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-400 pb-3 border-b border-gray-200 dark:border-gray-700">
            <span>Total Manoperă:</span>
            <span className="font-medium">{sumLabor.toFixed(2)} RON</span>
          </div>
          <div className="flex justify-between text-gray-900 dark:text-white text-xl font-bold">
            <span>Total Deviz:</span>
            <span>{totalGeneral.toFixed(2)} RON</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6 pb-12 mt-8 border-t border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 font-medium text-gray-600 dark:text-gray-300 bg-gray-100/80 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700/80 rounded-xl transition-all hover:scale-[1.02] shadow-sm disabled:opacity-50"
        >
          Anulează
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="group relative flex items-center justify-center px-8 py-3 font-medium text-white shadow-lg bg-blue-600 hover:bg-blue-700 rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-blue-500/25 disabled:opacity-75 disabled:hover:translate-y-0 disabled:hover:scale-100 overflow-hidden"
        >
          <span className="absolute inset-0 w-full h-full bg-gradient-to-tr from-transparent via-white/20 to-transparent group-hover:translate-x-full duration-700 transform -translate-x-full transition-transform"></span>
          <span className="relative flex items-center gap-2">
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Se salvează...
              </>
            ) : (
              "Salvează Deviz"
            )}
          </span>
        </button>
      </div>
    </form>
  );
}
