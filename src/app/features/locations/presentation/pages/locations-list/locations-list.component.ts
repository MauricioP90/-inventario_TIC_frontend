import { Component, OnInit, signal, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Location } from '../../../domain/models/location.model';
import { GetAllLocationsUseCase } from '../../../application/use-cases/get-all-locations.use-case';
import { AddLocationDrawerComponent } from '../../../../../shared/components/drawer/location-drawer/add-location-drawer.component';

@Component({
  selector: 'app-locations-list',
  standalone: true,
  imports: [CommonModule, FormsModule, AddLocationDrawerComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">Ubicaciones</h2>
          <p class="text-sm text-slate-500 mt-1">Gestión de bodegas, oficinas y puntos físicos</p>
        </div>
        <button
          (click)="addDrawer.open()"
          class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-100">
          <span class="text-xl leading-none">+</span> Nueva Ubicación
        </button>
      </div>
      <!-- Filtros -->
      <div class="flex flex-wrap gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
        <div class="flex-1 min-w-[280px] relative">
          <span class="absolute inset-y-0 left-3 flex items-center text-slate-400">
            🔍
          </span>
          <input 
            type="text" 
            placeholder="Buscar por nombre o código..."
            [value]="searchTerm()"
            (input)="searchTerm.set($any($event.target).value)"
            class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm">
        </div>
        <select 
          [value]="statusFilter()"
          (change)="statusFilter.set($any($event.target).value)"
          class="px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm bg-white">
          <option value="">Todos los estados</option>
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
        </select>
      </div>
      <!-- Table ... unchanged part ... -->
      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>
      }
      @if (!loading()) {
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table class="w-full text-sm">
            <!-- the rest of the table ... -->
            <thead class="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Código</th>
                <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Nombre</th>
                <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Coordenadas</th>
                <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Estado</th>
                <th class="text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (location of filteredLocations(); track location.id) {
                <tr class="hover:bg-slate-50/50 transition-colors">
                  <td class="px-6 py-4 font-bold text-slate-700">{{ location.code }}</td>
                  <td class="px-6 py-4 font-medium text-slate-600">{{ location.nombre }}</td>
                  <td class="px-6 py-4 text-slate-500 font-mono text-[11px]">{{ location.coordenadas || 'N/A' }}</td>
                  <td class="px-6 py-4">
                    <span [class]="statusClass(location.estado)">{{ location.estado }}</span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button 
                      (click)="addDrawer.open(location)" 
                      [disabled]="location.estado === 'INACTIVO'"
                      [class.opacity-30]="location.estado === 'INACTIVO'"
                      [class.cursor-not-allowed]="location.estado === 'INACTIVO'"
                      class="text-indigo-600 hover:text-indigo-900 font-medium transition-all">
                      Editar
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="px-6 py-12 text-center text-slate-400 text-sm">Sin ubicaciones registradas</td></tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Drawer -->
      <app-add-location-drawer #addDrawer (onSave)="fetchLocations()"></app-add-location-drawer>
    </div>
  `,
  styles: []
})
export class LocationsListComponent implements OnInit {
  @ViewChild('addDrawer') addDrawer!: AddLocationDrawerComponent;

  locations = signal<Location[]>([]);
  searchTerm = signal('');
  statusFilter = signal('');

  filteredLocations = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const status = this.statusFilter();

    return this.locations().filter(loc => {

      const matchesSearch = loc.code.toLowerCase().includes(term) || loc.nombre.toLowerCase().includes(term);
      const matchesStatus = status === '' || loc.estado === status;

      return matchesSearch && matchesStatus;
    });
  });

  loading = signal(false);

  constructor(private getAllLocations: GetAllLocationsUseCase) { }

  ngOnInit() {
    this.fetchLocations();
  }

  fetchLocations() {
    this.loading.set(true);
    this.getAllLocations.execute().subscribe({
      next: (data) => {
        this.locations.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  statusClass(status: string): string {
    const base = 'text-[10px] font-bold px-2 py-0.5 rounded-full border ';
    return status === 'ACTIVO'
      ? base + 'bg-emerald-50 text-emerald-600 border-emerald-100'
      : base + 'bg-slate-50 text-slate-600 border-slate-100';
  }
}
