import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Responsable, CreateResponsableDto } from '../../domain/models/responsable.model';
import { ResponsableRepository } from '../../domain/repositories/responsable.repository';

@Injectable({ providedIn: 'root' })
export class CreateResponsableUseCase {
  constructor(private responsableRepository: ResponsableRepository) {}

  execute(responsable: CreateResponsableDto): Observable<Responsable> {
    return this.responsableRepository.create(responsable);
  }
}
