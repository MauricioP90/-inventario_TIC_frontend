import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Responsable, CreateResponsableDto, UpdateResponsableDto } from '../../domain/models/responsable.model';
import { ResponsableRepository } from '../../domain/repositories/responsable.repository';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HttpResponsableRepository implements ResponsableRepository {
  private apiUrl = `${environment.apiUrl}/responsibles`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Responsable[]> {
    return this.http.get<Responsable[]>(this.apiUrl);
  }
  getById(id: string): Observable<Responsable> {
    return this.http.get<Responsable>(`${this.apiUrl}/${id}`);
  }
  getStats(id: string): Observable<{ totalActivos: number, totalSIMCards: number }> {
    return this.http.get<{ totalActivos: number, totalSIMCards: number }>(`${this.apiUrl}/${id}/stats`);
  }
  create(responsable: CreateResponsableDto): Observable<Responsable> {
    return this.http.post<Responsable>(this.apiUrl, responsable);
  }
  update(id: string, responsable: UpdateResponsableDto): Observable<Responsable> {
    return this.http.put<Responsable>(`${this.apiUrl}/${id}`, responsable);
  }
  inactive(id: string): Observable<Responsable> {
    return this.http.patch<Responsable>(`${this.apiUrl}/${id}/inactive`, {});
  }
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
