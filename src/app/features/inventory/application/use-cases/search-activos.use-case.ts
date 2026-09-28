import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SearchActivosFilters, SearchActivosResponse } from '../../domain/models/activo.model';
import { ActivoRepository } from '../../domain/repositories/activo.repository';

@Injectable({
  providedIn: 'root'
})
export class SearchActivosUseCase {
  constructor(private repository: ActivoRepository) { }

  execute(filters: SearchActivosFilters): Observable<SearchActivosResponse> {
    return this.repository.search(filters);
  }
}
