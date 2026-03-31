import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Responsable, UpdateResponsableDto } from '../../domain/models/responsable.model';
import { ResponsableRepository } from '../../domain/repositories/responsable.repository';

@Injectable({ providedIn: 'root' })
export class UpdateResponsableUseCase {
  constructor(private responsableRepository: ResponsableRepository) {}

  execute(id: string, responsable: UpdateResponsableDto): Observable<Responsable> {
    return this.responsableRepository.update(id, responsable);
  }
}
