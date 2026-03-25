import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Activo } from '../../domain/models/activo.model';
import { ActivoRepository } from '../../domain/repositories/activo.repository';

@Injectable({
  providedIn: 'root'
})
export class GetAllActivosUseCase {
  constructor(private activoRepository: ActivoRepository) { }

  execute(): Observable<Activo[]> {
    return this.activoRepository.getAll();
  }
}
