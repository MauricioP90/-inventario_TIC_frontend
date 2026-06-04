export interface SimCard {
  id: string;
  numero: string;    // Del backend: numero
  iccid: string;
  operador: string;  // Del backend: operador
  estado: 'BODEGA' | 'ASIGNADA' | 'BAJA'; // Sincronizado con EstadoSIM
  responsableId?: string;
  activoId?: string;
  locationId?: string;
  activo?: { id: string; placa: string; serial?: string; marca?: string } | null;
  location?: { id: string; nombre: string } | null;
}

export type CreateSimCardDto = Omit<SimCard, 'id'>;
export type UpdateSimCardDto = Partial<SimCard>;

