import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SimCard, CreateSimCardDto } from '../../domain/models/sim-card.model';
import { SimCardRepository } from '../../domain/repositories/sim-card.repository'

@Injectable({ providedIn: 'root' })
export class CreateSimCardUseCase {
    constructor(private repo: SimCardRepository) { }
    execute(dto: CreateSimCardDto): Observable<SimCard> {
        return this.repo.create(dto);
    }
}