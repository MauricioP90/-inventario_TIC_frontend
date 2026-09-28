import { Observable } from 'rxjs';
import { Cargo } from '../models/cargo.model';

export abstract class CargoRepository {
  abstract getAll(): Observable<Cargo[]>;
  abstract create(nombre: string, estado?: string): Observable<Cargo>;
  abstract update(id: string, nombre?: string, estado?: string): Observable<Cargo>;
  abstract toggleStatus(id: string): Observable<Cargo>;
}
