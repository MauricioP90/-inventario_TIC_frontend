import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Cargo } from '../../domain/models/cargo.model';
import { CargoRepository } from '../../domain/repositories/cargo.repository';

@Injectable({ providedIn: 'root' })
export class UpdateCargoUseCase {
  constructor(private cargoRepo: CargoRepository) {}

  execute(id: string, nombre?: string, estado?: string): Observable<Cargo> {
    return this.cargoRepo.update(id, nombre, estado);
  }
}
