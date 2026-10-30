export type TelemetryStatus =
  | 'CONFORME'
  | 'EN_TRANSITO_AUTORIZADO'
  | 'CONTROVERSIA_UBICACION'
  | 'SIN_COORDENADAS_SEDE';

export interface ActivoTelemetryLog {
  id: string;
  activoId: string;
  placa: string;
  reportedCoords: string;
  reportedIp?: string | null;
  expectedLocationId?: string | null;
  expectedLocationName?: string | null;
  detectedLocationId?: string | null;
  detectedLocationName?: string | null;
  distanceKm?: number | null;
  status: TelemetryStatus;
  alertSent: boolean;
  notificationUuid?: string | null;
  observaciones?: string | null;
  reportedAt: string;
}

export interface TelemetrySettings {
  toleranceKm: number;
  cooldownHours: number;
  alertsEnabled: boolean;
  whatsappEnabled?: boolean;
  whatsappNotifyCustodian?: boolean;
  whatsappCargoIds?: string[];
  updatedAt?: string;
}

export interface TelemetryOverviewResponse {
  settings: TelemetrySettings;
  latestByActivo: Record<string, ActivoTelemetryLog>;
  recentControversies: ActivoTelemetryLog[];
}

export interface RegisterHeartbeatDto {
  placa: string;
  latitud: number;
  longitud: number;
  ipAddress?: string;
  toleranceKm?: number;
  forceAlert?: boolean;
}

