import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Responsable, CreateResponsableDto, UpdateResponsableDto } from '../../domain/models/responsable.model';
import { ResponsableRepository } from '../../domain/repositories/responsable.repository';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HttpResponsableRepository implements ResponsableRepository {
  private apiUrl = `${environment.apiUrl}/responsables`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Responsable[]> {
    return this.http.get<Responsable[]>(this.apiUrl);
  }
  getById(id: string): Observable<Responsable> {
    return this.http.get<Responsable>(`${this.apiUrl}/${id}`);
  }
  create(responsable: CreateResponsableDto): Observable<Responsable> {
    return this.http.post<Responsable>(this.apiUrl, responsable);
  }
  update(id: string, responsable: UpdateResponsableDto): Observable<Responsable> {
    return this.http.patch<Responsable>(`${this.apiUrl}/${id}`, responsable);
  }
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
