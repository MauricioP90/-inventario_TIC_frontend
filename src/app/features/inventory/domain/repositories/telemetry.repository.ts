import { Observable } from 'rxjs';
import {
  ActivoTelemetryLog,
  TelemetryOverviewResponse,
  TelemetrySettings,
  RegisterHeartbeatDto
} from '../models/telemetry.model';

export abstract class TelemetryRepository {
  abstract getOverview(): Observable<TelemetryOverviewResponse>;
  abstract getHistoryByActivo(activoId: string): Observable<ActivoTelemetryLog[]>;
  abstract registerHeartbeat(dto: RegisterHeartbeatDto): Observable<ActivoTelemetryLog>;
  abstract getSettings(): Observable<TelemetrySettings>;
  abstract updateSettings(settings: Partial<TelemetrySettings>): Observable<TelemetrySettings>;
  abstract sendTestAlert(): Observable<{ success: boolean; uuid?: string; message: string }>;
}

