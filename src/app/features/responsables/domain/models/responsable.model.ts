import { Area } from './area.model';
import { Cargo } from './cargo.model';

export interface Responsable {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  role?: any;
  area?: Area | null;
  cargo?: Cargo | null;
  tipoDocumento?: string;
  numeroDocumento?: string;
  identificacion?: string;
  fechaExpedicionDocumento?: string | null;
  direccion?: string;
  address?: string;
  ciudad?: string;
  lugarExpedicion?: string;
  expedicion?: string;
  ciudadExpedicion?: string;
  estado: 'ACTIVO' | 'INACTIVO';
  locationIds: string[];
  // Campos visuales opcionales (mapeados desde el adapter)
  locations?: any[]; 
  totalActivos?: number;
  totalSIMCards?: number;
}

export interface Location {
  id: string;
  code: string;
  nombre: string;
  coordenadas?: string | null;
  responsibleIds: string[];
  estado: 'ACTIVO' | 'INACTIVO';
}

export type CreateResponsableDto = Omit<Responsable, 'id' | 'locations' | 'totalActivos' | 'totalSIMCards'>;
export type UpdateResponsableDto = Partial<CreateResponsableDto>;
