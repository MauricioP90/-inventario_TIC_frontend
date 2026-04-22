import { Location } from "../../../locations/domain/models/location.model";
import { Responsable } from "../../../responsables/domain/models/responsable.model";

export interface Activo {
  id: string;
  placa: string;
  tipo: string;
  marca: string;
  modelo: string;
  serial: string;
  estado: 'BODEGA' | 'OPERACION' | 'MANTENIMIENTO' | 'BAJA';
  fechaIngreso: string;
  locationId: string;
  responsibleId: string;
  facturaUrl?: string;
  location?: Location;
  responsible?: Responsable;
}

export type CreateActivoDto = Omit<Activo, 'id'>;
export type UpdateActivoDto = Partial<CreateActivoDto>;
