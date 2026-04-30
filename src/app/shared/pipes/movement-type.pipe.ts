import { Pipe, PipeTransform } from '@angular/core';
import { MOVEMENT_TYPE_LABELS } from '../../features/movements/domain/models/movement.model';

@Pipe({
  name: 'movementTypeLabel',
  standalone: true
})
export class MovementTypePipe implements PipeTransform {
  transform(value: string | undefined | null): string {
    if (!value) return 'Desconocido';
    return MOVEMENT_TYPE_LABELS[value] || value;
  }
}
