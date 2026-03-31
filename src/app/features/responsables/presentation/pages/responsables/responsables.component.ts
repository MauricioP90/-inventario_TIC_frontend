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
        <div class="md:col-span-5 relative">
          <span class="absolute inset-y-0 left-3 flex items-center text-slate-400">🔍</span>
          <input 
            type="text" 
            placeholder="Buscar por nombre o email..."
            [value]="searchTerm()"
            (input)="searchTerm.set($any($event.target).value)"
            class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm">
        </div>
        <div class="md:col-span-4">
          <select 
            [value]="locationFilter()"
            (change)="locationFilter.set($any($event.target).value)"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm bg-white">
            <option value="">Todas las sedes</option>
            @for (loc of locations(); track loc.id) {
              <option [value]="loc.id">{{ loc.nombre }}</option>
            }
          </select>
        </div>
        <div class="md:col-span-3">
          <select 
            [value]="statusFilter()"
            (change)="statusFilter.set($any($event.target).value)"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm bg-white">
            <option value="">Todos los estados</option>
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
                    <span class="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">{{ resp.rol }}</span>
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
  locationFilter = signal('');
  statusFilter = signal('');

  filteredResponsables = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const locId = this.locationFilter();
    const status = this.statusFilter();

    return this.responsables().filter(resp => {
      const matchesSearch = resp.nombre.toLowerCase().includes(term) || resp.email.toLowerCase().includes(term);
      const matchesLocation = !locId || resp.locationIds?.includes(locId);
      const matchesStatus = !status || resp.estado === status;
      return matchesSearch && matchesLocation && matchesStatus;
    });
  });

  constructor(
    private getAllResponsables: GetAllResponsablesUseCase,
    private getAllLocations: GetAllLocationsUseCase
  ) {}

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
