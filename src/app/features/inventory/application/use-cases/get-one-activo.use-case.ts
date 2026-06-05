import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Activo } from '../../domain/models/activo.model';
import { ActivoRepository } from '../../domain/repositories/activo.repository';

@Injectable({
  providedIn: 'root'
})
export class GetOneActivoUseCase {
  constructor(private activoRepository: ActivoRepository) { }

  execute(placa: string): Observable<Activo> {
    return this.activoRepository.getByPlaca(placa);
  }
}
