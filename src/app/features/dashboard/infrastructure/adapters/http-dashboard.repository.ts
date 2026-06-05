import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardMetrics } from '../../domain/models/dashboard.model';
import { DashboardRepository } from '../../domain/repositories/dashboard.repository';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HttpDashboardRepository implements DashboardRepository {
  private readonly apiUrl = `${environment.apiUrl}/activos/dashboard`;

  constructor(private http: HttpClient) {}

  getMetrics(): Observable<DashboardMetrics> {
    return this.http.get<DashboardMetrics>(this.apiUrl);
  }
}
