import { Area } from '../../../responsables/domain/models/area.model';

export type LocationTipo = 'PUNTO_TI' | 'OFICINA_PROPIA' | 'CONTRATISTA' | 'PROVEEDOR' | 'BODEGA' | 'OFICINA' | 'REGIONAL';

export interface Location {
  id: string;
  code: string;
  nombre: string;
  coordenadas?: string | null;
  tipo?: LocationTipo;
  responsibleIds: string[];
  areaIds?: string[];
  areas?: Area[];
  estado: 'ACTIVO' | 'INACTIVO';
  observaciones?: string | null;
}

export type CreateLocationDto = Omit<Location, 'id' | 'areas'>;
export type UpdateLocationDto = Partial<CreateLocationDto>;
