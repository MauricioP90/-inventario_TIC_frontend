import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CatalogsRepository } from '../../domain/repositories/catalogs.repository';
import { TipoActivo, UpdateTipoActivoDto } from '../../domain/models/tipo-activo.model';

@Injectable({ providedIn: 'root' })
export class UpdateTipoUseCase {
  constructor(private repo: CatalogsRepository) {}
  execute(id: string, dto: UpdateTipoActivoDto): Observable<TipoActivo> {
    return this.repo.updateTipo(id, dto);
  }
}
