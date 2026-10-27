import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Activo } from '../../../../../inventory/domain/models/activo.model';

@Component({
  selector: 'app-document-reintegro-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pt-3 mt-1 border-t border-slate-200">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2.5 items-end">
        <!-- 1. Fecha Contrato Colaboración -->
        <div>
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Fecha Contrato:
          </label>
          <input 
            type="text" 
            [ngModel]="fechaContratoReintegro"
            (ngModelChange)="fechaContratoReintegroChange.emit($event)"
            placeholder="Ej: 14 de junio de 2013"
            class="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs" />
        </div>

        <!-- 2. Cargador Reintegrado -->
        <div>
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Cargador Reintegrado:
          </label>
          <select 
            [ngModel]="incluyeCargadorReintegro"
            (ngModelChange)="incluyeCargadorReintegroChange.emit($event)"
            class="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs font-semibold">
            <option value="Incluido">Incluido</option>
            <option value="No incluido">No incluido</option>
            <option value="Bueno">Bueno</option>
            <option value="Regular">Regular</option>
          </select>
        </div>

        <!-- 3. Forro Reintegrado -->
        <div>
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Forro Reintegrado:
          </label>
          <select 
            [ngModel]="incluyeForroReintegro"
            (ngModelChange)="incluyeForroReintegroChange.emit($event)"
            class="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs font-semibold">
            <option value="No incluido">No incluido</option>
            <option value="Incluido">Incluido</option>
            <option value="Bueno">Bueno</option>
            <option value="Regular">Regular</option>
          </select>
        </div>

        <!-- 4. Checkbox Devolución de Préstamo -->
        <div class="flex items-center h-[34px] px-2 bg-white rounded-lg border border-slate-300 shadow-2xs">
          <label class="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
            <input 
              type="checkbox"
              [ngModel]="incluyeDevolucionPrestamo"
              (ngModelChange)="incluyeDevolucionPrestamoChange.emit($event)"
              class="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-slate-300 cursor-pointer" />
            <span>¿Devuelve Préstamo?</span>
          </label>
        </div>

        <!-- 5. Buscador Typeahead del Activo en Préstamo que se devuelve -->
        @if (incluyeDevolucionPrestamo) {
          <div class="relative sm:col-span-2">
            @if (showPlacaPrestadaDropdown()) {
              <div class="fixed inset-0 z-40" (click)="showPlacaPrestadaDropdown.set(false)"></div>
            }

            <div class="flex items-center justify-between mb-1">
              <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Equipo en Préstamo a Devolver:
              </label>
              @if (selectedActivoPrestado()) {
                <span class="text-[9px] text-emerald-600 font-bold">✓ Seleccionado</span>
              }
            </div>

            <div class="relative z-50">
              <input 
                type="text" 
                [ngModel]="searchPlacaPrestadaQuery()"
                (input)="onSearchPlacaPrestadaInput($any($event.target).value)"
                (focus)="onSearchPlacaPrestadaFocus()"
                placeholder="Buscar placa o modelo en préstamo..."
                class="w-full bg-white text-slate-800 font-mono text-xs pl-2.5 pr-6 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs" />
              
              @if (searchPlacaPrestadaQuery()) {
                <button 
                  type="button"
                  (click)="clearPlacaPrestadaSearch()"
                  title="Limpiar búsqueda"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer">
                  ✕
                </button>
              }

              @if (showPlacaPrestadaDropdown() && filteredPrestados().length > 0) {
                <div class="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 divide-y divide-slate-100">
                  @for (activo of filteredPrestados(); track activo.id) {
                    <button 
                      type="button"
                      (click)="selectActivoPrestado(activo)"
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
        }
      </div>
    </div>
  `
})
export class DocumentReintegroToolbarComponent {
  @Input() fechaContratoReintegro: string = '';
  @Input() incluyeCargadorReintegro: string = 'No incluido';
  @Input() incluyeForroReintegro: string = 'No incluido';
  @Input() incluyeDevolucionPrestamo: boolean = true;
  @Input() placaPrestada: string = '';
  @Input() modeloPrestado: string = '';
  @Input() serialPrestado: string = '';
  @Input() fechaEntregaPrestamo: string = '';
  @Input() allActivos: Activo[] = [];

  @Output() fechaContratoReintegroChange = new EventEmitter<string>();
  @Output() incluyeCargadorReintegroChange = new EventEmitter<string>();
  @Output() incluyeForroReintegroChange = new EventEmitter<string>();
  @Output() incluyeDevolucionPrestamoChange = new EventEmitter<boolean>();
  @Output() placaPrestadaChange = new EventEmitter<string>();
  @Output() modeloPrestadoChange = new EventEmitter<string>();
  @Output() serialPrestadoChange = new EventEmitter<string>();
  @Output() fechaEntregaPrestamoChange = new EventEmitter<string>();

  searchPlacaPrestadaQuery = signal<string>('');
  showPlacaPrestadaDropdown = signal<boolean>(false);
  selectedActivoPrestado = signal<Activo | null>(null);

  filteredPrestados = computed<Activo[]>(() => {
    const term = this.searchPlacaPrestadaQuery().toLowerCase().trim();
    if (!term || term.length < 2) return [];
    return this.allActivos.filter(a =>
      (a.placa && a.placa.toLowerCase().includes(term)) ||
      (a.serial && a.serial.toLowerCase().includes(term)) ||
      (a.marca && a.marca.toLowerCase().includes(term)) ||
      (a.modelo && a.modelo.toLowerCase().includes(term))
    ).slice(0, 15);
  });

  onSearchPlacaPrestadaInput(value: string) {
    this.searchPlacaPrestadaQuery.set(value);
    this.placaPrestadaChange.emit(value);
    this.showPlacaPrestadaDropdown.set(true);
    if (this.selectedActivoPrestado() && this.selectedActivoPrestado()?.placa !== value) {
      this.selectedActivoPrestado.set(null);
    }
  }

  onSearchPlacaPrestadaFocus() {
    if (this.searchPlacaPrestadaQuery().trim().length >= 2) {
      this.showPlacaPrestadaDropdown.set(true);
    }
  }

  selectActivoPrestado(activo: Activo) {
    this.selectedActivoPrestado.set(activo);
    this.searchPlacaPrestadaQuery.set(activo.placa);
    this.placaPrestadaChange.emit(activo.placa);
    const modeloCompleto = [activo.marca, activo.modelo].filter(Boolean).join(' ') || activo.modelo || 'Equipo Móvil';
    this.modeloPrestadoChange.emit(modeloCompleto);
    if (activo.serial) {
      this.serialPrestadoChange.emit(activo.serial);
    }
    this.showPlacaPrestadaDropdown.set(false);
  }

  clearPlacaPrestadaSearch() {
    this.searchPlacaPrestadaQuery.set('');
    this.placaPrestadaChange.emit('');
    this.modeloPrestadoChange.emit('');
    this.serialPrestadoChange.emit('');
    this.selectedActivoPrestado.set(null);
    this.showPlacaPrestadaDropdown.set(false);
  }
}
