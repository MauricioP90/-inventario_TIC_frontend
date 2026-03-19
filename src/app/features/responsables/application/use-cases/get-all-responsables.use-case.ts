import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Responsable } from '../../domain/models/responsable.model';
import { ResponsableRepository } from '../../domain/repositories/responsable.repository';

@Injectable({ providedIn: 'root' })
export class GetAllResponsablesUseCase {
  constructor(private repo: ResponsableRepository) {}
  execute(): Observable<Responsable[]> { return this.repo.getAll(); }
}
