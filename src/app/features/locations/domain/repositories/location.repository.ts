import { Observable } from 'rxjs';
import { Location, CreateLocationDto, UpdateLocationDto } from '../models/location.model';

export abstract class LocationRepository {
  abstract getAll(): Observable<Location[]>;
  abstract getByCode(code: string): Observable<Location>;
  abstract create(location: CreateLocationDto): Observable<Location>;
  abstract update(code: string, location: UpdateLocationDto): Observable<Location>;
}
