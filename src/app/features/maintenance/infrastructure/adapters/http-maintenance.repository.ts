import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MaintenanceReport, CreateMaintenanceReportDto, UpdateMaintenanceReportDto } from '../../domain/models/maintenance.model';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HttpMaintenanceRepository {
  private apiUrl = `${environment.apiUrl}/maintenance`;

  constructor(private http: HttpClient) { }

  getActive(): Observable<MaintenanceReport[]> {
    return this.http.get<MaintenanceReport[]>(`${this.apiUrl}/active`);
  }

  getHistory(activoId?: string): Observable<MaintenanceReport[]> {
    const params = activoId ? `?activoId=${activoId}` : '';
    return this.http.get<MaintenanceReport[]>(`${this.apiUrl}/history${params}`);
  }

  create(dto: CreateMaintenanceReportDto): Observable<MaintenanceReport> {
    return this.http.post<MaintenanceReport>(this.apiUrl, dto);
  }

  update(id: string, dto: UpdateMaintenanceReportDto): Observable<MaintenanceReport> {
    return this.http.patch<MaintenanceReport>(`${this.apiUrl}/${id}`, dto);
  }
}
