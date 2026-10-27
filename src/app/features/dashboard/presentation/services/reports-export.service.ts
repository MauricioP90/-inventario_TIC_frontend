import { Injectable } from '@angular/core';
import { Movement, MOVEMENT_TYPE_LABELS, MovementStatus } from '../../../movements/domain/models/movement.model';
import { Activo } from '../../../inventory/domain/models/activo.model';
import { MaintenanceReport } from '../../../maintenance/domain/models/maintenance.model';

@Injectable({
  providedIn: 'root'
})
export class ReportsExportService {
  formatDateTimeForCSV(dateVal: any): string {
    if (!dateVal) return 'N/A';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'N/A';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  formatDateOnlyForCSV(dateVal: any): string {
    if (!dateVal) return 'N/A';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'N/A';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getMovementTypeLabel(type: string): string {
    return MOVEMENT_TYPE_LABELS[type] || type;
  }

  getMovementStatusLabel(status: MovementStatus): string {
    const labels: Record<MovementStatus, string> = {
      [MovementStatus.PENDING]: 'En Curso',
      [MovementStatus.EN_TRANSIT]: 'En Tránsito',
      [MovementStatus.RECEIVED]: 'Recibido',
      [MovementStatus.CANCELLED]: 'Cancelado'
    };
    return labels[status] || status;
  }

  exportMovementsToCSV(movements: Movement[]) {
    const filename = `auditoria_traslados_${new Date().toISOString().split('T')[0]}.csv`;
    let csvContent = '\uFEFF';
    const headers = ['Fecha', 'ID Traslado', 'Tipo Movimiento', 'Activos', 'SIM Cards', 'Origen', 'Destino', 'Estado', 'Notas', 'Comodato/Acta URL', 'Soporte Envío URL', 'Soporte Recepción URL'];
    csvContent += headers.join(';') + '\n';

    movements.forEach(m => {
      const date = this.formatDateTimeForCSV(m.createdAt);
      const id = m.id.slice(-8);
      const type = this.getMovementTypeLabel(m.type);
      const activos = (m.activos || []).map((a: any) => `${a.placa} (${a.marca} ${a.modelo})`).join(', ');
      const sims = (m.simCards || []).map((s: any) => `${s.numero} (${s.operador})`).join(', ');
      const origin = m.originLocation?.nombre || 'N/A';
      const dest = m.destinationLocation?.nombre || 'N/A';
      const status = this.getMovementStatusLabel(m.status);
      const notes = m.notes || '';
      const documentUrl = m.documentUrl || '';
      const evidenceUrl = m.evidenceUrl || '';
      const receivedEvidenceUrl = m.receivedEvidenceUrl || '';

      const row = [date, id, type, activos, sims, origin, dest, status, notes, documentUrl, evidenceUrl, receivedEvidenceUrl]
        .map(val => `"${val.replace(/"/g, '""')}"`);
      csvContent += row.join(';') + '\n';
    });

    this.downloadCSV(csvContent, filename);
  }

  exportAltasToCSV(altas: Activo[], typeMap: Record<string, any>, isAdmin: boolean) {
    const filename = `historial_altas_${new Date().toISOString().split('T')[0]}.csv`;
    let csvContent = '\uFEFF';
    const headers = ['Fecha Ingreso', 'Placa', 'Tipo Activo', 'Marca', 'Modelo', 'Serial', 'Ubicación', 'URL Factura', 'Valor Compra'];
    csvContent += headers.join(';') + '\n';

    altas.forEach(a => {
      const date = this.formatDateOnlyForCSV(a.fechaIngreso);
      const placa = a.placa;
      const type = typeMap[a.tipoActivoId]?.label || a.tipoActivoId;
      const marca = a.marca || '';
      const modelo = a.modelo || '';
      const serial = a.serial || '';
      const location = a.location?.nombre || 'Bodega/Disponible';
      const facturaUrl = a.facturaUrl || '';
      const valCompra = isAdmin ? (a.precioCompra || 0) : 'RESTRINGIDO';

      const row = [date, placa, type, marca, modelo, serial, location, facturaUrl, valCompra]
        .map(val => `"${String(val).replace(/"/g, '""')}"`);
      csvContent += row.join(';') + '\n';
    });

    this.downloadCSV(csvContent, filename);
  }

  exportMantenimientosToCSV(
    mantenimientos: MaintenanceReport[],
    getActivoPlate: (id: string) => string,
    getActivoDetails: (id: string) => string
  ) {
    const filename = `costos_mantenimiento_${new Date().toISOString().split('T')[0]}.csv`;
    let csvContent = '\uFEFF';
    const headers = ['Fecha Cierre', 'Placa', 'Equipo', 'Diagnóstico/Acciones', 'Modalidad', 'Técnico/Proveedor', 'Costo Estimado', 'Costo Final'];
    csvContent += headers.join(';') + '\n';

    mantenimientos.forEach(rep => {
      const date = this.formatDateOnlyForCSV(rep.fechaCierre);
      const placa = getActivoPlate(rep.activoId);
      const equipo = getActivoDetails(rep.activoId);
      const diag = rep.diagnostico || '';
      const mod = rep.modalidad || '';
      const tech = rep.tecnicoResponsable || rep.proveedorServicio || 'No asignado';
      const costoEst = rep.costoEstimado || 0;
      const costoFin = rep.costoFinal || 0;

      const row = [date, placa, equipo, diag, mod, tech, costoEst, costoFin]
        .map(val => `"${String(val).replace(/"/g, '""')}"`);
      csvContent += row.join(';') + '\n';
    });

    this.downloadCSV(csvContent, filename);
  }

  private downloadCSV(csvContent: string, filename: string) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}
