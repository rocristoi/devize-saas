"use client";

import { VehicleInfo } from "@/types/deviz";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatLicensePlate } from "@/lib/licenseUtils";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { Modal } from "@/components/ui/Modal";

const supabase = createClient();

interface Props {
  vehicleInfo: VehicleInfo;
  onChange: (field: keyof VehicleInfo, value: string) => void;
  onSetVehicle: (vehicle: Partial<VehicleInfo>) => void;
}

export function VehicleInfoForm({ vehicleInfo, onChange, onSetVehicle }: Props) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isGeneratingSession, setIsGeneratingSession] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const processTalonImageRef = useRef<(urlOrFile: string | File) => Promise<void>>(async () => {});

  // Funcție ca să primim datele de la API dupa ce avem fisierul (sau url-ul)
  const processTalonImage = async (urlOrFile: string | File) => {
    setIsScanning(true);
    try {
      let publicUrl = "";
      if (typeof urlOrFile === "string") {
        publicUrl = urlOrFile;
      } else {
        const file = urlOrFile;
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("talon-pics")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl: url },
        } = supabase.storage.from("talon-pics").getPublicUrl(filePath);
        publicUrl = url;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ image: publicUrl }),
      });

      if (!response.ok) {
        throw new Error("Failed to scan talon");
      }

      const scanData = await response.json();

      if (scanData.license_plate_number) onChange("numarInmatriculare", scanData.license_plate_number);
      if (scanData.make) onChange("marca", scanData.make);
      if (scanData.model) onChange("model", scanData.model);
      if (scanData.vin) onChange("seriaSasiu", scanData.vin);
      if (scanData.make_year) onChange("anFabricatie", String(scanData.make_year));
      if (scanData.color) onChange("culoare", scanData.color);
      if (scanData.engine_capacity_cc) onChange("capacitateCilindrica", String(scanData.engine_capacity_cc));
        
      toast.success("Talon scanat cu succes!");
      setShowQR(false);
    } catch (err) {
      console.error(err);
      toast.error("Eroare la procesarea talonului.");
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Keep the ref pointing to the latest version so the realtime channel can call it
  processTalonImageRef.current = processTalonImage;

  const handleScanTalon = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processTalonImage(file);
  };

  const handleMobileScan = async () => {
    try {
      setIsGeneratingSession(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("company_id")
        .eq("id", userData.user.id)
        .single();
        
      if (!profileData?.company_id) return;

      const { data, error } = await supabase
        .from("upload_sessions")
        .insert([{ company_id: profileData.company_id }])
        .select()
        .single();
        
      if (error) throw error;
      
      setSessionId(data.id);
      setShowQR(true);
      setIsGeneratingSession(false);
    } catch (error) {
      console.error(error);
      toast.error("Nu s-a putut inițializa sesiunea de scanare.");
    }
  };

  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`scan_session_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "upload_sessions",
          filter: `id=eq.${sessionId}`,
        },
        async (payload) => {
          const newStatus = payload.new.status;
          const imageUrl = payload.new.image_url;

          if (newStatus === "completed" && imageUrl) {
            toast.success("Poză primită! Începem procesarea...");
            await processTalonImageRef.current(imageUrl);
          } else if (newStatus === "failed") {
            toast.error("Eroare la încărcarea de pe telefon.");
            setShowQR(false);
          }
        }
      )
      .subscribe((status, err) => {
        console.log('[scan] Channel subscription status:', status, err ?? '');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  useEffect(() => {
    const searchVehicle = async () => {
      const searchTerm = vehicleInfo.numarInmatriculare.replace(/\s+/g, '');
      if (searchTerm.length < 3) {
        setSuggestions([]);
        return;
      }

      // Simplistic search in current company's vehicles
      const { data } = await supabase
        .from('vehicles')
        .select('*, clients(nume, telefon)')
        .ilike('numar_inmatriculare', `%${searchTerm}%`)
        .limit(5);

      if (data && data.length > 0) {
        setSuggestions(data);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
      }
    };

    const timeout = setTimeout(searchVehicle, 400);
    return () => clearTimeout(timeout);
  }, [vehicleInfo.numarInmatriculare]);

  const handleLicenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const unformattedValue = e.target.value;
    const formattedVal = formatLicensePlate(unformattedValue);
    onChange("numarInmatriculare", formattedVal);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onChange(e.target.name as keyof VehicleInfo, e.target.value);
  };

  const handleSelectVehicle = (vehicle: any) => {
    onSetVehicle({
      numarInmatriculare: vehicle.numar_inmatriculare || "",
      marca: vehicle.marca || "",
      model: vehicle.model || "",
      seriaSasiu: vehicle.seria_sasiu || "",
      anFabricatie: vehicle.an_fabricatie || "",
      culoare: vehicle.culoare || "",
      capacitateCilindrica: vehicle.capacitate_cilindrica || "",
    });
    setShowSuggestions(false);
  };


  return (
    <div className="card-container">
      <div className="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
        <h3 className="text-gray-900 dark:text-gray-100 text-sm sm:text-lg font-semibold">
          Informații Autovehicul
        </h3>
        <div className="flex gap-2">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleScanTalon} 
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isScanning}
            className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 cursor-pointer text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm disabled:opacity-50 flex"
          >
            {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            Încarcă Talon
          </button>
          <button 
            type="button" 
            onClick={handleMobileScan} 
            disabled={isScanning || isGeneratingSession}
            className="flex items-center gap-2 px-3 py-1.5 cursor-pointer bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm disabled:opacity-50 hidden md:flex"
            title="Scanează talonul direct cu telefonul mobil"
          >
            {isGeneratingSession ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            {isGeneratingSession ? "Se generează..." : "Scanare din Telefon"}
          </button>
        </div>
      </div>
      
      <Modal
        isOpen={showQR && !!sessionId}
        onClose={() => setShowQR(false)}
        title="Scanează Talon"
        className="max-w-md"
      >
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
            Scanează codul QR cu telefonul pentru a face o poză la talonul auto. Orice imagine trimisă va fi procesată automat.
          </p>
          <div className="flex justify-center bg-white p-4 rounded-xl border border-gray-200 dark:border-gray-200 mb-6 mx-auto w-fit shadow-sm">
            <QRCodeSVG value={`${process.env.NEXT_PUBLIC_APP_URL}/upload/${sessionId}`} size={200} />
          </div>
          {isScanning ? (
            <div className="flex items-center justify-center gap-2 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-medium text-sm">Procesare în curs...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 rounded-lg border border-gray-100 dark:border-gray-800">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
              <span className="text-sm font-medium">Așteptăm poza...</span>
            </div>
          )}
          <button 
            type="button"
            onClick={() => setShowQR(false)}
            className="w-full py-2.5 px-4 mt-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors"
          >
            Anulează
          </button>
        </div>
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="relative">
          <label className="form-label">
            Nr. Înmatriculare *
          </label>
          <input
            type="text"
            name="numarInmatriculare"
            value={vehicleInfo.numarInmatriculare}
            onChange={handleLicenseChange}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            required
            autoComplete="off"
            placeholder="ex: B 12 XYZ"
            className="w-full uppercase form-input focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold tracking-wider"
          />
          {showSuggestions && suggestions.length > 0 && (
             <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-md mt-1 max-h-60 overflow-auto">
               {suggestions.map((vehicle) => (
                 <li 
                   key={vehicle.id} 
                   className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                   onMouseDown={() => handleSelectVehicle(vehicle)}
                 >
                   <div className="font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">{vehicle.numar_inmatriculare}</div>
                   <div className="text-xs text-gray-500">{vehicle.marca} {vehicle.model} - Client: {vehicle.clients?.nume || 'Necunoscut'}</div>
                 </li>
               ))}
             </ul>
          )}
        </div>
        <div>
          <label className="form-label">
            Marcă *
          </label>
          <input
            type="text"
            name="marca"
            value={vehicleInfo.marca}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label">
            Model *
          </label>
          <input
            type="text"
            name="model"
            value={vehicleInfo.model}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>
        <div className="col-span-1 md:col-span-2">
          <label className="form-label">
            Serie Șasiu (VIN)
          </label>
          <input
            type="text"
            name="seriaSasiu"
            value={vehicleInfo.seriaSasiu}
            onChange={handleChange}
            autoComplete="off"
            className="w-full uppercase form-input focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>
        <div>
          <label className="form-label">
            An Fabricație
          </label>
          <input
            type="text"
            name="anFabricatie"
            value={vehicleInfo.anFabricatie}
            onChange={handleChange}
            autoComplete="off"
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label">
            Culoare
          </label>
          <input
            type="text"
            name="culoare"
            value={vehicleInfo.culoare}
            onChange={handleChange}
            autoComplete="off"
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label">
            Capacitate Cilindrică (cm³)
          </label>
          <input
            type="text"
            name="capacitateCilindrica"
            value={vehicleInfo.capacitateCilindrica}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label">
            Kilometri (Bord)
          </label>
          <input
            type="text"
            name="km"
            value={vehicleInfo.km}
            onChange={handleChange}
            autoComplete="off"
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label">
            Nivel Carburant (%)
          </label>
          <div className="relative">
            <input
              type="number"
              name="nivelCarburant"
              min="0"
              max="100"
              value={vehicleInfo.nivelCarburant}
              onChange={handleChange}
              autoComplete="off"
              className="form-input pr-8"
              placeholder="0 - 100"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
              %
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
