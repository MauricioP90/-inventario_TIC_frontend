import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TipoDocumentoOficial } from '../../../../domain/models/document-template.model';
import { Activo } from '../../../../../inventory/domain/models/activo.model';

@Component({
  selector: 'app-document-memorando-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pt-3 mt-1 border-t border-slate-200">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2.5 items-end">
        <!-- 1. Switch Memorando Tipo -->
        <div class="sm:col-span-2">
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Subtipo de Memorando:
          </label>
          <div class="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg border border-slate-300">
            <button 
              type="button"
              (click)="tipoChange.emit('MEMORANDO_REINTEGRO')"
              [class.bg-white]="currentTipo === 'MEMORANDO_REINTEGRO'"
              [class.text-indigo-900]="currentTipo === 'MEMORANDO_REINTEGRO'"
              [class.font-bold]="currentTipo === 'MEMORANDO_REINTEGRO'"
              [class.shadow-2xs]="currentTipo === 'MEMORANDO_REINTEGRO'"
              class="flex-1 py-1 px-2 text-[11px] rounded-md transition-all text-slate-600 cursor-pointer text-center truncate">
              🔄 Reintegro a Oficina
            </button>
            <button 
              type="button"
              (click)="tipoChange.emit('MEMORANDO_PRESTAMO')"
              [class.bg-white]="currentTipo === 'MEMORANDO_PRESTAMO'"
              [class.text-indigo-900]="currentTipo === 'MEMORANDO_PRESTAMO'"
              [class.font-bold]="currentTipo === 'MEMORANDO_PRESTAMO'"
              [class.shadow-2xs]="currentTipo === 'MEMORANDO_PRESTAMO'"
              class="flex-1 py-1 px-2 text-[11px] rounded-md transition-all text-slate-600 cursor-pointer text-center truncate">
              📱 Préstamo a Oficina
            </button>
          </div>
        </div>

        <!-- 2. Buscador de Placa Averiada -->
        <div class="relative sm:col-span-2">
          @if (showPlacaDropdown()) {
            <div class="fixed inset-0 z-40" (click)="showPlacaDropdown.set(false)"></div>
          }

          <div class="flex items-center justify-between mb-1">
            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Placa Averiada / Dañada:
            </label>
            @if (selectedActivoAveriado()) {
              <span class="text-[9px] text-emerald-600 font-bold">✓ Seleccionado</span>
            }
          </div>

          <div class="relative z-50">
            <input 
              type="text" 
              [ngModel]="searchPlacaQuery()"
              (input)="onSearchPlacaInput($any($event.target).value)"
              (focus)="onSearchPlacaFocus()"
              placeholder="Buscar placa averiada..."
              class="w-full bg-white text-slate-800 font-mono text-xs pl-2.5 pr-6 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs" />
            
            @if (searchPlacaQuery()) {
              <button 
                type="button"
                (click)="clearPlacaSearch()"
                title="Limpiar búsqueda"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer">
                ✕
              </button>
            }

            @if (showPlacaDropdown() && filteredAveriados().length > 0) {
              <div class="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 divide-y divide-slate-100">
                @for (activo of filteredAveriados(); track activo.id) {
                  <button 
                    type="button"
                    (click)="selectActivoAveriado(activo)"
                    class="w-full text-left px-3 py-2 hover:bg-indigo-50/80 transition-colors flex items-center justify-between text-xs cursor-pointer">
                    <div>
                      <span class="font-mono font-bold text-slate-800">{{ activo.placa }}</span>
                      <span class="text-slate-500 text-[11px] ml-2">{{ activo.marca }} {{ activo.modelo }}</span>
                    </div>
                    <span class="text-[10px] px-1.5 py-0.5 rounded font-semibold text-slate-600 bg-slate-100">
                      {{ activo.serial || 'S/N' }}
                    </span>
                  </button>
                }
              </div>
            }
          </div>
        </div>

        <!-- 3. Modelo Averiado -->
        <div>
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Modelo Averiado:
          </label>
          <input 
            type="text" 
            [ngModel]="modeloAveriado"
            (ngModelChange)="modeloAveriadoChange.emit($event)"
            placeholder="Ej: Galaxy A14"
            class="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs" />
        </div>

        <!-- 4. Incluye Cargador -->
        <div>
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Incluye Cargador:
          </label>
          <select 
            [ngModel]="incluyeCargador"
            (ngModelChange)="incluyeCargadorChange.emit($event)"
            class="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs font-semibold">
            <option value="SÍ">SÍ</option>
            <option value="NO">NO</option>
          </select>
        </div>
      </div>
    </div>
  `
})
export class DocumentMemorandoToolbarComponent {
  @Input() currentTipo: TipoDocumentoOficial = 'MEMORANDO_REINTEGRO';
  @Input() modeloAveriado: string = '';
  @Input() placaAveriada: string = '';
  @Input() serialAveriado: string = '';
  @Input() incluyeCargador: string = 'SÍ';
  @Input() allActivos: Activo[] = [];

  @Output() tipoChange = new EventEmitter<TipoDocumentoOficial>();
  @Output() modeloAveriadoChange = new EventEmitter<string>();
  @Output() placaAveriadaChange = new EventEmitter<string>();
  @Output() serialAveriadoChange = new EventEmitter<string>();
  @Output() incluyeCargadorChange = new EventEmitter<string>();

  searchPlacaQuery = signal<string>('');
  showPlacaDropdown = signal<boolean>(false);
  selectedActivoAveriado = signal<Activo | null>(null);

  filteredAveriados = computed<Activo[]>(() => {
    const term = this.searchPlacaQuery().toLowerCase().trim();
    if (!term || term.length < 2) return [];
    return this.allActivos.filter(a =>
      (a.placa && a.placa.toLowerCase().includes(term)) ||
      (a.serial && a.serial.toLowerCase().includes(term)) ||
      (a.marca && a.marca.toLowerCase().includes(term)) ||
      (a.modelo && a.modelo.toLowerCase().includes(term))
    ).slice(0, 15);
  });

  onSearchPlacaInput(value: string) {
    this.searchPlacaQuery.set(value);
    this.placaAveriadaChange.emit(value);
    this.showPlacaDropdown.set(true);
    if (this.selectedActivoAveriado() && this.selectedActivoAveriado()?.placa !== value) {
      this.selectedActivoAveriado.set(null);
    }
  }

  onSearchPlacaFocus() {
    if (this.searchPlacaQuery().trim().length >= 2) {
      this.showPlacaDropdown.set(true);
    }
  }

  selectActivoAveriado(activo: Activo) {
    this.selectedActivoAveriado.set(activo);
    this.searchPlacaQuery.set(activo.placa);
    this.placaAveriadaChange.emit(activo.placa);
    const modeloCompleto = [activo.marca, activo.modelo].filter(Boolean).join(' ') || activo.modelo || 'Equipo Móvil';
    this.modeloAveriadoChange.emit(modeloCompleto);
    if (activo.serial) {
      this.serialAveriadoChange.emit(activo.serial);
    }
    this.showPlacaDropdown.set(false);
  }

  clearPlacaSearch() {
    this.searchPlacaQuery.set('');
    this.placaAveriadaChange.emit('');
    this.modeloAveriadoChange.emit('');
    this.serialAveriadoChange.emit('');
    this.selectedActivoAveriado.set(null);
    this.showPlacaDropdown.set(false);
  }
}
