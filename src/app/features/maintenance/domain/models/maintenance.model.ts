export enum ModalidadMantenimiento {
  INTERNO = 'INTERNO',
  EXTERNO = 'EXTERNO',
  INTERNO_ESCALADO = 'INTERNO_ESCALADO'
}

export enum TipoMantenimiento {
  PREVENTIVO = 'PREVENTIVO',
  CORRECTIVO = 'CORRECTIVO'
}

export enum EstadoFicha {
  PENDIENTE_DIAGNOSTICO = 'PENDIENTE_DIAGNOSTICO',
  EN_PROCESO = 'EN_PROCESO',
  REQUIERE_AUTORIZACION = 'REQUIERE_AUTORIZACION',
  ENVIADO_PROVEEDOR = 'ENVIADO_PROVEEDOR',
  CERRADO = 'CERRADO'
}

export enum ResultadoFinal {
  REPARADO = 'REPARADO',
  IRREPARABLE = 'IRREPARABLE',
  SIN_FALLAS = 'SIN_FALLAS'
}

export const ESTADO_FICHA_LABELS: Record<EstadoFicha, string> = {
  [EstadoFicha.PENDIENTE_DIAGNOSTICO]: 'Pendiente Diagnóstico',
  [EstadoFicha.EN_PROCESO]: 'En Proceso',
  [EstadoFicha.REQUIERE_AUTORIZACION]: 'Requiere Autorización',
  [EstadoFicha.ENVIADO_PROVEEDOR]: 'Enviado a Proveedor',
  [EstadoFicha.CERRADO]: 'Cerrado'
};

export const ESTADO_FICHA_COLORS: Record<EstadoFicha, string> = {
  [EstadoFicha.PENDIENTE_DIAGNOSTICO]: '#f59e0b',
  [EstadoFicha.EN_PROCESO]: '#3b82f6',
  [EstadoFicha.REQUIERE_AUTORIZACION]: '#ef4444',
  [EstadoFicha.ENVIADO_PROVEEDOR]: '#8b5cf6',
  [EstadoFicha.CERRADO]: '#10b981'
};

export interface MaintenanceReport {
  id: string;
  activoId: string;
  modalidad: ModalidadMantenimiento;
  tipoMantenimiento: TipoMantenimiento;
  estado: EstadoFicha;
  diagnostico?: string;
  accionesRealizadas?: string;
  repuestosUsados?: string;
  costoEstimado?: number;
  costoFinal?: number;
  cubiertoPorGarantia?: boolean;
  tecnicoResponsable?: string;
  escalaAProveedor?: boolean;
  motivoEscalacion?: string;
  fechaEscalacion?: string;
  proveedorServicio?: string;
  referenciaOrdenServicio?: string;
  soporteProveedorUrl?: string;
  soporteAutorizacionUrl?: string;
  resultadoFinal?: ResultadoFinal;
  movimientoOrigenId?: string;
  fechaApertura?: string;
  fechaInicioInterno?: string;
  fechaDiagnostico?: string;
  fechaEnvioProveedor?: string;
  fechaRetornoProveedor?: string;
  fechaCierre?: string;
}

export type CreateMaintenanceReportDto = {
  activoId: string;
  modalidad: ModalidadMantenimiento;
  tipoMantenimiento: TipoMantenimiento;
  movimientoOrigenId?: string;
  costoEstimado?: number;
  tecnicoResponsable?: string;
};

export type UpdateMaintenanceReportDto = {
  accion: 'iniciar' | 'escalar' | 'retorno_proveedor' | 'solicitar_autorizacion' | 'aprobar' | 'cerrar' | 'actualizar';
  diagnostico?: string;
  tecnicoResponsable?: string;
  motivoEscalacion?: string;
  proveedorServicio?: string;
  referenciaOrdenServicio?: string;
  soporteProveedorUrl?: string;
  soporteAutorizacionUrl?: string;
  resultadoFinal?: ResultadoFinal;
  accionesRealizadas?: string;
  costoFinal?: number;
  repuestosUsados?: string;
  costoEstimado?: number;
  cubiertoPorGarantia?: boolean;
};
