import { Component, Input, Output, EventEmitter, inject, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaintenanceReport, ResultadoFinal } from '../../domain/models/maintenance.model';
import { MaintenanceUseCases } from '../../application/use-cases/maintenance.use-cases';
import { Activo } from '../../../inventory/domain/models/activo.model';
import { FileUploadService } from '../../../../core/services/file-upload.service';

@Component({
  selector: 'app-maintenance-workflow-actions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (puedeEditar) {
      <!-- 1. DIAGNÓSTICO E INICIO (Si está PENDIENTE_DIAGNOSTICO) -->
      @if (report.estado === 'PENDIENTE_DIAGNOSTICO') {
        <div class="border border-indigo-100 bg-indigo-50/20 p-4 rounded-xl space-y-3">
          <h4 class="text-sm font-bold text-indigo-900">Iniciar Diagnóstico y Reparación</h4>
          
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-600">Diagnóstico Inicial <span class="text-red-500">*</span></label>
            <textarea [(ngModel)]="diagnostico" rows="3" placeholder="Describa el problema detectado..."
              class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"></textarea>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-slate-600">Técnico Asignado</label>
              <input type="text" [(ngModel)]="tecnicoResponsable"
                class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white" />
            </div>
            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-slate-600">Costo Estimado ($)</label>
              <input type="number" [(ngModel)]="costoEstimado"
                class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white" />
            </div>
          </div>

          <!-- Botones de Acción -->
          <div class="grid grid-cols-2 gap-2 pt-2">
            <button (click)="iniciarReparacion()" [disabled]="saving()"
              class="py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer">
              Iniciar Reparación
            </button>
            <button (click)="descartarSinFallas()" [disabled]="saving()"
              class="py-2 bg-slate-600 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer">
              Descartar / Sin Fallas
            </button>
          </div>
        </div>
      }

      <!-- 2. REGISTRAR ACCIONES, ESCALAR O SOLICITAR AUTORIZACIÓN (Si está EN_PROCESO) -->
      @if (report.estado === 'EN_PROCESO') {
        <!-- Viabilidad Financiera Warning -->
        @if (mostrarAlertaViabilidad()) {
          <div class="bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl p-3 flex gap-2">
            <span class="text-base">⚠️</span>
            <div>
              <p class="font-bold">Alerta de Viabilidad Financiera</p>
              <p class="mt-0.5">El costo de reparación supera el 40% del precio de compra de este equipo. Evalúe si vale la pena proceder.</p>
            </div>
          </div>
        }

        <!-- Reparación Interna -->
        <div class="border border-slate-200 p-4 rounded-xl space-y-3">
          <h4 class="text-sm font-bold text-slate-800">Cierre de Reparación Interna</h4>
          
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-600">Acciones Realizadas <span class="text-red-500">*</span></label>
            <textarea [(ngModel)]="accionesRealizadas" rows="2" placeholder="Qué se le hizo al dispositivo..."
              class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"></textarea>
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-600">Repuestos Usados</label>
            <input type="text" [(ngModel)]="repuestosUsados" placeholder="Ej: Pantalla LCD, Batería"
              class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-slate-600">Costo Final ($) <span class="text-red-500">*</span></label>
              <input type="number" [(ngModel)]="costoFinal" (ngModelChange)="checkCostoViabilidad($event)"
                class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white" />
            </div>
            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-slate-600">Resultado Final</label>
              <select [(ngModel)]="resultadoFinal" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white">
                <option value="REPARADO">Reparado</option>
                <option value="SIN_FALLAS">Sin Fallas (Operativo)</option>
                <option value="IRREPARABLE">Irreparable</option>
              </select>
            </div>
          </div>

          <div class="flex items-center gap-2 pt-1">
            <input type="checkbox" [(ngModel)]="cubiertoPorGarantia" id="warranty" class="rounded text-indigo-600 cursor-pointer" />
            <label for="warranty" class="text-xs text-slate-600 font-medium cursor-pointer">Cubierto por garantía</label>
          </div>

          <!-- Botones de Acción -->
          <div class="grid grid-cols-2 gap-2 pt-2">
            <button (click)="cerrarMantenimiento()" [disabled]="saving()"
              class="py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer">
              Finalizar y Cerrar
            </button>
            @if (requiereAutorizacionPorCosto) {
              <button (click)="solicitarAutorizacion()" [disabled]="saving()"
                class="py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer">
                Solicitar Autorización
              </button>
            }
          </div>
        </div>

        <!-- Escalación a Proveedor -->
        <div class="border border-purple-100 bg-purple-50/10 p-4 rounded-xl space-y-3">
          <h4 class="text-sm font-bold text-purple-900">Escalar a Proveedor Externo</h4>
          
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-600">Motivo de Escalación <span class="text-red-500">*</span></label>
            <input type="text" [(ngModel)]="motivoEscalacion" placeholder="Ej: Requiere micro-soldadura compleja"
              class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-slate-600">Proveedor de Servicio <span class="text-red-500">*</span></label>
              <input type="text" [(ngModel)]="proveedorServicio" placeholder="Ej: Soporte Asus"
                class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white" />
            </div>
            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-slate-600">N° Orden Servicio</label>
              <input type="text" [(ngModel)]="referenciaOrdenServicio" placeholder="Ej: OS-98122"
                class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white" />
            </div>
          </div>

          <!-- File Upload (Soporte Proveedor) -->
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-600">Soporte/Cotización del Proveedor</label>
            <label class="flex flex-col items-center justify-center border border-dashed border-slate-300 rounded-lg p-3 bg-white cursor-pointer hover:bg-slate-50">
              @if (subiendoSoporte()) {
                <span class="text-xs text-slate-400">Subiendo cotización...</span>
              } @else {
                <span class="text-xs text-slate-500">{{ soporteProveedorUrl ? '✓ Soporte cargado' : 'Subir Cotización (PDF/Imagen)' }}</span>
              }
              <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx" (change)="subirSoporteArchivo($event, 'proveedor')" />
            </label>
          </div>

          <button (click)="escalarAProveedor()" [disabled]="saving()"
            class="w-full mt-1 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer">
            Confirmar Envío a Proveedor
          </button>
        </div>
      }

      <!-- 3. REQUIERE AUTORIZACIÓN (Si está REQUIERE_AUTORIZACION) -->
      @if (report.estado === 'REQUIERE_AUTORIZACION') {
        <div class="border border-red-100 bg-red-50/20 p-4 rounded-xl space-y-3">
          <h4 class="text-sm font-bold text-red-900">Adjuntar Soporte de Autorización</h4>
          <p class="text-xs text-slate-500">Este mantenimiento supera el umbral financiero y requiere la firma/soporte de un superior para continuar.</p>

          <div class="space-y-2">
            <label class="block text-xs font-semibold text-slate-600">Documento de Autorización <span class="text-red-500">*</span></label>
            <label class="flex flex-col items-center justify-center border border-dashed border-red-300 rounded-lg p-4 bg-white cursor-pointer hover:bg-red-50">
              @if (subiendoSoporte()) {
                <span class="text-xs text-slate-400">Subiendo soporte...</span>
              } @else {
                <span class="text-xs text-slate-500 font-bold text-red-700">
                  {{ soporteAutorizacionUrl ? '✓ Autorización cargada' : 'Subir Firma / Correo Soporte (PDF/Imagen)' }}
                </span>
              }
              <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx" (change)="subirSoporteArchivo($event, 'autorizacion')" />
            </label>
          </div>

          <button (click)="aprobarAutorizacion()" [disabled]="saving() || !soporteAutorizacionUrl"
            class="w-full py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer">
            Aprobar y Retomar Mantenimiento
          </button>
        </div>
      }

      <!-- 4. ENVIADO A PROVEEDOR (Si está ENVIADO_PROVEEDOR) -->
      @if (report.estado === 'ENVIADO_PROVEEDOR') {
        <div class="border border-violet-100 bg-violet-50/20 p-4 rounded-xl space-y-3">
          <h4 class="text-sm font-bold text-violet-900">Registrar Retorno de Proveedor</h4>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-slate-600">Costo Final Proveedor ($) <span class="text-red-500">*</span></label>
              <input type="number" [(ngModel)]="costoFinal"
                class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white" />
            </div>
            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-slate-600">Resultado Técnico</label>
              <select [(ngModel)]="resultadoFinal" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white">
                <option value="REPARADO">Reparado</option>
                <option value="SIN_FALLAS">Sin Fallas (Operativo)</option>
                <option value="IRREPARABLE">Irreparable</option>
              </select>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-600">Detalles de la Reparación del Proveedor <span class="text-red-500">*</span></label>
            <textarea [(ngModel)]="accionesRealizadas" rows="2" placeholder="Qué repuestos cambió el proveedor..."
              class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"></textarea>
          </div>

          <button (click)="registrarRetornoProveedor()" [disabled]="saving()"
            class="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer">
            Registrar Retorno y Cerrar Ficha
          </button>
        </div>
      }
    } @else {
      <!-- Mensaje sin permisos para editar -->
      <div class="bg-slate-50 text-slate-500 p-3 rounded-lg text-xs italic text-center border border-slate-100">
        Usted tiene permisos de modo lectura. Las acciones de técnico y administración están restringidas.
      </div>
    }
  `
})
export class MaintenanceWorkflowActionsComponent implements OnChanges {
  private usecases = inject(MaintenanceUseCases);
  private fileUploadService = inject(FileUploadService);

  @Input({ required: true }) report!: MaintenanceReport;
  @Input() activo: Activo | null = null;
  @Input() puedeEditar = false;

  @Output() saved = new EventEmitter<void>();
  @Output() reportUpdated = new EventEmitter<MaintenanceReport>();
  @Output() error = new EventEmitter<string>();
  @Output() success = new EventEmitter<string>();
  @Output() closeDrawer = new EventEmitter<void>();

  diagnostico = '';
  accionesRealizadas = '';
  repuestosUsados = '';
  costoEstimado: number | undefined;
  costoFinal: number | undefined;
  tecnicoResponsable = '';
  cubiertoPorGarantia = false;
  resultadoFinal = ResultadoFinal.REPARADO;
  motivoEscalacion = '';
  proveedorServicio = '';
  referenciaOrdenServicio = '';
  soporteProveedorUrl = '';
  soporteAutorizacionUrl = '';

  saving = signal(false);
  subiendoSoporte = signal(false);
  requiereAutorizacionPorCosto = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['report'] && this.report) {
      this.syncFromReport();
    }
    if (changes['activo'] && this.activo && this.costoFinal !== undefined) {
      this.checkCostoViabilidad(this.costoFinal);
    }
  }

  private syncFromReport() {
    this.diagnostico = this.report.diagnostico || '';
    this.accionesRealizadas = this.report.accionesRealizadas || '';
    this.repuestosUsados = this.report.repuestosUsados || '';
    this.costoEstimado = this.report.costoEstimado;
    this.costoFinal = this.report.costoFinal;
    this.tecnicoResponsable = this.report.tecnicoResponsable || '';
    this.cubiertoPorGarantia = this.report.cubiertoPorGarantia || false;
    this.resultadoFinal = this.report.resultadoFinal || ResultadoFinal.REPARADO;
    this.motivoEscalacion = this.report.motivoEscalacion || '';
    this.proveedorServicio = this.report.proveedorServicio || '';
    this.referenciaOrdenServicio = this.report.referenciaOrdenServicio || '';
    this.soporteProveedorUrl = this.report.soporteProveedorUrl || '';
    this.soporteAutorizacionUrl = this.report.soporteAutorizacionUrl || '';
    this.requiereAutorizacionPorCosto = false;

    if (this.activo && this.costoFinal !== undefined) {
      this.checkCostoViabilidad(this.costoFinal);
    }
  }

  checkCostoViabilidad(costo: number | undefined) {
    if (costo === undefined || costo === null || !this.activo?.precioCompra) {
      this.requiereAutorizacionPorCosto = false;
      return;
    }
    this.requiereAutorizacionPorCosto = (costo > this.activo.precioCompra * 0.40);
  }

  mostrarAlertaViabilidad(): boolean {
    if (!this.activo?.precioCompra) return false;
    const costo = (this.costoFinal !== undefined && this.costoFinal !== null) ? this.costoFinal : this.costoEstimado;
    if (costo === undefined || costo === null) return false;
    return (costo > this.activo.precioCompra * 0.40);
  }

  iniciarReparacion() {
    if (!this.diagnostico) {
      this.error.emit('El diagnóstico inicial es requerido.');
      return;
    }
    if (this.report.modalidad === 'INTERNO' && !this.tecnicoResponsable.trim()) {
      this.error.emit('El Técnico Responsable es obligatorio para iniciar mantenimiento interno.');
      return;
    }
    this.saving.set(true);
    this.usecases.update(this.report.id, {
      accion: 'iniciar',
      diagnostico: this.diagnostico,
      tecnicoResponsable: this.tecnicoResponsable || undefined,
      costoEstimado: this.costoEstimado
    }).subscribe({
      next: (updated: MaintenanceReport) => {
        this.saving.set(false);
        this.success.emit('Reparación iniciada exitosamente.');
        this.reportUpdated.emit(updated);
        this.saved.emit();
      },
      error: (err: any) => {
        this.saving.set(false);
        this.error.emit(err.error?.message || 'Error al iniciar la reparación.');
      }
    });
  }

  descartarSinFallas() {
    if (!this.diagnostico) {
      this.error.emit('Por favor, ingrese un diagnóstico o motivo de descarte.');
      return;
    }
    this.saving.set(true);
    this.usecases.update(this.report.id, {
      accion: 'cerrar',
      accionesRealizadas: `Descartado en diagnóstico inicial. Motivo: ${this.diagnostico}`,
      costoFinal: 0,
      resultadoFinal: ResultadoFinal.SIN_FALLAS
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.emit('Mantenimiento descartado y cerrado exitosamente.');
        this.saved.emit();
        setTimeout(() => this.closeDrawer.emit(), 1500);
      },
      error: (err: any) => {
        this.saving.set(false);
        this.error.emit(err.error?.message || 'Error al descartar la ficha.');
      }
    });
  }

  cerrarMantenimiento() {
    if (!this.accionesRealizadas || this.costoFinal === undefined || this.costoFinal === null || this.costoFinal < 0) {
      this.error.emit('Las acciones realizadas son obligatorias y el costo final debe ser mayor o igual a 0.');
      return;
    }
    this.saving.set(true);
    this.usecases.update(this.report.id, {
      accion: 'cerrar',
      accionesRealizadas: this.accionesRealizadas,
      repuestosUsados: this.repuestosUsados || undefined,
      costoFinal: this.costoFinal,
      resultadoFinal: this.resultadoFinal,
      cubiertoPorGarantia: this.cubiertoPorGarantia
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.emit('Ficha de mantenimiento cerrada con éxito.');
        this.saved.emit();
        setTimeout(() => this.closeDrawer.emit(), 1500);
      },
      error: (err: any) => {
        this.saving.set(false);
        this.error.emit(err.error?.message || 'Error al cerrar la ficha.');
      }
    });
  }

  solicitarAutorizacion() {
    this.saving.set(true);
    this.usecases.update(this.report.id, {
      accion: 'solicitar_autorizacion'
    }).subscribe({
      next: (updated: MaintenanceReport) => {
        this.saving.set(false);
        this.success.emit('Autorización solicitada con éxito.');
        this.reportUpdated.emit(updated);
        this.saved.emit();
      },
      error: (err: any) => {
        this.saving.set(false);
        this.error.emit(err.error?.message || 'Error al solicitar autorización.');
      }
    });
  }

  aprobarAutorizacion() {
    if (!this.soporteAutorizacionUrl) {
      this.error.emit('Por favor cargue el soporte de autorización primero.');
      return;
    }
    this.saving.set(true);
    this.usecases.update(this.report.id, {
      accion: 'aprobar',
      soporteAutorizacionUrl: this.soporteAutorizacionUrl
    }).subscribe({
      next: (updated: MaintenanceReport) => {
        this.saving.set(false);
        this.success.emit('Autorización aprobada. Puede reanudar el mantenimiento.');
        this.reportUpdated.emit(updated);
        this.saved.emit();
      },
      error: (err: any) => {
        this.saving.set(false);
        this.error.emit(err.error?.message || 'Error al aprobar.');
      }
    });
  }

  escalarAProveedor() {
    if (!this.motivoEscalacion || !this.proveedorServicio) {
      this.error.emit('El motivo y el proveedor son obligatorios.');
      return;
    }
    this.saving.set(true);
    this.usecases.update(this.report.id, {
      accion: 'escalar',
      motivoEscalacion: this.motivoEscalacion,
      proveedorServicio: this.proveedorServicio,
      referenciaOrdenServicio: this.referenciaOrdenServicio || undefined,
      soporteProveedorUrl: this.soporteProveedorUrl || undefined
    }).subscribe({
      next: (updated: MaintenanceReport) => {
        this.saving.set(false);
        this.success.emit('Mantenimiento escalado a proveedor externo.');
        this.reportUpdated.emit(updated);
        this.saved.emit();
      },
      error: (err: any) => {
        this.saving.set(false);
        this.error.emit(err.error?.message || 'Error al escalar.');
      }
    });
  }

  registrarRetornoProveedor() {
    if (!this.accionesRealizadas || this.costoFinal === undefined || this.costoFinal === null || this.costoFinal < 0) {
      this.error.emit('Debe especificar las acciones realizadas y un costo final mayor o igual a 0.');
      return;
    }
    this.saving.set(true);
    this.usecases.update(this.report.id, {
      accion: 'retorno_proveedor',
      accionesRealizadas: this.accionesRealizadas,
      costoFinal: this.costoFinal,
      resultadoFinal: this.resultadoFinal
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.emit('Retorno registrado y ficha cerrada con éxito.');
        this.saved.emit();
        setTimeout(() => this.closeDrawer.emit(), 1500);
      },
      error: (err: any) => {
        this.saving.set(false);
        this.error.emit(err.error?.message || 'Error al registrar retorno.');
      }
    });
  }

  subirSoporteArchivo(event: Event, tipo: 'proveedor' | 'autorizacion') {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.subiendoSoporte.set(true);
    this.fileUploadService.upload(file, 'mantenimiento').subscribe({
      next: (res) => {
        this.subiendoSoporte.set(false);
        if (tipo === 'proveedor') {
          this.soporteProveedorUrl = res.url;
        } else {
          this.soporteAutorizacionUrl = res.url;
        }
      },
      error: (err: any) => {
        this.subiendoSoporte.set(false);
        this.error.emit(err.message || 'Error al subir el soporte.');
      }
    });
  }
}
