import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Activo, UpdateActivoDto } from '../../domain/models/activo.model';
import { ActivoRepository } from '../../domain/repositories/activo.repository';

@Injectable({
  providedIn: 'root'
})
export class UpdateActivoUseCase {
  constructor(private readonly activoRepository: ActivoRepository) { }

  execute(placa: string, data: UpdateActivoDto): Observable<Activo> {
    return this.activoRepository.update(placa, data);
  }
}