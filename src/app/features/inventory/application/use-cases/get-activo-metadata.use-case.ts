import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivoRepository } from '../../domain/repositories/activo.repository';
import { ActivoMetadata } from '../../domain/models/activo.model';

@Injectable({ providedIn: 'root' })
export class GetActivoMetadataUseCase {
    constructor(private repository: ActivoRepository) { }

    execute(): Observable<ActivoMetadata> {
        return this.repository.getMetadata();
    }
}