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

    // 2. Si es una operación de Reintegro de dispositivo reparado -> Reintegro y/o Devolución
    if (movType.includes('REINTEGRO')) {
      return 'REINTEGRO_DISPOSITIVO';
    }

    // 3. Si es comodato de CS-30 / dispositivo
    if (movType.includes('COMODATO') || movType.includes('CS30') || movType.includes('CS-30')) {
      return 'COMODATO';
    }

    // 4. Si es una entrega temporal de préstamo -> Préstamo de Dispositivo
    if (movType.includes('PRESTAMO')) {
      return 'PRESTAMO_DISPOSITIVO';
    }

    // 5. Por defecto para colaboradores y sedes propias directas -> Acta de Entrega Laboral
    return 'ACTA_ENTREGA';
  }

  /**
   * Genera un consecutivo formal legible para el documento.
   * Formato: TIPO-AÑO-ID6 (ej: ACT-2026-A1B2C3)
   */
  generarConsecutivo(tipo: TipoDocumentoOficial, movementId: string): string {
    const year = new Date().getFullYear();
    const shortYear = year.toString().slice(-2);
    const shortId = (movementId || 'TEMP').slice(-6).toUpperCase();

    if (tipo === 'MEMORANDO_REINTEGRO' || tipo === 'MEMORANDO_PRESTAMO') {
      return `GR-MEM-${shortYear}-${shortId}`;
    }

    const prefijos: Record<TipoDocumentoOficial, string> = {
      ACTA_ENTREGA: 'ACT',
      GUIA_REMISION: 'GUI',
      PRESTAMO_DISPOSITIVO: 'PRE',
      REINTEGRO_DISPOSITIVO: 'REI',
      MEMORANDO_REINTEGRO: 'GR-MEM',
      MEMORANDO_PRESTAMO: 'GR-MEM',
      COMODATO: 'COM'
    };
    return `${prefijos[tipo] || 'DOC'}-${year}-${shortId}`;
  }
}
