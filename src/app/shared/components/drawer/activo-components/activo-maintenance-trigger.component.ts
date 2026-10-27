import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-activo-maintenance-trigger',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="border-t border-slate-200 pt-4 space-y-4">
      <h4 class="text-xs font-bold text-indigo-600 uppercase tracking-wider">Apertura de Mantenimiento</h4>
      
      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700">Modalidad <span class="text-red-500">*</span></label>
        <select 
          [ngModel]="modalidad" 
          (ngModelChange)="modalidadChange.emit($event)"
          class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="INTERNO">Interno (Bodega / Taller)</option>
          <option value="EXTERNO">Externo (Proveedor Directo)</option>
        </select>
      </div>

      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700">Tipo de Mantenimiento <span class="text-red-500">*</span></label>
        <select 
          [ngModel]="tipo" 
          (ngModelChange)="tipoChange.emit($event)"
          class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="PREVENTIVO">Preventivo</option>
          <option value="CORRECTIVO">Correctivo</option>
        </select>
      </div>

      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700">Costo Estimado <span class="text-slate-400 text-xs font-normal">(opcional)</span></label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
          <input 
            type="number" 
            [ngModel]="costoEstimado" 
            (ngModelChange)="costoEstimadoChange.emit($event)"
            placeholder="Ej: 150000"
            class="w-full pl-7 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400" 
          />
        </div>
      </div>

      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-slate-700">Técnico Responsable / Proveedor <span class="text-slate-400 text-xs font-normal">(opcional)</span></label>
        <input 
          type="text" 
          [ngModel]="tecnicoResponsable" 
          (ngModelChange)="tecnicoResponsableChange.emit($event)"
          placeholder="Ej: Juan Pérez o Service Center"
          class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400" 
        />
      </div>
    </div>
  `
})
export class ActivoMaintenanceTriggerComponent {
  @Input() modalidad: string = 'INTERNO';
  @Input() tipo: string = 'PREVENTIVO';
  @Input() costoEstimado?: number;
  @Input() tecnicoResponsable: string = '';

  @Output() modalidadChange = new EventEmitter<string>();
  @Output() tipoChange = new EventEmitter<string>();
  @Output() costoEstimadoChange = new EventEmitter<number | undefined>();
  @Output() tecnicoResponsableChange = new EventEmitter<string>();
}
