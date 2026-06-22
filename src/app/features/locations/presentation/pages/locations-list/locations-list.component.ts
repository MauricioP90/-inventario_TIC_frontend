import { Component, OnInit, signal, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Location } from '../../../domain/models/location.model';
import { GetAllLocationsUseCase } from '../../../application/use-cases/get-all-locations.use-case';
import { ReverseGeocodeUseCase } from '../../../application/use-cases/reverse-geocode.use-case';
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
                  <td class="px-6 py-4 font-bold text-slate-700 cursor-pointer hover:text-indigo-600 transition-colors" (click)="toggleExpand(location)">
                    <div class="flex items-center gap-1.5">
                      <span>{{ location.code }}</span>
                      @if (location.coordenadas || location.observaciones || (location.areas && location.areas.length > 0)) {
                        <span class="text-[10px] text-slate-400 font-normal">
                          {{ expandedLocationId() === location.id ? '▲' : '▼' }}
                        </span>
                      }
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span class="font-medium text-slate-600 block">{{ location.nombre }}</span>
                  </td>
                  <td class="px-6 py-4 text-slate-500 font-mono text-[11px] select-all">
                    {{ location.coordenadas || 'N/A' }}
                  </td>
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
                @if (expandedLocationId() === location.id) {
                  <tr class="bg-slate-50/50">
                    <td colspan="5" class="px-8 py-5 border-y border-slate-100">
                      @if (parseCoordinates(location.coordenadas); as coords) {
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <!-- Col 1: Geocoding & Additional Details -->
                          <div class="space-y-4">
                            <div>
                              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Dirección Física Estimada</h4>
                              @if (resolvedAddresses()[location.id]; as addrState) {
                                @if (addrState.loading) {
                                  <div class="flex items-center gap-2 mt-2 text-xs text-slate-500">
                                    <div class="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                                    <span>Consultando dirección en mapa...</span>
                                  </div>
                                }
                                @if (!addrState.loading && addrState.address) {
                                  <p class="text-xs font-semibold text-slate-700 mt-2 bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-start gap-2 leading-relaxed">
                                    <span class="text-indigo-600 text-base">📍</span>
                                    <span>{{ addrState.address }}</span>
                                  </p>
                                }
                                @if (addrState.error) {
                                  <p class="text-xs text-rose-500 mt-2 bg-rose-50 border border-rose-100 p-2 rounded-lg">
                                    ⚠️ {{ addrState.error }}
                                  </p>
                                }
                              }
                            </div>

                            @if (location.observaciones) {
                              <div>
                                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Observaciones / Detalles Adicionales</h4>
                                <p class="text-xs font-semibold text-slate-700 mt-2 bg-white p-3 rounded-lg border border-slate-200 shadow-sm leading-relaxed whitespace-pre-wrap">{{ location.observaciones }}</p>
                              </div>
                            }
                            
                            @if (location.areas && location.areas.length > 0) {
                              <div>
                                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Áreas Asociadas ({{ location.areas.length }})</h4>
                                <div class="grid grid-cols-2 gap-x-6 gap-y-2 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                  @for (area of location.areas; track area.id) {
                                    <div class="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                      <span class="text-indigo-500 text-sm leading-none">•</span>
                                      <span class="truncate" [title]="area.nombre">{{ area.nombre }}</span>
                                    </div>
                                  }
                                </div>
                              </div>
                            }
                            
                            <div class="space-y-1.5 text-xs text-slate-500 bg-white p-3 rounded-lg border border-slate-100">
                              <p><strong>Latitud:</strong> {{ coords.lat }}</p>
                              <p><strong>Longitud:</strong> {{ coords.lon }}</p>
                            </div>
                            <p class="text-[9px] text-slate-400 italic">
                              * La dirección física se resuelve de manera automática usando el servicio gratuito de OpenStreetMap Nominatim.
                            </p>
                          </div>
                          <!-- Col 2: Iframe map -->
                          <div class="h-64 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                            <iframe 
                              [src]="getSafeMapUrl(coords.lat, coords.lon)"
                              class="w-full h-full border-0" 
                              allowfullscreen="" 
                              loading="lazy" 
                              referrerpolicy="no-referrer-when-downgrade">
                            </iframe>
                          </div>
                        </div>
                      } @else {
                        <div class="space-y-4">
                          @if (location.observaciones) {
                            <div>
                              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Observaciones / Detalles Adicionales</h4>
                              <p class="text-xs font-semibold text-slate-700 mt-2 bg-white p-3 rounded-lg border border-slate-200 shadow-sm leading-relaxed whitespace-pre-wrap">{{ location.observaciones }}</p>
                            </div>
                          }
                          
                          @if (location.areas && location.areas.length > 0) {
                            <div>
                              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Áreas Asociadas ({{ location.areas.length }})</h4>
                              <div class="grid grid-cols-2 gap-x-6 gap-y-2 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                @for (area of location.areas; track area.id) {
                                  <div class="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                    <span class="text-indigo-500 text-sm leading-none">•</span>
                                    <span class="truncate" [title]="area.nombre">{{ area.nombre }}</span>
                                  </div>
                                }
                              </div>
                            </div>
                          }
                          
                          <div class="text-center py-6 text-slate-400 text-xs bg-white p-4 rounded-xl border border-slate-100">
                            📍 No hay coordenadas válidas registradas para esta ubicación. Edite la ubicación e ingréselas en formato "Latitud, Longitud" (ej. 4.6538,-74.1164).
                          </div>
                        </div>
                      }
                    </td>
                  </tr>
                }
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
  expandedLocationId = signal<string | null>(null);
  resolvedAddresses = signal<Record<string, { address: string; loading: boolean; error?: string }>>({});

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

  constructor(
    private getAllLocations: GetAllLocationsUseCase,
    private reverseGeocodeUseCase: ReverseGeocodeUseCase,
    private sanitizer: DomSanitizer
  ) { }

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

  toggleExpand(location: Location) {
    if (this.expandedLocationId() === location.id) {
      this.expandedLocationId.set(null);
    } else {
      this.expandedLocationId.set(location.id);
      const coords = this.parseCoordinates(location.coordenadas);
      if (coords && !this.resolvedAddresses()[location.id]) {
        this.resolveAddress(location.id, coords.lat, coords.lon);
      }
    }
  }

  parseCoordinates(coordenadas?: string | null): { lat: number; lon: number } | null {
    if (!coordenadas) return null;
    const parts = coordenadas.split(',');
    if (parts.length !== 2) return null;
    const lat = parseFloat(parts[0].trim());
    const lon = parseFloat(parts[1].trim());
    if (isNaN(lat) || isNaN(lon)) return null;
    return { lat, lon };
  }

  resolveAddress(locationId: string, lat: number, lon: number) {
    this.resolvedAddresses.update(prev => ({
      ...prev,
      [locationId]: { address: '', loading: true }
    }));

    this.reverseGeocodeUseCase.execute(lat, lon).subscribe({
      next: (addressName) => {
        this.resolvedAddresses.update(prev => ({
          ...prev,
          [locationId]: { address: addressName, loading: false }
        }));
      },
      error: (err) => {
        this.resolvedAddresses.update(prev => ({
          ...prev,
          [locationId]: { address: '', loading: false, error: err.message || 'Error al geolocalizar' }
        }));
      }
    });
  }

  getSafeMapUrl(lat: number, lon: number): SafeResourceUrl {
    const url = `https://maps.google.com/maps?q=${lat},${lon}&z=16&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  statusClass(status: string): string {
    const base = 'text-[10px] font-bold px-2 py-0.5 rounded-full border ';
    return status === 'ACTIVO'
      ? base + 'bg-emerald-50 text-emerald-600 border-emerald-100'
      : base + 'bg-slate-50 text-slate-600 border-slate-100';
  }
}
