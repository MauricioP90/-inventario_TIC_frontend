import { Observable } from 'rxjs';

export interface GeocodingResult {
  address: string;
  city: string;
}

export abstract class GeocodingRepository {
  abstract reverseGeocode(lat: number, lon: number): Observable<GeocodingResult>;
}
