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

  const hasData = useMemo(() => {
    const hasPartsOrLabor = parts.length > 0 || labor.length > 0;
    const hasClientData = Object.entries(clientInfo).some(([k, v]) => k !== "dataIntrare" && v !== "");
    const hasVehicleData = Object.values(vehicleInfo).some(v => v !== "");
    return hasPartsOrLabor || hasClientData || hasVehicleData;
  }, [parts, labor, clientInfo, vehicleInfo]);

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

      <div className="space-y-6 flex-grow">
        <DevizPartsTable parts={parts} onChange={setParts} />
        <DevizLaborTable labor={labor} onChange={setLabor} />
      </div>

      {/* Totals Section / Action Bar */}
      <div 
        className={`card-container w-full mt-6 transition-all duration-500 ease-in-out overflow-hidden p-0 md:p-0 
        ${hasData ? "max-h-[500px] opacity-100 mt-6" : "max-h-0 opacity-0 mt-0 !border-transparent !p-0"}`}
      >
        <div className="p-4 md:p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          
          {/* Smart Info Section */}
          <div className="hidden md:flex items-center gap-4 w-1/3">
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-1.5">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Sumar Deviz
                </span>
                {vehicleInfo.numarInmatriculare ? (
                  <span className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border border-gray-200 dark:border-gray-700">
                    {vehicleInfo.numarInmatriculare}
                  </span>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">Auto nespecificat</span>
                )}
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {parts.length} repere piese • {labor.length} manopere
              </span>
            </div>
          </div>

          {/* Totals */}
          <div className="w-full md:w-1/3 flex flex-col space-y-1.5 order-1 md:order-2 md:border-l md:border-r border-gray-200 dark:border-gray-800 md:px-8">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Piese / Materiale:</span>
              <span className="font-medium">{sumParts.toFixed(2)} RON</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 pb-2 border-b border-gray-100 dark:border-gray-800">
              <span>Manoperă:</span>
              <span className="font-medium">{sumLabor.toFixed(2)} RON</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-sm font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300">Total Deviz:</span>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {totalGeneral.toFixed(2)} RON
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex w-full md:w-1/3 justify-end gap-3 order-2 md:order-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Salvăm...
                </>
              ) : (
                "Salvează Deviz"
              )}
            </button>
          </div>
        </div>
        </div>
      </div>
    </form>
  );
}
