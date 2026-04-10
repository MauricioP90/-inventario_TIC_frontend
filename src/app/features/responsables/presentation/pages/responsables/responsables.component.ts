import { Component, OnInit, signal, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Responsable } from '../../../domain/models/responsable.model';
import { Location } from '../../../../locations/domain/models/location.model';
import { GetAllResponsablesUseCase } from '../../../application/use-cases/get-all-responsables.use-case';
import { GetAllLocationsUseCase } from '../../../../locations/application/use-cases/get-all-locations.use-case';
import { AddResponsableDrawerComponent } from '../../../../../shared/components/drawer/responsable-drawer/add-responsable-drawer.component';

@Component({
  selector: 'app-responsables-page',
  standalone: true,
  imports: [CommonModule, FormsModule, AddResponsableDrawerComponent],
  template: `
    <div class="p-4 md:p-6 space-y-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
            <svg class="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-slate-800">Responsables</h1>
            <p class="text-sm text-slate-500">Gestión de personal y asignaciones de red</p>
          </div>
        </div>
        <button 
          (click)="addDrawer.open()"
          class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-100">
          + Nuevo Responsable
        </button>
      </div>

      <!-- Filtros -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div class="md:col-span-4 relative">
          <span class="absolute inset-y-0 left-3 flex items-center text-slate-400">🔍</span>
          <input 
            type="text" 
            placeholder="Buscar por nombre o email..."
            [value]="searchTerm()"
            (input)="searchTerm.set($any($event.target).value)"
            class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm">
        </div>
        <!-- Filtro Multi-Sede Custom -->
        <div class="md:col-span-3 relative">
          <!-- Botón que abre el menú -->
          <button 
            type="button"
            (click)="isLocationDropdownOpen.set(!isLocationDropdownOpen())"
            class="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all text-sm text-slate-600 text-left">
            <span class="truncate">
              {{ locationFilter().length === 0 ? 'Todas las sedes' : locationFilter().length + ' sedes seleccionadas' }}
            </span>
            <span class="text-[10px] text-slate-400">▼</span>
          </button>

          <!-- El Menú Flotante -->
          @if (isLocationDropdownOpen()) {
            <div class="absolute z-20 top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden p-2">
              
              <!-- Buscador -->
              <div class="relative mb-2">
                <span class="absolute inset-y-0 left-2 flex items-center text-slate-400 text-xs">🔍</span>
                <input 
                  type="text" 
                  [value]="searchLocationTerm()"
                  (input)="searchLocationTerm.set($any($event.target).value)"
                  placeholder="Buscar sede..."
                  class="w-full pl-7 pr-3 py-1.5 rounded-lg border border-slate-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-xs transition-all">
              </div>

              <!-- Lista con Checkboxes -->
              <div class="max-h-48 overflow-y-auto space-y-1">
                @for (loc of filteredLocationsDropdown(); track loc.id) {
                  <label class="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-md cursor-pointer group">
                    <input 
                      type="checkbox" 
                      [checked]="locationFilter().includes(loc.id)"
                      (change)="toggleLocationFilter(loc.id)"
                      class="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300">
                    <div class="flex flex-col">
                      <span class="text-xs font-medium text-slate-700 group-hover:text-indigo-600 transition-colors truncate">{{ loc.nombre }}</span>
                    </div>
                  </label>
                } @empty {
                  <p class="text-[10px] text-slate-400 text-center py-2">Sede no encontrada</p>
                }
              </div>
              
              <!-- Botón cerrar (Opcional, de ayuda UX) -->
               <div class="mt-2 pt-2 border-t border-slate-100 text-center">
                 <button (click)="isLocationDropdownOpen.set(false)" class="text-[10px] font-bold text-indigo-600 hover:text-indigo-800">
                   Cerrar Filtro
                 </button>
               </div>
            </div>
          }
        </div>
                <div class="md:col-span-3">
          <select 
            [value]="roleFilter()"
            (change)="roleFilter.set($any($event.target).value)"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm bg-white cursor-pointer">
            <option value="">Cualquier Rol</option>
            <option value="ADMIN">Administrador</option>
            <option value="TECNICO">Técnico</option>
            <option value="COORDINADOR">Coordinador</option>
            <option value="EXTERNO">Externo / Usuario</option>
          </select>
        </div>
        <div class="md:col-span-2">
          <select 
            [value]="statusFilter()"
            (change)="statusFilter.set($any($event.target).value)"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm bg-white">
            <option value="">estados</option>
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
          </select>
        </div>
      </div>

      <!-- Table -->
      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>
      } @else {
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-slate-50/50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th class="text-left px-6 py-4">Responsable</th>
                <th class="text-left px-6 py-4">Rol</th>
                <th class="text-left px-6 py-4">Sedes Asignadas</th>
                <th class="text-center px-6 py-4">Estadísticas</th>
                <th class="text-center px-6 py-4">Estado</th>
                <th class="text-right px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (resp of filteredResponsables(); track resp.id) {
                <tr class="hover:bg-slate-50/50 transition-colors">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-[10px]">
                        {{ getInitials(resp.nombre) }}
                      </div>
                      <div>
                        <p class="font-bold text-slate-700 truncate">{{ resp.nombre }}</p>
                        <p class="text-[10px] text-slate-400">{{ resp.email }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span class="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">{{ resp.role.nombre }}</span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex flex-wrap gap-1">
                      @for (loc of getLocNames(resp.locationIds); track $index) {
                        <span class="text-[9px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100">{{ loc }}</span>
                      } @empty {
                        <span class="text-[9px] text-slate-400">Sin sedes</span>
                      }
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center justify-center gap-4">
                      <div class="flex flex-col items-center">
                        <span class="text-[10px] text-slate-400">Activos</span>
                        <span class="font-bold text-slate-700">{{ resp.totalActivos || 0 }}</span>
                      </div>
                      <div class="flex flex-col items-center">
                        <span class="text-[10px] text-slate-400">SIMs</span>
                        <span class="font-bold text-slate-700">{{ resp.totalSIMCards || 0 }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <span [class]="statusClass(resp.estado)">{{ resp.estado }}</span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button 
                      (click)="addDrawer.open(resp)"
                      class="text-indigo-600 hover:text-indigo-900 font-bold transition-colors">
                      Editar
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="px-6 py-12 text-center text-slate-400">No se encontraron responsables</td></tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Drawer Component -->
      <app-add-responsable-drawer #addDrawer (onSave)="fetchData()"></app-add-responsable-drawer>
    </div>
  `,
  styles: []
})
export class ResponsablesPageComponent implements OnInit {
  @ViewChild('addDrawer') addDrawer!: AddResponsableDrawerComponent;

  responsables = signal<Responsable[]>([]);
  locations = signal<Location[]>([]);
  loading = signal(false);

  // Filtros
  searchTerm = signal('');
  isLocationDropdownOpen = signal(false);
  locationFilter = signal<string[]>([]);
  searchLocationTerm = signal('');
  filteredLocationsDropdown = computed(() => {
    const term = this.searchLocationTerm().toLowerCase().trim();
    if (!term) return this.locations();
    return this.locations().filter(loc =>
      loc.nombre.toLowerCase().includes(term) ||
      loc.code.toLowerCase().includes(term)
    );
  });

  toggleLocationFilter(id: string) {
    const current = this.locationFilter();
    if (current.includes(id)) {
      this.locationFilter.set(current.filter(item => item !== id));
    } else {
      this.locationFilter.set([...current, id]);
    }
  }

  statusFilter = signal('');
  roleFilter = signal('');

  filteredResponsables = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const locIds = this.locationFilter(); // Ahora es un array
    const status = this.statusFilter();
    const role = this.roleFilter();
    return this.responsables().filter(resp => {
      const matchesSearch = resp.nombre.toLowerCase().includes(term) || resp.email.toLowerCase().includes(term);

      // La magia: Si no hay filtro, pasan todos. Si hay, verificamos si el responsable tiene alguna de las sedes seleccionadas.
      const matchesLocation = locIds.length === 0 ||
        locIds.some(id => resp.locationIds?.includes(id));

      const matchesStatus = !status || resp.estado === status;
      const matchesRol = !role || resp.role.nombre === role;
      return matchesSearch && matchesLocation && matchesStatus && matchesRol;
    });
  });

  constructor(
    private getAllResponsables: GetAllResponsablesUseCase,
    private getAllLocations: GetAllLocationsUseCase
  ) { }

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.loading.set(true);
    // Cargar sedes primero para los filtros
    this.getAllLocations.execute().subscribe({
      next: (locs) => {
        this.locations.set(locs);

        // Cargar responsables
        this.getAllResponsables.execute().subscribe({
          next: (resps) => {
            this.responsables.set(resps);
            this.loading.set(false);
          },
          error: (err) => {
            console.error('Error loading responsables:', err);
            this.loading.set(false);
          }
        });
      },
      error: (err) => {
        console.error('Error loading locations:', err);
        this.loading.set(false);
      }
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  getLocNames(ids: string[] = []): string[] {
    return ids.map(id => {
      const loc = this.locations().find(l => l.id === id);
      return loc ? loc.nombre : '...';
    });
  }

  statusClass(status: string): string {
    const base = 'text-[10px] font-bold px-2 py-0.5 rounded-full border ';
    return status === 'ACTIVO'
      ? base + 'bg-emerald-50 text-emerald-600 border-emerald-100'
      : base + 'bg-slate-50 text-slate-600 border-slate-100';
  }
}
