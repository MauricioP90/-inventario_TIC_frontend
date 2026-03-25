import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Activo, CreateActivoDto, UpdateActivoDto } from '../../domain/models/activo.model';
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

  getByPlaca(placa: string): Observable<Activo> {
    return this.http.get<Activo>(`${this.apiUrl}/${placa}`);
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
}