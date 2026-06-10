export interface Location {
  id: string;
  code: string;
  nombre: string;
  coordenadas?: string | null;
  tipo?: 'BODEGA' | 'OFICINA' | 'REGIONAL' | 'PROVEEDOR';
  responsibleIds: string[];
  estado: 'ACTIVO' | 'INACTIVO';
  observaciones?: string | null;
}

export type CreateLocationDto = Omit<Location, 'id'>;
export type UpdateLocationDto = Partial<CreateLocationDto>;
