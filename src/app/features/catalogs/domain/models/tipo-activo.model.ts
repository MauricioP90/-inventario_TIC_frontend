export interface TipoActivo {
  id: string;
  nombre: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface CreateTipoActivoDto {
  nombre: string;
  estado?: 'ACTIVO' | 'INACTIVO';
}

export interface UpdateTipoActivoDto {
  nombre?: string;
  estado?: 'ACTIVO' | 'INACTIVO';
}
