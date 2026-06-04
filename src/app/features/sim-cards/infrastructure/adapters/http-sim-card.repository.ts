import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SimCard, CreateSimCardDto, UpdateSimCardDto } from '../../domain/models/sim-card.model';
import { SimCardRepository } from '../../domain/repositories/sim-card.repository';
import { environment } from '../../../../../environments/environment';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class HttpSimCardRepository implements SimCardRepository {
  private apiUrl = `${environment.apiUrl}/sim-cards`;

  constructor(private http: HttpClient) { }

  findAll(): Observable<SimCard[]> {
    return this.http.get<SimCard[]>(this.apiUrl);
  }
  findById(id: string): Observable<SimCard> {
    return this.http.get<SimCard>(`${this.apiUrl}/${id}`);
  }
  create(simCard: CreateSimCardDto): Observable<SimCard> {
    return this.http.post<SimCard>(this.apiUrl, simCard);
  }
  update(id: string, simCard: UpdateSimCardDto): Observable<SimCard> {
    return this.http.put<SimCard>(`${this.apiUrl}/${id}`, simCard);
  }
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  findByNumero(numero: string): Observable<SimCard> {
    return this.http.get<SimCard>(`${this.apiUrl}/numero/${numero}`);
  }

  findByIccid(iccid: string): Observable<SimCard> {
    return this.http.get<SimCard>(`${this.apiUrl}/iccid/${iccid}`);
  }

  countByResponsible(responsibleId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/count/responsible/${responsibleId}`).pipe(map(res => res.count));
  }

  assign(simCardId: string, placaActivo: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/assign`, { simCardId, placaActivo });
  }
}
