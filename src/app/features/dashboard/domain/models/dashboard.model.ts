export interface StateDistribution {
  total: number;
  disponible: number;
  asignado: number;
  mantenimiento: number;
  baja: number;
  enTransito: number;
  rechazado: number;
}

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
  /** Desglose jerárquico: tipo → modelo → {disponible, asignado} */
  modelStacked: Record<string, Record<string, { disponible: number; asignado: number }>>;
  /** Desglose jerárquico: tipo → modelo → cantidad en mantenimiento */
  modelMantenimiento: Record<string, Record<string, number>>;
  /** Desglose jerárquico: tipo → modelo → cantidad dados de baja */
  modelBaja: Record<string, Record<string, number>>;
  /** Desglose completo de estados por tipo de activo */
  stateDistributionByType?: Record<string, StateDistribution>;
  /** Desglose completo de estados por modelo agrupado por tipo: tipo -> modelo -> estados */
  stateDistributionByModel?: Record<string, Record<string, StateDistribution>>;
}
