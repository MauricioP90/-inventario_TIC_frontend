import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Movement } from '../../domain/models/movement.model';
import { MovementRepository } from '../../domain/repositories/movement.repository';

@Injectable({ providedIn: 'root' })
export class CancelMovementUseCase {
  constructor(private repository: MovementRepository) { }

  execute(id: string, reason: string): Observable<Movement> {
    return this.repository.cancel(id, reason);
  }
}
