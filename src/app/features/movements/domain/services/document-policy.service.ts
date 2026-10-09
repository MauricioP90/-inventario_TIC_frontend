import { Injectable } from '@angular/core';
import { Movement } from '../models/movement.model';
import { Location } from '../../../locations/domain/models/location.model';
import { TipoDocumentoOficial } from '../models/document-template.model';

@Injectable({
  providedIn: 'root'
})
export class DocumentPolicyService {
  /**
   * Regla de Negocio Pura (DDD Domain Service):
   * Determina automáticamente el tipo de documento legal aplicable según el destino,
   * tipo de sede y naturaleza del movimiento.
   */
  sugerirTipoDocumento(movement: Movement, destinationLocation?: Location | null): TipoDocumentoOficial {
    const destTipo = destinationLocation?.tipo || movement.destinationLocation?.tipo;
    const movType = (movement.type || '').toUpperCase();

    // 1. Si va hacia un Proveedor externo / taller técnico -> Guía de Remisión
    if (destTipo === 'PROVEEDOR' || movType.includes('PROVEEDOR')) {
      return 'GUIA_REMISION';
    }

    // 2. Si va hacia una Agencia Tercerizada / Contratista -> Contrato de Comodato
    if (destTipo === 'CONTRATISTA') {
      return 'COMODATO';
    }

    // 3. Si va hacia un Punto TI (Retorno, baja, reintegro o salida de custodia) -> Paz y Salvo / Devolución
    if (destTipo === 'PUNTO_TI' || destTipo === 'BODEGA' || movType.includes('RETORNO') || movType.includes('BAJA')) {
      return 'PAZ_Y_SALVO';
    }

    // 4. Por defecto para colaboradores y sedes propias directas -> Acta de Entrega Laboral
    return 'ACTA_ENTREGA';
  }

  /**
   * Genera un consecutivo formal legible para el documento.
   * Formato: TIPO-AÑO-ID6 (ej: ACT-2026-A1B2C3)
   */
  generarConsecutivo(tipo: TipoDocumentoOficial, movementId: string): string {
    const year = new Date().getFullYear();
    const shortId = (movementId || 'TEMP').slice(-6).toUpperCase();
    const prefijos: Record<TipoDocumentoOficial, string> = {
      ACTA_ENTREGA: 'ACT',
      COMODATO: 'COM',
      PAZ_Y_SALVO: 'PYS',
      GUIA_REMISION: 'GUI',
      PRESTAMO_DISPOSITIVO: 'PRE'
    };
    return `${prefijos[tipo] || 'DOC'}-${year}-${shortId}`;
  }
}
