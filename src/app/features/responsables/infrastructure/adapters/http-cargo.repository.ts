import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cargo } from '../../domain/models/cargo.model';
import { CargoRepository } from '../../domain/repositories/cargo.repository';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HttpCargoRepository implements CargoRepository {
  private apiUrl = `${environment.apiUrl}/cargos`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Cargo[]> {
    return this.http.get<Cargo[]>(this.apiUrl);
  }

  create(nombre: string, estado?: string): Observable<Cargo> {
    return this.http.post<Cargo>(this.apiUrl, { nombre, estado });
  }

  update(id: string, nombre?: string, estado?: string): Observable<Cargo> {
    return this.http.put<Cargo>(`${this.apiUrl}/${id}`, { nombre, estado });
  }

  toggleStatus(id: string): Observable<Cargo> {
    return this.http.patch<Cargo>(`${this.apiUrl}/${id}/toggle`, {});
  }
}
