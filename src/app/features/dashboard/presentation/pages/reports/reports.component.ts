import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Asset {
  placa: string;
  tipo: string;
  modelo: string;
  serial: string;
  kind: 'device' | 'sim';
}

interface ResponsableReport {
  name: string;
  location: string;
  totalDevices: number;
  totalSims: number;
  assets: Asset[];
}

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
            <h1 class="text-2xl font-bold text-slate-800">Historial de Registros</h1>
            <p class="text-sm text-slate-500">Inventario por Responsable & Auditoría</p>
          </div>
        </div>
        <button class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          Exportar CSV
        </button>
      </div>

      <!-- Responsables Grid (Accordion) -->
      <section class="space-y-4">
        <h2 class="text-base font-bold text-slate-700">Responsables de Ubicación</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (r of responsableReports; track r.name) {
            <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md cursor-pointer"
                 (click)="toggleCard(r.name)">
              <div class="p-4">
                <div class="flex items-center gap-3">
                  <div class="h-11 w-11 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                    {{ getInitials(r.name) }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="font-bold text-slate-800 truncate">{{ r.name }}</p>
                    <p class="text-[11px] text-slate-500">{{ r.location }}</p>
                  </div>
                  <svg class="h-4 w-4 text-slate-400 transition-transform duration-300"
                       [class.rotate-180]="expandedCard() === r.name"
                       fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7"/></svg>
                </div>

                <div class="flex items-center gap-2 mt-4">
                  <span class="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                    {{ r.totalDevices }} Dispositivos
                  </span>
                  <span class="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                    {{ r.totalSims }} SIMs
                  </span>
                </div>

                <!-- Expanded Content -->
                <div class="overflow-hidden transition-all duration-300"
                     [style.max-height]="expandedCard() === r.name ? '500px' : '0px'"
                     [style.opacity]="expandedCard() === r.name ? '1' : '0'"
                     [class.mt-4]="expandedCard() === r.name">
                  <p class="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Vista Expandida de Activos</p>
                  <div class="space-y-1.5">
                    @for (asset of r.assets; track asset.placa) {
                      <div class="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100 text-[11px]">
                        @if (asset.kind === 'device') {
                          <svg class="h-3.5 w-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                        } @else {
                          <svg class="h-3.5 w-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                        }
                        <span class="font-bold text-slate-700">{{ asset.placa }}</span>
                        <span class="text-slate-400 font-medium">— {{ asset.modelo }}</span>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- Advanced Filtering Bar -->
      <section class="space-y-4">
        <h2 class="text-base font-bold text-slate-700">Barra de Filtrado Inteligente</h2>
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-1">
            <div class="lg:col-span-2 relative">
              <input type="text" placeholder="Buscar Global (Placa, Modelo, Serial)"
                     class="w-full pl-10 pr-4 h-10 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm transition-all">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <input type="date" class="h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all">
            <input type="date" class="h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all">
            <select class="h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none">
              <option value="">Todos los usuarios</option>
            </select>
            <div class="flex gap-2">
              <select class="flex-1 h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none">
                <option value="">Todos</option>
              </select>
              <button class="h-10 w-10 flex items-center justify-center bg-red-50 text-red-600 rounded-lg border border-red-100 hover:bg-red-100 transition-all">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Table 1: Productos Registrados -->
        <div class="space-y-2">
          <h3 class="text-sm font-bold text-indigo-600 flex items-center gap-2">
            Productos Registrados
            <span class="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full">7</span>
          </h3>
          <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div class="overflow-x-auto max-h-80">
              <table class="w-full text-left text-[11px]">
                <thead class="bg-indigo-50/50 text-indigo-900/60 sticky top-0 border-b border-indigo-100">
                  <tr>
                    <th class="px-4 py-3 font-bold uppercase tracking-wider">Placa</th>
                    <th class="px-4 py-3 font-bold uppercase tracking-wider">Tipo</th>
                    <th class="px-4 py-3 font-bold uppercase tracking-wider">Modelo</th>
                    <th class="px-4 py-3 font-bold uppercase tracking-wider">Estado</th>
                    <th class="px-4 py-3 font-bold uppercase tracking-wider">Ubicación</th>
                    <th class="px-4 py-3 font-bold uppercase tracking-wider">Fecha</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (p of mockProducts; track p.placa) {
                    <tr class="hover:bg-slate-50 transition-colors">
                      <td class="px-4 py-3 font-bold text-slate-800">{{ p.placa }}</td>
                      <td class="px-4 py-3 text-slate-500">{{ p.tipo }}</td>
                      <td class="px-4 py-3 text-slate-500">{{ p.modelo }}</td>
                      <td class="px-4 py-3">
                        <span class="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase text-[9px]">Asignado</span>
                      </td>
                      <td class="px-4 py-3 text-slate-500">{{ p.ubicacion }}</td>
                      <td class="px-4 py-3 text-slate-400">{{ p.fechaIngreso }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Table 2: Movimientos -->
        <div class="space-y-2">
          <h3 class="text-sm font-bold text-emerald-600 flex items-center gap-2">
            Movimientos
            <span class="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full">5</span>
          </h3>
          <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div class="overflow-x-auto max-h-80">
              <table class="w-full text-left text-[11px]">
                <thead class="bg-emerald-50/50 text-emerald-900/60 sticky top-0 border-b border-emerald-100">
                  <tr>
                    <th class="px-4 py-3 font-bold uppercase tracking-wider">Placa</th>
                    <th class="px-4 py-3 font-bold uppercase tracking-wider">Modelo</th>
                    <th class="px-4 py-3 font-bold uppercase tracking-wider">Movimiento</th>
                    <th class="px-4 py-3 font-bold uppercase tracking-wider">Destino</th>
                    <th class="px-4 py-3 font-bold uppercase tracking-wider">Usuario</th>
                    <th class="px-4 py-3 font-bold uppercase tracking-wider">Fecha</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (m of mockMovements; track $index) {
                    <tr class="hover:bg-slate-50 transition-colors">
                      <td class="px-4 py-3"><span class="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-mono text-[10px]">{{ m.placa }}</span></td>
                      <td class="px-4 py-3 text-slate-500">{{ m.modelo }}</td>
                      <td class="px-4 py-3 text-slate-500">{{ m.tipoMovimiento }}</td>
                      <td class="px-4 py-3 text-slate-500">{{ m.ubicacionDestino }}</td>
                      <td class="px-4 py-3 text-slate-500">{{ m.usuario }}</td>
                      <td class="px-4 py-3 text-slate-400 whitespace-nowrap">{{ m.fecha }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: []
})
export class ReportsPageComponent {
  expandedCard = signal<string | null>(null);

  responsableReports: ResponsableReport[] = [
    {
      name: "Carlos Pérez",
      location: "Oficina Bogotá",
      totalDevices: 12,
      totalSims: 8,
      assets: [
        { placa: "FLM-001", tipo: "Laptop", modelo: "Dell Latitude 5540", serial: "SN001", kind: "device" },
        { placa: "FLM-002", tipo: "Laptop", modelo: "Dell Latitude 5540", serial: "SN002", kind: "device" },
        { placa: "SIM-101", tipo: "SIM", modelo: "Claro Prepago", serial: "3100000001", kind: "sim" },
      ]
    },
    {
      name: "María López",
      location: "Oficina Medellín",
      totalDevices: 7,
      totalSims: 5,
      assets: [
        { placa: "FLM-003", tipo: "Tablet", modelo: "Samsung Galaxy Tab", serial: "SN003", kind: "device" },
        { placa: "SIM-102", tipo: "SIM", modelo: "Movistar Datos", serial: "3100000002", kind: "sim" },
      ]
    },
    {
      name: "Juan García",
      location: "Bodega Principal",
      totalDevices: 23,
      totalSims: 14,
      assets: [
        { placa: "1528-003001", tipo: "Terminal", modelo: "Cs10C", serial: "SN627", kind: "device" },
        { placa: "SIM-201", tipo: "SIM", modelo: "Tigo Empresa", serial: "3100000003", kind: "sim" },
      ]
    }
  ];

  mockProducts = [
    { placa: "1528-003001", tipo: "Terminal", modelo: "Cs10C", ubicacion: "Oficina Bogotá", fechaIngreso: "31/8/2021" },
    { placa: "1528-003002", tipo: "Terminal", modelo: "Cs10C", ubicacion: "Terminal Salitre", fechaIngreso: "31/8/2021" },
    { placa: "FLM-001", tipo: "Laptop", modelo: "Dell Latitude 5540", ubicacion: "Oficina Bogotá", fechaIngreso: "15/3/2024" },
  ];

  mockMovements = [
    { placa: "1528-003001", modelo: "Cs10C", tipoMovimiento: "Asignación", ubicacionDestino: "Oficina Bogotá", usuario: "Mauricio Parra", fecha: "3/3/2026" },
    { placa: "FLM-001", modelo: "Latitude 5540", tipoMovimiento: "Transferencia", ubicacionDestino: "Oficina Bogotá", usuario: "Carlos Pérez", fecha: "15/3/2024" },
  ];

  toggleCard(name: string) {
    this.expandedCard.update(current => current === name ? null : name);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }
}
