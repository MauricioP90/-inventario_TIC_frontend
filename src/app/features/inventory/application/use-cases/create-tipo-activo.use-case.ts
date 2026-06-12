import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivoRepository } from '../../domain/repositories/activo.repository';

@Injectable({
  providedIn: 'root'
})
export class CreateTipoActivoUseCase {
  constructor(private activoRepository: ActivoRepository) { }

  execute(nombre: string): Observable<any> {
    return this.activoRepository.createTipoActivo(nombre);
  }
}
