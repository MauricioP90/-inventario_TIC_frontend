import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SimCard, UpdateSimCardDto } from '../../domain/models/sim-card.model';
import { SimCardRepository } from '../../domain/repositories/sim-card.repository';

@Injectable({ providedIn: 'root' })
export class UpdateSimCardUseCase {
    constructor(private repo: SimCardRepository) { }
    execute(id: string, dto: UpdateSimCardDto): Observable<SimCard> {
        return this.repo.update(id, dto);
    }
}
