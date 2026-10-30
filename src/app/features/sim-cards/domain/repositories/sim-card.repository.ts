import { Observable } from 'rxjs';
import { SimCard, CreateSimCardDto, UpdateSimCardDto } from '../models/sim-card.model';

export abstract class SimCardRepository {
  abstract findAll(): Observable<SimCard[]>;
  abstract findById(id: string): Observable<SimCard>;
  abstract create(simCard: CreateSimCardDto): Observable<SimCard>;
  abstract update(id: string, simCard: UpdateSimCardDto): Observable<SimCard>;
  abstract delete(id: string): Observable<void>;
}