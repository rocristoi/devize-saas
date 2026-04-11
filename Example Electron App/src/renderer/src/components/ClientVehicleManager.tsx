import React, { useState, useEffect } from 'react';
import { Search, Car, User, FileText, Trash2, AlertTriangle } from 'lucide-react';
import { StoredClient, StoredVehicle, ServiceRecord } from '../types';
import { 
  getAllClients, 
  searchClients, 
  getVehiclesByClient, 
  searchVehiclesByLicensePlate,
  getServiceHistory,
  getClient,
  deleteClient,
  deleteVehicle,
  deleteServiceRecord
} from '../utils/clientVehicleStorage';

interface ClientVehicleManagerProps {
  onSelectClient?: (client: StoredClient) => void;
  onSelectVehicle?: (vehicle: StoredVehicle, client: StoredClient) => void;
  className?: string;
}

const ClientVehicleManager: React.FC<ClientVehicleManagerProps> = ({
  onSelectClient,
  onSelectVehicle,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'clients' | 'vehicles' | 'history'>('clients');
  const [searchQuery, setSearchQuery] = useState('');
  const [clients, setClients] = useState<StoredClient[]>([]);
  const [selectedClient, setSelectedClient] = useState<StoredClient | null>(null);
  const [clientVehicles, setClientVehicles] = useState<StoredVehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<StoredVehicle | null>(null);
  const [serviceHistory, setServiceHistory] = useState<ServiceRecord[]>([]);
  const [vinSearchResults, setVinSearchResults] = useState<StoredVehicle[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    type: 'client' | 'vehicle' | 'serviceRecord';
    id: string;
    name: string;
  } | null>(null);

  // Load all clients on component mount
  useEffect(() => {
    loadClients();
  }, []);

  // Search clients when query changes
  useEffect(() => {
    if (activeTab === 'clients') {
      if (searchQuery.trim()) {
        const results = searchClients(searchQuery);
        setClients(results);
      } else {
        loadClients();
      }
    }
  }, [searchQuery, activeTab]);

  // Search vehicles by license plate when query changes
  useEffect(() => {
    if (activeTab === 'vehicles') {
      if (searchQuery.trim()) {
        const results = searchVehiclesByLicensePlate(searchQuery);
        setVinSearchResults(results);
      } else {
        setVinSearchResults([]);
      }
    }
  }, [searchQuery, activeTab]);

  const loadClients = () => {
    const allClients = getAllClients();
    setClients(allClients);
  };

  const handleClientSelect = (client: StoredClient) => {
    setSelectedClient(client);
    const vehicles = getVehiclesByClient(client.id);
    setClientVehicles(vehicles);
    if (onSelectClient) {
      onSelectClient(client);
    }
  };

  const handleVehicleSelect = (vehicle: StoredVehicle) => {
    setSelectedVehicle(vehicle);
    const history = getServiceHistory(vehicle.licensePlate);
    setServiceHistory(history);
    
    if (onSelectVehicle) {
      const client = getClient(vehicle.clientId);
      if (client) {
        onSelectVehicle(vehicle, client);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO');
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} RON`;
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

  const handleDeleteServiceRecord = (recordId: string, series: string) => {
    setShowDeleteConfirm({
      type: 'serviceRecord',
      id: recordId,
      name: `Deviz ${series}`
    });
  };

  const confirmDelete = () => {
    if (!showDeleteConfirm) return;

    let success = false;
    
    switch (showDeleteConfirm.type) {
      case 'client':
        success = deleteClient(showDeleteConfirm.id);
        if (success) {
          loadClients();
          setSelectedClient(null);
          setClientVehicles([]);
        }
        break;
      case 'vehicle':
        success = deleteVehicle(showDeleteConfirm.id);
        if (success && selectedClient) {
          const vehicles = getVehiclesByClient(selectedClient.id);
          setClientVehicles(vehicles);
          setSelectedVehicle(null);
        }
        break;
      case 'serviceRecord':
        if (selectedVehicle) {
          success = deleteServiceRecord(selectedVehicle.licensePlate, showDeleteConfirm.id);
          if (success) {
            const history = getServiceHistory(selectedVehicle.licensePlate);
            setServiceHistory(history);
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
    <div className={`bg-white dark:bg-gray-800 rounded-none shadow-lg ${className}`}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6 py-4">
          <button
            onClick={() => setActiveTab('clients')}
            className={`flex items-center space-x-2 py-2 px-3 border-b-2 font-medium text-sm ${
              activeTab === 'clients'
                ? ''
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            style={activeTab === 'clients' ? { 
              borderBottomColor: 'var(--color-primary)',
              color: 'var(--color-primary)'
            } : {}}
          >
            <User className="w-4 h-4" />
            <span>Clienți</span>
          </button>
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`flex items-center space-x-2 py-2 px-3 border-b-2 font-medium text-sm ${
              activeTab === 'vehicles'
                ? ''
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            style={activeTab === 'vehicles' ? { 
              borderBottomColor: 'var(--color-primary)',
              color: 'var(--color-primary)'
            } : {}}
          >
            <Car className="w-4 h-4" />
            <span>Vehicule</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-2 py-2 px-3 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Istoric</span>
          </button>
        </nav>
      </div>

      {/* Search Bar */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={
              activeTab === 'clients' 
                ? "Căutare client (nume, CNP/CUI, telefon)..."
                : activeTab === 'vehicles'
                ? "Căutare vehicul (VIN, număr înmatriculare)..."
                : "Selectează un vehicul pentru istoric..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={activeTab === 'history'}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {activeTab === 'clients' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Clienți ({clients.length})
              </h3>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {clients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => handleClientSelect(client)}
                  className="p-4 border border-gray-200 dark:border-gray-600 rounded-none hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer
                           transition-colors duration-200"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {client.nume}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {client.cuiCnp} • {client.numarTelefon}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        {client.locatie}, {client.strada}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {client.vehicles.length} vehicule
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {formatDate(client.lastUpdated)}
                        </p>
                      </div>
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
              
              {clients.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'Nu s-au găsit clienți' : 'Nu există clienți salvați'}
                </div>
              )}
            </div>

            {/* Selected Client's Vehicles */}
            {selectedClient && clientVehicles.length > 0 && (
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Vehiculele clientului: {selectedClient.nume}
                </h4>
                <div className="space-y-2">
                  {clientVehicles.map((vehicle) => (
                    <div
                      key={vehicle.licensePlate}
                      onClick={() => handleVehicleSelect(vehicle)}
                      className="p-3 border border-gray-200 dark:border-gray-600 rounded-none hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer
                               transition-colors duration-200"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {vehicle.marca} {vehicle.model} ({vehicle.anFabricatie})
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {vehicle.numarInmatriculare} • VIN: {vehicle.vin}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {vehicle.serviceHistory.length}  {vehicle.serviceHistory.length == 1 ? "serviciu" : 'servicii'}
                          </p>
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
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'vehicles' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Căutare Vehicule
              </h3>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {vinSearchResults.map((vehicle) => {
                const client = getClient(vehicle.clientId);
                return (
                  <div
                    key={vehicle.licensePlate}
                    onClick={() => handleVehicleSelect(vehicle)}
                    className="p-4 border border-gray-200 dark:border-gray-600 rounded-none hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer
                             transition-colors duration-200"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {vehicle.marca} {vehicle.model} ({vehicle.anFabricatie})
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {vehicle.numarInmatriculare} • VIN: {vehicle.vin}
                        </p>
                        {client && (
                          <p className="text-sm text-gray-500 dark:text-gray-500">
                            Client: {client.nume}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {vehicle.serviceHistory.length}  {vehicle.serviceHistory.length == 1 ? "serviciu" : 'servicii'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {formatDate(vehicle.dateAdded)}
                          </p>
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
              
              {searchQuery && vinSearchResults.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Nu s-au găsit vehicule
                </div>
              )}
              
              {!searchQuery && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Introduceți VIN sau numărul de înmatriculare pentru căutare
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Istoric Servicii
              </h3>
            </div>

            {selectedVehicle ? (
              <div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-none mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {selectedVehicle.marca} {selectedVehicle.model} ({selectedVehicle.anFabricatie})
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedVehicle.numarInmatriculare} • VIN: {selectedVehicle.vin}
                  </p>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {serviceHistory.map((record) => (
                    <div
                      key={record.id}
                      className="p-4 border border-gray-200 dark:border-gray-600 rounded-none"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            Deviz #{record.series}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(record.date)} • {record.km} km
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {formatCurrency(record.totalDevis)}
                          </p>
                          <button
                            onClick={() => handleDeleteServiceRecord(record.id, record.series)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-none transition-colors"
                            title="Șterge înregistrarea de service"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        <strong>Motiv:</strong> {record.motivIntrare}
                      </p>
                      
                      {record.observatii && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <strong>Observații:</strong> {record.observatii}
                        </p>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Piese: {formatCurrency(record.totalPiese)}
                          </p>
                          <p className="text-gray-500 dark:text-gray-500">
                            {record.parts.length} articole
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Manoperă: {formatCurrency(record.totalManopera)}
                          </p>
                          <p className="text-gray-500 dark:text-gray-500">
                            {record.labor.length} operațiuni
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {serviceHistory.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      Nu există istoric de servicii pentru acest vehicul
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Selectați un vehicul pentru a vizualiza istoricul serviciilor
              </div>
            )}
          </div>
        )}
      </div>

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
                  {showDeleteConfirm.type === 'serviceRecord' && 
                    `Sunteți sigur că doriți să ștergeți ${showDeleteConfirm.name}? Această acțiune nu poate fi anulată.`
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

export default ClientVehicleManager;