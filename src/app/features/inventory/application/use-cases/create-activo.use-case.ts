import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Activo, CreateActivoDto } from '../../domain/models/activo.model';
import { ActivoRepository } from '../../domain/repositories/activo.repository';

@Injectable({
  providedIn: 'root'
})
export class CreateActivoUseCase {
  constructor(private activoRepository: ActivoRepository) { }

  execute(activo: CreateActivoDto): Observable<Activo> {
    return this.activoRepository.create(activo);
  }
}
