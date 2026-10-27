import { Component, OnInit, signal, computed, inject, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GetAllActivosUseCase } from '../../../../inventory/application/use-cases/get-all-activos.use-case';
import { GetAllMovementsUseCase } from '../../../../movements/application/use-cases/get-all-movements.use-case';
import { GetAllLocationsUseCase } from '../../../../locations/application/use-cases/get-all-locations.use-case';
import { GetActivoMetadataUseCase } from '../../../../inventory/application/use-cases/get-activo-metadata.use-case';
import { MaintenanceUseCases } from '../../../../maintenance/application/use-cases/maintenance.use-cases';
import { Activo, ActivoMetadata } from '../../../../inventory/domain/models/activo.model';
import { Movement } from '../../../../movements/domain/models/movement.model';
import { Location } from '../../../../locations/domain/models/location.model';
import { MaintenanceReport } from '../../../../maintenance/domain/models/maintenance.model';
import { RoleService } from '../../../../../core/auth/services/role.service';
import { ReportsExportService } from '../../services/reports-export.service';
import { ReportsFilterBarComponent } from './components/reports-filter-bar.component';
import { ReportsPaginationComponent } from './components/reports-pagination.component';
import { ReportsMovementsTableComponent } from './components/reports-movements-table.component';
import { ReportsAltasTableComponent } from './components/reports-altas-table.component';
import { ReportsMantenimientosTableComponent } from './components/reports-mantenimientos-table.component';

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [
    CommonModule,
    ReportsFilterBarComponent,
    ReportsPaginationComponent,
    ReportsMovementsTableComponent,
    ReportsAltasTableComponent,
    ReportsMantenimientosTableComponent
  ],
  template: `
    <div class="p-4 md:p-6 space-y-6">
      
      <!-- Filter and Action Bar -->
      <app-reports-filter-bar
        [searchTerm]="searchTerm()"
        (searchTermChange)="searchTerm.set($event)"
        [selectedLocationId]="selectedLocationId()"
        (selectedLocationIdChange)="selectedLocationId.set($event)"
        [startDate]="startDate()"
        (startDateChange)="startDate.set($event)"
        [endDate]="endDate()"
        (endDateChange)="endDate.set($event)"
        [locations]="locations()"
        (resetFilters)="resetFilters()"
        (exportCsv)="exportToCSV()"
      />

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
        <app-reports-movements-table
          *ngIf="activeTab() === 'movimientos'"
          [movements]="paginatedMovements()"
        />

        <!-- PESTAÑA 2: Altas e Ingresos -->
        <app-reports-altas-table
          *ngIf="activeTab() === 'altas'"
          [altas]="paginatedAltas()"
          [typeMap]="typeMap()"
          [isAdmin]="isAdmin()"
        />

        <!-- PESTAÑA 3: Costos de Mantenimiento -->
        <app-reports-mantenimientos-table
          *ngIf="activeTab() === 'mantenimientos'"
          [mantenimientos]="paginatedMantenimientos()"
          [activos]="activos()"
          [totalCost]="totalMantenimientosCost()"
        />

        <!-- Pagination Footer -->
        <app-reports-pagination
          [currentListLength]="currentListLength()"
          [startIndex]="startIndex()"
          [endIndex]="endIndex()"
          [pageSize]="pageSize()"
          [currentPage]="currentPage()"
          [totalPages]="totalPages()"
          (pageSizeChange)="onPageSizeChange($event)"
          (prevPage)="prevPage()"
          (nextPage)="nextPage()"
        />

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
  private exportService = inject(ReportsExportService);
  public roleService = inject(RoleService);

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

  // Pagination Signals
  currentPage = signal(1);
  pageSize = signal(10);

  // Paginated slices for each tab
  paginatedMovements = computed(() => {
    const list = this.filteredMovements();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  paginatedAltas = computed(() => {
    const list = this.filteredAltas();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  paginatedMantenimientos = computed(() => {
    const list = this.filteredMantenimientos();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  currentListLength = computed(() => {
    const tab = this.activeTab();
    if (tab === 'movimientos') return this.filteredMovements().length;
    if (tab === 'altas') return this.filteredAltas().length;
    return this.filteredMantenimientos().length;
  });

  startIndex = computed(() => {
    if (this.currentListLength() === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  endIndex = computed(() => {
    const end = this.currentPage() * this.pageSize();
    const total = this.currentListLength();
    return end > total ? total : end;
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.currentListLength() / this.pageSize())));

  // Role Checks
  isAdmin = computed(() => this.roleService.isAdmin());

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

      const matchesLocation = !locId || m.originLocationId === locId || m.destinationLocationId === locId;

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

      const matchesLocation = !locId || a.locationId === locId;

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
    let list = this.mantenimientos().filter(r => r.estado === 'CERRADO');
    const term = this.searchTerm().toLowerCase().trim();
    const locId = this.selectedLocationId();
    const start = this.startDate() ? new Date(this.startDate() + 'T00:00:00') : null;
    const end = this.endDate() ? new Date(this.endDate() + 'T23:59:59') : null;

    return list.filter(rep => {
      const act = this.activos().find(a => a.id === rep.activoId);

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

      const matchesLocation = !locId || act?.locationId === locId;

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

  constructor() {
    effect(() => {
      this.searchTerm();
      this.startDate();
      this.endDate();
      this.selectedLocationId();
      this.activeTab();
      untracked(() => {
        this.currentPage.set(1);
      });
    });
  }

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.loading.set(true);
    
    this.getMetadataUC.execute().subscribe({
      next: (meta) => this.metadata.set(meta),
      error: (err) => console.error("Error loading asset metadata in reports:", err)
    });

    this.getAllLocations.execute().subscribe({
      next: (locs) => this.locations.set(locs),
      error: (err) => console.error("Error loading locations in reports:", err)
    });

    this.getAllActivos.execute().subscribe({
      next: (acts) => this.activos.set(acts),
      error: (err) => console.error("Error loading assets in reports:", err)
    });

    this.getAllMovements.execute().subscribe({
      next: (movs) => this.movements.set(movs),
      error: (err) => console.error("Error loading movements in reports:", err)
    });

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

  onPageSizeChange(size: number) {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  resetFilters() {
    this.searchTerm.set('');
    this.startDate.set('');
    this.endDate.set('');
    this.selectedLocationId.set('');
  }

  exportToCSV() {
    const tab = this.activeTab();
    if (tab === 'movimientos') {
      this.exportService.exportMovementsToCSV(this.filteredMovements());
    } else if (tab === 'altas') {
      this.exportService.exportAltasToCSV(this.filteredAltas(), this.typeMap(), this.isAdmin());
    } else if (tab === 'mantenimientos') {
      this.exportService.exportMantenimientosToCSV(
        this.filteredMantenimientos(),
        (id) => {
          const a = this.activos().find(x => x.id === id);
          return a ? a.placa : '...';
        },
        (id) => {
          const a = this.activos().find(x => x.id === id);
          return a ? `${a.marca} ${a.modelo}` : 'Cargando equipo...';
        }
      );
    }
  }
}
