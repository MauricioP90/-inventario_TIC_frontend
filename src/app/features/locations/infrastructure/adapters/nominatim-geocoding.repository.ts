import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { GeocodingRepository } from '../../domain/repositories/geocoding.repository';

@Injectable({
  providedIn: 'root'
})
export class NominatimGeocodingRepository implements GeocodingRepository {
  constructor(private http: HttpClient) {}

  reverseGeocode(lat: number, lon: number): Observable<string> {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=es`;
    return this.http.get<any>(url).pipe(
      map(data => data.display_name || 'Dirección no encontrada'),
      catchError(() => of('Error al geolocalizar'))
    );
  }
}
