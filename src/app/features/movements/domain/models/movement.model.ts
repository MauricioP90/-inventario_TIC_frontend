export enum MovementStatus {
  PENDING = 'PENDING',
  EN_TRANSIT = 'EN_TRANSIT',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED'
}

export enum MovementType {
  // Activos
  REGIONAL_TRANSFER = 'TRASLADO_REGIONAL',
  OFFICE_ASSIGNMENT = 'ASIGNACION_OFICINA',
  LOAN_OUT = 'SALIDA_PRESTAMO',
  SUPPORT_RETURN = 'RETORNO_SOPORTE',
  PROVIDER_WARRANTY = 'ENVIO_GARANTIA',
  SUPPORT_REENTRY = 'REINGRESO_SOPORTE',
  PROVIDER_RETURN = 'RETORNO_PROVEEDOR',
  DISPOSAL = 'BAJA_ACTIVO',
  RETURN_BY_REJECTION = 'RETORNO_POR_RECHAZO',
  // SIM Cards
  SIM_ASSIGNMENT = 'SIM_ASIGNACION',
  SIM_CHANGE = 'SIM_CAMBIO',
  SIM_REMOVAL = 'SIM_RETIRO',
  SIM_FULL_REMOVAL = 'SIM_RETIRO_TOTAL',
  SIM_TRANSFER = 'SIM_TRASLADO'
}

export interface Movement {
  id: string;
  parentMovementId?: string;
  type: MovementType | string;
  originLocationId: string;
  destinationLocationId: string;
  responsibleId: string;
  receiverId?: string;
  status: MovementStatus;
  activoIds: string[];
  simCardIds?: string[];
  notes?: string;
  evidenceUrl?: string;
  receivedEvidenceUrl?: string;
  createdAt: Date;
  shippedAt?: Date;
  receivedAt?: Date;
  magicLinkToken?: string;
  physicalReceiverName?: string;
  originLocation?: any;
  destinationLocation?: any;
  responsible?: any;
  receiver?: any;
  activos?: any[];
  simCards?: any[];
}

export type CreateMovementDto = Omit<Movement, 'id' | 'createdAt' | 'status' | 'shippedAt' | 'receivedAt'> & { recipients?: string[] };

export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  // Activos
  [MovementType.REGIONAL_TRANSFER]: 'Traslado entre Sedes',
  [MovementType.OFFICE_ASSIGNMENT]: 'Asignación a Oficina',
  [MovementType.LOAN_OUT]: 'Salida por Préstamo',
  [MovementType.SUPPORT_RETURN]: 'Retorno para Soporte',
  [MovementType.PROVIDER_WARRANTY]: 'Envío a Proveedor',
  [MovementType.SUPPORT_REENTRY]: 'Reingreso de Soporte',
  [MovementType.PROVIDER_RETURN]: 'Retorno de Proveedor',
  [MovementType.DISPOSAL]: 'Baja de Activo',
  [MovementType.RETURN_BY_REJECTION]: 'Retorno Automático (Por Rechazo)',
  // SIM Cards
  [MovementType.SIM_ASSIGNMENT]: 'Asignación de SIMCARD',
  [MovementType.SIM_CHANGE]: 'Cambio de SIMCARD',
  [MovementType.SIM_REMOVAL]: 'Retiro de SIMCARD',
  [MovementType.SIM_FULL_REMOVAL]: 'Retiro de TODAS las SIMs',
  [MovementType.SIM_TRANSFER]: 'Traslado de SIM (Individual)'
};
