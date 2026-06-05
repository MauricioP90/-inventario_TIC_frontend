import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GeocodingRepository } from '../../domain/repositories/geocoding.repository';

@Injectable({
  providedIn: 'root'
})
export class ReverseGeocodeUseCase {
  constructor(private geocodingRepository: GeocodingRepository) {}

  execute(lat: number, lon: number): Observable<string> {
    return this.geocodingRepository.reverseGeocode(lat, lon);
  }
}
