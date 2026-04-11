export interface ClientInfo {
  nume: string;
  cuiCnp: string;
  locatie: string;
  strada: string;
  numarTelefon: string;
  dataIntrare: string;
  dataIesire: string;
  motivIntrare: string;
  observatii: string;
}

export interface VehicleInfo {
  marca: string;
  model: string;
  numarInmatriculare: string;
  seriaSasiu: string;
  anFabricatie: string;
  culoare: string;
  capacitateCilindrica: string;
  km: string;
  nivelCarburant: string;
}

export interface DevizPart {
  id: string; // for local UI tracking
  inventory_part_id?: string;
  cod_piesa: string;
  nume_piesa: string;
  stare: string;
  cantitate: number | string;
  pret_unitar: number | string;
  discount_percentage: number | string;
  total: number;
}

export interface DevizLabor {
  id: string; // for local UI tracking
  operatiune: string;
  durata: string | number;
  pret_orar: number | string;
  discount_percentage: number | string;
  total: number;
}
