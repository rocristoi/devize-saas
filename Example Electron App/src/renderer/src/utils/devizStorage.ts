import { StoredDeviz, DevizDatabase, ClientInfo, VehicleInfo, Part, Labor } from '../types';
import { getDatabase as getClientVehicleDB, saveDatabase as saveClientVehicleDB } from './clientVehicleStorage';

const DEVIZ_DB_KEY = 'devizDatabase';

// Initialize empty database structure
const initializeDatabase = (): DevizDatabase => ({
  devizes: {},
  lastUpdated: new Date().toISOString()
});

// Get the entire deviz database from localStorage
export const getDevizDatabase = (): DevizDatabase => {
  try {
    const stored = localStorage.getItem(DEVIZ_DB_KEY);
    if (!stored) {
      console.log('No deviz database found, initializing new database');
      const newDb = initializeDatabase();
      saveDevizDatabase(newDb);
      return newDb;
    }
    
    const parsed = JSON.parse(stored);
    
    // Validate parsed database structure
    if (!parsed.devizes) {
      console.warn('Invalid deviz database structure found, reinitializing');
      const newDb = initializeDatabase();
      saveDevizDatabase(newDb);
      return newDb;
    }
    
    // Ensure all required fields exist
    if (!parsed.lastUpdated) {
      parsed.lastUpdated = new Date().toISOString();
    }
    
    console.log('Deviz database loaded successfully');
    return parsed;
  } catch (error) {
    console.error('Error loading deviz database:', error);
    console.log('Initializing new deviz database due to error');
    const newDb = initializeDatabase();
    try {
      saveDevizDatabase(newDb);
    } catch (saveError) {
      console.error('Critical error: Cannot save new deviz database:', saveError);
    }
    return newDb;
  }
};

// Save the entire deviz database to localStorage
export const saveDevizDatabase = (database: DevizDatabase): void => {
  try {
    // Validate database structure before saving
    if (!database || typeof database !== 'object') {
      throw new Error('Invalid deviz database structure');
    }
    
    if (!database.devizes || typeof database.devizes !== 'object') {
      throw new Error('Invalid devizes structure in database');
    }
    
    database.lastUpdated = new Date().toISOString();
    
    // Try to stringify to catch circular references or other issues
    const jsonString = JSON.stringify(database);
    
    // Check if the JSON string is too large (localStorage has limits)
    if (jsonString.length > 5000000) { // 5MB limit
      console.warn('Deviz database size is very large, consider cleanup');
    }
    
    localStorage.setItem(DEVIZ_DB_KEY, jsonString);
    console.log('Deviz database saved successfully');
  } catch (error) {
    console.error('Error saving deviz database:', error);
    const errorMessage = typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message: string }).message
      : String(error);
    throw new Error(`Failed to save deviz database: ${errorMessage}`);
  }
};

// Save or update a deviz
export const saveDeviz = (
  series: string,
  clientInfo: ClientInfo,
  vehicleInfo: VehicleInfo,
  parts: Part[],
  labor: Labor[],
  totals: { totalPiese: number; totalManopera: number; totalDevis: number }
): StoredDeviz => {
  // Validate required fields
  if (!series || !series.trim()) {
    throw new Error('Seria devizului este obligatorie');
  }
  
  const database = getDevizDatabase();
  
  const storedDeviz: StoredDeviz = {
    series: series.trim(),
    timestamp: new Date().toISOString(),
    clientInfo: { ...clientInfo },
    vehicleInfo: { ...vehicleInfo },
    parts: parts.map(part => ({ ...part })),
    labor: labor.map(lab => ({ ...lab })),
    totalPiese: totals.totalPiese,
    totalManopera: totals.totalManopera,
    totalDevis: totals.totalDevis
  };
  
  database.devizes[series.trim()] = storedDeviz;
  saveDevizDatabase(database);
  
  console.log(`Deviz ${series} saved successfully`);
  return storedDeviz;
};

// Update an existing deviz and synchronize with service records
export const updateDeviz = (
  series: string,
  clientInfo: ClientInfo,
  vehicleInfo: VehicleInfo,
  parts: Part[],
  labor: Labor[],
  totals: { totalPiese: number; totalManopera: number; totalDevis: number }
): StoredDeviz => {
  // Validate required fields
  if (!series || !series.trim()) {
    throw new Error('Seria devizului este obligatorie');
  }
  
  const database = getDevizDatabase();
  
  // Check if deviz exists
  if (!database.devizes[series.trim()]) {
    console.warn(`Deviz ${series} does not exist, creating new one`);
  }
  
  // Update deviz in deviz database
  const storedDeviz: StoredDeviz = {
    series: series.trim(),
    timestamp: database.devizes[series.trim()]?.timestamp || new Date().toISOString(),
    clientInfo: { ...clientInfo },
    vehicleInfo: { ...vehicleInfo },
    parts: parts.map(part => ({ ...part })),
    labor: labor.map(lab => ({ ...lab })),
    totalPiese: totals.totalPiese,
    totalManopera: totals.totalManopera,
    totalDevis: totals.totalDevis
  };
  
  database.devizes[series.trim()] = storedDeviz;
  saveDevizDatabase(database);
  
  // Synchronize with service records
  try {
    updateServiceRecordBySeries(series.trim(), clientInfo, vehicleInfo, parts, labor, totals);
  } catch (error) {
    console.error('Error synchronizing service record:', error);
    // Don't throw error, deviz was saved successfully
  }
  
  console.log(`Deviz ${series} updated successfully`);
  return storedDeviz;
};

// Update service record by series number
const updateServiceRecordBySeries = (
  series: string,
  clientInfo: ClientInfo,
  vehicleInfo: VehicleInfo,
  parts: Part[],
  labor: Labor[],
  totals: { totalPiese: number; totalManopera: number; totalDevis: number }
): void => {
  const clientVehicleDB = getClientVehicleDB();
  
  // Find the vehicle by license plate
  const licensePlate = vehicleInfo.numarInmatriculare.trim().toUpperCase();
  const vehicle = clientVehicleDB.vehicles[licensePlate];
  
  if (!vehicle) {
    console.warn(`Vehicle ${licensePlate} not found in database, cannot update service record`);
    return;
  }
  
  // Find the service record by series
  const recordIndex = vehicle.serviceHistory.findIndex(record => record.series === series);
  
  if (recordIndex === -1) {
    console.warn(`Service record with series ${series} not found for vehicle ${licensePlate}`);
    return;
  }
  
  // Update the service record
  vehicle.serviceHistory[recordIndex] = {
    ...vehicle.serviceHistory[recordIndex],
    km: vehicleInfo.km?.trim() || vehicle.serviceHistory[recordIndex].km,
    motivIntrare: clientInfo.motivIntrare.trim(),
    observatii: clientInfo.observatii?.trim() || '',
    parts: parts.map(part => ({ ...part })),
    labor: labor.map(lab => ({ ...lab })),
    totalPiese: totals.totalPiese,
    totalManopera: totals.totalManopera,
    totalDevis: totals.totalDevis,
    nivelCarburant: vehicleInfo.nivelCarburant?.trim() || '',
    dataIntrare: clientInfo.dataIntrare || '',
    dataIesire: clientInfo.dataIesire || ''
  };
  
  // Update vehicle's lastKm if provided
  if (vehicleInfo.km && vehicleInfo.km.trim()) {
    const kmValue = parseInt(vehicleInfo.km.trim());
    if (!isNaN(kmValue) && kmValue > 0) {
      vehicle.lastKm = vehicleInfo.km.trim();
    }
  }
  
  clientVehicleDB.vehicles[licensePlate] = vehicle;
  saveClientVehicleDB(clientVehicleDB);
  
  console.log(`Service record with series ${series} updated successfully`);
};

// Get all devizes sorted by timestamp (newest first)
export const getAllDevizes = (): StoredDeviz[] => {
  const database = getDevizDatabase();
  const devizes: StoredDeviz[] = [];
  
  for (const key in database.devizes) {
    if (database.devizes.hasOwnProperty(key)) {
      devizes.push(database.devizes[key]);
    }
  }
  
  return devizes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// Get a specific deviz by series
export const getDevizBySeries = (series: string): StoredDeviz | null => {
  const database = getDevizDatabase();
  return database.devizes[series.trim()] || null;
};

// Delete a deviz from history and remove from service records
export const deleteDeviz = (series: string): boolean => {
  try {
    const database = getDevizDatabase();
    
    if (!database.devizes[series.trim()]) {
      console.warn(`Deviz ${series} does not exist`);
      return false;
    }
    
    const deviz = database.devizes[series.trim()];
    
    // Delete from deviz database
    delete database.devizes[series.trim()];
    saveDevizDatabase(database);
    
    // Also delete from service records if vehicle exists
    try {
      const clientVehicleDB = getClientVehicleDB();
      const licensePlate = deviz.vehicleInfo.numarInmatriculare.trim().toUpperCase();
      const vehicle = clientVehicleDB.vehicles[licensePlate];
      
      if (vehicle) {
        // Find and remove the service record with matching series
        const recordIndex = vehicle.serviceHistory.findIndex(record => record.series === series.trim());
        
        if (recordIndex !== -1) {
          vehicle.serviceHistory.splice(recordIndex, 1);
          clientVehicleDB.vehicles[licensePlate] = vehicle;
          saveClientVehicleDB(clientVehicleDB);
          console.log(`Service record with series ${series} also deleted from vehicle ${licensePlate}`);
        }
      }
    } catch (serviceError) {
      console.warn('Error deleting service record:', serviceError);
      // Don't fail the entire operation if service record deletion fails
    }
    
    console.log(`Deviz ${series} deleted successfully from all storage locations`);
    return true;
  } catch (error) {
    console.error('Error deleting deviz:', error);
    return false;
  }
};

// Search devizes by client name, vehicle info, or series
export const searchDevizes = (query: string): StoredDeviz[] => {
  const allDevizes = getAllDevizes();
  const lowerQuery = query.toLowerCase();
  
  return allDevizes.filter(deviz =>
    deviz.series.includes(query) ||
    deviz.clientInfo.nume.toLowerCase().includes(lowerQuery) ||
    deviz.vehicleInfo.marca.toLowerCase().includes(lowerQuery) ||
    deviz.vehicleInfo.model.toLowerCase().includes(lowerQuery) ||
    deviz.vehicleInfo.numarInmatriculare.toUpperCase().includes(query.toUpperCase()) ||
    `${deviz.vehicleInfo.marca} ${deviz.vehicleInfo.model}`.toLowerCase().includes(lowerQuery)
  );
};

// Export database
export const exportDevizDatabase = (): string => {
  const database = getDevizDatabase();
  return JSON.stringify(database, null, 2);
};

// Import database
export const importDevizDatabase = (jsonData: string): boolean => {
  try {
    const database = JSON.parse(jsonData) as DevizDatabase;
    // Validate structure
    if (!database.devizes) {
      throw new Error('Invalid deviz database structure');
    }
    saveDevizDatabase(database);
    return true;
  } catch (error) {
    console.error('Error importing deviz database:', error);
    return false;
  }
};

// Clear database
export const clearDevizDatabase = (): void => {
  localStorage.removeItem(DEVIZ_DB_KEY);
};

