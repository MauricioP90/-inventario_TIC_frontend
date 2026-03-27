export interface Location {
  id: string;
  code: string;
  nombre: string;
  coordenadas?: string | null;
  responsableId: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

export type CreateLocationDto = Omit<Location, 'id'>;
export type UpdateLocationDto = Partial<CreateLocationDto>;
