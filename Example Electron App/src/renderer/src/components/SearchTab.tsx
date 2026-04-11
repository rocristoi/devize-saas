import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Car, ChevronDown, Plus, History } from 'lucide-react';
import { StoredClient, StoredVehicle } from '../types';
import { searchClients, searchVehiclesByLicensePlate, getClient, getVehiclesByClient } from '../utils/clientVehicleStorage';
import { getDisplayLicensePlate } from '../utils/licensePlateUtils';

interface SearchTabProps {
  onClientSelect: (client: StoredClient) => void;
  onClientVehicleSelect: (client: StoredClient, vehicle: StoredVehicle) => void;
  onViewHistory: (vehicle: StoredVehicle) => void;
  initialState?: {
    searchQuery: string;
    searchType: 'clients' | 'vehicles';
    expandedClient: string | null;
  };
  onStateChange?: (state: {
    searchQuery: string;
    searchType: 'clients' | 'vehicles';
    expandedClient: string | null;
  }) => void;
}

const SearchTab: React.FC<SearchTabProps> = ({ 
  onClientSelect, 
  onClientVehicleSelect, 
  onViewHistory, 
  initialState,
  onStateChange 
}) => {
  const [searchQuery, setSearchQuery] = useState(initialState?.searchQuery || '');
  const [searchType, setSearchType] = useState<'clients' | 'vehicles'>(initialState?.searchType || 'clients');
  const [clients, setClients] = useState<StoredClient[]>([]);
  const [vehicles, setVehicles] = useState<StoredVehicle[]>([]);
  const [expandedClient, setExpandedClient] = useState<string | null>(initialState?.expandedClient || null);

  // Notify parent of state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        searchQuery,
        searchType,
        expandedClient
      });
    }
  }, [searchQuery, searchType, expandedClient, onStateChange]);

  // Load initial data when switching tabs
  useEffect(() => {
    if (searchType === 'clients') {
      const allClients = searchClients('');
      setClients(allClients);
      setVehicles([]); // Clear vehicles when switching to clients
    } else if (searchType === 'vehicles') {
      const allVehicles = searchVehiclesByLicensePlate('');
      setVehicles(allVehicles);
      setClients([]); // Clear clients when switching to vehicles
    }
  }, [searchType]);

  // Search functionality
  useEffect(() => {
    if (searchType === 'clients') {
      const results = searchClients(searchQuery);
      setClients(results);
    } else if (searchType === 'vehicles') {
      const results = searchVehiclesByLicensePlate(searchQuery);
      setVehicles(results);
    }
  }, [searchQuery, searchType]);

  const handleClientClick = (client: StoredClient) => {
    // Toggle expanded state for client vehicles
    setExpandedClient(expandedClient === client.id ? null : client.id);
  };

  const handleClientSelect = (client: StoredClient) => {
    onClientSelect(client);
  };

  const handleVehicleSelect = (vehicle: StoredVehicle) => {
    const client = getClient(vehicle.clientId);
    if (client) {
      onClientVehicleSelect(client, vehicle);
    }
  };

  const handleViewHistory = (vehicle: StoredVehicle) => {
    onViewHistory(vehicle);
  };

  const getClientVehicles = (clientId: string): StoredVehicle[] => {
    return getVehiclesByClient(clientId);
  };

  const getClientByVehicle = (vehicle: StoredVehicle): StoredClient | null => {
    return getClient(vehicle.clientId);
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Căutare Client/Vehicul
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Căutați clienți sau vehicule pentru a crea un deviz nou
        </p>
      </div>

      {/* Search Controls */}
      <div className="bg-white dark:bg-gray-900 rounded-none p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Type Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-none p-1">
            <button
              onClick={() => setSearchType('clients')}
              className={`flex items-center gap-2 px-4 py-2 rounded-none text-sm font-medium transition-all duration-200 ${
                searchType === 'clients'
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <User size={16} />
              Clienți
            </button>
            <button
              onClick={() => setSearchType('vehicles')}
              className={`flex items-center gap-2 px-4 py-2 rounded-none text-sm font-medium transition-all duration-200 ${
                searchType === 'vehicles'
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Car size={16} />
              Vehicule
            </button>
          </div>

          {/* Search Input */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={
                searchType === 'clients'
                  ? 'Căutați clienți după nume, CNP/CUI sau telefon...'
                  : 'Căutați vehicule după număr înmatriculare, marcă sau model...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {searchType === 'clients' ? (
          /* Client Results */
          <div className="space-y-3">
            {clients.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {searchQuery ? 'Nu au fost găsiți clienți care să corespundă căutării.' : 'Nu există clienți în baza de date.'}
              </div>
            ) : (
               clients.map((client, index) => {
                 const clientVehicles = getClientVehicles(client.id);
                 const isExpanded = expandedClient === client.id;
                 
                 return (
                   <motion.div
                     key={client.id}
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     transition={{ 
                       delay: index * 0.05, 
                       duration: 0.2,
                       ease: [0.4, 0.0, 0.2, 1]
                     }}
                     className="bg-white dark:bg-gray-900 rounded-none border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200"
                   >
                    <div 
                      className="p-4 cursor-pointer"
                      onClick={() => handleClientClick(client)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {client.nume}
                            </h3>
                             <motion.button 
                               className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                               whileTap={{ scale: 0.9 }}
                             >
                               <motion.div
                                 animate={{ rotate: isExpanded ? 180 : 0 }}
                                 transition={{ duration: 0.2, ease: [0.4, 0.0, 0.2, 1] }}
                               >
                                 <ChevronDown size={16} />
                               </motion.div>
                             </motion.button>
                          </div>
                          <div className="mt-1 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            {client.cuiCnp && (
                              <p><span className="font-medium">CNP/CUI:</span> {client.cuiCnp}</p>
                            )}
                            {client.numarTelefon && (
                              <p><span className="font-medium">Telefon:</span> {client.numarTelefon}</p>
                            )}
                            {client.locatie && (
                              <p><span className="font-medium">Locație:</span> {client.locatie}</p>
                            )}
                            <p><span className="font-medium">Vehicule:</span> {clientVehicles.length}</p>
                          </div>
                        </div>
                         <motion.div 
                           className="flex items-center gap-2"
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           transition={{ delay: 0.1 + (index * 0.05), duration: 0.15 }}
                         >
                           <motion.button
                             className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-none text-sm font-medium hover:bg-blue-700 transition-colors"
                             onClick={(e) => {
                               e.stopPropagation();
                               handleClientSelect(client);
                             }}
                             whileTap={{ scale: 0.95 }}
                           >
                             <Plus size={16} className="inline mr-1" />
                             Deviz Nou
                           </motion.button>
                         </motion.div>
                      </div>
                    </div>
                    
                     {/* Vehicle Dropdown */}
                     <AnimatePresence>
                       {isExpanded && clientVehicles.length > 0 && (
                         <motion.div
                           initial={{ height: 0, opacity: 0 }}
                           animate={{ height: 'auto', opacity: 1 }}
                           exit={{ height: 0, opacity: 0 }}
                           transition={{ 
                             duration: 0.2, 
                             ease: [0.4, 0.0, 0.2, 1],
                             opacity: { duration: 0.1 }
                           }}
                           className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-hidden"
                         >
                           <motion.div 
                             className="p-4 space-y-3"
                             initial={{ y: -20 }}
                             animate={{ y: 0 }}
                             transition={{ delay: 0.05, duration: 0.1 }}
                           >
                             <motion.h4 
                               className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3"
                               initial={{ opacity: 0, x: -10 }}
                               animate={{ opacity: 1, x: 0 }}
                               transition={{ delay: 0.08, duration: 0.1 }}
                             >
                               Vehiculele clientului:
                             </motion.h4>
                             <div className="space-y-3">
                               {clientVehicles.map((vehicle, index) => (
                                 <motion.div
                                   key={vehicle.licensePlate}
                                   initial={{ opacity: 0, scale: 0.95 }}
                                   animate={{ opacity: 1, scale: 1 }}
                                   transition={{ 
                                     delay: 0.1 + (index * 0.05), 
                                     duration: 0.15,
                                     ease: [0.4, 0.0, 0.2, 1]
                                   }}
                                   className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-none border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
                                 >
                               <div className="flex-1">
                                 <div className="flex items-center gap-3 mb-2">
                                   <h5 className="font-medium text-gray-900 dark:text-gray-100 text-base">
                                     {vehicle.marca} {vehicle.model}
                                   </h5>
                                 </div>
                                 <div className="flex items-center gap-3 mb-1">
                                   <div className="flex items-center border-[1px] border-gray-300 dark:border-gray-600 overflow-hidden h-7 bg-white dark:bg-gray-800 shadow-sm rounded-none" style={{ minWidth: 0 }}>
                                     <div className="h-full bg-[#003399] flex flex-col items-center justify-center text-white font-bold px-2">
                                       <span className="text-xs">RO</span>
                                     </div>
                                     <div className="px-2 flex items-center justify-center font-semibold text-gray-800 dark:text-gray-200 text-sm tracking-wide whitespace-nowrap">
                                       {getDisplayLicensePlate(vehicle.licensePlate)}
                                     </div>
                                   </div>
                                   <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                     <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-none border border-gray-200 dark:border-gray-600">
                                       {vehicle.anFabricatie || 'N/A'}
                                     </span>
                                     {vehicle.lastKm && (
                                       <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-none border border-gray-200 dark:border-gray-600">
                                         {vehicle.lastKm} km
                                       </span>
                                     )}
                                   </div>
                                 </div>
                              </div>
                                 <motion.div 
                                   className="flex items-center gap-2"
                                   initial={{ opacity: 0, x: 20 }}
                                   animate={{ opacity: 1, x: 0 }}
                                   transition={{ delay: 0.15 + (index * 0.05), duration: 0.1 }}
                                 >
                                   <motion.button
                                     className="px-3 py-1 bg-green-600 text-white flex items-center rounded-none text-sm font-medium hover:bg-green-700 transition-colors"
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       handleVehicleSelect(vehicle);
                                     }}
                                     whileTap={{ scale: 0.95 }}
                                   >
                                     <Plus size={14} className="inline mr-1" />
                                     Deviz
                                   </motion.button>
                                   <motion.button
                                     className="px-3 py-1 bg-gray-600 text-white flex items-center rounded-none text-sm font-medium hover:bg-gray-700 transition-colors"
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       handleViewHistory(vehicle);
                                     }}
                                     whileTap={{ scale: 0.95 }}
                                   >
                                     <History size={14} className="inline mr-1" />
                                     Istoric
                                   </motion.button>
                                 </motion.div>
                               </motion.div>
                               ))}
                             </div>
                           </motion.div>
                         </motion.div>
                       )}
                     </AnimatePresence>
                   </motion.div>
                );
              })
            )}
          </div>
        ) : (
          /* Vehicle Results */
          <div className="space-y-3">
            {vehicles.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {searchQuery ? 'Nu au fost găsite vehicule care să corespundă căutării.' : 'Nu există vehicule în baza de date.'}
              </div>
            ) : (
               vehicles.map((vehicle, index) => {
                 const client = getClientByVehicle(vehicle);
                 return (
                   <motion.div
                     key={vehicle.licensePlate}
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     transition={{ 
                       delay: index * 0.05, 
                       duration: 0.2,
                       ease: [0.4, 0.0, 0.2, 1]
                     }}

                     className="bg-white dark:bg-gray-900 rounded-none border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all duration-200"
                   >
                     <div className="flex items-center justify-between">
                       <div className="flex-1">
                         <div className="flex items-center gap-3 mb-3">
                           <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                             {vehicle.marca} {vehicle.model}
                           </h3>
                           <div className="flex items-center border-[1px] border-gray-300 dark:border-gray-600 overflow-hidden w-32 h-7 bg-white dark:bg-gray-800 shadow-sm rounded-none">
                             <div className="w-[25%] h-full bg-[#003399] flex flex-col items-center justify-center text-white font-bold">
                               <span className="text-xs">RO</span>
                             </div>
                             <div className="flex-1 flex items-center justify-center font-semibold text-gray-800 dark:text-gray-200 text-sm tracking-wide">
                               {getDisplayLicensePlate(vehicle.licensePlate)}
                             </div>
                           </div>
                         </div>
                         <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                           {client && (
                             <div className="flex items-center gap-1">
                               <User size={14} />
                               <span className="font-medium">{client.nume}</span>
                             </div>
                           )}
                           <div className="flex items-center gap-2">
                             {vehicle.anFabricatie && (
                               <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-none text-xs border border-gray-200 dark:border-gray-600">
                                 {vehicle.anFabricatie}
                               </span>
                             )}
                             {vehicle.capacitateCilindrica && (
                               <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-none text-xs border border-gray-200 dark:border-gray-600">
                                 {vehicle.capacitateCilindrica}
                               </span>
                             )}
                             {vehicle.culoare && (
                               <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-none text-xs border border-gray-200 dark:border-gray-600">
                                 {vehicle.culoare}
                               </span>
                             )}
                           </div>
                         </div>
                       </div>
                      <motion.div 
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + (index * 0.05), duration: 0.15 }}
                      >
                        <motion.button
                          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-none text-sm font-medium hover:bg-green-700 transition-colors"
                          onClick={() => handleVehicleSelect(vehicle)}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Plus size={16} className="inline mr-1" />
                          Deviz Nou
                        </motion.button>
                        <motion.button
                          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-none text-sm font-medium hover:bg-gray-700 transition-colors"
                          onClick={() => handleViewHistory(vehicle)}

                          whileTap={{ scale: 0.95 }}
                        >
                          <History size={16} className="inline mr-1" />
                          Istoric
                        </motion.button>
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchTab;
