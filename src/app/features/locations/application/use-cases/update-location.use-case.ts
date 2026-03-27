import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Location, UpdateLocationDto } from '../../domain/models/location.model';
import { LocationRepository } from '../../domain/repositories/location.repository';

@Injectable({
  providedIn: 'root'
})
export class UpdateLocationUseCase {
  constructor(private locationRepository: LocationRepository) { }

  execute(code: string, location: UpdateLocationDto): Observable<Location> {
    return this.locationRepository.update(code, location);
  }
}
