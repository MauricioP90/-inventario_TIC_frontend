import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Movement, CreateMovementDto } from '../../domain/models/movement.model';
import { MovementRepository } from '../../domain/repositories/movement.repository';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HttpMovementRepository implements MovementRepository {
  private apiUrl = `${environment.apiUrl}/movements`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Movement[]> {
    return this.http.get<Movement[]>(this.apiUrl);
  }
  getById(id: string): Observable<Movement> {
    return this.http.get<Movement>(`${this.apiUrl}/${id}`);
  }
  create(movement: CreateMovementDto): Observable<Movement> {
    return this.http.post<Movement>(this.apiUrl, movement);
  }
}
