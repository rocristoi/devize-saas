import { StoredPart, PartsDatabase, Part } from '../types';

const PARTS_DB_KEY = 'partsDatabase';

// Initialize empty parts database structure
const initializePartsDatabase = (): PartsDatabase => ({
  parts: {},
  lastUpdated: new Date().toISOString()
});

// Get the entire parts database from localStorage
export const getPartsDatabase = (): PartsDatabase => {
  try {
    const stored = localStorage.getItem(PARTS_DB_KEY);
    if (!stored) {
      console.log('No parts database found, initializing new parts database');
      const newDb = initializePartsDatabase();
      savePartsDatabase(newDb);
      return newDb;
    }
    
    const parsed = JSON.parse(stored);
    
    // Validate parsed database structure
    if (!parsed.parts) {
      console.warn('Invalid parts database structure found, reinitializing');
      const newDb = initializePartsDatabase();
      savePartsDatabase(newDb);
      return newDb;
    }
    
    // Ensure all required fields exist
    if (!parsed.lastUpdated) {
      parsed.lastUpdated = new Date().toISOString();
    }
    
    console.log('Parts database loaded successfully');
    return parsed;
  } catch (error) {
    console.error('Error loading parts database:', error);
    console.log('Initializing new parts database due to error');
    const newDb = initializePartsDatabase();
    try {
      savePartsDatabase(newDb);
    } catch (saveError) {
      console.error('Critical error: Cannot save new parts database:', saveError);
    }
    return newDb;
  }
};

// Save the entire parts database to localStorage
export const savePartsDatabase = (database: PartsDatabase): void => {
  try {
    // Validate database structure before saving
    if (!database || typeof database !== 'object') {
      throw new Error('Invalid parts database structure');
    }
    
    if (!database.parts || typeof database.parts !== 'object') {
      throw new Error('Invalid parts structure in database');
    }
    
    database.lastUpdated = new Date().toISOString();
    
    // Try to stringify to catch circular references or other issues
    const jsonString = JSON.stringify(database);
    
    // Check if the JSON string is too large (localStorage has limits)
    if (jsonString.length > 5000000) { // 5MB limit
      console.warn('Parts database size is very large, consider cleanup');
    }
    
    localStorage.setItem(PARTS_DB_KEY, jsonString);
    console.log('Parts database saved successfully');
  } catch (error) {
    console.error('Error saving parts database:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to save parts database: ${errorMsg}`);
  }
};

// Generate unique ID for new parts
const generatePartId = (): string => {
  return `part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Add or update a part in the database
export const savePart = (partData: Omit<StoredPart, 'id' | 'dateAdded' | 'lastUpdated'>): StoredPart => {
  // Validation
  if (!partData.codPiesa || !partData.codPiesa.trim()) {
    throw new Error('Codul piesei este obligatoriu');
  }
  
  if (!partData.numePiesa || !partData.numePiesa.trim()) {
    throw new Error('Numele piesei este obligatoriu');
  }

  if (partData.pret < 0) {
    throw new Error('Prețul nu poate fi negativ');
  }

  if (partData.stocCurent < 0) {
    throw new Error('Stocul nu poate fi negativ');
  }

  const database = getPartsDatabase();
  
  // Check for existing part with same code (case-insensitive)
  const normalizedCode = partData.codPiesa.trim().toLowerCase();
  const existingPart = Object.values(database.parts).find(
    part => part.codPiesa.toLowerCase() === normalizedCode
  );
  
  let savedPart: StoredPart;
  
  if (existingPart) {
    // Update existing part
    savedPart = {
      ...existingPart,
      ...partData,
      codPiesa: partData.codPiesa.trim(),
      numePiesa: partData.numePiesa.trim(),
      lastUpdated: new Date().toISOString()
    };
    database.parts[existingPart.id] = savedPart;
    console.log('Updated existing part:', savedPart.id);
  } else {
    // Create new part
    const partId = generatePartId();
    savedPart = {
      id: partId,
      codPiesa: partData.codPiesa.trim(),
      numePiesa: partData.numePiesa.trim(),
      brand: partData.brand?.trim() || '',
      category: partData.category?.trim() || '',
      description: partData.description?.trim() || '',
      pret: partData.pret,
      stocCurent: partData.stocCurent,
      stocMinim: partData.stocMinim || 0,
      furnizor: partData.furnizor?.trim() || '',
      locatie: partData.locatie?.trim() || '',
      dateAdded: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      isActive: partData.isActive
    };
    database.parts[partId] = savedPart;
    console.log('Created new part:', partId);
  }
  
  try {
    savePartsDatabase(database);
    return savedPart;
  } catch (error) {
    console.error('Error saving part:', error);
    throw error;
  }
};

// Get a part by ID
export const getPart = (partId: string): StoredPart | null => {
  try {
    const database = getPartsDatabase();
    return database.parts[partId] || null;
  } catch (error) {
    console.error('Error getting part:', error);
    return null;
  }
};

// Update part stock after service
export const updatePartStock = (partCode: string, newStock: number): boolean => {
  try {
    const database = getPartsDatabase();
    const normalizedCode = partCode.trim().toLowerCase();
    
    // Find part by code (case-insensitive)
    const part = Object.values(database.parts).find(
      p => p.codPiesa.toLowerCase() === normalizedCode
    );
    
    if (!part) {
      console.warn(`Part with code ${partCode} not found for stock update`);
      return false;
    }
    
    // Update stock
    part.stocCurent = Math.max(0, newStock);
    part.lastUpdated = new Date().toISOString();
    
    // Save database
    savePartsDatabase(database);
    console.log(`Stock updated for part ${partCode}: ${newStock} units`);
    return true;
  } catch (error) {
    console.error('Error updating part stock:', error);
    return false;
  }
};

// Update stock for multiple parts after service
export const updateStockAfterService = (parts: Part[]): void => {
  try {
    parts.forEach(part => {
      if (part.codPiesa && part.bucati) {
        const storedPart = getPartByCode(part.codPiesa);
        if (storedPart) {
          const newStock = Math.max(0, storedPart.stocCurent - part.bucati);
          updatePartStock(part.codPiesa, newStock);
        }
      }
    });
    console.log('Stock updated for all parts used in service');
  } catch (error) {
    console.error('Error updating stock after service:', error);
  }
};

// Get a part by code
export const getPartByCode = (partCode: string): StoredPart | null => {
  try {
    const database = getPartsDatabase();
    const normalizedCode = partCode.trim().toLowerCase();
    return Object.values(database.parts).find(
      part => part.codPiesa.toLowerCase() === normalizedCode
    ) || null;
  } catch (error) {
    console.error('Error getting part by code:', error);
    return null;
  }
};

// Get all parts
export const getAllParts = (): StoredPart[] => {
  try {
    const database = getPartsDatabase();
    return Object.values(database.parts).sort((a, b) => 
      a.numePiesa.localeCompare(b.numePiesa)
    );
  } catch (error) {
    console.error('Error getting all parts:', error);
    return [];
  }
};

// Get active parts only
export const getActiveParts = (): StoredPart[] => {
  try {
    const database = getPartsDatabase();
    return Object.values(database.parts)
      .filter(part => part.isActive)
      .sort((a, b) => a.numePiesa.localeCompare(b.numePiesa));
  } catch (error) {
    console.error('Error getting active parts:', error);
    return [];
  }
};

// Search parts by name or code
export const searchParts = (query: string): StoredPart[] => {
  try {
    const database = getPartsDatabase();
    const normalizedQuery = query.trim().toLowerCase();
    
    if (!normalizedQuery) {
      return getActiveParts();
    }
    
    return Object.values(database.parts)
      .filter(part => 
        part.isActive && (
          part.numePiesa.toLowerCase().includes(normalizedQuery) ||
          part.codPiesa.toLowerCase().includes(normalizedQuery) ||
          (part.brand && part.brand.toLowerCase().includes(normalizedQuery)) ||
          (part.category && part.category.toLowerCase().includes(normalizedQuery))
        )
      )
      .sort((a, b) => a.numePiesa.localeCompare(b.numePiesa));
  } catch (error) {
    console.error('Error searching parts:', error);
    return [];
  }
};


// Reduce stock when part is used in a quote
export const usePartInQuote = (partCode: string, quantity: number): boolean => {
  try {
    const part = getPartByCode(partCode);
    if (!part) {
      console.warn(`Part with code ${partCode} not found in inventory`);
      return false;
    }
    
    if (part.stocCurent < quantity) {
      console.warn(`Insufficient stock for part ${partCode}. Available: ${part.stocCurent}, Requested: ${quantity}`);
      return false;
    }
    
    return updatePartStock(part.id, part.stocCurent - quantity);
  } catch (error) {
    console.error('Error using part in quote:', error);
    return false;
  }
};

// Delete a part (set as inactive)
export const deletePart = (partId: string): boolean => {
  try {
    const database = getPartsDatabase();
    if (!database.parts[partId]) {
      throw new Error('Piesa nu a fost găsită');
    }
    
    database.parts[partId].isActive = false;
    database.parts[partId].lastUpdated = new Date().toISOString();
    
    savePartsDatabase(database);
    console.log(`Deactivated part: ${partId}`);
    return true;
  } catch (error) {
    console.error('Error deleting part:', error);
    return false;
  }
};

// Get parts with low stock
export const getLowStockParts = (): StoredPart[] => {
  try {
    const database = getPartsDatabase();
    return Object.values(database.parts)
      .filter(part => 
        part.isActive && 
        part.stocMinim && 
        part.stocCurent <= part.stocMinim
      )
      .sort((a, b) => a.stocCurent - b.stocCurent);
  } catch (error) {
    console.error('Error getting low stock parts:', error);
    return [];
  }
};

// Export/import functions for backup
export const exportPartsData = (): string => {
  try {
    const database = getPartsDatabase();
    return JSON.stringify(database, null, 2);
  } catch (error) {
    console.error('Error exporting parts data:', error);
    throw error;
  }
};

export const importPartsData = (jsonData: string): boolean => {
  try {
    const imported = JSON.parse(jsonData);
    
    // Validate imported data
    if (!imported.parts || typeof imported.parts !== 'object') {
      throw new Error('Invalid parts data format');
    }
    
    // Validate each part
    Object.values(imported.parts).forEach((part: any) => {
      if (!part.id || !part.codPiesa || !part.numePiesa) {
        throw new Error('Invalid part data structure');
      }
    });
    
    // Add timestamp if missing
    if (!imported.lastUpdated) {
      imported.lastUpdated = new Date().toISOString();
    }
    
    savePartsDatabase(imported);
    console.log('Parts data imported successfully');
    return true;
  } catch (error) {
    console.error('Error importing parts data:', error);
    throw error;
  }
};