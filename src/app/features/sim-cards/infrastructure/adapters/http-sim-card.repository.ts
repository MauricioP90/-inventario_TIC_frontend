import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SimCard, CreateSimCardDto, UpdateSimCardDto } from '../../domain/models/sim-card.model';
import { SimCardRepository } from '../../domain/repositories/sim-card.repository';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HttpSimCardRepository implements SimCardRepository {
  private apiUrl = `${environment.apiUrl}/sim-cards`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<SimCard[]> {
    return this.http.get<SimCard[]>(this.apiUrl);
  }
  getById(id: string): Observable<SimCard> {
    return this.http.get<SimCard>(`${this.apiUrl}/${id}`);
  }
  create(simCard: CreateSimCardDto): Observable<SimCard> {
    return this.http.post<SimCard>(this.apiUrl, simCard);
  }
  update(id: string, simCard: UpdateSimCardDto): Observable<SimCard> {
    return this.http.patch<SimCard>(`${this.apiUrl}/${id}`, simCard);
  }
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
