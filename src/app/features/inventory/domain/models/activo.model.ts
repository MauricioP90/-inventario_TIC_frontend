import { Location } from "../../../locations/domain/models/location.model";
import { Responsable } from "../../../responsables/domain/models/responsable.model";

export enum EstadoActivo {
  BODEGA = 'BODEGA',
  OPERACION = 'OPERACION',
  MANTENIMIENTO = 'MANTENIMIENTO',
  BAJA = 'BAJA'
}

export interface ActivoMetadata {
  statuses: { id: EstadoActivo; label: string }[];
  types: { id: string; label: string }[];
}

export interface Activo {
  id: string;
  placa: string;
  tipoActivoId: string;
  marca: string;
  modelo: string;
  serial: string;
  estado: EstadoActivo;
  fechaIngreso: string;
  locationId: string;
  responsibleId: string;
  facturaUrl?: string;
  location?: Location;
  responsible?: Responsable;
}

export type CreateActivoDto = Omit<Activo, 'id' | 'tipoActivo' | 'location' | 'responsible'>;
export type UpdateActivoDto = Partial<CreateActivoDto>;
