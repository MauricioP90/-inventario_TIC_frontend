import { Location } from "../../../locations/domain/models/location.model";
import { Responsable } from "../../../responsables/domain/models/responsable.model";

export enum EstadoActivo {
  DISPONIBLE = 'DISPONIBLE',
  OPERACION = 'OPERACION',
  MANTENIMIENTO = 'MANTENIMIENTO',
  BAJA = 'BAJA',
  RECHAZADO = 'RECHAZADO',
  EN_TRANSITO = 'EN_TRANSITO'
}

export interface ActivoMetadata {
  statuses: { id: EstadoActivo; label: string }[];
  types: { id: string; label: string }[];
  bodegas: { id: string; nombre: string }[];
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
  simCards?: any[];
  precioCompra?: number;
}

export type CreateActivoDto = Omit<Activo, 'id' | 'tipoActivo' | 'location' | 'responsible'>;
export type UpdateActivoDto = Partial<CreateActivoDto>;
