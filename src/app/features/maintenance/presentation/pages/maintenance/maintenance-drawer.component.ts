import { Component, Input, Output, EventEmitter, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaintenanceReport } from '../../../domain/models/maintenance.model';
import { Activo } from '../../../../inventory/domain/models/activo.model';
import { HttpActivoRepository } from '../../../../inventory/infrastructure/adapters/http-activo.repository';
import { RoleService } from '../../../../../core/auth/services/role.service';
import { MaintenanceCreateFormComponent } from '../../components/maintenance-create-form.component';
import { MaintenanceInfoCardComponent } from '../../components/maintenance-info-card.component';
import { MaintenanceWorkflowActionsComponent } from '../../components/maintenance-workflow-actions.component';
import { MaintenanceTimelineComponent } from '../../components/maintenance-timeline.component';

@Component({
  selector: 'app-maintenance-drawer',
  standalone: true,
  imports: [
    CommonModule,
    MaintenanceCreateFormComponent,
    MaintenanceInfoCardComponent,
    MaintenanceWorkflowActionsComponent,
    MaintenanceTimelineComponent
  ],
  template: `
    <!-- Backdrop -->
    @if (open) {
      <div class="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" (click)="close()"></div>
    }

    <!-- Drawer Panel -->
    <div
      class="fixed top-0 right-0 z-50 h-full w-full max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col transition-transform duration-300"
      [class.translate-x-0]="open"
      [class.translate-x-full]="!open"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-5 border-b border-slate-200 shrink-0">
        <div>
          <h3 class="text-base font-bold text-slate-800">
            {{ report ? 'Ficha de Mantenimiento #' + report.id.substring(0, 8) : 'Nueva Ficha de Mantenimiento' }}
          </h3>
          <p class="text-xs text-slate-500 mt-0.5">
            {{ report ? 'Ver y actualizar proceso de reparación' : 'Registrar ingreso a mantenimiento' }}
          </p>
        </div>
        <button (click)="close()" class="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        @if (toast()) {
          <div [class]="toast()!.type === 'error'
            ? 'bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 leading-relaxed'
            : 'bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-3 leading-relaxed'">
            {{ toast()!.message }}
          </div>
        }

        @if (!report) {
          <!-- MODO CREACIÓN -->
          <app-maintenance-create-form
            (saved)="onReportSaved()"
            (success)="showSuccess($event)"
            (error)="showError($event)"
          />
        } @else {
          <!-- MODO DETALLE Y FLUJO -->
          <div class="space-y-5">
            <app-maintenance-info-card
              [report]="report"
              [activo]="activoAsociado"
              [isAdmin]="isAdmin()"
            />

            <app-maintenance-workflow-actions
              [report]="report"
              [activo]="activoAsociado"
              [puedeEditar]="isTecnico()"
              (saved)="onReportSaved()"
              (reportUpdated)="onReportUpdated($event)"
              (success)="showSuccess($event)"
              (error)="showError($event)"
              (closeDrawer)="close()"
            />

            <app-maintenance-timeline
              [report]="report"
            />
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class MaintenanceDrawerComponent {
  private activoRepo = inject(HttpActivoRepository);
  public roleService = inject(RoleService);

  @Input() open = false;
  @Input() set report(val: MaintenanceReport | null) {
    this._report = val;
    this.toast.set(null);
    if (val) {
      this.cargarDetallesReporte(val);
    } else {
      this.activoAsociado = null;
    }
  }
  get report() { return this._report; }
  private _report: MaintenanceReport | null = null;

  @Output() openChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  isAdmin = computed(() => this.roleService.isAdmin());
  isTecnico = computed(() => this.roleService.canRegisterMaintenance());

  activoAsociado: Activo | null = null;
  toast = signal<{ type: 'success' | 'error', message: string } | null>(null);

  close() {
    this.openChange.emit(false);
  }

  cargarDetallesReporte(rep: MaintenanceReport) {
    this.activoRepo.getAll().subscribe({
      next: (activos: Activo[]) => {
        this.activoAsociado = activos.find((a: Activo) => a.id === rep.activoId) || null;
      },
      error: () => {
        this.activoAsociado = null;
      }
    });
  }

  showSuccess(message: string) {
    this.toast.set({ type: 'success', message });
    setTimeout(() => this.toast.set(null), 4000);
  }

  showError(message: string) {
    this.toast.set({ type: 'error', message });
    setTimeout(() => this.toast.set(null), 5000);
  }

  onReportSaved() {
    this.saved.emit();
  }

  onReportUpdated(updated: MaintenanceReport) {
    this._report = updated;
  }
}
