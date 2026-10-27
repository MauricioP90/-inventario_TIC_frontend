import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Cargo } from '../../domain/models/cargo.model';
import { CargoRepository } from '../../domain/repositories/cargo.repository';

@Injectable({ providedIn: 'root' })
export class ToggleCargoStatusUseCase {
  constructor(private cargoRepo: CargoRepository) {}

  execute(id: string): Observable<Cargo> {
    return this.cargoRepo.toggleStatus(id);
  }
}
