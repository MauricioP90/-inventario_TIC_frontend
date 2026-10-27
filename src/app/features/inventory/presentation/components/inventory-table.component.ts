import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Activo } from '../../domain/models/activo.model';

@Component({
  selector: 'app-inventory-table',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
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
            @if (isAdmin) {
              <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Precio Compra</th>
            }
            @if (canEditActivo) {
              <th class="text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Acciones</th>
            }
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          @for (activo of activos; track activo.id) {
            <tr 
              [class.bg-emerald-50/70]="newlyCreatedPlaca === activo.placa"
              [class.hover:bg-emerald-100/50]="newlyCreatedPlaca === activo.placa"
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
                  {{ typeMap[activo.tipoActivoId]?.label || activo.tipoActivoId }}
                </span>
              </td>
              <td class="px-6 py-4 font-medium text-slate-600">{{ activo.marca }}</td>
              <td class="px-6 py-4 font-medium text-slate-600">{{ activo.modelo }}</td>
              <td class="px-6 py-4 text-[11px] font-mono text-slate-400 tracking-tighter">{{ activo.serial }}</td>
              <td class="px-6 py-4 text-slate-500 font-medium">
                <div>{{ locationMap[activo.locationId]?.nombre || activo.locationId }}</div>
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
              @if (isAdmin) {
                <td class="px-6 py-4 font-medium text-indigo-600">
                  {{ activo.precioCompra ? '$ ' + (activo.precioCompra | number:'1.2-2') : '—' }}
                </td>
              }
              @if (canEditActivo) {
                <td class="px-6 py-4 text-right">
                  @if (activo.estado !== 'BAJA') {
                    <button 
                      (click)="edit.emit(activo)"
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
            <tr><td [attr.colspan]="(isAdmin ? 8 : 7) + (canEditActivo ? 1 : 0)" class="px-6 py-12 text-center text-slate-400 text-sm">Sin activos registrados</td></tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class InventoryTableComponent {
  @Input() activos: Activo[] = [];
  @Input() typeMap: Record<string, any> = {};
  @Input() locationMap: Record<string, any> = {};
  @Input() isAdmin: boolean = false;
  @Input() canEditActivo: boolean = false;
  @Input() newlyCreatedPlaca: string | null = null;

  @Output() edit = new EventEmitter<Activo>();

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
