export interface ClientInfo {
  nume: string;
  cuiCnp: string;
  locatie: string;
  strada: string;
  numarTelefon: string;
  motivIntrare: string;
  observatii: string;
  dataIntrare: string;
  dataIesire: string;
}

export interface VehicleInfo {
  marca: string;
  model: string;
  numarInmatriculare: string;
  seriaSasiu: string;
  nivelCarburant: string;
  capacitateCilindrica: string;
  anFabricatie: string;
  km: string;
  culoare: string;
}

export interface Part {
  codPiesa: string;
  numePiesa: string;
  bucati: number;
  stare: string;
  pret: number;
  discount: number;
  pretTotal: number;
}

export interface Labor {
  manopera: string;
  durata: string;
  pret: number;
  discount: number;
  pretTotal: number;
}

export interface QuoteData {
  clientInfo: ClientInfo;
  vehicleInfo: VehicleInfo;
  parts: Part[];
  labor: Labor[];
  totalPiese: number;
  totalManopera: number;
  totalDevis: number;
  series: string; 
}

// New data models for client/vehicle management
export interface StoredClient {
  id: string; // CNP/CUI or generated unique identifier from name
  nume: string;
  cuiCnp: string;
  locatie: string;
  strada: string;
  numarTelefon: string;
  dateCreated: string;
  lastUpdated: string;
  vehicles: string[]; // Array of license plate numbers
}

export interface StoredVehicle {
  licensePlate: string; // License plate - unique identifier (numarInmatriculare)
  vin: string; // VIN (seriaSasiu) - now optional
  marca: string;
  model: string;
  numarInmatriculare: string; // Keep for backward compatibility
  capacitateCilindrica: string;
  anFabricatie: string;
  culoare: string;
  clientId: string; // Reference to client's ID
  dateAdded: string;
  lastKm: string; // Last recorded km
  serviceHistory: ServiceRecord[];
}

export interface ServiceRecord {
  id: string;
  date: string;
  km: string;
  motivIntrare: string;
  observatii: string;
  parts: Part[];
  labor: Labor[];
  totalPiese: number;
  totalManopera: number;
  totalDevis: number;
  series: string;
  nivelCarburant?: string;
  dataIntrare?: string;
  dataIesire?: string;
}

export interface ClientVehicleDatabase {
  clients: { [key: string]: StoredClient }; // Key is CNP/CUI
  vehicles: { [key: string]: StoredVehicle }; // Key is VIN
  lastUpdated: string;
}

// Parts database structure
export interface StoredPart {
  id: string; // Unique identifier for the part
  codPiesa: string; // Part code
  numePiesa: string; // Part name
  brand?: string; // Brand/manufacturer
  category?: string; // Category (e.g., motor, caroserie, etc.)
  description?: string; // Additional description
  pret: number; // Unit price
  stocCurent: number; // Current stock quantity
  stocMinim?: number; // Minimum stock alert level
  furnizor?: string; // Supplier
  locatie?: string; // Storage location
  dateAdded: string; // When part was added to inventory
  lastUpdated: string; // Last modification date
  isActive: boolean; // Whether part is active/available
}

export interface PartsDatabase {
  parts: { [key: string]: StoredPart }; // Key is part ID
  lastUpdated: string;
}

// Deviz History Types
export interface StoredDeviz {
  series: string; // Primary key
  timestamp: string;
  clientInfo: ClientInfo;
  vehicleInfo: VehicleInfo;
  parts: Part[];
  labor: Labor[];
  totalPiese: number;
  totalManopera: number;
  totalDevis: number;
}

export interface DevizDatabase {
  devizes: { [series: string]: StoredDeviz };
  lastUpdated: string;
}

// Branding and Configuration Types
export interface BrandingConfig {
  company: {
    name: string;
    fullName: string;
    cui: string;
    email: string;
    phone: string;
    address?: {
      street?: string;
      city?: string;
      country?: string;
    };
  };
  app: {
    name: string;
    title: string;
    description: string;
    version: string;
  };
  visual: {
    logo: {
      uri: string;
      alt: string;
      height: string;
    };
    colors: {
      primary: string;
      secondary?: string;
      success?: string;
      warning?: string;
      error?: string;
    };
  };
  pdf: {
    filename: string;
    headerTitle: string;
  };
} 