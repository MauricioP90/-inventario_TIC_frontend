export interface DashboardMetrics {
  totalCount: number;
  disponibleCount: number;
  asignadoCount: number;
  mantenimientoCount: number;
  bajaCount: number;
  enTransitoCount: number;
  rechazadoCount: number;
  typeStacked: Record<string, { disponible: number; asignado: number }>;
  typeBaja: Record<string, number>;
  typeMantenimiento: Record<string, number>;
}
