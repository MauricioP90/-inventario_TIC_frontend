import { Observable } from 'rxjs';
import { Activo, CreateActivoDto, UpdateActivoDto } from '../models/activo.model';

export abstract class ActivoRepository {
  abstract getAll(): Observable<Activo[]>;
  abstract getByPlaca(placa: string): Observable<Activo>;
  abstract create(activo: CreateActivoDto): Observable<Activo>;
  abstract update(placa: string, activo: UpdateActivoDto): Observable<Activo>;
  abstract delete(placa: string): Observable<void>;
}
