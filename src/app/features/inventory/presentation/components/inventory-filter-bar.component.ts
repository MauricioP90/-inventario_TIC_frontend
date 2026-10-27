import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ActivoMetadata } from '../../domain/models/activo.model';
import { Location } from '../../../locations/domain/models/location.model';

@Component({
  selector: 'app-inventory-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">Inventario de Activos</h2>
          <p class="text-sm text-slate-500 mt-1">Gestión integral de hardware y dispositivos</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            (click)="refresh.emit()"
            [disabled]="loading"
            class="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-slate-50 active:bg-slate-100 rounded-xl border border-slate-200 transition-all shadow-sm bg-white disabled:opacity-50"
            title="Actualizar listado">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class.animate-spin]="loading">
              <path d="M23 4v6h-6"></path>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
          </button>
          @if (canCreateActivo) {
            <button
              (click)="addNew.emit()"
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
                 [ngModel]="searchTerm" 
                 (ngModelChange)="searchChange.emit($event)"
                 placeholder="Buscar por placa, serial, modelo..." 
                 class="w-full pl-10 pr-4 h-10 bg-slate-50 border border-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm transition-all">
        </div>
        
        <select 
          [ngModel]="selectedType" 
          (ngModelChange)="typeChange.emit($event)"
          class="h-10 bg-slate-50 border border-slate-100 rounded-lg px-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none transition-all">
          <option value="">Todos los tipos</option>
          @for (type of metadata?.types; track type.id) {
            <option [value]="type.id">{{ type.label }}</option>
          }
        </select>

        <select 
          [ngModel]="selectedLocation" 
          (ngModelChange)="locationChange.emit($event)"
          class="h-10 bg-slate-50 border border-slate-100 rounded-lg px-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none transition-all">
          <option value="">Todas las ubicaciones</option>
          @for (loc of locations; track loc.id) {
            <option [value]="loc.id">{{ loc.nombre }}</option>
          }
        </select>

        <select 
          [ngModel]="selectedStatus" 
          (ngModelChange)="statusChange.emit($event)"
          class="h-10 bg-slate-50 border border-slate-100 rounded-lg px-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none transition-all">
          <option value="">Todos los estados</option>
          @for (st of metadata?.statuses; track st.id) {
            <option [value]="st.id">{{ getStatusLabel(st.id) }}</option>
          }
        </select>
      </div>

      <!-- Barra de Filtros Activos / Breadcrumb Contextual -->
      @if (selectedStatus || selectedModel || selectedType || selectedLocation || searchTerm) {
        <div class="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-xl text-xs">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Filtros aplicados:</span>
            
            @if (selectedStatus) {
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-white shadow-2xs"
                    [style.backgroundColor]="getStatusColor(selectedStatus)">
                <span>Estado: {{ getStatusLabel(selectedStatus) }}</span>
                <button (click)="clearStatus.emit()" class="hover:opacity-75 cursor-pointer font-black ml-1" title="Quitar filtro de estado">✕</button>
              </span>
            }

            @if (selectedModel) {
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
                <span>Modelo: {{ selectedModel }}</span>
                <button (click)="clearModel.emit()" class="hover:text-indigo-950 cursor-pointer font-black ml-1" title="Quitar filtro de modelo">✕</button>
              </span>
            }

            @if (selectedType) {
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold bg-slate-200 text-slate-800 shadow-2xs">
                <span>Tipo: {{ typeMap[selectedType]?.label || selectedType }}</span>
                <button (click)="clearType.emit()" class="hover:opacity-75 cursor-pointer font-black ml-1" title="Quitar filtro de tipo">✕</button>
              </span>
            }

            @if (selectedLocation) {
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold bg-slate-200 text-slate-800 shadow-2xs">
                <span>Ubicación: {{ locationMap[selectedLocation]?.nombre || selectedLocation }}</span>
                <button (click)="clearLocation.emit()" class="hover:opacity-75 cursor-pointer font-black ml-1" title="Quitar filtro de ubicación">✕</button>
              </span>
            }

            @if (searchTerm) {
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold bg-slate-200 text-slate-700 shadow-2xs">
                <span>Texto: "{{ searchTerm }}"</span>
                <button (click)="clearSearch.emit()" class="hover:opacity-75 cursor-pointer font-black ml-1" title="Quitar filtro de búsqueda">✕</button>
              </span>
            }

            <button (click)="clearAll.emit()" class="text-indigo-600 hover:text-indigo-800 font-bold text-[11px] underline ml-2 cursor-pointer">
              Limpiar todos
            </button>
          </div>

          <a routerLink="/" class="inline-flex items-center gap-1.5 font-bold text-slate-500 hover:text-indigo-600 transition-colors text-[11px] ml-auto">
            <span>← Volver al Dashboard</span>
          </a>
        </div>
      }
    </div>
  `
})
export class InventoryFilterBarComponent {
  @Input() loading: boolean = false;
  @Input() canCreateActivo: boolean = false;
  @Input() searchTerm: string = '';
  @Input() selectedType: string = '';
  @Input() selectedLocation: string = '';
  @Input() selectedStatus: string = '';
  @Input() selectedModel: string = '';
  @Input() metadata: ActivoMetadata | null = null;
  @Input() locations: Location[] = [];
  @Input() typeMap: Record<string, any> = {};
  @Input() locationMap: Record<string, any> = {};

  @Output() refresh = new EventEmitter<void>();
  @Output() addNew = new EventEmitter<void>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() typeChange = new EventEmitter<string>();
  @Output() locationChange = new EventEmitter<string>();
  @Output() statusChange = new EventEmitter<string>();
  @Output() clearStatus = new EventEmitter<void>();
  @Output() clearModel = new EventEmitter<void>();
  @Output() clearType = new EventEmitter<void>();
  @Output() clearLocation = new EventEmitter<void>();
  @Output() clearSearch = new EventEmitter<void>();
  @Output() clearAll = new EventEmitter<void>();

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
