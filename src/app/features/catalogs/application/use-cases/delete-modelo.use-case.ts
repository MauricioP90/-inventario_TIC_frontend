import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ModeloActivoRepository } from '../../domain/repositories/modelo-activo.repository';

@Injectable({ providedIn: 'root' })
export class DeleteModeloUseCase {
  constructor(private repo: ModeloActivoRepository) {}

  execute(id: string): Observable<void> {
    return this.repo.delete(id);
  }
}
