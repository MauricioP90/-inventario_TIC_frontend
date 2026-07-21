import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CatalogsRepository } from '../../domain/repositories/catalogs.repository';
import { TipoActivo } from '../../domain/models/tipo-activo.model';

@Injectable({ providedIn: 'root' })
export class GetAllTiposUseCase {
  constructor(private repo: CatalogsRepository) {}
  execute(): Observable<TipoActivo[]> {
    return this.repo.getAllTipos();
  }
}
