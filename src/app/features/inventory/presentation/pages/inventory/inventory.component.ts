import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { Activo } from '../../../domain/models/activo.model';
import { SearchActivosUseCase } from '../../../application/use-cases/search-activos.use-case';
import { GetActivoMetadataUseCase } from '../../../application/use-cases/get-activo-metadata.use-case';
import { GetAllLocationsUseCase } from '../../../../locations/application/use-cases/get-all-locations.use-case'; // <-- Importamos para el filtro
import { AddActivoDrawerComponent } from '../../../../../shared/components/drawer/add-activo-drawer.component';
import { ActivoMetadata } from '../../../domain/models/activo.model';
import { Location } from '../../../../locations/domain/models/location.model'; // <-- Importamos para el tipado
import { RoleService } from '../../../../../core/auth/services/role.service';

@Component({
  selector: 'app-inventory-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AddActivoDrawerComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">Inventario de Activos</h2>
          <p class="text-sm text-slate-500 mt-1">Gestión integral de hardware y dispositivos</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            (click)="fetchData()"
            [disabled]="loading()"
            class="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-slate-50 active:bg-slate-100 rounded-xl border border-slate-200 transition-all shadow-sm bg-white disabled:opacity-50"
            title="Actualizar listado">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class.animate-spin]="loading()">
              <path d="M23 4v6h-6"></path>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
          </button>
          @if (roleService.canCreateActivo()) {
            <button
              (click)="abrirNuevo()"
              class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-100">
              <span class="text-xl leading-none">+</span> Añadir Nuevo Activo
            </button>
          }
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-3 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
        <div class="md:col-span-2 relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input type="text" 
                 [ngModel]="searchTerm()" 
                 (ngModelChange)="onSearchInput($event)"
                 placeholder="Buscar por placa, serial, modelo..." 
                 class="w-full pl-10 pr-4 h-10 bg-slate-50 border border-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm transition-all">
        </div>
        
        <select 
          [ngModel]="selectedType()" 
          (ngModelChange)="onTypeChange($event)"
          class="h-10 bg-slate-50 border border-slate-100 rounded-lg px-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none transition-all">
          <option value="">Todos los tipos</option>
          @for (type of metadata()?.types; track type.id) {
            <option [value]="type.id">{{ type.label }}</option>
          }
        </select>

        <select 
          [ngModel]="selectedLocation()" 
          (ngModelChange)="onLocationChange($event)"
          class="h-10 bg-slate-50 border border-slate-100 rounded-lg px-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none transition-all">
          <option value="">Todas las ubicaciones</option>
          @for (loc of locations(); track loc.id) {
            <option [value]="loc.id">{{ loc.nombre }}</option>
          }
        </select>

        <select 
          [ngModel]="selectedStatus()" 
          (ngModelChange)="onStatusChange($event)"
          class="h-10 bg-slate-50 border border-slate-100 rounded-lg px-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none transition-all">
          <option value="">Todos los estados</option>
          @for (st of metadata()?.statuses; track st.id) {
            <option [value]="st.id">{{ getStatusLabel(st.id) }}</option>
          }
        </select>
      </div>

      <!-- Barra de Filtros Activos / Breadcrumb Contextual -->
      @if (selectedStatus() || selectedModel() || selectedType() || selectedLocation() || searchTerm()) {
        <div class="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-xl text-xs">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Filtros aplicados:</span>
            
            @if (selectedStatus()) {
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-white shadow-2xs"
                    [style.backgroundColor]="getStatusColor(selectedStatus())">
                <span>Estado: {{ getStatusLabel(selectedStatus()) }}</span>
                <button (click)="clearStatusFilter()" class="hover:opacity-75 cursor-pointer font-black ml-1" title="Quitar filtro de estado">✕</button>
              </span>
            }

            @if (selectedModel()) {
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
                <span>Modelo: {{ selectedModel() }}</span>
                <button (click)="clearModelFilter()" class="hover:text-indigo-950 cursor-pointer font-black ml-1" title="Quitar filtro de modelo">✕</button>
              </span>
            }

            @if (selectedType()) {
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold bg-slate-200 text-slate-800 shadow-2xs">
                <span>Tipo: {{ typeMap()[selectedType()]?.label || selectedType() }}</span>
                <button (click)="clearTypeFilter()" class="hover:opacity-75 cursor-pointer font-black ml-1" title="Quitar filtro de tipo">✕</button>
              </span>
            }

            @if (selectedLocation()) {
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold bg-slate-200 text-slate-800 shadow-2xs">
                <span>Ubicación: {{ locationMap()[selectedLocation()]?.nombre || selectedLocation() }}</span>
                <button (click)="clearLocationFilter()" class="hover:opacity-75 cursor-pointer font-black ml-1" title="Quitar filtro de ubicación">✕</button>
              </span>
            }

            @if (searchTerm()) {
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold bg-slate-200 text-slate-700 shadow-2xs">
                <span>Texto: "{{ searchTerm() }}"</span>
                <button (click)="searchTerm.set(''); onSearchInput('');" class="hover:opacity-75 cursor-pointer font-black ml-1" title="Quitar filtro de búsqueda">✕</button>
              </span>
            }

            <button (click)="clearAllFilters()" class="text-indigo-600 hover:text-indigo-800 font-bold text-[11px] underline ml-2 cursor-pointer">
              Limpiar todos
            </button>
          </div>

          <a routerLink="/" class="inline-flex items-center gap-1.5 font-bold text-slate-500 hover:text-indigo-600 transition-colors text-[11px] ml-auto">
            <span>← Volver al Dashboard</span>
          </a>
        </div>
      }

      <!-- Table -->
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
                <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Placa</th>
                <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Tipo</th>
                <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Marca</th>
                <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Modelo</th>
                <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Serial</th>
                <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Ubicación</th>
                <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Estado</th>
                @if (isAdmin()) {
                  <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Precio Compra</th>
                }
                @if (roleService.canEditActivo()) {
                  <th class="text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Acciones</th>
                }
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (activo of paginatedActivos(); track activo.id) {
                <tr 
                  [class.bg-emerald-50/70]="newlyCreatedPlaca() === activo.placa"
                  [class.hover:bg-emerald-100/50]="newlyCreatedPlaca() === activo.placa"
                  class="hover:bg-slate-50/50 transition-all duration-500">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex flex-col items-start gap-1">
                      <span class="font-bold text-slate-700 underline decoration-indigo-200 underline-offset-4 font-mono text-xs">{{ activo.placa }}</span>
                      @if (activo.facturaUrl) {
                        <a 
                          [href]="activo.facturaUrl" 
                          target="_blank" 
                          title="Ver Factura Adjunta"
                          class="inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900 border border-indigo-200/80 px-2 py-0.5 rounded-md transition-all">
                          📄 Factura
                        </a>
                      }
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-50 text-slate-600 border-slate-200">
                      {{ typeMap()[activo.tipoActivoId]?.label || activo.tipoActivoId }}
                    </span>
                  </td>
                  <td class="px-6 py-4 font-medium text-slate-600" italic>{{ activo.marca }}</td>
                  <td class="px-6 py-4 font-medium text-slate-600">{{ activo.modelo }}</td>
                  <td class="px-6 py-4 text-[11px] font-mono text-slate-400 tracking-tighter">{{ activo.serial }}</td>
                  <td class="px-6 py-4 text-slate-500 font-medium">
                    <div>{{ locationMap()[activo.locationId]?.nombre || activo.locationId }}</div>
                    <div class="text-[11px] text-slate-400 font-normal mt-0.5">
                      {{ activo.area?.nombre || 'NO APLICA' }}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    @if (activo.estado === 'EN_TRANSITO') {
                      <a [routerLink]="['/movements']"
                         [queryParams]="{ search: activo.placa, tab: 'PENDING' }"
                         title="Ver traslado de este equipo en Movimientos →"
                         class="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-lg text-white shadow-sm bg-indigo-600 hover:bg-indigo-700 hover:ring-2 hover:ring-indigo-300 hover:scale-105 transition-all cursor-pointer">
                        {{ getStatusLabel(activo.estado) }}
                      </a>
                    } @else if (activo.estado === 'RECHAZADO') {
                      <a [routerLink]="['/movements']"
                         [queryParams]="{ search: activo.placa, tab: 'HISTORY' }"
                         title="Ver novedad o motivo de rechazo en Movimientos →"
                         class="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-lg text-white shadow-sm bg-red-600 hover:bg-red-700 hover:ring-2 hover:ring-red-300 hover:scale-105 transition-all cursor-pointer">
                        {{ getStatusLabel(activo.estado) }}
                      </a>
                    } @else if (activo.estado === 'MANTENIMIENTO') {
                      <a [routerLink]="['/maintenance']"
                         [queryParams]="{ search: activo.placa }"
                         title="Ver orden de mantenimiento →"
                         class="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-lg text-white shadow-sm bg-amber-500 hover:bg-amber-600 hover:ring-2 hover:ring-amber-300 hover:scale-105 transition-all cursor-pointer">
                        {{ getStatusLabel(activo.estado) }}
                      </a>
                    } @else {
                      <span 
                        [style.backgroundColor]="getStatusColor(activo.estado)"
                        class="text-[10px] font-bold px-2.5 py-1 rounded-lg text-white shadow-sm inline-block">
                        {{ getStatusLabel(activo.estado) }}
                      </span>
                    }
                  </td>
                  @if (isAdmin()) {
                    <td class="px-6 py-4 font-medium text-indigo-600">
                      {{ activo.precioCompra ? '$ ' + (activo.precioCompra | number:'1.2-2') : '—' }}
                    </td>
                  }
                  @if (roleService.canEditActivo()) {
                    <td class="px-6 py-4 text-right">
                      @if (activo.estado !== 'BAJA') {
                        <button 
                          (click)="editarActivo(activo)"
                          class="text-indigo-600 hover:text-indigo-900 font-medium transition-all">
                          Editar
                        </button>
                      } @else {
                        <span class="text-slate-300 font-medium cursor-not-allowed" title="Equipo inactivo, no modificable">
                          Editar
                        </span>
                      }
                    </td>
                  }
                </tr>
              } @empty {
                <tr><td [attr.colspan]="(isAdmin() ? 8 : 7) + (roleService.canEditActivo() ? 1 : 0)" class="px-6 py-12 text-center text-slate-400 text-sm">Sin activos registrados</td></tr>
              }
            </tbody>
          </table>
          <!-- Barra de navegación de páginas (Paginación) -->
          <div class="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium select-none">
            <!-- Rango actual -->
            <div>
              Mostrando <span class="font-bold text-slate-700">{{ startIndex() }}</span> a 
              <span class="font-bold text-slate-700">{{ endIndex() }}</span> de 
              <span class="font-bold text-slate-700">{{ totalActivos() }}</span> activos
            </div>
            
            <!-- Controles -->
            <div class="flex items-center gap-4">
              <!-- Selector de cantidad por página -->
              <div class="flex items-center gap-1.5">
                <span>Filas por página:</span>
                <select 
                  [ngModel]="pageSize()" 
                  (ngModelChange)="onPageSizeChange(+$event)"
                  class="bg-white border border-slate-200 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-indigo-500/30">
                  <option [value]="5">5</option>
                  <option [value]="10">10</option>
                  <option [value]="25">25</option>
                  <option [value]="50">50</option>
                </select>
              </div>

              <!-- Navegación -->
              <div class="flex items-center gap-1">
                <button 
                  (click)="prevPage()" 
                  [disabled]="currentPage() === 1"
                  class="w-7 h-7 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold">
                  ‹
                </button>
                <span class="text-slate-600 font-bold px-1">Pág. {{ currentPage() }} de {{ totalPages() }}</span>
                <button 
                  (click)="nextPage()" 
                  [disabled]="currentPage() === totalPages()"
                  class="w-7 h-7 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold">
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>

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
    // 1. Cargamos la Metadata (Filtros dinámicos de tipos y estados)
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

    // 2. Cargamos las Ubicaciones (Para el filtro de ubicaciones)
    this.getLocationsUC.execute().subscribe({
      next: (locs) => this.locations.set(locs),
      error: (err) => console.error("Error cargando ubicaciones", err)
    });

    // 3. Cargamos los Activos mediante Search si no hay pendingTipoName pendiente de resolver
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

  getStatusColor(estado: string): string {
    const colors: Record<string, string> = {
      'DISPONIBLE': '#10b981',
      'BODEGA': '#10b981',
      'OPERACION': '#2563eb',
      'MANTENIMIENTO': '#f59e0b',
      'BAJA': '#dc2626',
      'RECHAZADO': '#ef4444',
      'EN_TRANSITO': '#6366f1',
      'EN_TRANSIT': '#6366f1'
    };
    return colors[estado?.toUpperCase()] || '#64748b';
  }

  getStatusLabel(estado: string): string {
    const labels: Record<string, string> = {
      'DISPONIBLE': 'DISPONIBLE',
      'BODEGA': 'DISPONIBLE',
      'OPERACION': 'OPERACIÓN',
      'MANTENIMIENTO': 'MANTENIMIENTO',
      'BAJA': 'INACTIVO',
      'RECHAZADO': 'RECHAZADO / NOVEDAD',
      'EN_TRANSITO': 'EN TRÁNSITO',
      'EN_TRANSIT': 'EN TRÁNSITO'
    };
    return labels[estado?.toUpperCase()] || estado;
  }
}
