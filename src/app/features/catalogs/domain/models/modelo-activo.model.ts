export interface ModeloActivo {
  id: string;
  tipoActivoId: string;
  marca: string;
  modelo: string;
  estado: 'ACTIVO' | 'INACTIVO';
  createdAt?: string;
}

export interface CreateModeloActivoDto {
  tipoActivoId: string;
  marca: string;
  modelo: string;
  estado?: 'ACTIVO' | 'INACTIVO';
}

export interface UpdateModeloActivoDto {
  tipoActivoId?: string;
  marca?: string;
  modelo?: string;
  estado?: 'ACTIVO' | 'INACTIVO';
}
