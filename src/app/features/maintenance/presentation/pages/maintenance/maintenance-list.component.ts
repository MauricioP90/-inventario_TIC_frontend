import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaintenanceReport, ModalidadMantenimiento, EstadoFicha, ESTADO_FICHA_LABELS } from '../../../domain/models/maintenance.model';
import { MaintenanceUseCases } from '../../../application/use-cases/maintenance.use-cases';
import { MaintenanceDrawerComponent } from './maintenance-drawer.component';
import { Activo } from '../../../../inventory/domain/models/activo.model';
import { HttpActivoRepository } from '../../../../inventory/infrastructure/adapters/http-activo.repository';
import Keycloak from 'keycloak-js';

@Component({
  selector: 'app-maintenance-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MaintenanceDrawerComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-slate-800 font-sans tracking-tight">Gestión de Mantenimientos</h2>
          <p class="text-sm text-slate-500 mt-1">Bandeja de trabajo para técnicos y control de reparaciones externas</p>
        </div>
        @if (isTecnico()) {
          <button
            (click)="abrirNuevo()"
            class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-100">
            <span class="text-xl leading-none">+</span> Abrir Ficha
          </button>
        }
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-slate-200">
        <button
          (click)="activeTab.set('activos')"
          [class]="activeTab() === 'activos'
            ? 'border-indigo-600 text-indigo-600 font-bold border-b-2 py-3 px-6 text-sm transition-all focus:outline-none'
            : 'border-transparent text-slate-500 hover:text-slate-700 font-medium py-3 px-6 text-sm transition-all focus:outline-none'"
        >
          Mantenimientos Activos ({{ activeCount() }})
        </button>
        <button
          (click)="activeTab.set('historial')"
          [class]="activeTab() === 'historial'
            ? 'border-indigo-600 text-indigo-600 font-bold border-b-2 py-3 px-6 text-sm transition-all focus:outline-none'
            : 'border-transparent text-slate-500 hover:text-slate-700 font-medium py-3 px-6 text-sm transition-all focus:outline-none'"
        >
          Historial de Mantenimiento
        </button>
      </div>

      <!-- Filters -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
        <div class="md:col-span-2 relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="text"
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event)"
            placeholder="Buscar por placa, técnico o proveedor..."
            class="w-full pl-10 pr-4 h-10 bg-slate-50 border border-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm transition-all" />
        </div>

        <select
          [ngModel]="modalityFilter()"
          (ngModelChange)="modalityFilter.set($event)"
          class="h-10 bg-slate-50 border border-slate-100 rounded-lg px-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none transition-all"
        >
          <option value="">Todas las modalidades</option>
          <option value="INTERNO">Interno</option>
          <option value="EXTERNO">Externo</option>
        </select>

        @if (activeTab() === 'historial') {
          <select
            [ngModel]="statusFilter()"
            (ngModelChange)="statusFilter.set($event)"
            class="h-10 bg-slate-50 border border-slate-100 rounded-lg px-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none transition-all"
          >
            <option value="">Todos los resultados</option>
            <option value="REPARADO">Reparado</option>
            <option value="IRREPARABLE">Irreparable</option>
          </select>
        } @else {
          <select
            [ngModel]="statusFilter()"
            (ngModelChange)="statusFilter.set($event)"
            class="h-10 bg-slate-50 border border-slate-100 rounded-lg px-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none transition-all"
          >
            <option value="">Todos los estados</option>
            <option value="PENDIENTE_DIAGNOSTICO">Pendiente Diagnóstico</option>
            <option value="EN_PROCESO">En Proceso</option>
            <option value="REQUIERE_AUTORIZACION">Requiere Autorización</option>
            <option value="ENVIADO_PROVEEDOR">Enviado a Proveedor</option>
          </select>
        }
      </div>

      <!-- List / Table -->
      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>
      }
      @if (!loading()) {
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Ficha</th>
                <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Equipo (Placa)</th>
                <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Modalidad</th>
                <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Responsable / Técnico</th>
                <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Estado / Resultado</th>
                <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Tiempo Transcurrido</th>
                <th class="text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (rep of filteredReports(); track rep.id) {
                <tr class="hover:bg-slate-50/50 transition-colors">
                  <td class="px-6 py-4 font-mono text-xs text-slate-400 font-bold">#{{ rep.id.substring(0, 8) }}</td>
                  <td class="px-6 py-4">
                    <div class="font-bold text-slate-700">{{ getActivoPlaca(rep.activoId) }}</div>
                    <div class="text-[11px] text-slate-400 font-medium">
                      {{ getActivoDetails(rep.activoId) }}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-50 text-slate-600 border-slate-200">
                      {{ rep.modalidad }}
                    </span>
                  </td>
                  <td class="px-6 py-4 font-medium text-slate-600">
                    {{ rep.tecnicoResponsable || rep.proveedorServicio || 'Sin asignar' }}
                  </td>
                  <td class="px-6 py-4">
                    @if (activeTab() === 'activos') {
                      <span class="text-[10px] font-bold px-2.5 py-1 rounded-lg text-white" [style.background-color]="estadoColor(rep.estado)">
                        {{ getEstadoLabel(rep.estado) }}
                      </span>
                    } @else {
                      <span class="text-[10px] font-bold px-2.5 py-1 rounded-lg"
                        [class]="rep.resultadoFinal === 'REPARADO'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-red-50 text-red-700 border border-red-100'">
                        {{ rep.resultadoFinal }}
                      </span>
                    }
                  </td>
                  <td class="px-6 py-4 text-xs font-semibold text-slate-500">
                    {{ calcularSla(rep) }}
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button
                      (click)="verDetalle(rep)"
                      class="text-indigo-600 hover:text-indigo-900 font-bold text-xs transition-all">
                      {{ puedeEditar() && activeTab() === 'activos' ? 'Gestionar' : 'Ver Ficha' }}
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="px-6 py-12 text-center text-slate-400 text-sm">
                    No hay registros de mantenimientos
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- Drawer para gestionar mantenimiento -->
    <app-maintenance-drawer
      [open]="showDrawer()"
      [report]="selectedReport()"
      (openChange)="handleDrawerOpenChange($event)"
      (saved)="cargarDatos()"
    />
  `,
  styles: []
})
export class MaintenanceListComponent implements OnInit {
  private usecases = inject(MaintenanceUseCases);
  private activoRepo = inject(HttpActivoRepository);
  private keycloak = inject(Keycloak);

  // States
  activeTab = signal<'activos' | 'historial'>('activos');
  loading = signal(false);
  reports = signal<MaintenanceReport[]>([]);
  activos = signal<Activo[]>([]);

  // Search & Filters
  searchTerm = signal('');
  modalityFilter = signal('');
  statusFilter = signal('');

  // Drawer
  showDrawer = signal(false);
  selectedReport = signal<MaintenanceReport | null>(null);

  // Permisos
  isAdmin = computed(() => this.keycloak.hasRealmRole('admin') || this.keycloak.hasRealmRole('ADMIN'));
  isTecnico = computed(() => this.keycloak.hasRealmRole('tecnico') || this.keycloak.hasRealmRole('TECNICO') || this.isAdmin());

  // Count active tickets
  activeCount = computed(() => this.reports().filter(r => r.estado !== EstadoFicha.CERRADO).length);

  // Filtered List
  filteredReports = computed(() => {
    const list = this.reports();
    const search = this.searchTerm().toLowerCase().trim();
    const tab = this.activeTab();
    const modality = this.modalityFilter();
    const status = this.statusFilter();

    return list.filter(rep => {
      // 1. Tab validation
      const isTabClosed = rep.estado === EstadoFicha.CERRADO;
      if (tab === 'activos' && isTabClosed) return false;
      if (tab === 'historial' && !isTabClosed) return false;

      // 2. Modality filter
      if (modality && rep.modalidad !== modality) return false;

      // 3. Status or Result filter
      if (status) {
        if (tab === 'activos' && rep.estado !== status) return false;
        if (tab === 'historial' && rep.resultadoFinal !== status) return false;
      }

      // 4. Search Filter (Plate, Tech, Provider, ID)
      if (search) {
        const plate = this.getActivoPlaca(rep.activoId).toLowerCase();
        const tech = (rep.tecnicoResponsable || '').toLowerCase();
        const provider = (rep.proveedorServicio || '').toLowerCase();
        const details = this.getActivoDetails(rep.activoId).toLowerCase();
        const matches = plate.includes(search) || tech.includes(search) || provider.includes(search) || details.includes(search) || rep.id.toLowerCase().includes(search);
        if (!matches) return false;
      }

      return true;
    });
  });

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.loading.set(true);
    // Cargar Activos para mapear placas e info
    this.activoRepo.getAll().subscribe((acts: Activo[]) => {
      this.activos.set(acts || []);
      
      // Cargar reportes según el tab
      this.usecases.getHistory().subscribe({
        next: (reps: MaintenanceReport[]) => {
          this.reports.set(reps || []);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    });
  }

  puedeEditar(): boolean {
    return this.isTecnico();
  }

  getActivoPlaca(activoId: string): string {
    const act = this.activos().find(a => a.id === activoId);
    return act ? act.placa : '—';
  }

  getActivoDetails(activoId: string): string {
    const act = this.activos().find(a => a.id === activoId);
    return act ? `${act.marca} ${act.modelo}` : 'Detalles no disponibles';
  }

  calcularSla(rep: MaintenanceReport): string {
    if (!rep.fechaApertura) return '—';
    const dateStart = new Date(rep.fechaApertura).getTime();
    const dateEnd = rep.fechaCierre ? new Date(rep.fechaCierre).getTime() : Date.now();
    const diffMs = dateEnd - dateStart;

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h`;
    }
    return `${diffHours}h`;
  }

  verDetalle(rep: MaintenanceReport) {
    this.selectedReport.set(rep);
    this.showDrawer.set(true);
  }

  abrirNuevo() {
    this.selectedReport.set(null);
    this.showDrawer.set(true);
  }

  handleDrawerOpenChange(isOpen: boolean) {
    this.showDrawer.set(isOpen);
    if (!isOpen) {
      this.selectedReport.set(null);
    }
  }

  getEstadoLabel(state: EstadoFicha): string {
    return ESTADO_FICHA_LABELS[state] || state;
  }

  estadoColor(state: EstadoFicha): string {
    const map: Record<EstadoFicha, string> = {
      [EstadoFicha.PENDIENTE_DIAGNOSTICO]: '#f59e0b',
      [EstadoFicha.EN_PROCESO]: '#3b82f6',
      [EstadoFicha.REQUIERE_AUTORIZACION]: '#ef4444',
      [EstadoFicha.ENVIADO_PROVEEDOR]: '#8b5cf6',
      [EstadoFicha.CERRADO]: '#10b981'
    };
    return map[state] || '#64748b';
  }
}
