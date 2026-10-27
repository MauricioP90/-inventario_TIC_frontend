import { Observable } from 'rxjs';
import { MaintenanceReport, CreateMaintenanceReportDto, UpdateMaintenanceReportDto } from '../models/maintenance.model';

export abstract class MaintenanceRepository {
  abstract getActive(): Observable<MaintenanceReport[]>;
  abstract getHistory(activoId?: string): Observable<MaintenanceReport[]>;
  abstract create(dto: CreateMaintenanceReportDto): Observable<MaintenanceReport>;
  abstract update(id: string, dto: UpdateMaintenanceReportDto): Observable<MaintenanceReport>;
}
