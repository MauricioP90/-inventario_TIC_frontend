import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TelemetryRepository } from '../../domain/repositories/telemetry.repository';
import {
  ActivoTelemetryLog,
  TelemetryOverviewResponse,
  TelemetrySettings,
  RegisterHeartbeatDto
} from '../../domain/models/telemetry.model';

@Injectable({ providedIn: 'root' })
export class GetTelemetryOverviewUseCase {
  private repo = inject(TelemetryRepository);

  execute(): Observable<TelemetryOverviewResponse> {
    return this.repo.getOverview();
  }
}

@Injectable({ providedIn: 'root' })
export class GetActivoTelemetryHistoryUseCase {
  private repo = inject(TelemetryRepository);

  execute(activoId: string): Observable<ActivoTelemetryLog[]> {
    return this.repo.getHistoryByActivo(activoId);
  }
}

@Injectable({ providedIn: 'root' })
export class RegisterDeviceHeartbeatUseCase {
  private repo = inject(TelemetryRepository);

  execute(dto: RegisterHeartbeatDto): Observable<ActivoTelemetryLog> {
    return this.repo.registerHeartbeat(dto);
  }
}

@Injectable({ providedIn: 'root' })
export class UpdateTelemetrySettingsUseCase {
  private repo = inject(TelemetryRepository);

  execute(settings: Partial<TelemetrySettings>): Observable<TelemetrySettings> {
    return this.repo.updateSettings(settings);
  }
}

@Injectable({ providedIn: 'root' })
export class SendTelemetryTestAlertUseCase {
  private repo = inject(TelemetryRepository);

  execute(): Observable<{ success: boolean; uuid?: string; message: string }> {
    return this.repo.sendTestAlert();
  }
}

