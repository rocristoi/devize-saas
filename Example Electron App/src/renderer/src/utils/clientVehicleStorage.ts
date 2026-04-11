import { StoredClient, StoredVehicle, ServiceRecord, ClientVehicleDatabase, ClientInfo, VehicleInfo, Part, Labor } from '../types';

const CLIENT_VEHICLE_DB_KEY = 'clientVehicleDatabase';

// Generate a unique client ID from name and phone number
const generateClientIdFromName = (name: string, phoneNumber: string): string => {
  // Clean and normalize the name
  const cleanName = name
    .toLowerCase()
    .trim()
    .replace(/[^a-zăâîșț]/g, '') // Remove non-letters, keep Romanian characters
    .replace(/\s+/g, ''); // Remove all spaces
  
  // Clean phone number (remove spaces, dashes, etc.)
  const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  return `${cleanName}_${cleanPhone}`;
};

// Initialize empty database structure
const initializeDatabase = (): ClientVehicleDatabase => ({
  clients: {},
  vehicles: {},
  lastUpdated: new Date().toISOString()
});

// Get the entire database from localStorage
export const getDatabase = (): ClientVehicleDatabase => {
  try {
    const stored = localStorage.getItem(CLIENT_VEHICLE_DB_KEY);
    if (!stored) {
      console.log('No database found, initializing new database');
      const newDb = initializeDatabase();
      saveDatabase(newDb);
      return newDb;
    }
    
    const parsed = JSON.parse(stored);
    
    // Validate parsed database structure
    if (!parsed.clients || !parsed.vehicles) {
      console.warn('Invalid database structure found, reinitializing');
      const newDb = initializeDatabase();
      saveDatabase(newDb);
      return newDb;
    }
    
    // Ensure all required fields exist
    if (!parsed.lastUpdated) {
      parsed.lastUpdated = new Date().toISOString();
    }
    
    console.log('Database loaded successfully');
    return parsed;
  } catch (error) {
    console.error('Error loading database:', error);
    console.log('Initializing new database due to error');
    const newDb = initializeDatabase();
    try {
      saveDatabase(newDb);
    } catch (saveError) {
      console.error('Critical error: Cannot save new database:', saveError);
    }
    return newDb;
  }
};

// Save the entire database to localStorage
export const saveDatabase = (database: ClientVehicleDatabase): void => {
  try {
    // Validate database structure before saving
    if (!database || typeof database !== 'object') {
      throw new Error('Invalid database structure');
    }
    
    if (!database.clients || typeof database.clients !== 'object') {
      throw new Error('Invalid clients structure in database');
    }
    
    if (!database.vehicles || typeof database.vehicles !== 'object') {
      throw new Error('Invalid vehicles structure in database');
    }
    
    database.lastUpdated = new Date().toISOString();
    
    // Try to stringify to catch circular references or other issues
    const jsonString = JSON.stringify(database);
    
    // Check if the JSON string is too large (localStorage has limits)
    if (jsonString.length > 5000000) { // 5MB limit
      console.warn('Database size is very large, consider cleanup');
    }
    
    localStorage.setItem(CLIENT_VEHICLE_DB_KEY, jsonString);
    console.log('Database saved successfully');
  } catch (error) {
    console.error('Error saving database:', error);
    const errorMessage = typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message: string }).message
      : String(error);
    throw new Error(`Failed to save database: ${errorMessage}`);
  }
};

// Client management functions
export const saveClient = (clientInfo: ClientInfo): StoredClient => {
  // Robust validation
  if (!clientInfo.nume || !clientInfo.nume.trim()) {
    throw new Error('Numele clientului este obligatoriu');
  }
  
  if (!clientInfo.numarTelefon || !clientInfo.numarTelefon.trim()) {
    throw new Error('Numărul de telefon este obligatoriu');
  }

  const database = getDatabase();
  
  // Always generate ID from name + phone number
  const clientId = generateClientIdFromName(clientInfo.nume, clientInfo.numarTelefon);
  console.log(`Generated client ID from name + phone: ${clientId}`);
  
  const storedClient: StoredClient = {
    id: clientId,
    nume: clientInfo.nume.trim(),
    cuiCnp: clientInfo.cuiCnp?.trim() || '', // Keep for display purposes only
    locatie: clientInfo.locatie.trim(),
    strada: clientInfo.strada.trim(),
    numarTelefon: clientInfo.numarTelefon.trim(),
    dateCreated: database.clients[clientId]?.dateCreated || new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    vehicles: database.clients[clientId]?.vehicles || []
  };
  
  database.clients[clientId] = storedClient;
  saveDatabase(database);
  return storedClient;
};

export const getClient = (clientId: string): StoredClient | null => {
  const database = getDatabase();
  return database.clients[clientId] || null;
};

export const getAllClients = (): StoredClient[] => {
  const database = getDatabase();
  const clients: StoredClient[] = [];
  for (const key in database.clients) {
    if (database.clients.hasOwnProperty(key)) {
      clients.push(database.clients[key]);
    }
  }
  return clients.sort((a, b) => a.nume.localeCompare(b.nume));
};

export const searchClients = (query: string): StoredClient[] => {
  const clients = getAllClients();
  const lowerQuery = query.toLowerCase();
  return clients.filter(client => 
    client.nume.toLowerCase().indexOf(lowerQuery) !== -1 ||
    client.numarTelefon.indexOf(query) !== -1
    // Note: CNP/CUI removed from search to avoid identification conflicts
  );
};

// Vehicle management functions
export const saveVehicle = (vehicleInfo: VehicleInfo, clientId: string): StoredVehicle => {
  // Robust validation
  if (!vehicleInfo.numarInmatriculare || !vehicleInfo.numarInmatriculare.trim()) {
    throw new Error('Numărul de înmatriculare este obligatoriu pentru salvarea vehiculului');
  }
  
  if (!vehicleInfo.marca || !vehicleInfo.marca.trim()) {
    throw new Error('Marca vehiculului este obligatorie');
  }
  
  if (!vehicleInfo.model || !vehicleInfo.model.trim()) {
    throw new Error('Modelul vehiculului este obligatoriu');
  }
  
  if (!clientId || !clientId.trim()) {
    throw new Error('ID-ul clientului este obligatoriu pentru salvarea vehiculului');
  }

  const database = getDatabase();
  
  // Verify client exists
  if (!database.clients[clientId]) {
    throw new Error(`Clientul cu ID-ul ${clientId} nu există în baza de date`);
  }
  
  const licensePlate = vehicleInfo.numarInmatriculare.trim().toUpperCase();
  
  // Validate license plate format (basic validation)
  if (licensePlate.length < 2) {
    throw new Error('Numărul de înmatriculare trebuie să aibă cel puțin 2 caractere');
  }
  
  // Check if vehicle exists and belongs to a different client
  const existingVehicle = database.vehicles[licensePlate];
  const oldClientId = existingVehicle?.clientId;
  
  const storedVehicle: StoredVehicle = {
    licensePlate: licensePlate,
    vin: vehicleInfo.seriaSasiu?.trim() || '', // VIN is now optional
    marca: vehicleInfo.marca.trim(),
    model: vehicleInfo.model.trim(),
    numarInmatriculare: licensePlate, // Keep for backward compatibility
    capacitateCilindrica: vehicleInfo.capacitateCilindrica.trim(),
    anFabricatie: vehicleInfo.anFabricatie.trim(),
    culoare: vehicleInfo.culoare.trim(),
    clientId: clientId,
    dateAdded: database.vehicles[licensePlate]?.dateAdded || new Date().toISOString(),
    lastKm: vehicleInfo.km?.trim() || database.vehicles[licensePlate]?.lastKm || '',
    serviceHistory: database.vehicles[licensePlate]?.serviceHistory || []
  };
  
  database.vehicles[licensePlate] = storedVehicle;
  
  // Handle vehicle reassignment
  if (oldClientId && oldClientId !== clientId) {
    // Remove vehicle from old client's list
    if (database.clients[oldClientId]) {
      const oldClientVehicles = database.clients[oldClientId].vehicles;
      const vehicleIndex = oldClientVehicles.indexOf(licensePlate);
      if (vehicleIndex !== -1) {
        oldClientVehicles.splice(vehicleIndex, 1);
        console.log(`Removed vehicle ${licensePlate} from old client ${oldClientId}`);
      }
    }
  }
  
  // Add vehicle to new client's vehicle list if not already present
  if (database.clients[clientId] && database.clients[clientId].vehicles.indexOf(licensePlate) === -1) {
    database.clients[clientId].vehicles.push(licensePlate);
    console.log(`Added vehicle ${licensePlate} to new client ${clientId}`);
  }
  
  saveDatabase(database);
  return storedVehicle;
};

export const getVehicle = (licensePlate: string): StoredVehicle | null => {
  const database = getDatabase();
  return database.vehicles[licensePlate.toUpperCase()] || null;
};

export const getVehiclesByClient = (clientId: string): StoredVehicle[] => {
  const database = getDatabase();
  const client = database.clients[clientId];
  if (!client) return [];
  
  return client.vehicles
    .map(licensePlate => database.vehicles[licensePlate])
    .filter(vehicle => vehicle != null);
};

export const searchVehiclesByLicensePlate = (licensePlateQuery: string): StoredVehicle[] => {
  const database = getDatabase();
  const upperQuery = licensePlateQuery.toUpperCase();
  const vehicles: StoredVehicle[] = [];
  for (const key in database.vehicles) {
    if (database.vehicles.hasOwnProperty(key)) {
      vehicles.push(database.vehicles[key]);
    }
  }
  return vehicles.filter(vehicle =>
    vehicle.licensePlate.indexOf(upperQuery) !== -1 ||
    vehicle.numarInmatriculare.toUpperCase().indexOf(upperQuery) !== -1 ||
    vehicle.marca.toLowerCase().indexOf(licensePlateQuery.toLowerCase()) !== -1 ||
    vehicle.model.toLowerCase().indexOf(licensePlateQuery.toLowerCase()) !== -1 ||
    `${vehicle.marca} ${vehicle.model}`.toLowerCase().indexOf(licensePlateQuery.toLowerCase()) !== -1
  );
};

// Keep old function name for backward compatibility
export const searchVehiclesByVin = searchVehiclesByLicensePlate;

// Utility function for duplicate detection
export const isDuplicateServiceRecord = (
  vehicle: StoredVehicle, 
  series: string, 
  timeWindow: number = 300000 // 5 minutes default
): boolean => {
  const now = new Date();
  return vehicle.serviceHistory.some(record => 
    record.series === series.trim() && 
    Math.abs(new Date(record.date).getTime() - now.getTime()) < timeWindow
  );
};

// Service record management
export const addServiceRecord = (
  licensePlate: string,
  clientInfo: ClientInfo,
  vehicleInfo: VehicleInfo,
  parts: Part[],
  labor: Labor[],
  totals: { totalPiese: number; totalManopera: number; totalDevis: number },
  series: string
): ServiceRecord => {
  // Robust validation
  if (!licensePlate || !licensePlate.trim()) {
    throw new Error('Numărul de înmatriculare este obligatoriu pentru salvarea înregistrării de service');
  }
  
  if (!series || !series.trim()) {
    throw new Error('Seria devizului este obligatorie');
  }

  const database = getDatabase();
  const vehicle = database.vehicles[licensePlate.trim().toUpperCase()];
  
  if (!vehicle) {
    throw new Error(`Vehiculul cu numărul de înmatriculare ${licensePlate} nu a fost găsit în baza de date`);
  }
  
  // Check for potential duplicate records using centralized function
  if (isDuplicateServiceRecord(vehicle, series)) {
    console.warn(`Potential duplicate service record detected for series ${series}. Skipping save.`);
    const existingRecord = vehicle.serviceHistory.find(record => 
      record.series === series.trim() && 
      Math.abs(new Date(record.date).getTime() - new Date().getTime()) < 300000
    );
    return existingRecord!; // Return existing record
  }
  
  const serviceRecord: ServiceRecord = {
    id: `${licensePlate.trim().toUpperCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    date: new Date().toISOString(),
    km: vehicleInfo.km?.trim() || '',
    motivIntrare: clientInfo.motivIntrare.trim(),
    observatii: clientInfo.observatii?.trim() || '',
    parts: parts.map(part => ({...part})), // Deep copy
    labor: labor.map(lab => ({...lab})), // Deep copy
    totalPiese: Math.max(0, totals.totalPiese),
    totalManopera: Math.max(0, totals.totalManopera),
    totalDevis: Math.max(0, totals.totalDevis),
    series: series.trim(),
    nivelCarburant: vehicleInfo.nivelCarburant?.trim() || '',
    dataIntrare: clientInfo.dataIntrare || '',
    dataIesire: clientInfo.dataIesire || ''
  };
  
  vehicle.serviceHistory.push(serviceRecord);
  
  // Update vehicle's lastKm if provided and is numeric
  if (vehicleInfo.km && vehicleInfo.km.trim()) {
    const kmValue = parseInt(vehicleInfo.km.trim());
    if (!isNaN(kmValue) && kmValue > 0) {
      vehicle.lastKm = vehicleInfo.km.trim();
    }
  }
  
  database.vehicles[licensePlate.trim().toUpperCase()] = vehicle;
  saveDatabase(database);
  
  console.log(`Service record saved successfully: ${serviceRecord.id}`);
  return serviceRecord;
};

export const getServiceHistory = (licensePlate: string): ServiceRecord[] => {
  const vehicle = getVehicle(licensePlate);
  return vehicle?.serviceHistory || [];
};

// Utility functions
export const exportDatabase = (): string => {
  const database = getDatabase();
  return JSON.stringify(database, null, 2);
};

export const importDatabase = (jsonData: string): boolean => {
  try {
    const database = JSON.parse(jsonData) as ClientVehicleDatabase;
    // Validate structure
    if (!database.clients || !database.vehicles) {
      throw new Error('Invalid database structure');
    }
    saveDatabase(database);
    return true;
  } catch (error) {
    console.error('Error importing database:', error);
    return false;
  }
};

export const clearDatabase = (): void => {
  localStorage.removeItem(CLIENT_VEHICLE_DB_KEY);
};

// Delete functions
export const deleteClient = (clientId: string): boolean => {
  try {
    const database = getDatabase();
    
    if (!database.clients[clientId]) {
      throw new Error(`Clientul cu ID-ul ${clientId} nu există în baza de date`);
    }
    
    const client = database.clients[clientId];
    
    // Delete all vehicles associated with this client
    client.vehicles.forEach(licensePlate => {
      delete database.vehicles[licensePlate];
    });
    
    // Delete the client
    delete database.clients[clientId];
    
    saveDatabase(database);
    console.log(`Client ${clientId} and all associated vehicles deleted successfully`);
    return true;
  } catch (error) {
    console.error('Error deleting client:', error);
    return false;
  }
};

export const deleteVehicle = (licensePlate: string): boolean => {
  try {
    const database = getDatabase();
    const upperLicensePlate = licensePlate.trim().toUpperCase();
    
    if (!database.vehicles[upperLicensePlate]) {
      throw new Error(`Vehiculul cu numărul de înmatriculare ${licensePlate} nu există în baza de date`);
    }
    
    const vehicle = database.vehicles[upperLicensePlate];
    const clientId = vehicle.clientId;
    
    // Remove vehicle from client's vehicle list
    if (database.clients[clientId]) {
      database.clients[clientId].vehicles = database.clients[clientId].vehicles.filter(
        plate => plate !== upperLicensePlate
      );
    }
    
    // Delete the vehicle
    delete database.vehicles[upperLicensePlate];
    
    saveDatabase(database);
    console.log(`Vehicle ${upperLicensePlate} deleted successfully`);
    return true;
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return false;
  }
};

export const deleteServiceRecord = (licensePlate: string, recordId: string): boolean => {
  try {
    const database = getDatabase();
    const upperLicensePlate = licensePlate.trim().toUpperCase();
    
    if (!database.vehicles[upperLicensePlate]) {
      throw new Error(`Vehiculul cu numărul de înmatriculare ${licensePlate} nu există în baza de date`);
    }
    
    const vehicle = database.vehicles[upperLicensePlate];
    const recordIndex = vehicle.serviceHistory.findIndex(record => record.id === recordId);
    
    if (recordIndex === -1) {
      throw new Error(`Înregistrarea de service cu ID-ul ${recordId} nu a fost găsită`);
    }
    
    // Remove the service record
    vehicle.serviceHistory.splice(recordIndex, 1);
    
    saveDatabase(database);
    console.log(`Service record ${recordId} deleted successfully`);
    return true;
  } catch (error) {
    console.error('Error deleting service record:', error);
    return false;
  }
};