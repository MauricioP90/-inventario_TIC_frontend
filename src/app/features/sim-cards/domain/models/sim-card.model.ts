export interface SimCard {
  id: string;
  number: string;
  iccid: string;
  carrier: string;
  status: 'available' | 'assigned' | 'blocked';
  assignedTo?: string;
  responsableId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateSimCardDto = Omit<SimCard, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateSimCardDto = Partial<CreateSimCardDto>;
