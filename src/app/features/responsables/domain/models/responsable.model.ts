import { Role } from './role.model';

export interface Responsable {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  role: Role;
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
