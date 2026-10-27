import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Cargo } from '../../domain/models/cargo.model';
import { CargoRepository } from '../../domain/repositories/cargo.repository';

@Injectable({ providedIn: 'root' })
export class GetAllCargosUseCase {
  constructor(private cargoRepo: CargoRepository) {}

  execute(): Observable<Cargo[]> {
    return this.cargoRepo.getAll();
  }
}
