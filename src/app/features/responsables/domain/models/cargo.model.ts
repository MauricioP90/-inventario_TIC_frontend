export interface Cargo {
  id: string;
  nombre: string;
  estado: 'ACTIVO' | 'INACTIVO';
  createdAt?: string;
  updatedAt?: string;
}
