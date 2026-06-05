export interface DashboardMetrics {
  totalCount: number;
  disponibleCount: number;
  asignadoCount: number;
  mantenimientoCount: number;
  bajaCount: number;
  typeStacked: Record<string, { disponible: number; asignado: number }>;
  typeBaja: Record<string, number>;
}
