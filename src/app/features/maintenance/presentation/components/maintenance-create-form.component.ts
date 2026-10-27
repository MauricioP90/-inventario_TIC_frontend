import { Component, OnInit, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaintenanceReport, ModalidadMantenimiento, TipoMantenimiento } from '../../domain/models/maintenance.model';
import { MaintenanceUseCases } from '../../application/use-cases/maintenance.use-cases';
import { Activo } from '../../../inventory/domain/models/activo.model';
import { HttpActivoRepository } from '../../../inventory/infrastructure/adapters/http-activo.repository';
import { RoleService } from '../../../../core/auth/services/role.service';

@Component({
  selector: 'app-maintenance-create-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-4">
      <!-- Activo Selection -->
      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700">Activo (En Mantenimiento) <span class="text-red-500">*</span></label>
        <select [(ngModel)]="activoId" class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
          <option value="" disabled>Seleccione un equipo</option>
          @for (a of disponibles(); track a.id) {
            <option [value]="a.id">{{ a.placa }} - {{ a.marca }} {{ a.modelo }} ({{ a.serial }})</option>
          }
        </select>
        <p class="text-xs text-slate-400">Sólo se listan equipos en estado de inventario "MANTENIMIENTO" o "DISPONIBLE" que no tengan fichas activas.</p>
      </div>

      <!-- Modalidad -->
      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700">Modalidad <span class="text-red-500">*</span></label>
        <select [(ngModel)]="modalidad" class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
          <option value="INTERNO">Interno (En Bodega / Taller)</option>
          <option value="EXTERNO">Externo (Proveedor Directo)</option>
        </select>
      </div>

      <!-- Tipo Mantenimiento -->
      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700">Tipo de Mantenimiento <span class="text-red-500">*</span></label>
        <select [(ngModel)]="tipoMantenimiento" class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
          <option value="CORRECTIVO">Correctivo</option>
          <option value="PREVENTIVO">Preventivo</option>
        </select>
      </div>

      <!-- Tecnico Responsable (Interno) -->
      @if (modalidad === 'INTERNO') {
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">Técnico Responsable <span class="text-red-500">*</span></label>
          <input type="text" [(ngModel)]="tecnicoResponsable" placeholder="Ej: Ing. Carlos Pérez"
            class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400" />
        </div>
      }

      <!-- Proveedor de Servicio (Externo) -->
      @if (modalidad === 'EXTERNO') {
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">Proveedor de Servicio <span class="text-red-500">*</span></label>
          <input type="text" [(ngModel)]="proveedorServicio" placeholder="Ej: Soporte Asus"
            class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400" />
        </div>
      }

      <!-- Costo Estimado -->
      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700">Costo Estimado ($)</label>
        <input type="number" [(ngModel)]="costoEstimado" placeholder="Ej: 150000"
          class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400" />
      </div>

      <!-- Submit CTA -->
      @if (roleService.canRegisterMaintenance()) {
        <div class="pt-4 border-t border-slate-200">
          <button (click)="guardarNuevaFicha()" [disabled]="saving() || !activoId"
            class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2">
            @if (saving()) {
              <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              Guardando...
            } @else {
              Abrir Ficha de Mantenimiento
            }
          </button>
        </div>
      }
    </div>
  `
})
export class MaintenanceCreateFormComponent implements OnInit {
  private usecases = inject(MaintenanceUseCases);
  private activoRepo = inject(HttpActivoRepository);
  public roleService = inject(RoleService);

  @Output() saved = new EventEmitter<void>();
  @Output() error = new EventEmitter<string>();
  @Output() success = new EventEmitter<string>();

  disponibles = signal<Activo[]>([]);
  activoId = '';
  modalidad: ModalidadMantenimiento = ModalidadMantenimiento.INTERNO;
  tipoMantenimiento: TipoMantenimiento = TipoMantenimiento.CORRECTIVO;
  tecnicoResponsable = '';
  proveedorServicio = '';
  costoEstimado: number | undefined;
  saving = signal(false);

  ngOnInit() {
    this.cargarActivosDisponibles();
  }

  cargarActivosDisponibles() {
    this.activoRepo.getAll().subscribe((activos: Activo[]) => {
      const candidatos = activos.filter((a: Activo) => a.estado === 'MANTENIMIENTO' || a.estado === 'DISPONIBLE');
      this.usecases.getActive().subscribe((reports: MaintenanceReport[]) => {
        const idsConReporteActivo = new Set(reports.map((r: MaintenanceReport) => r.activoId));
        this.disponibles.set(candidatos.filter((a: Activo) => !idsConReporteActivo.has(a.id)));
      });
    });
  }

  guardarNuevaFicha() {
    if (!this.roleService.canRegisterMaintenance()) {
      this.error.emit('No cuenta con el rol requerido (Tecnico/Admin) para abrir una ficha de mantenimiento.');
      return;
    }

    if (this.modalidad === ModalidadMantenimiento.INTERNO && !this.tecnicoResponsable.trim()) {
      this.error.emit('El Técnico Responsable es obligatorio para mantenimientos internos.');
      return;
    }
    if (this.modalidad === ModalidadMantenimiento.EXTERNO && !this.proveedorServicio.trim()) {
      this.error.emit('El Proveedor de Servicio es obligatorio para mantenimientos externos.');
      return;
    }

    this.saving.set(true);
    this.usecases.create({
      activoId: this.activoId,
      modalidad: this.modalidad,
      tipoMantenimiento: this.tipoMantenimiento,
      tecnicoResponsable: this.modalidad === ModalidadMantenimiento.INTERNO ? this.tecnicoResponsable.trim() : undefined,
      proveedorServicio: this.modalidad === ModalidadMantenimiento.EXTERNO ? this.proveedorServicio.trim() : undefined,
      costoEstimado: this.costoEstimado
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.emit('Ficha de mantenimiento abierta con éxito.');
        this.saved.emit();
        this.cargarActivosDisponibles();
        this.resetForm();
      },
      error: (err: any) => {
        this.saving.set(false);
        this.error.emit(err.error?.message || 'Error al abrir la ficha de mantenimiento.');
      }
    });
  }

  resetForm() {
    this.activoId = '';
    this.modalidad = ModalidadMantenimiento.INTERNO;
    this.tipoMantenimiento = TipoMantenimiento.CORRECTIVO;
    this.tecnicoResponsable = '';
    this.proveedorServicio = '';
    this.costoEstimado = undefined;
  }
}
