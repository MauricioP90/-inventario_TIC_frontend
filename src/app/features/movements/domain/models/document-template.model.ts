export type TipoDocumentoOficial = 
  | 'ACTA_ENTREGA' 
  | 'COMODATO' 
  | 'PAZ_Y_SALVO' 
  | 'GUIA_REMISION'
  | 'PRESTAMO_DISPOSITIVO';

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
}

export interface DocumentSIMCardItem {
  numero: string;
  iccid: string;
  operador: string;
  estado: string;
}

export interface PrestamoDispositivoData {
  fechaContrato: string;
  modeloAveriado: string;
  serialAveriado?: string;
  placaAveriada?: string;
  cargador: string;
  forro: string;
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
}
