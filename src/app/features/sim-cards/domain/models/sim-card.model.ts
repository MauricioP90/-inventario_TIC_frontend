export interface SimCard {
  id: string;
  numero: string;    // Del backend: numero
  iccid: string;
  operador: string;  // Del backend: operador
  estado: 'BODEGA' | 'ASIGNADA' | 'BAJA'; // Sincronizado con EstadoSIM
  responsableId?: string;
  activoId?: string;
}

export type CreateSimCardDto = Omit<SimCard, 'id'>;
export type UpdateSimCardDto = Partial<SimCard>;

