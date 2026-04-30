import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Movement } from '../../domain/models/movement.model';
import { MovementRepository } from '../../domain/repositories/movement.repository';

@Injectable({ providedIn: 'root' })
export class DispatchMovementUseCase {
  constructor(private repository: MovementRepository) { }

  execute(id: string, evidenceUrl: string): Observable<Movement> {
    return this.repository.dispatch(id, evidenceUrl);
  }
}
