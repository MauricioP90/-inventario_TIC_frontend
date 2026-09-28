import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Cargo } from '../../domain/models/cargo.model';
import { HttpCargoRepository } from '../../infrastructure/adapters/http-cargo.repository';

@Injectable({ providedIn: 'root' })
export class CreateCargoUseCase {
  constructor(private cargoRepo: HttpCargoRepository) {}

  execute(nombre: string, estado?: string): Observable<Cargo> {
    return this.cargoRepo.create(nombre, estado);
  }
}
