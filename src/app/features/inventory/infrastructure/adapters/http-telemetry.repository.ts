import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { TelemetryRepository } from '../../domain/repositories/telemetry.repository';
import {
  ActivoTelemetryLog,
  TelemetryOverviewResponse,
  TelemetrySettings,
  RegisterHeartbeatDto
} from '../../domain/models/telemetry.model';

@Injectable({ providedIn: 'root' })
export class HttpTelemetryRepository implements TelemetryRepository {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/telemetry`;

  getOverview(): Observable<TelemetryOverviewResponse> {
    return this.http.get<TelemetryOverviewResponse>(`${this.baseUrl}/overview`);
  }

  getHistoryByActivo(activoId: string): Observable<ActivoTelemetryLog[]> {
    return this.http.get<ActivoTelemetryLog[]>(`${this.baseUrl}/activos/${activoId}`);
  }

  registerHeartbeat(dto: RegisterHeartbeatDto): Observable<ActivoTelemetryLog> {
    return this.http.post<ActivoTelemetryLog>(`${this.baseUrl}/heartbeat`, dto);
  }

  getSettings(): Observable<TelemetrySettings> {
    return this.http.get<TelemetrySettings>(`${this.baseUrl}/settings`);
  }

  updateSettings(settings: Partial<TelemetrySettings>): Observable<TelemetrySettings> {
    return this.http.put<TelemetrySettings>(`${this.baseUrl}/settings`, settings);
  }

  sendTestAlert(): Observable<{ success: boolean; uuid?: string; message: string }> {
    return this.http.post<{ success: boolean; uuid?: string; message: string }>(`${this.baseUrl}/test-alert`, {});
  }
}

