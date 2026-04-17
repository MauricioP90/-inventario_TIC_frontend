import { Component, Input, Output, EventEmitter, signal, OnInit, OnChanges, SimpleChanges, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreateSimCardUseCase } from '../../../features/sim-cards/application/use-cases/create-sim-card.use-case';
import { GetAllLocationsUseCase } from '../../../features/locations/application/use-cases/get-all-locations.use-case';
import { Location } from '../../../features/locations/domain/models/location.model';

@Component({
  selector: 'app-add-sim-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Backdrop -->
    @if (open) {
      <div
        class="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
        (click)="close()"
      ></div>
    }

    <!-- Drawer panel -->
    <div
      class="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col transition-transform duration-300"
      [class.translate-x-0]="open"
      [class.translate-x-full]="!open"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-5 border-b border-slate-200 shrink-0">
        <div>
          <h2 class="text-base font-bold text-slate-800">Nueva SIM Card</h2>
          <p class="text-xs text-slate-500 mt-0.5">Registra una nueva tarjeta SIM en el inventario.</p>
        </div>
        <button (click)="close()" class="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Form -->
      <div class="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        @if (toast()) {
          <div [class]="toast()!.type === 'error'
            ? 'bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2.5'
            : 'bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-2.5'">
            {{ toast()!.message }}
          </div>
        }

        <!-- Número Telefónico -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">Número Telefónico</label>
          <input type="text" [(ngModel)]="numero" placeholder="Ej: 310-555-0101"
            class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400" />
        </div>

        <!-- ICCID -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">ICCID</label>
          <input type="text" [(ngModel)]="iccid" placeholder="Ej: 8957101234567890001"
            class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400" />
        </div>

        <!-- Operador -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">Operador</label>
          <select [(ngModel)]="operador" class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="" disabled>Seleccionar operador...</option>
            @for (op of operadoresLista; track op) {
              <option [value]="op">{{ op }}</option>
            }
          </select>
        </div>

        <!-- Ubicación Inicial -->
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">Ubicación Inicial</label>      <div class="relative mb-2">
            <span class="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </span>
            <input 
              type="text" 
              [value]="searchLocationTerm()"
              (input)="searchLocationTerm.set($any($event.target).value)"
              placeholder="Escribe para buscar... Ej: Bodega"
              class="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-xs transition-all">
          </div>
          
          <!-- Lista con scroll -->
          <div class="space-y-1.5 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50/50">
            @for (loc of filteredLocations(); track loc.id) {
              <!-- Le damos un halo azul elegante si es el seleccionado -->
              <label class="flex items-center gap-3 p-2 border rounded-lg transition-colors cursor-pointer group hover:bg-white"
                     [class.bg-indigo-50]="ubicacion === loc.id"
                     [class.border-indigo-200]="ubicacion === loc.id"
                     [class.border-transparent]="ubicacion !== loc.id">
                
                <input 
                  type="radio" 
                  name="ubicacionGroup"
                  [value]="loc.id"
                  [(ngModel)]="ubicacion"
                  class="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300">
                
                <div class="flex flex-col">
                  <span class="text-sm font-medium text-slate-700">{{ loc.nombre }}</span>
                  <span class="text-[10px] text-slate-400">{{ loc.code }}</span>
                </div>
              </label>
            } @empty {
              <p class="text-[11px] text-slate-400 text-center py-4">No se encontraron ubicaciones</p>
            }
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-slate-200 shrink-0">
        <button (click)="handleSave()"
          class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg transition-colors">
          Guardar SIM
        </button>
      </div>
    </div>
  `,
  styles: []
})
export class AddSimDrawerComponent implements OnInit, OnChanges {
  @Input() open = false;
  @Output() openChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  // Tus variables de formulario
  numero = '';
  iccid = '';
  operador = '';
  ubicacion = '';
  toast = signal<{ type: 'success' | 'error', message: string } | null>(null);

  // --- Lógica del buscador de ubicaciones ---
  searchLocationTerm = signal('');
  filteredLocations = computed(() => {
    const term = this.searchLocationTerm().toLowerCase().trim();
    if (!term) return this.ubicacionesLista(); // Si está vacío, muestra todo

    // Si hay texto, filtramos por nombre o código
    return this.ubicacionesLista().filter(loc =>
      loc.nombre.toLowerCase().includes(term) ||
      loc.code.toLowerCase().includes(term)
    );
  });

  // Operadores estáticos en el Frontend:
  operadoresLista = ['CLARO', 'MOVISTAR', 'TIGO', 'WOM'];

  // Ubicaciones dinámicas desde el Backend:
  ubicacionesLista = signal<Location[]>([]);
  loaded = false;

  constructor(
    private createSimCard: CreateSimCardUseCase,
    private getAllLocations: GetAllLocationsUseCase  // <- Inyectamos las ubicaciones
  ) { }

  ngOnInit() { }

  // Este ciclo de vida detecta cuando haces clic para abrir el Drawer
  ngOnChanges(changes: SimpleChanges) {
    if (changes['open'] && changes['open'].currentValue === true && !this.loaded) {
      // Cuando se abre por primera vez, vamos a la BD por las ubicaciones 
      this.getAllLocations.execute().subscribe(data => this.ubicacionesLista.set(data));
      this.loaded = true;
    }
  }

  close() {
    this.openChange.emit(false);
  }

  handleSave() {
    this.toast.set(null);
    if (!this.numero || !this.iccid || !this.operador || !this.ubicacion) {
      this.toast.set({ type: 'error', message: 'Por favor completa todos los campos.' });
      return;
    }

    const dto = {
      numero: this.numero,
      iccid: this.iccid,
      operador: this.operador,
      estado: 'BODEGA' as 'BODEGA'
    };

    this.createSimCard.execute(dto).subscribe({
      next: () => {
        this.toast.set({ type: 'success', message: `SIM guardada exitosamente.` });
        setTimeout(() => {
          this.close();
          this.saved.emit();
          this.resetForm();
        }, 1200);
      },
      error: (err) => {
        this.toast.set({ type: 'error', message: err.message || 'Error al guardar.' });
      }
    });
  }

  private resetForm() {
    this.numero = '';
    this.iccid = '';
    this.operador = '';
    this.ubicacion = '';
  }
}

