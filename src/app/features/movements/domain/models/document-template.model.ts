export type TipoDocumentoOficial = 
  | 'ACTA_ENTREGA' 
  | 'GUIA_REMISION'
  | 'PRESTAMO_DISPOSITIVO'
  | 'REINTEGRO_DISPOSITIVO'
  | 'MEMORANDO_REINTEGRO'
  | 'MEMORANDO_PRESTAMO'
  | 'COMODATO';

export interface DocumentClausula {
  num: number;
  titulo: string;
  texto: string;
}

export interface OfficialDocumentConfig {
  tipo: TipoDocumentoOficial;
  titulo: string;
  subtitulo: string;
  codigoCalidad: string; // ej. FOR-TIC-001
  version: string;       // ej. Versión 03
  descripcionCabecera: string;
  clausulas: DocumentClausula[];
  compromisoReceptor: string;
}

export interface DocumentPartes {
  elaboradoPor: {
    nombre: string;
    cargo: string;
    email?: string;
  };
  entregadoA: {
    nombre: string;
    identificacion?: string;
    cargo?: string;
    area?: string;
    sede?: string;
    tipoVinculacion?: 'OFICINA_PROPIA' | 'CONTRATISTA' | 'PROVEEDOR' | 'PUNTO_TI' | string;
  };
}

export interface DocumentActivoItem {
  placa: string;
  tipo: string;
  marca: string;
  modelo: string;
  serial: string;
  estado: string;
  simCard?: string | null;
  precioCompra?: number;
}

export interface DocumentSIMCardItem {
  numero: string;
  iccid: string;
  operador: string;
  estado: string;
}

export interface PrestamoDispositivoData {
  fechaContrato: string;
  modeloAveriado?: string;
  serialAveriado?: string;
  placaAveriada?: string;
  cargador: string;
  forro: string;
}

export interface ReintegroDispositivoData {
  fechaContrato: string;
  cargador: string;
  forro: string;
  incluyeDevolucionPrestamo: boolean;
  modeloPrestado?: string;
  serialPrestado?: string;
  placaPrestada?: string;
  fechaEntregaPrestamo?: string;
}

export interface MemorandoDispositivoData {
  modeloAveriado?: string;
  serialAveriado?: string;
  placaAveriada?: string;
  cargador: string;
  forro: string;
}

export interface ComodatoDispositivoData {
  fechaContratoColaboracion: string;
  lugarFecha?: string;
  direccionComodatario?: string;
  ciudadComodatario?: string;
  emailComodatario?: string;
  operadorSim?: string;
  numeroSim?: string;
  valorReposicion?: string;
  valorReposicionLetras?: string;
  estadoBien?: string;
  bienEntregado?: string;
  precioCompra?: number;
}

export interface OfficialDocumentData {
  consecutivo: string;
  fechaEmision: Date | string;
  ciudad: string;
  config: OfficialDocumentConfig;
  partes: DocumentPartes;
  activos: DocumentActivoItem[];
  simCards: DocumentSIMCardItem[];
  observacionesGenerales?: string;
  movementId: string;
  prestamoData?: PrestamoDispositivoData;
  reintegroData?: ReintegroDispositivoData;
  memorandoData?: MemorandoDispositivoData;
  comodatoData?: ComodatoDispositivoData;
}


