import { Observable } from 'rxjs';
import { Movement, CreateMovementDto } from '../models/movement.model';

export abstract class MovementRepository {
  abstract getAll(): Observable<Movement[]>;
  abstract getById(id: string): Observable<Movement>;
  abstract create(movement: CreateMovementDto): Observable<Movement>;
}
