import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CatalogsRepository } from '../../domain/repositories/catalogs.repository';
import { TipoActivo, CreateTipoActivoDto } from '../../domain/models/tipo-activo.model';

@Injectable({ providedIn: 'root' })
export class CreateTipoUseCase {
  constructor(private repo: CatalogsRepository) {}
  execute(dto: CreateTipoActivoDto): Observable<TipoActivo> {
    return this.repo.createTipo(dto);
  }
}
