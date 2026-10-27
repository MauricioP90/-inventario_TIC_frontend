import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MaintenanceRepository } from '../../domain/repositories/maintenance.repository';
import { MaintenanceReport, CreateMaintenanceReportDto, UpdateMaintenanceReportDto } from '../../domain/models/maintenance.model';

@Injectable({ providedIn: 'root' })
export class MaintenanceUseCases {
  constructor(private repo: MaintenanceRepository) { }

  getActive(): Observable<MaintenanceReport[]> { return this.repo.getActive(); }
  getHistory(activoId?: string): Observable<MaintenanceReport[]> { return this.repo.getHistory(activoId); }
  create(dto: CreateMaintenanceReportDto): Observable<MaintenanceReport> { return this.repo.create(dto); }
  update(id: string, dto: UpdateMaintenanceReportDto): Observable<MaintenanceReport> { return this.repo.update(id, dto); }
}
