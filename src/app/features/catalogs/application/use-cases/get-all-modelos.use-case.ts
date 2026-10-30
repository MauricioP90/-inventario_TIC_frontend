import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ModeloActivoRepository } from '../../domain/repositories/modelo-activo.repository';
import { ModeloActivo } from '../../domain/models/modelo-activo.model';

@Injectable({ providedIn: 'root' })
export class GetAllModelosUseCase {
  constructor(private repo: ModeloActivoRepository) {}

  execute(tipoActivoId?: string): Observable<ModeloActivo[]> {
    return this.repo.getAll(tipoActivoId);
  }
}
