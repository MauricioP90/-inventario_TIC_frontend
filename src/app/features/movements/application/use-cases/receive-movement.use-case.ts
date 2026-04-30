import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Movement } from '../../domain/models/movement.model';
import { MovementRepository } from '../../domain/repositories/movement.repository';

@Injectable({ providedIn: 'root' })
export class ReceiveMovementUseCase {
  constructor(private repository: MovementRepository) { }

  execute(id: string, receiverId: string, receiverEvidenceUrl: string): Observable<Movement> {
    return this.repository.receive(id, receiverId, receiverEvidenceUrl);
  }
}
