import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ModeloActivoRepository } from '../../domain/repositories/modelo-activo.repository';
import { ModeloActivo, UpdateModeloActivoDto } from '../../domain/models/modelo-activo.model';

@Injectable({ providedIn: 'root' })
export class UpdateModeloUseCase {
  constructor(private repo: ModeloActivoRepository) {}

  execute(id: string, dto: UpdateModeloActivoDto): Observable<ModeloActivo> {
    return this.repo.update(id, dto);
  }
}
