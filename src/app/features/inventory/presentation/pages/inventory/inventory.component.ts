import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Activo } from '../../../domain/models/activo.model';
import { GetAllActivosUseCase } from '../../../application/use-cases/get-all-activos.use-case';
import { AddActivoDrawerComponent } from '../../../../../shared/components/drawer/add-activo-drawer.component';

@Component({
  selector: 'app-inventory-page',
  standalone: true,
  imports: [CommonModule, FormsModule, AddActivoDrawerComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">Inventario de Equipos</h2>
          <p class="text-sm text-slate-500 mt-1">Gestión integral de hardware y dispositivos</p>
        </div>
        <button
          (click)="showDrawer.set(true)"
          class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-100">
          <span class="text-xl leading-none">+</span> Añadir Nuevo Producto
        </button>
      </div>

      <!-- Filter Bar -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
        <div class="md:col-span-2 relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input type="text" placeholder="Buscar por placa, serial, modelo..." 
                 class="w-full pl-10 pr-4 h-10 bg-slate-50 border border-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm transition-all">
        </div>
        <select class="h-10 bg-slate-50 border border-slate-100 rounded-lg px-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none transition-all">
          <option>Todos los tipos</option>
          <option>Laptop</option>
          <option>Móvil</option>
          <option>Tablet</option>
          <option>Router</option>
        </select>
        <select class="h-10 bg-slate-50 border border-slate-100 rounded-lg px-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none transition-all">
          <option>Todas las ubicaciones</option>
          <option>Bodega Principal</option>
          <option>Oficina Bogotá</option>
          <option>Oficina Medellín</option>
        </select>
      </div>

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
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (activo of activos(); track activo.id) {
                <tr class="hover:bg-slate-50/50 transition-colors">
                  <td class="px-6 py-4 font-bold text-slate-700 underline decoration-indigo-200 underline-offset-4">{{ activo.placa }}</td>
                  <td class="px-6 py-4">
                    <span [class]="typeClass(activo.tipo)">{{ activo.tipo }}</span>
                  </td>
                  <td class="px-6 py-4 font-medium text-slate-600" italic>{{ activo.marca }}</td>
                  <td class="px-6 py-4 font-medium text-slate-600">{{ activo.modelo }}</td>
                  <td class="px-6 py-4 text-[11px] font-mono text-slate-400 tracking-tighter">{{ activo.serial }}</td>
                  <td class="px-6 py-4 text-slate-500 font-medium">{{ activo.locationId }}</td>
                  <td class="px-6 py-4">
                    <span [class]="statusClass(activo.estado)">{{ statusLabel(activo.estado) }}</span>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="px-6 py-12 text-center text-slate-400 text-sm">Sin activos registrados</td></tr>
              }
            </tbody>
          </table>
          <div class="px-6 py-4 bg-slate-50/30 border-t border-slate-100 text-xs text-slate-400 font-medium">
            Mostrando {{ activos().length }} activos registrados
          </div>
        </div>
      }
    </div>

    <!-- Drawer para agregar activo -->
    <app-add-activo-drawer
      [open]="showDrawer()"
      (openChange)="showDrawer.set($event)"
      (saved)="ngOnInit()"
    />
  `,
  styles: []
})
export class InventoryPageComponent implements OnInit {
  activos = signal<Activo[]>([]);
  loading = signal(false);
  showDrawer = signal(false);

  constructor(private getAllActivos: GetAllActivosUseCase) { }

  ngOnInit() {
    this.loading.set(true);
    this.getAllActivos.execute().subscribe({
      next: (data: Activo[]) => {
        if (data && data.length > 0) {
          this.activos.set(data);
        } else {
          // Mock data matching Screenshot 2
          this.activos.set([
            {
              id: '1', placa: '1528-003001', tipo: 'Terminal', marca: 'Astro', modelo: 'Cs10C',
              serial: 'SN62788911', locationId: 'BOG-01', responsibleId: 'USER-01',
              estado: 'OPERACION', fechaIngreso: '2024-01-01'
            },
            {
              id: '2', placa: '1528-003002', tipo: 'Terminal', marca: 'Spectra', modelo: 'Cs10C',
              serial: 'SN62788912', locationId: 'Terminal Salitre', responsibleId: 'USER-01', estado: 'BODEGA', fechaIngreso: '2022-01-01'
            },
            {
              id: '3', placa: '1528-003003', tipo: 'Terminal', marca: 'Spectra', modelo: 'Cs10C',
              serial: 'SN62788913', locationId: 'Terminal Salitre', responsibleId: 'USER-01', estado: 'BODEGA', fechaIngreso: '2022-01-01'
            },
          ]);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  typeClass(type: string): string {
    const base = 'text-[10px] font-bold px-2 py-0.5 rounded-full border ';
    const normalizedType = type?.toLowerCase() || '';
    switch (normalizedType) {
      case 'laptop': return base + 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'móvil': return base + 'bg-blue-50 text-blue-600 border-blue-100';
      case 'tablet': return base + 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return base + 'bg-slate-50 text-slate-600 border-slate-100';
    }
  }

  statusClass(status: string): string {
    const base = 'text-[10px] font-bold px-2.5 py-1 rounded-lg text-white ';
    const normalizedStatus = status?.toUpperCase() || '';
    switch (normalizedStatus) {
      case 'BODEGA': return base + 'bg-emerald-500';
      case 'OPERACION': return base + 'bg-blue-600';
      case 'MANTENIMIENTO': return base + 'bg-amber-500';
      case 'BAJA': return base + 'bg-red-600';
      default: return base + 'bg-slate-400';
    }
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      BODEGA: 'Bodega', OPERACION: 'Operación', MANTENIMIENTO: 'Mantenimiento', BAJA: 'Baja'
    };
    const normalizedStatus = status?.toUpperCase() || '';
    return map[normalizedStatus] ?? (status || 'Desconocido');
  }
}
