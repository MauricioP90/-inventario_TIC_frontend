import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardMetrics } from '../../domain/models/dashboard.model';
import { DashboardRepository } from '../../domain/repositories/dashboard.repository';

@Injectable({
  providedIn: 'root'
})
export class GetDashboardMetricsUseCase {
  constructor(private dashboardRepository: DashboardRepository) {}

  execute(): Observable<DashboardMetrics> {
    return this.dashboardRepository.getMetrics();
  }
}
