import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Location } from '../../domain/models/location.model';
import { LocationRepository } from '../../domain/repositories/location.repository';

@Injectable({
  providedIn: 'root'
})
export class GetAllLocationsUseCase {
  constructor(private locationRepository: LocationRepository) { }

  execute(): Observable<Location[]> {
    return this.locationRepository.getAll();
  }
}
