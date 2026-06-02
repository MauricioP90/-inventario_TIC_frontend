import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Movement } from '../../domain/models/movement.model';
import { MovementRepository } from '../../domain/repositories/movement.repository';

@Injectable({ providedIn: 'root' })
export class RejectMovementUseCase {
  constructor(private repository: MovementRepository) { }

  execute(id: string, rejectionReason: string): Observable<Movement> {
    return this.repository.reject(id, rejectionReason);
  }
}
