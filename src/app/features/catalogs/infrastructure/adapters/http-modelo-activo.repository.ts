import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ModeloActivoRepository } from '../../domain/repositories/modelo-activo.repository';
import { ModeloActivo, CreateModeloActivoDto, UpdateModeloActivoDto } from '../../domain/models/modelo-activo.model';

@Injectable({ providedIn: 'root' })
export class HttpModeloActivoRepository implements ModeloActivoRepository {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/modelos-activos`;

  getAll(tipoActivoId?: string): Observable<ModeloActivo[]> {
    let params = new HttpParams();
    if (tipoActivoId) {
      params = params.set('tipoActivoId', tipoActivoId);
    }
    return this.http.get<ModeloActivo[]>(this.baseUrl, { params });
  }

  create(dto: CreateModeloActivoDto): Observable<ModeloActivo> {
    return this.http.post<ModeloActivo>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdateModeloActivoDto): Observable<ModeloActivo> {
    return this.http.put<ModeloActivo>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
