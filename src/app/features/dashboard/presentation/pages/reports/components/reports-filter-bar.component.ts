import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Location } from '../../../../../locations/domain/models/location.model';

@Component({
  selector: 'app-reports-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
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
          (click)="exportCsv.emit()"
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
                [ngModel]="searchTerm"
                (ngModelChange)="searchTermChange.emit($event)"
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
              [ngModel]="selectedLocationId"
              (ngModelChange)="selectedLocationIdChange.emit($event)"
              class="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none cursor-pointer"
            >
              <option value="">Todas las Sedes</option>
              @for (loc of locations; track loc.id) {
                <option [value]="loc.id">{{ loc.nombre }}</option>
              }
            </select>
          </div>

          <!-- Start date -->
          <div class="lg:col-span-2 space-y-1.5">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha Inicio</label>
            <input
              type="date"
              [ngModel]="startDate"
              (ngModelChange)="startDateChange.emit($event)"
              class="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <!-- End date -->
          <div class="lg:col-span-2 space-y-1.5">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha Fin</label>
            <input
              type="date"
              [ngModel]="endDate"
              (ngModelChange)="endDateChange.emit($event)"
              class="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <!-- Reset button -->
          <div class="lg:col-span-1 flex justify-end">
            <button
              (click)="resetFilters.emit()"
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
    </div>
  `
})
export class ReportsFilterBarComponent {
  @Input() searchTerm: string = '';
  @Input() selectedLocationId: string = '';
  @Input() startDate: string = '';
  @Input() endDate: string = '';
  @Input() locations: Location[] = [];

  @Output() searchTermChange = new EventEmitter<string>();
  @Output() selectedLocationIdChange = new EventEmitter<string>();
  @Output() startDateChange = new EventEmitter<string>();
  @Output() endDateChange = new EventEmitter<string>();
  @Output() resetFilters = new EventEmitter<void>();
  @Output() exportCsv = new EventEmitter<void>();
}
