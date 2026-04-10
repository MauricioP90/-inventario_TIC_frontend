export enum MovementStatus {
  PENDING = 'PENDING',
  EN_TRANSIT = 'EN_TRANSIT',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED'
}

export interface Movement {
  id: string;
  type: string;
  originLocationId: string;
  destinationLocationId: string;
  responsibleId: string;
  status: MovementStatus;
  activoIds: string[];
  notes?: string;
  evidenceUrl?: string;
  createdAt: Date;
  shippedAt?: Date;
  receivedAt?: Date;
  originLocation?: any;
  destinationLocation?: any;
  responsible?: any;
  activos?: any[];
}

export type CreateMovementDto = Omit<Movement, 'id' | 'createdAt' | 'status' | 'shippedAt' | 'receivedAt'>;
