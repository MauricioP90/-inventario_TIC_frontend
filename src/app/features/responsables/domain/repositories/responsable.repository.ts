import { Observable } from 'rxjs';
import { Responsable, CreateResponsableDto, UpdateResponsableDto } from '../models/responsable.model';

export abstract class ResponsableRepository {
  abstract getAll(): Observable<Responsable[]>;
  abstract getById(id: string): Observable<Responsable>;
  abstract getStats(id: string): Observable<{ totalActivos: number, totalSIMCards: number }>;
  abstract create(responsable: CreateResponsableDto): Observable<Responsable>;
  abstract update(id: string, responsable: UpdateResponsableDto): Observable<Responsable>;
  abstract inactive(id: string): Observable<Responsable>;
  abstract delete(id: string): Observable<void>;
}
