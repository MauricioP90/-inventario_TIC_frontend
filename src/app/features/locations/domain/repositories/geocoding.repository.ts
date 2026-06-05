import { Observable } from 'rxjs';

export abstract class GeocodingRepository {
  abstract reverseGeocode(lat: number, lon: number): Observable<string>;
}
