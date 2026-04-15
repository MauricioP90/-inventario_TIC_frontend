import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SimCard } from '../../domain/models/sim-card.model';
import { SimCardRepository } from '../../domain/repositories/sim-card.repository';

@Injectable({ providedIn: 'root' })
export class GetAllSimCardsUseCase {
  constructor(private repo: SimCardRepository) { }
  execute(): Observable<SimCard[]> { return this.repo.findAll(); }
}
