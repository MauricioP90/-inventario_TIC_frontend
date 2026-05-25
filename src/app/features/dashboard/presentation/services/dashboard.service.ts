import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface DashboardMetrics {
  statusCounts: Record<string, number>;
  locationCounts: Record<string, number>;
  responsibleCounts: Record<string, number>;
  typeCounts: Record<string, number>;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly apiUrl = `${environment.apiUrl}/activos`;

  constructor(private http: HttpClient) {}

  /**
   * Devuelve el resumen del inventario agrupado por estado, sede y responsable.
   * Endpoint: GET /api/activos/dashboard
   */
  getMetrics(): Observable<DashboardMetrics> {
    return this.http.get<DashboardMetrics>(`${this.apiUrl}/dashboard`);
  }
}
