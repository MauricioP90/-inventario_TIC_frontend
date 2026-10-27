import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { Activo } from '../../../domain/models/activo.model';
import { SearchActivosUseCase } from '../../../application/use-cases/search-activos.use-case';
import { GetActivoMetadataUseCase } from '../../../application/use-cases/get-activo-metadata.use-case';
import { GetAllLocationsUseCase } from '../../../../locations/application/use-cases/get-all-locations.use-case';
import { AddActivoDrawerComponent } from '../../../../../shared/components/drawer/add-activo-drawer.component';
import { ActivoMetadata } from '../../../domain/models/activo.model';
import { Location } from '../../../../locations/domain/models/location.model';
import { RoleService } from '../../../../../core/auth/services/role.service';
import { InventoryFilterBarComponent } from '../../components/inventory-filter-bar.component';
import { InventoryTableComponent } from '../../components/inventory-table.component';
import { InventoryPaginationComponent } from '../../components/inventory-pagination.component';

@Component({
  selector: 'app-inventory-page',
  standalone: true,
  imports: [
    CommonModule,
    AddActivoDrawerComponent,
    InventoryFilterBarComponent,
    InventoryTableComponent,
    InventoryPaginationComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Header, Search & Filter Bar, Active Chips -->
      <app-inventory-filter-bar
        [loading]="loading()"
        [canCreateActivo]="roleService.canCreateActivo()"
        [searchTerm]="searchTerm()"
        (searchChange)="onSearchInput($event)"
        [selectedType]="selectedType()"
        (typeChange)="onTypeChange($event)"
        [selectedLocation]="selectedLocation()"
        (locationChange)="onLocationChange($event)"
        [selectedStatus]="selectedStatus()"
        (statusChange)="onStatusChange($event)"
        [selectedModel]="selectedModel()"
        [metadata]="metadata()"
        [locations]="locations()"
        [typeMap]="typeMap()"
        [locationMap]="locationMap()"
        (refresh)="fetchData()"
        (addNew)="abrirNuevo()"
        (clearStatus)="clearStatusFilter()"
        (clearModel)="clearModelFilter()"
        (clearType)="clearTypeFilter()"
        (clearLocation)="clearLocationFilter()"
        (clearSearch)="clearSearchFilter()"
        (clearAll)="clearAllFilters()"
      />

      <!-- Table & Pagination -->
      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>
      }
      @if (!loading()) {
        <div class="space-y-0">
          <app-inventory-table
            [activos]="paginatedActivos()"
            [typeMap]="typeMap()"
            [locationMap]="locationMap()"
            [isAdmin]="isAdmin()"
            [canEditActivo]="roleService.canEditActivo()"
            [newlyCreatedPlaca]="newlyCreatedPlaca()"
            (edit)="editarActivo($event)"
          />

          <app-inventory-pagination
            [startIndex]="startIndex()"
            [endIndex]="endIndex()"
            [totalActivos]="totalActivos()"
            [pageSize]="pageSize()"
            [currentPage]="currentPage()"
            [totalPages]="totalPages()"
            (pageSizeChange)="onPageSizeChange($event)"
            (prevPage)="prevPage()"
            (nextPage)="nextPage()"
          />
        </div>
      }
    </div>

    <!-- Add/Edit Asset Drawer -->
    <app-add-activo-drawer
      [open]="showDrawer()"
      [activo]="selectedActivo()"
      (openChange)="handleDrawerOpenChange($event)"
      (saved)="handleSaved($event)"
    />
  `,
  styles: []
})
export class InventoryPageComponent implements OnInit {
  public roleService = inject(RoleService);
  isAdmin = computed(() => this.roleService.isAdmin());

  activos = signal<Activo[]>([]);
  totalActivos = signal<number>(0);
  locations = signal<Location[]>([]);
  loading = signal(false);
  showDrawer = signal(false);
  selectedActivo = signal<Activo | null>(null);
  metadata = signal<ActivoMetadata | null>(null);

  // Señales para filtros
  searchTerm = signal('');
  selectedType = signal('');
  selectedLocation = signal('');
  selectedStatus = signal('');
  selectedModel = signal('');
  pendingTipoName: string = '';
  private searchSubject = new Subject<string>();

  // Señales de Paginación
  currentPage = signal(1);
  pageSize = signal(10);

  // Datos de la página actual
  paginatedActivos = computed(() => this.activos());

  startIndex = computed(() => {
    if (this.totalActivos() === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  endIndex = computed(() => {
    const end = this.currentPage() * this.pageSize();
    const total = this.totalActivos();
    return end > total ? total : end;
  });

  totalPages = computed(() => {
    const total = this.totalActivos();
    const size = this.pageSize();
    return Math.max(Math.ceil(total / size), 1);
  });

  statusMap = computed(() => {
    const meta = this.metadata();
    if (!meta) return {};
    return meta.statuses.reduce((acc, curr) => ({ ...acc, [curr.id]: curr }), {} as Record<string, any>);
  });

  typeMap = computed(() => {
    const meta = this.metadata();
    if (!meta) return {};
    return meta.types.reduce((acc, curr) => ({ ...acc, [curr.id]: curr }), {} as Record<string, any>);
  });

  locationMap = computed(() => {
    return this.locations().reduce((acc, curr) => ({ ...acc, [curr.id]: curr }), {} as Record<string, any>);
  });

  newlyCreatedPlaca = signal<string | null>(null);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  constructor(
    private searchActivosUC: SearchActivosUseCase,
    private getMetadataUC: GetActivoMetadataUseCase,
    private getLocationsUC: GetAllLocationsUseCase
  ) {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((term) => {
      this.searchTerm.set(term);
      this.currentPage.set(1);
      this.updateUrl();
      this.fetchActivos();
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['estado']) {
        this.selectedStatus.set(params['estado']);
      }
      if (params['modelo']) {
        this.selectedModel.set(params['modelo']);
      }
      if (params['tipoActivoId']) {
        this.selectedType.set(params['tipoActivoId']);
      }
      if (params['tipo']) {
        this.pendingTipoName = params['tipo'];
      }
      if (params['locationId']) {
        this.selectedLocation.set(params['locationId']);
      }
      if (params['search']) {
        this.searchTerm.set(params['search']);
      }
      this.fetchData();
    });
  }

  abrirNuevo() {
    this.selectedActivo.set(null);
    this.showDrawer.set(true);
  }

  editarActivo(activo: Activo) {
    this.selectedActivo.set(activo);
    this.showDrawer.set(true);
  }

  handleDrawerOpenChange(isOpen: boolean) {
    this.showDrawer.set(isOpen);
    if (!isOpen) {
      this.selectedActivo.set(null);
    }
  }

  onSearchInput(val: string) {
    this.searchSubject.next(val);
  }

  onTypeChange(val: string) {
    this.selectedType.set(val);
    this.pendingTipoName = '';
    this.currentPage.set(1);
    this.updateUrl();
    this.fetchActivos();
  }

  onLocationChange(val: string) {
    this.selectedLocation.set(val);
    this.currentPage.set(1);
    this.updateUrl();
    this.fetchActivos();
  }

  onStatusChange(val: string) {
    this.selectedStatus.set(val);
    this.currentPage.set(1);
    this.updateUrl();
    this.fetchActivos();
  }

  onPageSizeChange(val: number) {
    this.pageSize.set(val);
    this.currentPage.set(1);
    this.fetchActivos();
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.fetchActivos();
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
      this.fetchActivos();
    }
  }

  clearStatusFilter() {
    this.selectedStatus.set('');
    this.currentPage.set(1);
    this.updateUrl();
    this.fetchActivos();
  }

  clearModelFilter() {
    this.selectedModel.set('');
    this.currentPage.set(1);
    this.updateUrl();
    this.fetchActivos();
  }

  clearTypeFilter() {
    this.selectedType.set('');
    this.pendingTipoName = '';
    this.currentPage.set(1);
    this.updateUrl();
    this.fetchActivos();
  }

  clearLocationFilter() {
    this.selectedLocation.set('');
    this.currentPage.set(1);
    this.updateUrl();
    this.fetchActivos();
  }

  clearSearchFilter() {
    this.searchTerm.set('');
    this.onSearchInput('');
  }

  clearAllFilters() {
    this.selectedStatus.set('');
    this.selectedModel.set('');
    this.selectedType.set('');
    this.selectedLocation.set('');
    this.searchTerm.set('');
    this.pendingTipoName = '';
    this.currentPage.set(1);
    this.updateUrl();
    this.fetchActivos();
  }

  private updateUrl() {
    const queryParams: Record<string, string | null> = {
      estado: this.selectedStatus() || null,
      modelo: this.selectedModel() || null,
      tipoActivoId: this.selectedType() || null,
      locationId: this.selectedLocation() || null,
      search: this.searchTerm() || null,
      tipo: null
    };
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  handleSaved(placa: string) {
    this.fetchActivos();
    if (placa) {
      this.newlyCreatedPlaca.set(placa);
      setTimeout(() => {
        this.newlyCreatedPlaca.set(null);
      }, 30000);
    }
  }

  fetchData() {
    this.getMetadataUC.execute().subscribe({
      next: (meta) => {
        this.metadata.set(meta);
        if (this.pendingTipoName) {
          const matched = meta.types.find(t => 
            t.label.toLowerCase() === this.pendingTipoName.toLowerCase() ||
            t.id.toLowerCase() === this.pendingTipoName.toLowerCase()
          );
          if (matched) {
            this.selectedType.set(matched.id);
          }
          this.pendingTipoName = '';
          this.fetchActivos();
        }
      },
      error: (err) => console.error("Error cargando metadata", err)
    });

    this.getLocationsUC.execute().subscribe({
      next: (locs) => this.locations.set(locs),
      error: (err) => console.error("Error cargando ubicaciones", err)
    });

    if (!this.pendingTipoName) {
      this.fetchActivos();
    }
  }

  fetchActivos() {
    this.loading.set(true);
    this.searchActivosUC.execute({
      search: this.searchTerm().trim() || undefined,
      tipoActivoId: this.selectedType() || undefined,
      locationId: this.selectedLocation() || undefined,
      estado: this.selectedStatus() || undefined,
      modelo: this.selectedModel().trim() || undefined,
      page: this.currentPage(),
      limit: this.pageSize()
    }).subscribe({
      next: (res) => {
        this.activos.set(res.data);
        this.totalActivos.set(res.total);
        this.loading.set(false);
      },
      error: (err) => {
        console.error("Error cargando activos", err);
        this.loading.set(false);
      }
    });
  }
}
