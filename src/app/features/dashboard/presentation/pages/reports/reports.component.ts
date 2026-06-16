import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GetAllActivosUseCase } from '../../../../inventory/application/use-cases/get-all-activos.use-case';
import { GetAllMovementsUseCase } from '../../../../movements/application/use-cases/get-all-movements.use-case';
import { GetAllLocationsUseCase } from '../../../../locations/application/use-cases/get-all-locations.use-case';
import { GetAllSimCardsUseCase } from '../../../../sim-cards/application/use-cases/get-all-sim-cards.use-case';
import { GetActivoMetadataUseCase } from '../../../../inventory/application/use-cases/get-activo-metadata.use-case';
import { MaintenanceUseCases } from '../../../../maintenance/application/use-cases/maintenance.use-cases';
import { Activo, ActivoMetadata } from '../../../../inventory/domain/models/activo.model';
import { Movement, MOVEMENT_TYPE_LABELS, MovementStatus } from '../../../../movements/domain/models/movement.model';
import { Location } from '../../../../locations/domain/models/location.model';
import { SimCard } from '../../../../sim-cards/domain/models/sim-card.model';
import { MaintenanceReport } from '../../../../maintenance/domain/models/maintenance.model';
import Keycloak from 'keycloak-js';

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 md:p-6 space-y-6">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
            <svg class="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-slate-800">Centro de Auditoría e Historial</h1>
            <p class="text-sm text-slate-500">Búsqueda, auditoría detallada y exportación contable</p>
          </div>
        </div>

        <!-- Export CSV Button -->
        <button
          (click)="exportToCSV()"
          class="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-100"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Exportar CSV
        </button>
      </div>

      <!-- Advanced Filtering Bar -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-1 items-end">
          
          <!-- Search input -->
          <div class="lg:col-span-4 space-y-1.5">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Buscar por Texto</label>
            <div class="relative">
              <input
                type="text"
                [ngModel]="searchTerm()"
                (ngModelChange)="searchTerm.set($event)"
                placeholder="Buscar placa, modelo, responsable..."
                class="w-full pl-9 pr-4 h-10 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all"
              />
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            </div>
          </div>

          <!-- Sede/Location select -->
          <div class="lg:col-span-3 space-y-1.5">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filtrar por Sede</label>
            <select
              [ngModel]="selectedLocationId()"
              (ngModelChange)="selectedLocationId.set($event)"
              class="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none cursor-pointer"
            >
              <option value="">Todas las Sedes</option>
              @for (loc of locations(); track loc.id) {
                <option [value]="loc.id">{{ loc.nombre }}</option>
              }
            </select>
          </div>

          <!-- Start date -->
          <div class="lg:col-span-2 space-y-1.5">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha Inicio</label>
            <input
              type="date"
              [ngModel]="startDate()"
              (ngModelChange)="startDate.set($event)"
              class="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <!-- End date -->
          <div class="lg:col-span-2 space-y-1.5">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha Fin</label>
            <input
              type="date"
              [ngModel]="endDate()"
              (ngModelChange)="endDate.set($event)"
              class="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <!-- Reset button -->
          <div class="lg:col-span-1 flex justify-end">
            <button
              (click)="resetFilters()"
              title="Limpiar Filtros"
              class="h-10 w-full flex items-center justify-center bg-red-50 text-red-600 rounded-lg border border-red-100 hover:bg-red-100 transition-all font-bold"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

        </div>
      </div>

      <!-- Segmented Control (Tabs) -->
      <div class="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          (click)="activeTab.set('movimientos')"
          [class]="activeTab() === 'movimientos' ? 'bg-white shadow-sm text-indigo-700 font-bold' : 'text-slate-500 hover:text-slate-700 font-medium'"
          class="px-5 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2"
        >
          <span>🚛</span> Auditoría de Traslados
          <span class="bg-indigo-50 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ml-1">
            {{ filteredMovements().length }}
          </span>
        </button>
        <button
          (click)="activeTab.set('altas')"
          [class]="activeTab() === 'altas' ? 'bg-white shadow-sm text-indigo-700 font-bold' : 'text-slate-500 hover:text-slate-700 font-medium'"
          class="px-5 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2"
        >
          <span>📦</span> Altas e Ingresos
          <span class="bg-indigo-50 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ml-1">
            {{ filteredAltas().length }}
          </span>
        </button>
        <button
          (click)="activeTab.set('mantenimientos')"
          [class]="activeTab() === 'mantenimientos' ? 'bg-white shadow-sm text-indigo-700 font-bold' : 'text-slate-500 hover:text-slate-700 font-medium'"
          class="px-5 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2"
        >
          <span>🔧</span> Costos de Mantenimiento
          <span class="bg-indigo-50 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ml-1">
            {{ filteredMantenimientos().length }}
          </span>
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="flex justify-center py-12">
        <div class="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>

      <!-- Main Content Cards / Grids -->
      <div *ngIf="!loading()" class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        <!-- PESTAÑA 1: Auditoría de Traslados -->
        <div *ngIf="activeTab() === 'movimientos'" class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-600 divide-y divide-slate-200">
            <thead class="bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              <tr>
                <th class="px-6 py-4">Fecha</th>
                <th class="px-6 py-4">ID Traslado</th>
                <th class="px-6 py-4">Tipo Movimiento</th>
                <th class="px-6 py-4">Equipos / SIM Cards</th>
                <th class="px-6 py-4">Origen</th>
                <th class="px-6 py-4">Destino</th>
                <th class="px-6 py-4">Responsable</th>
                <th class="px-6 py-4">Notas</th>
                <th class="px-6 py-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              @for (m of filteredMovements(); track m.id) {
                <tr class="hover:bg-slate-50/50 transition-colors">
                  <!-- Fecha -->
                  <td class="px-6 py-4 whitespace-nowrap font-medium text-slate-500">
                    {{ m.createdAt | date: 'dd/MM/yyyy HH:mm' }}
                  </td>
                  <!-- ID -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded text-[11px] font-semibold border border-slate-200">
                      {{ m.id.slice(-8) }}
                    </span>
                  </td>
                  <!-- Tipo -->
                  <td class="px-6 py-4 font-semibold text-slate-700">
                    {{ getMovementTypeLabel(m.type) }}
                  </td>
                  <!-- Items -->
                  <td class="px-6 py-4 max-w-xs">
                    <div class="flex flex-col gap-1">
                      <!-- Activos -->
                      <div class="flex flex-wrap gap-1" *ngIf="m.activos && m.activos.length > 0">
                        @for (a of m.activos; track a.id) {
                          <span class="text-[10px] font-extrabold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100" title="{{ a.marca }} {{ a.modelo }}">
                            💻 {{ a.placa }}
                          </span>
                        }
                      </div>
                      <!-- SIM Cards -->
                      <div class="flex flex-wrap gap-1" *ngIf="m.simCards && m.simCards.length > 0">
                        @for (s of m.simCards; track s.id) {
                          <span class="text-[10px] font-extrabold bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-100" title="{{ s.operador }}">
                            📶 {{ s.numero }}
                          </span>
                        }
                      </div>
                    </div>
                  </td>
                  <!-- Origen -->
                  <td class="px-6 py-4 font-medium text-slate-600">
                    {{ m.originLocation?.nombre || 'Bodega/Disponible' }}
                  </td>
                  <!-- Destino -->
                  <td class="px-6 py-4 font-medium text-slate-600">
                    {{ m.destinationLocation?.nombre || 'N/A' }}
                  </td>
                  <!-- Responsable -->
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2" *ngIf="m.responsible">
                      <div class="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                        {{ getInitials(m.responsible.nombre) }}
                      </div>
                      <span class="font-medium text-slate-700 truncate max-w-[120px]">{{ m.responsible.nombre }}</span>
                    </div>
                    <span *ngIf="!m.responsible" class="text-slate-400 italic">No asignado</span>
                  </td>
                  <!-- Notas -->
                  <td class="px-6 py-4 max-w-xs truncate" [title]="m.notes || ''">
                    <span class="text-slate-500 italic">{{ m.notes || '-' }}</span>
                  </td>
                  <!-- Estado -->
                  <td class="px-6 py-4 text-center whitespace-nowrap">
                    <span [class]="getMovementStatusClass(m.status)">
                      {{ getMovementStatusLabel(m.status) }}
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="9" class="px-6 py-12 text-center text-slate-400 font-medium">
                    No se encontraron movimientos con los filtros aplicados.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- PESTAÑA 2: Altas e Ingresos -->
        <div *ngIf="activeTab() === 'altas'" class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-600 divide-y divide-slate-200">
            <thead class="bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              <tr>
                <th class="px-6 py-4">Fecha Ingreso</th>
                <th class="px-6 py-4">Placa / Identificador</th>
                <th class="px-6 py-4">Tipo</th>
                <th class="px-6 py-4">Marca / Modelo</th>
                <th class="px-6 py-4">Serial / Número</th>
                <th class="px-6 py-4">Ubicación Inicial</th>
                <th class="px-6 py-4" *ngIf="isAdmin()">Valor Compra</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              @for (a of filteredAltas(); track a.id) {
                <tr class="hover:bg-slate-50/50 transition-colors">
                  <!-- Fecha Ingreso -->
                  <td class="px-6 py-4 whitespace-nowrap font-medium text-slate-500">
                    {{ a.fechaIngreso | date: 'dd/MM/yyyy' }}
                  </td>
                  <!-- Placa -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="font-mono text-indigo-600 font-bold bg-indigo-50/30 px-2 py-0.5 rounded border border-indigo-100/50">
                      {{ a.placa }}
                    </span>
                  </td>
                  <!-- Tipo -->
                  <td class="px-6 py-4 font-semibold text-slate-700">
                    {{ typeMap()[a.tipoActivoId]?.label || a.tipoActivoId }}
                  </td>
                  <!-- Marca / Modelo -->
                  <td class="px-6 py-4 font-medium text-slate-700">
                    {{ a.marca }} <span class="text-slate-400 font-normal">{{ a.modelo }}</span>
                  </td>
                  <!-- Serial -->
                  <td class="px-6 py-4 font-mono text-slate-500">
                    {{ a.serial || 'N/A' }}
                  </td>
                  <!-- Ubicación -->
                  <td class="px-6 py-4 font-semibold text-slate-600">
                    {{ a.location?.nombre || 'Bodega Principal' }}
                  </td>
                  <!-- Valor de Compra (Admin only) -->
                  <td class="px-6 py-4 font-bold text-slate-800 whitespace-nowrap" *ngIf="isAdmin()">
                    {{ (a.precioCompra || 0) | currency: 'USD': 'symbol': '1.0-0' }}
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td [attr.colspan]="isAdmin() ? 7 : 6" class="px-6 py-12 text-center text-slate-400 font-medium">
                    No se encontraron registros de altas con los filtros aplicados.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- PESTAÑA 3: Costos de Mantenimiento -->
        <div *ngIf="activeTab() === 'mantenimientos'" class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-600 divide-y divide-slate-200">
            <thead class="bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              <tr>
                <th class="px-6 py-4">Fecha Cierre</th>
                <th class="px-6 py-4">Placa</th>
                <th class="px-6 py-4">Equipo</th>
                <th class="px-6 py-4">Falla Reportada / Diagnóstico</th>
                <th class="px-6 py-4">Modalidad</th>
                <th class="px-6 py-4">Técnico / Proveedor</th>
                <th class="px-6 py-4 text-right">Costo Estimado</th>
                <th class="px-6 py-4 text-right">Costo Final</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              @for (rep of filteredMantenimientos(); track rep.id) {
                <tr class="hover:bg-slate-50/50 transition-colors">
                  <!-- Fecha Cierre -->
                  <td class="px-6 py-4 whitespace-nowrap font-medium text-slate-500">
                    {{ rep.fechaCierre | date: 'dd/MM/yyyy' }}
                  </td>
                  <!-- Placa -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 font-bold">
                      {{ getActivoPlate(rep.activoId) }}
                    </span>
                  </td>
                  <!-- Equipo -->
                  <td class="px-6 py-4 font-semibold text-slate-700">
                    {{ getActivoDetails(rep.activoId) }}
                  </td>
                  <!-- Falla / Diagnostico -->
                  <td class="px-6 py-4 max-w-sm">
                    <div class="line-clamp-2" [title]="rep.diagnostico || 'Sin diagnóstico registrado'">
                      <span class="font-medium text-slate-500">Diag:</span> {{ rep.diagnostico || 'Sin detalles' }}
                    </div>
                  </td>
                  <!-- Modalidad -->
                  <td class="px-6 py-4">
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {{ rep.modalidad }}
                    </span>
                  </td>
                  <!-- Tecnico -->
                  <td class="px-6 py-4 font-medium text-slate-700">
                    {{ rep.tecnicoResponsable || rep.proveedorServicio || 'No asignado' }}
                  </td>
                  <!-- Costo Estimado -->
                  <td class="px-6 py-4 text-right font-semibold text-slate-500">
                    {{ (rep.costoEstimado || 0) | currency: 'USD': 'symbol': '1.0-0' }}
                  </td>
                  <!-- Costo Final -->
                  <td class="px-6 py-4 text-right font-bold text-slate-900">
                    {{ (rep.costoFinal || 0) | currency: 'USD': 'symbol': '1.0-0' }}
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="px-6 py-12 text-center text-slate-400 font-medium">
                    No se encontraron reportes cerrados de mantenimiento con los filtros aplicados.
                  </td>
                </tr>
              }
            </tbody>
            
            <!-- Summary Footer -->
            <tfoot class="bg-slate-50 border-t border-slate-200 font-bold" *ngIf="filteredMantenimientos().length > 0">
              <tr>
                <td colspan="7" class="px-6 py-4 text-right text-slate-500 uppercase tracking-wider text-[10px]">
                  Costo Total Acumulado en Soporte:
                </td>
                <td class="px-6 py-4 text-right text-base text-indigo-700 font-extrabold whitespace-nowrap border-l border-slate-200 bg-indigo-50/35">
                  {{ totalMantenimientosCost() | currency: 'USD': 'symbol': '1.0-0' }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

      </div>

    </div>
  `,
  styles: []
})
export class ReportsPageComponent implements OnInit {
  // Use cases injection
  private getAllActivos = inject(GetAllActivosUseCase);
  private getAllMovements = inject(GetAllMovementsUseCase);
  private getAllLocations = inject(GetAllLocationsUseCase);
  private getMetadataUC = inject(GetActivoMetadataUseCase);
  private maintenanceUC = inject(MaintenanceUseCases);
  private keycloak = inject(Keycloak);

  // States
  loading = signal(false);
  activeTab = signal<'movimientos' | 'altas' | 'mantenimientos'>('movimientos');

  // Real Database Signals
  activos = signal<Activo[]>([]);
  movements = signal<Movement[]>([]);
  locations = signal<Location[]>([]);
  mantenimientos = signal<MaintenanceReport[]>([]);
  metadata = signal<ActivoMetadata | null>(null);

  // Filters
  searchTerm = signal('');
  startDate = signal('');
  endDate = signal('');
  selectedLocationId = signal('');

  // Role Checks
  isAdmin = computed(() => this.keycloak.hasRealmRole('admin') || this.keycloak.hasRealmRole('ADMIN'));

  // Metadata Mapping helper
  typeMap = computed(() => {
    const types = this.metadata()?.types || [];
    return types.reduce((acc, curr) => ({ ...acc, [curr.id]: curr }), {} as Record<string, any>);
  });

  // 1. Filtered Movements
  filteredMovements = computed(() => {
    let list = this.movements();
    const term = this.searchTerm().toLowerCase().trim();
    const locId = this.selectedLocationId();
    const start = this.startDate() ? new Date(this.startDate() + 'T00:00:00') : null;
    const end = this.endDate() ? new Date(this.endDate() + 'T23:59:59') : null;

    return list.filter(m => {
      // Search term
      let matchesSearch = true;
      if (term) {
        const idShort = m.id.slice(-8).toLowerCase();
        const notes = (m.notes || '').toLowerCase();
        const originName = (m.originLocation?.nombre || '').toLowerCase();
        const destName = (m.destinationLocation?.nombre || '').toLowerCase();
        const respName = (m.responsible?.nombre || '').toLowerCase();
        const receiverName = (m.receiver?.nombre || '').toLowerCase();
        const placaMatch = (m.activos || []).some(a => a.placa.toLowerCase().includes(term) || a.serial?.toLowerCase().includes(term));
        const simMatch = (m.simCards || []).some(s => s.numero.toLowerCase().includes(term));

        matchesSearch = idShort.includes(term) ||
          notes.includes(term) ||
          originName.includes(term) ||
          destName.includes(term) ||
          respName.includes(term) ||
          receiverName.includes(term) ||
          placaMatch ||
          simMatch;
      }

      // Location filter
      const matchesLocation = !locId || m.originLocationId === locId || m.destinationLocationId === locId;

      // Date range filter
      let matchesDate = true;
      if (m.createdAt) {
        const dateVal = new Date(m.createdAt);
        if (start && dateVal < start) matchesDate = false;
        if (end && dateVal > end) matchesDate = false;
      } else {
        if (start || end) matchesDate = false;
      }

      return matchesSearch && matchesLocation && matchesDate;
    });
  });

  // 2. Filtered Ingestions (Altas)
  filteredAltas = computed(() => {
    let list = this.activos();
    const term = this.searchTerm().toLowerCase().trim();
    const locId = this.selectedLocationId();
    const start = this.startDate() ? new Date(this.startDate() + 'T00:00:00') : null;
    const end = this.endDate() ? new Date(this.endDate() + 'T23:59:59') : null;

    return list.filter(a => {
      // Search term
      let matchesSearch = true;
      if (term) {
        const placa = a.placa.toLowerCase();
        const marca = (a.marca || '').toLowerCase();
        const modelo = (a.modelo || '').toLowerCase();
        const serial = (a.serial || '').toLowerCase();
        const locName = (a.location?.nombre || '').toLowerCase();
        const tipoName = (this.typeMap()[a.tipoActivoId]?.label || '').toLowerCase();

        matchesSearch = placa.includes(term) ||
          marca.includes(term) ||
          modelo.includes(term) ||
          serial.includes(term) ||
          locName.includes(term) ||
          tipoName.includes(term);
      }

      // Location filter
      const matchesLocation = !locId || a.locationId === locId;

      // Date range filter
      let matchesDate = true;
      if (a.fechaIngreso) {
        const dateVal = new Date(a.fechaIngreso);
        if (start && dateVal < start) matchesDate = false;
        if (end && dateVal > end) matchesDate = false;
      } else {
        if (start || end) matchesDate = false;
      }

      return matchesSearch && matchesLocation && matchesDate;
    });
  });

  // 3. Filtered Maintenance Closed Reports
  filteredMantenimientos = computed(() => {
    // We only want closed reports in the audit log
    let list = this.mantenimientos().filter(r => r.estado === 'CERRADO');
    const term = this.searchTerm().toLowerCase().trim();
    const locId = this.selectedLocationId();
    const start = this.startDate() ? new Date(this.startDate() + 'T00:00:00') : null;
    const end = this.endDate() ? new Date(this.endDate() + 'T23:59:59') : null;

    return list.filter(rep => {
      const act = this.getActivoByReportId(rep.activoId);

      // Search term
      let matchesSearch = true;
      if (term) {
        const placa = (act?.placa || '').toLowerCase();
        const marca = (act?.marca || '').toLowerCase();
        const modelo = (act?.modelo || '').toLowerCase();
        const diagnostico = (rep.diagnostico || '').toLowerCase();
        const acciones = (rep.accionesRealizadas || '').toLowerCase();
        const tech = (rep.tecnicoResponsable || '').toLowerCase();
        const prov = (rep.proveedorServicio || '').toLowerCase();

        matchesSearch = placa.includes(term) ||
          marca.includes(term) ||
          modelo.includes(term) ||
          diagnostico.includes(term) ||
          acciones.includes(term) ||
          tech.includes(term) ||
          prov.includes(term);
      }

      // Location filter
      const matchesLocation = !locId || act?.locationId === locId;

      // Date range filter
      let matchesDate = true;
      if (rep.fechaCierre) {
        const dateVal = new Date(rep.fechaCierre);
        if (start && dateVal < start) matchesDate = false;
        if (end && dateVal > end) matchesDate = false;
      } else {
        if (start || end) matchesDate = false;
      }

      return matchesSearch && matchesLocation && matchesDate;
    });
  });

  // Total cost for closing maintenance logs
  totalMantenimientosCost = computed(() => {
    return this.filteredMantenimientos().reduce((sum, rep) => sum + (rep.costoFinal || 0), 0);
  });

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.loading.set(true);
    
    // Load metadata for asset type mapping
    this.getMetadataUC.execute().subscribe({
      next: (meta) => this.metadata.set(meta),
      error: (err) => console.error("Error loading asset metadata in reports:", err)
    });

    // Load locations
    this.getAllLocations.execute().subscribe({
      next: (locs) => this.locations.set(locs),
      error: (err) => console.error("Error loading locations in reports:", err)
    });

    // Load assets
    this.getAllActivos.execute().subscribe({
      next: (acts) => this.activos.set(acts),
      error: (err) => console.error("Error loading assets in reports:", err)
    });

    // Load movements
    this.getAllMovements.execute().subscribe({
      next: (movs) => this.movements.set(movs),
      error: (err) => console.error("Error loading movements in reports:", err)
    });

    // Load closed/history maintenances
    this.maintenanceUC.getHistory().subscribe({
      next: (mants) => {
        this.mantenimientos.set(mants);
        this.loading.set(false);
      },
      error: (err) => {
        console.error("Error loading maintenance history in reports:", err);
        this.loading.set(false);
      }
    });
  }

  // Filter resets
  resetFilters() {
    this.searchTerm.set('');
    this.startDate.set('');
    this.endDate.set('');
    this.selectedLocationId.set('');
  }

  // Helper selectors
  getActivoByReportId(activoId: string): Activo | undefined {
    return this.activos().find(a => a.id === activoId);
  }

  getActivoPlate(activoId: string): string {
    const act = this.getActivoByReportId(activoId);
    return act ? act.placa : '...';
  }

  getActivoDetails(activoId: string): string {
    const act = this.getActivoByReportId(activoId);
    return act ? `${act.marca} ${act.modelo}` : 'Cargando equipo...';
  }

  getInitials(name?: string): string {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
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

  getMovementStatusClass(status: MovementStatus): string {
    const base = 'text-[10px] font-extrabold px-2 py-0.5 rounded-full border ';
    switch (status) {
      case MovementStatus.PENDING:
        return base + 'bg-amber-50 text-amber-600 border-amber-100';
      case MovementStatus.EN_TRANSIT:
        return base + 'bg-blue-50 text-blue-600 border-blue-100';
      case MovementStatus.RECEIVED:
        return base + 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case MovementStatus.CANCELLED:
        return base + 'bg-rose-50 text-rose-600 border-rose-100';
      default:
        return base + 'bg-slate-50 text-slate-600 border-slate-100';
    }
  }

  // Clean date and time format helpers for CSV to prevent spreadsheet errors
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

  // Export dynamically to CSV
  exportToCSV() {
    const tab = this.activeTab();
    let csvContent = '\uFEFF'; // Add BOM for UTF-8 compatibility in Excel
    let filename = '';

    if (tab === 'movimientos') {
      filename = `auditoria_traslados_${new Date().toISOString().split('T')[0]}.csv`;
      const headers = ['Fecha', 'ID Traslado', 'Tipo Movimiento', 'Activos', 'SIM Cards', 'Origen', 'Destino', 'Estado', 'Notas'];
      csvContent += headers.join(';') + '\n';

      this.filteredMovements().forEach(m => {
        const date = this.formatDateTimeForCSV(m.createdAt);
        const id = m.id.slice(-8);
        const type = this.getMovementTypeLabel(m.type);
        const activos = (m.activos || []).map(a => `${a.placa} (${a.marca} ${a.modelo})`).join(', ');
        const sims = (m.simCards || []).map(s => `${s.numero} (${s.operador})`).join(', ');
        const origin = m.originLocation?.nombre || 'N/A';
        const dest = m.destinationLocation?.nombre || 'N/A';
        const status = this.getMovementStatusLabel(m.status);
        const notes = m.notes || '';

        const row = [date, id, type, activos, sims, origin, dest, status, notes]
          .map(val => `"${val.replace(/"/g, '""')}"`);
        csvContent += row.join(';') + '\n';
      });
    } else if (tab === 'altas') {
      filename = `historial_altas_${new Date().toISOString().split('T')[0]}.csv`;
      const headers = ['Fecha Ingreso', 'Placa', 'Tipo Activo', 'Marca', 'Modelo', 'Serial', 'Ubicación', 'Valor Compra'];
      csvContent += headers.join(';') + '\n';

      this.filteredAltas().forEach(a => {
        const date = this.formatDateOnlyForCSV(a.fechaIngreso);
        const placa = a.placa;
        const type = this.typeMap()[a.tipoActivoId]?.label || a.tipoActivoId;
        const marca = a.marca || '';
        const modelo = a.modelo || '';
        const serial = a.serial || '';
        const location = a.location?.nombre || 'Bodega/Disponible';
        const valCompra = this.isAdmin() ? (a.precioCompra || 0) : 'RESTRINGIDO';

        const row = [date, placa, type, marca, modelo, serial, location, valCompra]
          .map(val => `"${String(val).replace(/"/g, '""')}"`);
        csvContent += row.join(';') + '\n';
      });
    } else if (tab === 'mantenimientos') {
      filename = `costos_mantenimiento_${new Date().toISOString().split('T')[0]}.csv`;
      const headers = ['Fecha Cierre', 'Placa', 'Equipo', 'Diagnóstico/Acciones', 'Modalidad', 'Técnico/Proveedor', 'Costo Estimado', 'Costo Final'];
      csvContent += headers.join(';') + '\n';

      this.filteredMantenimientos().forEach(rep => {
        const date = this.formatDateOnlyForCSV(rep.fechaCierre);
        const placa = this.getActivoPlate(rep.activoId);
        const equipo = this.getActivoDetails(rep.activoId);
        const diag = rep.diagnostico || '';
        const mod = rep.modalidad || '';
        const tech = rep.tecnicoResponsable || rep.proveedorServicio || 'No asignado';
        const costoEst = rep.costoEstimado || 0;
        const costoFin = rep.costoFinal || 0;

        const row = [date, placa, equipo, diag, mod, tech, costoEst, costoFin]
          .map(val => `"${String(val).replace(/"/g, '""')}"`);
        csvContent += row.join(';') + '\n';
      });
    }

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
