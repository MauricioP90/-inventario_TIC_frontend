export interface Movement {
  id: string;
  type: string;
  responsible: string;
  origin: string;
  destination: string;
  items: Array<{
    placa: string;
    type: string;
    model: string;
    serial: string;
  }>;
  date: Date;
  notes?: string;
  createdAt: Date;
}

export type CreateMovementDto = Omit<Movement, 'id' | 'createdAt'>;
