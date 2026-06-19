import { Observable } from 'rxjs';
import { Responsable, CreateResponsableDto, UpdateResponsableDto } from '../models/responsable.model';
import { Role } from '../models/role.model';
import { Area } from '../models/area.model';

export abstract class ResponsableRepository {
  abstract getAll(): Observable<Responsable[]>;
  abstract getRoles(): Observable<Role[]>;
  abstract getAreas(): Observable<Area[]>;
  abstract getById(id: string): Observable<Responsable>;
  abstract getStats(id: string): Observable<{ totalActivos: number, totalSIMCards: number }>;
  abstract create(responsable: CreateResponsableDto): Observable<Responsable>;
  abstract update(id: string, responsable: UpdateResponsableDto): Observable<Responsable>;
  abstract inactive(id: string): Observable<Responsable>;
  abstract delete(id: string): Observable<void>;
}
