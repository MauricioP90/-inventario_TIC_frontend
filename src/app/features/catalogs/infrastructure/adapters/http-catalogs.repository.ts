import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CatalogsRepository } from '../../domain/repositories/catalogs.repository';
import { TipoActivo, CreateTipoActivoDto, UpdateTipoActivoDto } from '../../domain/models/tipo-activo.model';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HttpCatalogsRepository implements CatalogsRepository {
  private baseUrl = `${environment.apiUrl}/activos/types`;

  constructor(private http: HttpClient) {}

  getAllTipos(): Observable<TipoActivo[]> {
    return this.http.get<TipoActivo[]>(this.baseUrl);
  }

  createTipo(dto: CreateTipoActivoDto): Observable<TipoActivo> {
    return this.http.post<TipoActivo>(this.baseUrl, { ...dto, estado: dto.estado ?? 'ACTIVO' });
  }

  updateTipo(id: string, dto: UpdateTipoActivoDto): Observable<TipoActivo> {
    return this.http.put<TipoActivo>(`${this.baseUrl}/${id}`, dto);
  }
}
