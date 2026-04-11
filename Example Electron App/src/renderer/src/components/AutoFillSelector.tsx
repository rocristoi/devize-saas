import React, { useState, useEffect } from 'react';
import { Search, Users, ArrowRight } from 'lucide-react';
import { StoredClient, StoredVehicle, ClientInfo, VehicleInfo } from '../types';
import { 
  getAllClients, 
  searchClients, 
  getVehiclesByClient, 
  searchVehiclesByLicensePlate,
  getClient
} from '../utils/clientVehicleStorage';

interface AutoFillSelectorProps {
  onClientSelect: (clientInfo: ClientInfo) => void;
  onVehicleSelect: (vehicleInfo: VehicleInfo) => void;
  className?: string;
}

const AutoFillSelector: React.FC<AutoFillSelectorProps> = ({
  onClientSelect,
  onVehicleSelect,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'client' | 'vin'>('client');
  const [clients, setClients] = useState<StoredClient[]>([]);
  const [selectedClient, setSelectedClient] = useState<StoredClient | null>(null);
  const [clientVehicles, setClientVehicles] = useState<StoredVehicle[]>([]);
  const [vinResults, setVinResults] = useState<StoredVehicle[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (searchType === 'client') {
      if (searchQuery.trim()) {
        const results = searchClients(searchQuery);
        setClients(results.slice(0, 10)); // Limit to 10 results
      } else {
        const allClients = getAllClients();
        setClients(allClients.slice(0, 10));
      }
    } else if (searchType === 'vin') {
      if (searchQuery.trim()) {
        const results = searchVehiclesByLicensePlate(searchQuery);
        setVinResults(results.slice(0, 10));
      } else {
        setVinResults([]);
      }
    }
  }, [searchQuery, searchType]);

  const handleClientSelect = (client: StoredClient) => {
    setSelectedClient(client);
    const vehicles = getVehiclesByClient(client.id);
    setClientVehicles(vehicles);
    
    // Auto-fill client info
    const clientInfo: ClientInfo = {
      nume: client.nume,
      cuiCnp: client.cuiCnp,
      locatie: client.locatie,
      strada: client.strada,
      numarTelefon: client.numarTelefon,
      motivIntrare: '',
      observatii: '',
      dataIntrare: new Date().toISOString().split('T')[0],
      dataIesire: ''
    };
    onClientSelect(clientInfo);
  };

  const handleVehicleSelect = (vehicle: StoredVehicle) => {
    // Auto-fill vehicle info
    const vehicleInfo: VehicleInfo = {
      marca: vehicle.marca,
      model: vehicle.model,
      numarInmatriculare: vehicle.numarInmatriculare,
      seriaSasiu: vehicle.vin, // Keep VIN for display
      nivelCarburant: '',
      capacitateCilindrica: vehicle.capacitateCilindrica,
      anFabricatie: vehicle.anFabricatie,
      km: '',
      culoare: vehicle.culoare
    };
    onVehicleSelect(vehicleInfo);

    // Also auto-fill client info if searching by VIN
    if (searchType === 'vin') {
      const client = getClient(vehicle.clientId);
      if (client) {
        const clientInfo: ClientInfo = {
          nume: client.nume,
          cuiCnp: client.cuiCnp,
          locatie: client.locatie,
          strada: client.strada,
          numarTelefon: client.numarTelefon,
          motivIntrare: '',
          observatii: '',
          dataIntrare: new Date().toISOString().split('T')[0],
          dataIesire: ''
        };
        onClientSelect(clientInfo);
      }
    }
    
    setIsExpanded(false);
  };


  return (
    <div className={`bg-blue-50 dark:bg-blue-900/20 rounded-none p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Auto-completare Date
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
        >
          {isExpanded ? 'Ascunde' : 'Arată'}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Search Type Selector */}
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="searchType"
                value="client"
                checked={searchType === 'client'}
                onChange={(e) => setSearchType(e.target.value as 'client' | 'vin')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Căutare client</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="searchType"
                value="vin"
                checked={searchType === 'vin'}
                onChange={(e) => setSearchType(e.target.value as 'client' | 'vin')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Căutare VIN</span>
            </label>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={
                searchType === 'client' 
                  ? "Nume client, CNP/CUI sau telefon..." 
                  : "VIN sau număr înmatriculare..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Client Search Results */}
          {searchType === 'client' && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {clients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => handleClientSelect(client)}
                  className="p-3 border border-gray-200 dark:border-gray-600 rounded-none hover:bg-white dark:hover:bg-gray-700 cursor-pointer
                           transition-colors duration-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {client.nume}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {client.cuiCnp} • {client.numarTelefon}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {client.vehicles.length} vehicule
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {searchQuery && clients.length === 0 && (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  Nu s-au găsit clienți
                </div>
              )}
            </div>
          )}

          {/* VIN Search Results */}
          {searchType === 'vin' && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {vinResults.map((vehicle) => {
                const client = getClient(vehicle.clientId);
                return (
                  <div
                    key={vehicle.licensePlate}
                    onClick={() => handleVehicleSelect(vehicle)}
                    className="p-3 border border-gray-200 dark:border-gray-600 rounded-none hover:bg-white dark:hover:bg-gray-700 cursor-pointer
                             transition-colors duration-200"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {vehicle.marca} {vehicle.model}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          VIN: {vehicle.vin}
                        </p>
                        {client && (
                          <p className="text-sm text-gray-500 dark:text-gray-500">
                            Client: {client.nume}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                );
              })}
              
              {searchQuery && vinResults.length === 0 && (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  Nu s-au găsit vehicule
                </div>
              )}
            </div>
          )}

          {/* Selected Client's Vehicles */}
          {selectedClient && clientVehicles.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                Vehiculele clientului: {selectedClient.nume}
              </h4>
              <div className="space-y-2">
                {clientVehicles.map((vehicle) => (
                  <div
                    key={vehicle.licensePlate}
                    onClick={() => handleVehicleSelect(vehicle)}
                    className="p-2 border border-gray-200 dark:border-gray-600 rounded-none hover:bg-white dark:hover:bg-gray-700 cursor-pointer
                             transition-colors duration-200 flex justify-between items-center"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {vehicle.marca} {vehicle.model}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {vehicle.numarInmatriculare}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AutoFillSelector;