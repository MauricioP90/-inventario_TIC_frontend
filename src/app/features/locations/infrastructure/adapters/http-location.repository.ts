import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Location, CreateLocationDto, UpdateLocationDto } from '../../domain/models/location.model';
import { LocationRepository } from '../../domain/repositories/location.repository';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HttpLocationRepository implements LocationRepository {
  private apiUrl = `${environment.apiUrl}/locations`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<Location[]> {
    return this.http.get<Location[]>(this.apiUrl);
  }

  getByCode(code: string): Observable<Location> {
    return this.http.get<Location>(`${this.apiUrl}/${code}`);
  }

  create(location: CreateLocationDto): Observable<Location> {
    return this.http.post<Location>(this.apiUrl, location);
  }

  update(code: string, location: UpdateLocationDto): Observable<Location> {
    return this.http.put<Location>(`${this.apiUrl}/${code}`, location);
  }
}
