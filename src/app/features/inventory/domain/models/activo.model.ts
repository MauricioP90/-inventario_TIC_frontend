export interface Activo {
  id: string;
  placa: string;
  tipo: string;
  marca: string;
  modelo: string;
  serial: string;
  estado: 'BODEGA' | 'OPERACION' | 'MANTENIMIENTO' | 'BAJA';
  fechaIngreso: string;
  locationId: string;
  responsibleId: string;
  facturaUrl?: string;
}

export type CreateActivoDto = Omit<Activo, 'id'>;
export type UpdateActivoDto = Partial<CreateActivoDto>;
