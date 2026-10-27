import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Cargo } from '../../domain/models/cargo.model';
import { CargoRepository } from '../../domain/repositories/cargo.repository';

@Injectable({ providedIn: 'root' })
export class CreateCargoUseCase {
  constructor(private cargoRepo: CargoRepository) {}

  execute(nombre: string, estado?: string): Observable<Cargo> {
    return this.cargoRepo.create(nombre, estado);
  }
}
