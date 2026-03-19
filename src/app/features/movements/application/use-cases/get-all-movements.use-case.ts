import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Movement } from '../../domain/models/movement.model';
import { MovementRepository } from '../../domain/repositories/movement.repository';

@Injectable({ providedIn: 'root' })
export class GetAllMovementsUseCase {
  constructor(private repo: MovementRepository) {}
  execute(): Observable<Movement[]> { return this.repo.getAll(); }
}
