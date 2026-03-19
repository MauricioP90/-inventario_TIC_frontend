import { Observable } from 'rxjs';
import { SimCard, CreateSimCardDto, UpdateSimCardDto } from '../models/sim-card.model';

export abstract class SimCardRepository {
  abstract getAll(): Observable<SimCard[]>;
  abstract getById(id: string): Observable<SimCard>;
  abstract create(simCard: CreateSimCardDto): Observable<SimCard>;
  abstract update(id: string, simCard: UpdateSimCardDto): Observable<SimCard>;
  abstract delete(id: string): Observable<void>;
}
