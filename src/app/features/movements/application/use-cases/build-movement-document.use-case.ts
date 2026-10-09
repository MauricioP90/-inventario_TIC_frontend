import { Injectable, inject } from '@angular/core';
import { Movement } from '../../domain/models/movement.model';
import { Location } from '../../../locations/domain/models/location.model';
import { OfficialDocumentData, TipoDocumentoOficial, PrestamoDispositivoData } from '../../domain/models/document-template.model';
import { OFFICIAL_DOCUMENT_TEMPLATES } from '../../domain/models/document-templates.config';
import { DocumentPolicyService } from '../../domain/services/document-policy.service';
import { RoleService } from '../../../../core/auth/services/role.service';

@Injectable({
  providedIn: 'root'
})
export class BuildMovementDocumentUseCase {
  private readonly policy = inject(DocumentPolicyService);
  private readonly roleService = inject(RoleService);

  execute(
    movement: Movement, 
    tipoOverride?: TipoDocumentoOficial,
    customObservaciones?: string,
    destinationLocation?: Location | null,
    receiverIdentificacion?: string,
    prestamoData?: PrestamoDispositivoData
  ): OfficialDocumentData {
    // 1. Determinar el tipo de documento (sugerido por el dominio o forzado por el usuario)
    const tipo = tipoOverride || this.policy.sugerirTipoDocumento(movement, destinationLocation);
    const config = OFFICIAL_DOCUMENT_TEMPLATES[tipo];
    const consecutivo = this.policy.generarConsecutivo(tipo, movement.id);

    // 2. Mapear quién elabora desde la sesión activa de Keycloak
    const elaboradoPor = {
      nombre: this.roleService.userName(),
      cargo: this.roleService.userRoleLabel(),
      email: ''
    };

    // 3. Mapear el receptor (colaborador, contratista o taller)
    const targetPerson = movement.responsible || movement.receiver;
    let autoDoc = '';
    if (targetPerson?.numeroDocumento) {
      autoDoc = targetPerson.tipoDocumento ? `${targetPerson.tipoDocumento} ${targetPerson.numeroDocumento}` : targetPerson.numeroDocumento;
    } else if (targetPerson?.identificacion) {
      autoDoc = targetPerson.identificacion;
    }

    const cargoStr = typeof targetPerson?.cargo === 'object' ? targetPerson?.cargo?.nombre : (targetPerson?.cargo || 'Custodio Asignado');
    const areaStr = typeof targetPerson?.area === 'object' ? targetPerson?.area?.nombre : (targetPerson?.area || 'Área Operativa');

    const entregadoA = {
      nombre: targetPerson?.nombre || 'Personal Autorizado',
      identificacion: receiverIdentificacion || autoDoc,
      cargo: cargoStr || 'Custodio Asignado',
      area: areaStr || 'Área Operativa',
      sede: destinationLocation?.nombre || movement.destinationLocation?.nombre || 'Sede Destino',
      tipoVinculacion: destinationLocation?.tipo || movement.destinationLocation?.tipo || 'OFICINA_PROPIA'
    };

    // 4. Mapear los activos vinculados con sus datos técnicos
    const activos = (movement.activos || []).map(a => {
      let simCardStr: string | null = null;
      if (a.simCards && a.simCards.length > 0) {
        simCardStr = a.simCards.map((s: any) => `${s.numero} (${s.operador})`).join(', ');
      } else if (a.simCard) {
        simCardStr = `${a.simCard.numero} (${a.simCard.operador})`;
      }
      return {
        placa: a.placa,
        tipo: a.tipoActivo?.nombre || 'Activo Tecnológico',
        marca: a.marca || 'N/A',
        modelo: a.modelo || 'N/A',
        serial: a.serial || 'S/N',
        estado: a.estado || 'OPERACION',
        simCard: simCardStr
      };
    });

    // 5. Mapear las SIM Cards vinculadas directamente al movimiento (ej: SIM_TRASLADO)
    const simCards = (movement.simCards || []).map((s: any) => ({
      numero: s.numero || 'N/A',
      iccid: s.iccid || 'N/A',
      operador: s.operador || 'N/A',
      estado: s.estado || 'EN_TRANSITO'
    }));

    const resolvedCiudad = destinationLocation?.ciudad || movement.destinationLocation?.ciudad || 'Bogotá D.C.';

    return {
      consecutivo,
      fechaEmision: movement.createdAt || new Date(),
      ciudad: resolvedCiudad,
      config,
      partes: {
        elaboradoPor,
        entregadoA
      },
      activos,
      simCards,
      observacionesGenerales: customObservaciones !== undefined ? customObservaciones : (movement.notes || ''),
      movementId: movement.id,
      prestamoData
    };
  }
}
