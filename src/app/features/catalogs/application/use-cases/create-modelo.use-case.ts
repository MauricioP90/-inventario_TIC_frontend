import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ModeloActivoRepository } from '../../domain/repositories/modelo-activo.repository';
import { ModeloActivo, CreateModeloActivoDto } from '../../domain/models/modelo-activo.model';

@Injectable({ providedIn: 'root' })
export class CreateModeloUseCase {
  constructor(private repo: ModeloActivoRepository) {}

  execute(dto: CreateModeloActivoDto): Observable<ModeloActivo> {
    return this.repo.create(dto);
  }
}
