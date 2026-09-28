import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Activo,
  CreateActivoDto,
  UpdateActivoDto,
  ActivoMetadata,
  SearchActivosFilters,
  SearchActivosResponse
} from '../../domain/models/activo.model';
import { ActivoRepository } from '../../domain/repositories/activo.repository';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HttpActivoRepository implements ActivoRepository {
  // Aquí usamos la URL del backend + /activos
  private apiUrl = `${environment.apiUrl}/activos`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<Activo[]> {
    return this.http.get<Activo[]>(this.apiUrl);
  }

  search(filters: SearchActivosFilters): Observable<SearchActivosResponse> {
    let params = new HttpParams();
    if (filters.search && filters.search.trim()) {
      params = params.set('search', filters.search.trim());
    }
    if (filters.tipoActivoId) {
      params = params.set('tipoActivoId', filters.tipoActivoId);
    }
    if (filters.locationId) {
      params = params.set('locationId', filters.locationId);
    }
    if (filters.responsibleId) {
      params = params.set('responsibleId', filters.responsibleId);
    }
    if (filters.estado) {
      params = params.set('estado', filters.estado);
    }
    if (filters.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters.limit) {
      params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<SearchActivosResponse>(this.apiUrl, { params });
  }

  getByPlaca(placa: string): Observable<Activo> {
    return this.http.get<Activo>(`${this.apiUrl}/${placa}`);
  }

  getMetadata(): Observable<ActivoMetadata> {
    return this.http.get<ActivoMetadata>(`${this.apiUrl}/metadata`);
  }

  create(activo: CreateActivoDto): Observable<Activo> {
    return this.http.post<Activo>(this.apiUrl, activo);
  }

  update(placa: string, activo: UpdateActivoDto): Observable<Activo> {
    return this.http.put<Activo>(`${this.apiUrl}/${placa}`, activo);
  }

  delete(placa: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${placa}`);
  }

  createTipoActivo(nombre: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/types`, { nombre, estado: 'ACTIVO' });
  }
}