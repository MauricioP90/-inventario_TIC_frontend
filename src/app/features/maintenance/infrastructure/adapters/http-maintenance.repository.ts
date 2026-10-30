import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MaintenanceReport, CreateMaintenanceReportDto, UpdateMaintenanceReportDto } from '../../domain/models/maintenance.model';
import { MaintenanceRepository } from '../../domain/repositories/maintenance.repository';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HttpMaintenanceRepository implements MaintenanceRepository {
  private apiUrl = `${environment.apiUrl}/maintenance`;

  constructor(private http: HttpClient) { }

  getActive(): Observable<MaintenanceReport[]> {
    return this.http.get<MaintenanceReport[]>(`${this.apiUrl}?scope=active`);
  }

  getHistory(activoId?: string): Observable<MaintenanceReport[]> {
    const params = activoId ? `?scope=history&activoId=${activoId}` : '?scope=history';
    return this.http.get<MaintenanceReport[]>(`${this.apiUrl}${params}`);
  }

  create(dto: CreateMaintenanceReportDto): Observable<MaintenanceReport> {
    return this.http.post<MaintenanceReport>(this.apiUrl, dto);
  }

  update(id: string, dto: UpdateMaintenanceReportDto): Observable<MaintenanceReport> {
    return this.http.patch<MaintenanceReport>(`${this.apiUrl}/${id}`, dto);
  }
}
