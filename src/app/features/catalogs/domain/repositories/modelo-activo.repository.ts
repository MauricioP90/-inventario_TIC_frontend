import { Observable } from 'rxjs';
import { ModeloActivo, CreateModeloActivoDto, UpdateModeloActivoDto } from '../models/modelo-activo.model';

export abstract class ModeloActivoRepository {
  abstract getAll(tipoActivoId?: string): Observable<ModeloActivo[]>;
  abstract create(dto: CreateModeloActivoDto): Observable<ModeloActivo>;
  abstract update(id: string, dto: UpdateModeloActivoDto): Observable<ModeloActivo>;
  abstract delete(id: string): Observable<void>;
}
