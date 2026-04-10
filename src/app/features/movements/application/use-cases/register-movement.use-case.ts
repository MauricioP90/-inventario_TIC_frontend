import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Movement, CreateMovementDto } from '../../domain/models/movement.model';
import { MovementRepository } from '../../domain/repositories/movement.repository';

@Injectable({ providedIn: 'root' })
export class RegisterMovementUseCase {
  constructor(private repository: MovementRepository) {}

  execute(dto: CreateMovementDto): Observable<Movement> {
    return this.repository.create(dto);
  }
}
