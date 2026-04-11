import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Car, User, Search, ChevronDown, ChevronRight, Phone, Plus } from 'lucide-react';
import { StoredVehicle, ServiceRecord, StoredClient } from '../types';
import {
  searchVehiclesByVin,
  getServiceHistory,
  getClient
} from '../utils/clientVehicleStorage';
import { getDisplayLicensePlate } from '../utils/licensePlateUtils';

interface ServiceHistoryViewerProps {
  selectedVehicle?: string | null;
  onCreateQuote?: (client: StoredClient, vehicle: StoredVehicle) => void;
}

const ServiceHistoryViewer: React.FC<ServiceHistoryViewerProps> = ({ selectedVehicle: propSelectedVehicle, onCreateQuote }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<StoredVehicle | null>(null);
  const [selectedClient, setSelectedClient] = useState<StoredClient | null>(null);
  const [serviceHistory, setServiceHistory] = useState<ServiceRecord[]>([]);
  const [vehicleResults, setVehicleResults] = useState<StoredVehicle[]>([]);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchVehiclesByVin(searchQuery);
      setVehicleResults(results.slice(0, 10));
    } else {
      setVehicleResults([]);
    }
  }, [searchQuery]);

  // Handle pre-selected vehicle from props
  useEffect(() => {
    if (propSelectedVehicle) {
      const vehicle = searchVehiclesByVin(propSelectedVehicle).find(v => v.licensePlate === propSelectedVehicle);
      if (vehicle) {
        handleVehicleSelect(vehicle);
      }
    }
  }, [propSelectedVehicle]);

  const handleVehicleSelect = (vehicle: StoredVehicle) => {
    setSelectedVehicle(vehicle);
    const client = getClient(vehicle.clientId);
    setSelectedClient(client);
    const history = getServiceHistory(vehicle.licensePlate);
    setServiceHistory(history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setSearchQuery('');
    setVehicleResults([]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON'
    }).format(amount);
  };

  const handleCreateQuote = () => {
    if (selectedVehicle && selectedClient && onCreateQuote) {
      onCreateQuote(selectedClient, selectedVehicle);
    }
  };

  return (
    <div className="space-y-6">

      {/* Search Controls - consistent cu SearchTab */}
      <div className="bg-white dark:bg-gray-900 rounded-none p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Căutați după VIN, număr înmatriculare, marcă..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setVehicleResults([]);
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Rezultate căutare - consistent cu SearchTab */}
      <AnimatePresence>
        {vehicleResults.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {vehicleResults.length} vehicul{vehicleResults.length > 1 ? 'e' : ''} găsit{vehicleResults.length > 1 ? 'e' : ''}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vehicleResults.map((vehicle) => {
                  const client = getClient(vehicle.clientId);
                  return (
                    <motion.div
                      key={vehicle.licensePlate}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => handleVehicleSelect(vehicle)}
                      className="bg-white dark:bg-gray-900 rounded-none border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <div className="w-8 h-8 rounded-none flex items-center justify-center mr-3" style={{backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)'}}>
                              <Car className="w-4 h-4" style={{color: 'var(--color-primary)'}} />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {vehicle.marca} {vehicle.model}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {getDisplayLicensePlate(vehicle.licensePlate)} • {vehicle.anFabricatie}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-1 text-sm ml-11">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">KM:</span>
                              <span className="font-medium text-gray-900 dark:text-white ml-1">{vehicle.lastKm || 'N/A'}</span>
                            </div>
                            {client && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Client:</span>
                                <span className="font-medium text-blue-600 dark:text-blue-400 ml-1">{client.nume}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300">
                            {vehicle.serviceHistory?.length}  {vehicle.serviceHistory?.length == 1 ? "serviciu" : 'servicii'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conținut principal - consistent cu restul tab-urilor */}
      <AnimatePresence mode="wait">
        {selectedVehicle && selectedClient ? (
          <motion.div
            key="selected"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
              {/* Header cu buton pentru crearea devizului */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {selectedVehicle.marca} {selectedVehicle.model}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {getDisplayLicensePlate(selectedVehicle.licensePlate)} • {selectedClient.nume}
                  </p>
                </div>
                
                {onCreateQuote && (
                  <button
                    onClick={handleCreateQuote}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-none text-sm font-medium text-white shadow-md hover:shadow-lg transition-all duration-200 transform "
                    style={{
                      background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-600))',
                      borderColor: 'var(--color-primary)',
                      border: '1px solid'
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Creează Deviz Nou</span>
                  </button>
                )}
              </div>

              {/* Informații vehicul și client - layout clean */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card vehicul - cu background distinct */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-none border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    <Car className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Vehicul</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">
                        {selectedVehicle.marca} {selectedVehicle.model}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">{selectedVehicle.anFabricatie}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Număr înmatriculare</span>
                        <span className="font-medium text-gray-900 dark:text-white">{getDisplayLicensePlate(selectedVehicle.licensePlate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">VIN</span>
                        <span className="font-mono text-xs text-gray-700 dark:text-gray-300">{selectedVehicle.vin}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Culoare</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedVehicle.culoare}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Capacitate cilindrică</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedVehicle.capacitateCilindrica}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Ultimii KM înregistrați</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedVehicle.lastKm || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Data adăugării</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {new Date(selectedVehicle.dateAdded).toLocaleDateString('ro-RO')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card client - cu background distinct */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-none border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Client</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">{selectedClient.nume}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">CNP/CUI: {selectedClient.cuiCnp}</p>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2" />
                        <span className="text-gray-900 dark:text-white">{selectedClient.numarTelefon}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Locație:</span>
                        <p className="text-gray-900 dark:text-white mt-1">{selectedClient.locatie}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Strada:</span>
                        <p className="text-gray-900 dark:text-white mt-1">{selectedClient.strada}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Client din:</span>
                        <p className="text-gray-900 dark:text-white mt-1">
                          {new Date(selectedClient.dateCreated).toLocaleDateString('ro-RO')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Istoricul serviciilor - cu background distinct */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-none border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Istoric Servicii ({serviceHistory.length})
                  </h3>
                </div>
                
                {serviceHistory.length > 0 ? (
                  <div className="space-y-3 p-6">
                    {serviceHistory.map((record) => (
                      <div key={record.id} className="bg-white dark:bg-gray-900 rounded-none border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow duration-200">
                        <div 
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => setExpandedRecord(expandedRecord === record.id ? null : record.id)}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                              {expandedRecord === record.id ? (
                                <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                Deviz #{record.series}
                              </p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                <span className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-1" />
                                  {formatDate(record.date)}
                                </span>
                                {record.km && (
                                  <span>KM: {record.km}</span>
                                )}
                                {record.motivIntrare && (
                                  <span>Motiv: {record.motivIntrare}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(record.totalDevis)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Total
                            </p>
                          </div>
                        </div>

                        <AnimatePresence mode="wait">
                          {expandedRecord === record.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ 
                                opacity: 1, 
                                height: 'auto',
                                transition: { 
                                  duration: 0.3,
                                  ease: [0.4, 0.0, 0.2, 1]
                                }
                              }}
                              exit={{ 
                                opacity: 0, 
                                height: 0,
                                transition: { 
                                  duration: 0.2,
                                  ease: [0.4, 0.0, 1, 1]
                                }
                              }}
                              style={{ overflow: 'visible' }}
                              className="mt-4"
                            >
                              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-none">
                                {/* Verificăm dacă există piese sau manoperă pentru a afișa layout-ul corect */}
                                {((record.parts && record.parts.length > 0) || (record.labor && record.labor.length > 0)) ? (
                                  <div className={`grid gap-6 ${
                                    (record.parts && record.parts.length > 0) && (record.labor && record.labor.length > 0) 
                                      ? 'grid-cols-1 md:grid-cols-2 md:divide-x md:divide-gray-200 dark:md:divide-gray-600' 
                                      : 'grid-cols-1'
                                  }`}>
                                    {/* Piese */}
                                    {record.parts && record.parts.length > 0 && (
                                      <div className="md:pr-6">
                                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Piese utilizate</h4>
                                        <div className="space-y-2">
                                          {record.parts.map((part, index) => (
                                            <div key={index} className="flex justify-between text-sm py-1">
                                              <span className="text-gray-600 dark:text-gray-400">{part.numePiesa} x{part.bucati}</span>
                                              <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(part.pretTotal)}</span>
                                            </div>
                                          ))}
                                          <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-3">
                                            <div className="flex justify-between text-sm font-semibold">
                                              <span className="text-gray-700 dark:text-gray-300">Total piese:</span>
                                              <span className="text-gray-900 dark:text-white">{formatCurrency(record.totalPiese)}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Manoperă */}
                                    {record.labor && record.labor.length > 0 && (
                                      <div className="md:pl-6">
                                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Manoperă</h4>
                                        <div className="space-y-2">
                                          {record.labor.map((labor, index) => (
                                            <div key={index} className="flex justify-between text-sm py-1">
                                              <span className="text-gray-600 dark:text-gray-400">{labor.manopera} ({labor.durata})</span>
                                              <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(labor.pretTotal)}</span>
                                            </div>
                                          ))}
                                          <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-3">
                                            <div className="flex justify-between text-sm font-semibold">
                                              <span className="text-gray-700 dark:text-gray-300">Total manoperă:</span>
                                              <span className="text-gray-900 dark:text-white">{formatCurrency(record.totalManopera)}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-center py-8">
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                                      Nu există piese sau manoperă înregistrate pentru acest serviciu.
                                    </p>
                                  </div>
                                )}
                              
                              {!record.observatii && (
                                <div className="mt-0 py-4  text-gray-500 dark:text-gray-400">
                                  <h4 className="font-medium">Fară alte observații</h4>
                                </div>
                              )}
                                {/* Observații */}
                                {record.observatii && (
                                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600 pb-4">
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Observații</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{record.observatii}</p>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-none flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Nu există istoric de servicii
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Acest vehicul nu are încă servicii înregistrate în sistem.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-none flex items-center justify-center mx-auto mb-6">
                <Search className="w-12 h-12 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                Căutați un vehicul
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Pentru a vizualiza istoricul serviciilor, căutați un vehicul folosind VIN-ul, 
                numărul de înmatriculare sau marca.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
};

export default ServiceHistoryViewer;