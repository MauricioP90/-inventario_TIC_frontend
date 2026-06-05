import { Observable } from 'rxjs';
import { DashboardMetrics } from '../models/dashboard.model';

export abstract class DashboardRepository {
  abstract getMetrics(): Observable<DashboardMetrics>;
}
