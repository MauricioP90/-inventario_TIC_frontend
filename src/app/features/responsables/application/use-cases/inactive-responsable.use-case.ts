import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Responsable } from '../../domain/models/responsable.model';
import { ResponsableRepository } from '../../domain/repositories/responsable.repository';

@Injectable({ providedIn: 'root' })
export class InactiveResponsableUseCase {
  constructor(private responsableRepository: ResponsableRepository) {}

  execute(id: string): Observable<Responsable> {
    return this.responsableRepository.inactive(id);
  }
}
