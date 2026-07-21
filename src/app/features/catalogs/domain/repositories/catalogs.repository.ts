import { Observable } from 'rxjs';
import { TipoActivo, CreateTipoActivoDto, UpdateTipoActivoDto } from '../models/tipo-activo.model';

export abstract class CatalogsRepository {
  abstract getAllTipos(): Observable<TipoActivo[]>;
  abstract createTipo(dto: CreateTipoActivoDto): Observable<TipoActivo>;
  abstract updateTipo(id: string, dto: UpdateTipoActivoDto): Observable<TipoActivo>;
}
