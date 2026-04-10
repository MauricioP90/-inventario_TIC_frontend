import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ResponsableRepository } from '../../domain/repositories/responsable.repository';
import { Role } from '../../domain/models/role.model';

@Injectable({ providedIn: 'root' })
export class GetAllRolesUseCase {
  constructor(private repository: ResponsableRepository) {}

  execute(): Observable<Role[]> {
    return this.repository.getRoles();
  }
}
