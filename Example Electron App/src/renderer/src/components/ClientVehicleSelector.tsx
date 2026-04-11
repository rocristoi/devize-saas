import React, { useState, useEffect } from 'react';
import { Search, User, Car, FileText, Trash2, AlertTriangle } from 'lucide-react';
import { StoredClient, StoredVehicle, ClientInfo, VehicleInfo } from '../types';
import { 
  searchClients, 
  getVehiclesByClient, 
  searchVehiclesByLicensePlate,
  getClient,
  getServiceHistory,
  deleteClient,
  deleteVehicle
} from '../utils/clientVehicleStorage';

interface ClientVehicleSelectorProps {
  onClientSelect: (clientInfo: ClientInfo) => void;
  onVehicleSelect: (vehicleInfo: VehicleInfo) => void;
  onClear: () => void;
  className?: string;
}

const ClientVehicleSelector: React.FC<ClientVehicleSelectorProps> = ({
  onClientSelect,
  onVehicleSelect,
  onClear,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<StoredClient | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<StoredVehicle | null>(null);
  const [clientResults, setClientResults] = useState<StoredClient[]>([]);
  const [vehicleResults, setVehicleResults] = useState<StoredVehicle[]>([]);
  const [clientVehicles, setClientVehicles] = useState<StoredVehicle[]>([]);
  const [showingResults, setShowingResults] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    type: 'client' | 'vehicle';
    id: string;
    name: string;
  } | null>(null);

  // Search both clients and vehicles
  useEffect(() => {
    if (searchQuery.trim()) {
      const clients = searchClients(searchQuery).slice(0, 5);
      const vehicles = searchVehiclesByLicensePlate(searchQuery).slice(0, 5);
      setClientResults(clients);
      setVehicleResults(vehicles);
      setShowingResults(true);
    } else {
      setClientResults([]);
      setVehicleResults([]);
      setShowingResults(false);
    }
  }, [searchQuery]);

  const handleClientSelect = (client: StoredClient) => {
    setSelectedClient(client);
    setSelectedVehicle(null);
    setSearchQuery('');
    setShowingResults(false);
    
    // Load client's vehicles
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
    setSelectedVehicle(vehicle);
    
    // If we don't have a client selected, select the vehicle's client
    if (!selectedClient) {
      const client = getClient(vehicle.clientId);
      if (client) {
        setSelectedClient(client);
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
        
        const vehicles = getVehiclesByClient(client.id);
        setClientVehicles(vehicles);
      }
    }
    
    // Auto-fill vehicle info
    const vehicleInfo: VehicleInfo = {
      marca: vehicle.marca,
      model: vehicle.model,
      numarInmatriculare: vehicle.numarInmatriculare,
      seriaSasiu: vehicle.vin, // Keep VIN for display
      nivelCarburant: '',
      capacitateCilindrica: vehicle.capacitateCilindrica,
      anFabricatie: vehicle.anFabricatie,
      km: vehicle.lastKm || '',
      culoare: vehicle.culoare
    };
    onVehicleSelect(vehicleInfo);
    
    setSearchQuery('');
    setShowingResults(false);
  };

  const handleClear = () => {
    setSelectedClient(null);
    setSelectedVehicle(null);
    setClientVehicles([]);
    setSearchQuery('');
    setShowingResults(false);
    onClear();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO');
  };

  const getLastServiceInfo = (vehicle: StoredVehicle) => {
    const history = getServiceHistory(vehicle.licensePlate);
    if (history.length === 0) return null;
    
    const lastService = history[history.length - 1];
    return {
      date: lastService.date,
      km: lastService.km,
      total: lastService.totalDevis
    };
  };

  const handleDeleteClient = (clientId: string, clientName: string) => {
    setShowDeleteConfirm({
      type: 'client',
      id: clientId,
      name: clientName
    });
  };

  const handleDeleteVehicle = (licensePlate: string, vehicleName: string) => {
    setShowDeleteConfirm({
      type: 'vehicle',
      id: licensePlate,
      name: vehicleName
    });
  };

  const confirmDelete = () => {
    if (!showDeleteConfirm) return;

    let success = false;
    
    switch (showDeleteConfirm.type) {
      case 'client':
        success = deleteClient(showDeleteConfirm.id);
        if (success) {
          // Refresh search results
          if (searchQuery.trim()) {
            const clients = searchClients(searchQuery).slice(0, 5);
            const vehicles = searchVehiclesByLicensePlate(searchQuery).slice(0, 5);
            setClientResults(clients);
            setVehicleResults(vehicles);
          }
          // Clear selection if deleted client was selected
          if (selectedClient && selectedClient.id === showDeleteConfirm.id) {
            handleClear();
          }
        }
        break;
      case 'vehicle':
        success = deleteVehicle(showDeleteConfirm.id);
        if (success) {
          // Refresh search results
          if (searchQuery.trim()) {
            const clients = searchClients(searchQuery).slice(0, 5);
            const vehicles = searchVehiclesByLicensePlate(searchQuery).slice(0, 5);
            setClientResults(clients);
            setVehicleResults(vehicles);
          }
          // Refresh client vehicles if a vehicle was deleted
          if (selectedClient) {
            const vehicles = getVehiclesByClient(selectedClient.id);
            setClientVehicles(vehicles);
          }
          // Clear selection if deleted vehicle was selected
          if (selectedVehicle && selectedVehicle.licensePlate === showDeleteConfirm.id) {
            setSelectedVehicle(null);
          }
        }
        break;
    }

    if (success) {
      setShowDeleteConfirm(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-blue-50 dark:from-blue-900/20 dark:to-blue-900/20 rounded-none border border-blue-200 dark:border-blue-700 ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Date Client Și Vehicul
          </h3>
          {(selectedClient || selectedVehicle) && (
            <button
              onClick={handleClear}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 
                       px-3 py-1 rounded-none border border-blue-300 dark:border-blue-600 hover:bg-blue-100 dark:hover:bg-blue-800/30"
            >
              Șterge selecția
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Căutare client (nume, CNP/CUI) sau vehicul (VIN, nr. înmatriculare)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-blue-300 dark:border-blue-600 rounded-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:outline-none focus:border-transparent
                     placeholder-gray-500 dark:placeholder-gray-400 transition"
            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={(e) => e.target.style.borderColor = ''}
          />
        </div>

        {/* Search Results */}
        {showingResults && (searchQuery.trim()) && (
          <div className="mb-4 bg-white dark:bg-gray-800 rounded-none border border-gray-200 dark:border-gray-600 shadow-sm max-h-64 overflow-y-auto">
            {/* Client Results */}
            {clientResults.length > 0 && (
              <div>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    Clienți găsiți ({clientResults.length})
                  </h4>
                </div>
                {clientResults.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => handleClientSelect(client)}
                    className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{client.nume}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{client.cuiCnp} • {client.numarTelefon}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">{client.locatie}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <p className="text-xs text-blue-600 dark:text-blue-400">{client.vehicles.length} vehicule</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClient(client.id, client.nume);
                          }}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-none transition-colors"
                          title="Șterge clientul"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Vehicle Results */}
            {vehicleResults.length > 0 && (
              <div>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <Car className="w-4 h-4 mr-1" />
                    Vehicule găsite ({vehicleResults.length})
                  </h4>
                </div>
                {vehicleResults.map((vehicle) => {
                  const client = getClient(vehicle.clientId);
                  const lastService = getLastServiceInfo(vehicle);
                  return (
                    <div
                      key={vehicle.licensePlate}
                      onClick={() => handleVehicleSelect(vehicle)}
                      className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {vehicle.marca} {vehicle.model} ({vehicle.anFabricatie})
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {vehicle.numarInmatriculare} • {vehicle.culoare}
                          </p>
                          {client && (
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Client: {client.nume}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-right">
                            {lastService && (
                              <div className="text-xs text-gray-500 dark:text-gray-500">
                                <p>Ultimul service: {formatDate(lastService.date)}</p>
                                <p>{lastService.km} km</p>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteVehicle(vehicle.licensePlate, `${vehicle.marca} ${vehicle.model}`);
                            }}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-none transition-colors"
                            title="Șterge vehiculul"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {clientResults.length === 0 && vehicleResults.length === 0 && (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                Nu s-au găsit rezultate
              </div>
            )}
          </div>
        )}

        {/* Selected Client Info */}
        {selectedClient && (
          <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-none border border-green-200 dark:border-green-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-green-900 dark:text-green-100 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Client selectat
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{selectedClient.nume}</p>
                <p className="text-gray-600 dark:text-gray-400">{selectedClient.cuiCnp}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">{selectedClient.numarTelefon}</p>
                <p className="text-gray-500 dark:text-gray-500">{selectedClient.locatie}</p>
              </div>
            </div>
          </div>
        )}

        {/* Client's Vehicles */}
        {selectedClient && clientVehicles.length > 0 && !selectedVehicle && (
          <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-none border border-blue-200 dark:border-blue-700">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center">
              <Car className="w-4 h-4 mr-2" />
              Vehiculele clientului ({clientVehicles.length})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {clientVehicles.map((vehicle) => {
                const lastService = getLastServiceInfo(vehicle);
                return (
                  <div
                    key={vehicle.licensePlate}
                    onClick={() => handleVehicleSelect(vehicle)}
                    className="p-3 border border-gray-200 dark:border-gray-600 rounded-none hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer
                             transition-colors duration-200"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {vehicle.marca} {vehicle.model} ({vehicle.anFabricatie})
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {vehicle.numarInmatriculare} • {vehicle.culoare} • {vehicle.capacitateCilindrica}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          VIN: {vehicle.vin}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            {vehicle.serviceHistory.length}  {vehicle.serviceHistory.length == 1 ? "serviciu" : 'servicii'}
                          </p>
                          {lastService && (
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              <p>Ultima dată: {formatDate(lastService.date)}</p>
                              <p>Km: {lastService.km}</p>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteVehicle(vehicle.licensePlate, `${vehicle.marca} ${vehicle.model}`);
                          }}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-none transition-colors"
                          title="Șterge vehiculul"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Vehicle Info */}
        {selectedVehicle && (
          <div className="p-4 bg-white dark:bg-gray-800 rounded-none border border-green-200 dark:border-green-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-green-900 dark:text-green-100 flex items-center">
                <Car className="w-4 h-4 mr-2" />
                Vehicul selectat
              </h4>
              <div className="flex items-center space-x-2">
                {selectedVehicle.serviceHistory.length > 0 && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-none flex items-center">
                    <FileText className="w-3 h-3 mr-1" />
                    {selectedVehicle.serviceHistory.length}  {selectedVehicle.serviceHistory.length == 1 ? "serviciu" : 'servicii'}
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {selectedVehicle.marca} {selectedVehicle.model}
                </p>
                <p className="text-gray-600 dark:text-gray-400">{selectedVehicle.numarInmatriculare}</p>
                <p className="text-gray-500 dark:text-gray-500">VIN: {selectedVehicle.vin}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedVehicle.anFabricatie} • {selectedVehicle.culoare}
                </p>
                <p className="text-gray-500 dark:text-gray-500">{selectedVehicle.capacitateCilindrica}</p>
                {selectedVehicle.lastKm && (
                  <p className="text-gray-500 dark:text-gray-500">Ultimii km: {selectedVehicle.lastKm}</p>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-none shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Confirmare ștergere
                  </h3>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {showDeleteConfirm.type === 'client' && 
                    `Sunteți sigur că doriți să ștergeți clientul "${showDeleteConfirm.name}" și toate vehiculele asociate? Această acțiune nu poate fi anulată.`
                  }
                  {showDeleteConfirm.type === 'vehicle' && 
                    `Sunteți sigur că doriți să ștergeți vehiculul "${showDeleteConfirm.name}"? Această acțiune nu poate fi anulată.`
                  }
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-none transition-colors"
                >
                  Anulează
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-none transition-colors"
                >
                  Șterge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientVehicleSelector;