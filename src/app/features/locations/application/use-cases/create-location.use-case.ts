import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Location, CreateLocationDto } from '../../domain/models/location.model';
import { LocationRepository } from '../../domain/repositories/location.repository';

@Injectable({
  providedIn: 'root'
})
export class CreateLocationUseCase {
  constructor(private locationRepository: LocationRepository) { }

  execute(location: CreateLocationDto): Observable<Location> {
    return this.locationRepository.create(location);
  }
}
