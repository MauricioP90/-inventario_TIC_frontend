export interface TipoActivo {
  id: string;
  nombre: string;
  estado: 'ACTIVO' | 'INACTIVO';
  admiteSoftware?: boolean;
  admiteTelemetria?: boolean;
  admiteSim?: boolean;
}

export interface CreateTipoActivoDto {
  nombre: string;
  estado?: 'ACTIVO' | 'INACTIVO';
  admiteSoftware?: boolean;
  admiteTelemetria?: boolean;
  admiteSim?: boolean;
}

export interface UpdateTipoActivoDto {
  nombre?: string;
  estado?: 'ACTIVO' | 'INACTIVO';
  admiteSoftware?: boolean;
  admiteTelemetria?: boolean;
  admiteSim?: boolean;
}
