import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-document-comodato-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pt-3 mt-1 border-t border-slate-200">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2.5 items-end">
        <!-- 1. Placa de Inventario -->
        <div class="md:col-span-2">
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Placa Inventario:
          </label>
          <div class="w-full bg-slate-100/90 text-slate-900 font-mono text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold truncate flex items-center gap-1.5 shadow-2xs" [title]="activoComodatoPlaca || 'Sin placa'">
            <span class="text-indigo-600">🏷️</span>
            <span class="truncate">{{ activoComodatoPlaca || 'Sin placa' }}</span>
          </div>
        </div>

        <!-- 2. Bien Entregado -->
        <div class="md:col-span-3">
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Bien Entregado:
          </label>
          <div class="w-full bg-slate-100/90 text-slate-900 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold truncate flex items-center gap-1.5 shadow-2xs" [title]="bienEntregado">
            <span class="text-indigo-600">📱</span>
            <span class="truncate">{{ bienEntregado }}</span>
          </div>
        </div>

        <!-- 3. Precio Compra -->
        <div class="md:col-span-2">
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Precio Compra:
          </label>
          <div class="w-full bg-slate-100/90 text-slate-900 font-mono text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold truncate shadow-2xs" [title]="valorReposicionLetras">
            {{ valorReposicion }}
          </div>
        </div>

        <!-- 4. Estado del Bien (Editable) -->
        <div class="md:col-span-2">
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Estado del Bien:
          </label>
          <select 
            [ngModel]="estadoBienComodato"
            (ngModelChange)="estadoBienComodatoChange.emit($event)"
            class="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs font-semibold">
            <option value="BUENO">BUENO</option>
            <option value="EXCELENTE">EXCELENTE</option>
            <option value="REGULAR">REGULAR</option>
          </select>
        </div>

        <!-- 5. Fecha Contrato Colaboración (Editable) -->
        <div class="md:col-span-3">
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Fecha Contrato Colab.:
          </label>
          <input 
            type="text" 
            [ngModel]="fechaContratoComodato"
            (ngModelChange)="fechaContratoComodatoChange.emit($event)"
            placeholder="Ej: 14 de junio de 2013"
            class="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs font-medium" />
        </div>
      </div>
    </div>
  `
})
export class DocumentComodatoToolbarComponent {
  @Input() activoComodatoPlaca: string = '';
  @Input() bienEntregado: string = '';
  @Input() valorReposicion: string = '$ 0';
  @Input() valorReposicionLetras: string = 'CERO PESOS';
  @Input() estadoBienComodato: string = 'BUENO';
  @Input() fechaContratoComodato: string = '';

  @Output() estadoBienComodatoChange = new EventEmitter<string>();
  @Output() fechaContratoComodatoChange = new EventEmitter<string>();
}
