import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ResponsableRepository } from '../../domain/repositories/responsable.repository';
import { Area } from '../../domain/models/area.model';

@Injectable({ providedIn: 'root' })
export class GetAllAreasUseCase {
  constructor(private repository: ResponsableRepository) {}

  execute(): Observable<Area[]> {
    return this.repository.getAreas();
  }
}
