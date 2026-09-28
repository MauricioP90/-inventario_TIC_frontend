import { Observable } from 'rxjs';
import {
  Activo,
  CreateActivoDto,
  UpdateActivoDto,
  ActivoMetadata,
  SearchActivosFilters,
  SearchActivosResponse
} from '../models/activo.model';

export abstract class ActivoRepository {
  abstract getAll(): Observable<Activo[]>;
  abstract search(filters: SearchActivosFilters): Observable<SearchActivosResponse>;
  abstract getByPlaca(placa: string): Observable<Activo>;
  abstract create(activo: CreateActivoDto): Observable<Activo>;
  abstract update(placa: string, activo: UpdateActivoDto): Observable<Activo>;
  abstract delete(placa: string): Observable<void>;
  abstract getMetadata(): Observable<ActivoMetadata>;
  abstract createTipoActivo(nombre: string): Observable<any>;
}
