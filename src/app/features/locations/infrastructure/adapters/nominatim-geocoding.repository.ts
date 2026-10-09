import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { GeocodingRepository, GeocodingResult } from '../../domain/repositories/geocoding.repository';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NominatimGeocodingRepository implements GeocodingRepository {
  constructor(private http: HttpClient) {}

  reverseGeocode(lat: number, lon: number): Observable<GeocodingResult> {
    const url = `${environment.apiUrl}/locations/reverse-geocode?lat=${lat}&lon=${lon}`;
    return this.http.get<{ address: string; city?: string }>(url).pipe(
      map(data => ({
        address: data.address || 'Dirección no encontrada',
        city: data.city || ''
      })),
      catchError(() => of({ address: 'Error al geolocalizar', city: '' }))
    );
  }
}
