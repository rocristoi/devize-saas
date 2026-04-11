"use client";

import { VehicleInfo } from "@/types/deviz";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatLicensePlate } from "@/lib/licenseUtils";

interface Props {
  vehicleInfo: VehicleInfo;
  onChange: (field: keyof VehicleInfo, value: string) => void;
  onSetVehicle: (vehicle: Partial<VehicleInfo>) => void;
}

export function VehicleInfoForm({ vehicleInfo, onChange, onSetVehicle }: Props) {
  const supabase = createClient();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

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
  }, [vehicleInfo.numarInmatriculare, supabase]);

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
      <h3 className="text-gray-900 dark:text-gray-100 mb-4 text-lg font-semibold border-b border-gray-200 dark:border-gray-700 pb-2">
        Informații Autovehicul
      </h3>

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
