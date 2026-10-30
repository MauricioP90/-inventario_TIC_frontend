import {
  Component, Input, Output, EventEmitter, signal, inject, computed, OnChanges, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TipoActivo } from '../../../domain/models/tipo-activo.model';
import { ModeloActivo } from '../../../domain/models/modelo-activo.model';
import { GetAllModelosUseCase } from '../../../application/use-cases/get-all-modelos.use-case';
import { CreateModeloUseCase } from '../../../application/use-cases/create-modelo.use-case';
import { UpdateModeloUseCase } from '../../../application/use-cases/update-modelo.use-case';
import { DeleteModeloUseCase } from '../../../application/use-cases/delete-modelo.use-case';

interface MarcaGroup {
  marca: string;
  modelos: ModeloActivo[];
}

@Component({
  selector: 'app-tipo-modelos-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen && tipo) {
      <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
        <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-scale-up">

          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
                </svg>
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-800">
                  Marcas y Modelos Homologados
                </h3>
                <p class="text-xs text-slate-500">
                  Tipo de Activo: <span class="font-bold text-purple-700 uppercase">{{ tipo.nombre }}</span>
                </p>
              </div>
            </div>
            <button
              (click)="closeModal()"
              class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 space-y-6 max-h-[75vh] overflow-y-auto">

            <!-- Form: Nuevo Registro Marca + Modelo -->
            <div class="p-4 bg-purple-50/50 rounded-xl border border-purple-100 space-y-3">
              <p class="text-xs font-bold text-purple-800 uppercase tracking-wide">
                + Agregar Nueva Marca o Modelo para {{ tipo.nombre }}
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div class="sm:col-span-2">
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Marca</label>
                  <input
                    type="text"
                    [(ngModel)]="nuevaMarca"
                    list="marcas-existentes"
                    placeholder="Ej: Samsung, Sony, Dell..."
                    class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                  <datalist id="marcas-existentes">
                    @for (mg of marcasAgrupadas(); track mg.marca) {
                      <option [value]="mg.marca"></option>
                    }
                  </datalist>
                </div>

                <div class="sm:col-span-2">
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Modelo</label>
                  <input
                    type="text"
                    [(ngModel)]="nuevoModelo"
                    placeholder="Ej: Xpirea3, NeoQLED 55..."
                    (keydown.enter)="agregarModelo()"
                    class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                </div>

                <div class="sm:col-span-1 flex items-end">
                  <button
                    (click)="agregarModelo()"
                    [disabled]="guardando()"
                    class="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    @if (guardando()) {
                      <div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    } @else {
                      <span>Agregar</span>
                    }
                  </button>
                </div>
              </div>
              @if (errorForm()) {
                <p class="text-xs text-red-600 font-medium">{{ errorForm() }}</p>
              }
            </div>

            <!-- Listado Agrupado por Marca -->
            @if (cargando()) {
              <div class="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                <div class="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                <span class="text-xs">Cargando marcas y modelos...</span>
              </div>
            } @else if (marcasAgrupadas().length === 0) {
              <div class="py-12 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <p class="text-sm font-semibold text-slate-600">No hay marcas ni modelos registrados para este tipo.</p>
                <p class="text-xs text-slate-400 mt-1">Usa el formulario superior para añadir la primera combinación de Marca y Modelo.</p>
              </div>
            } @else {
              <div class="space-y-4">
                @for (mg of marcasAgrupadas(); track mg.marca) {
                  <div class="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2.5">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                        <h4 class="text-sm font-bold text-slate-900">{{ mg.marca }}</h4>
                        <span class="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                          {{ mg.modelos.length }} modelo{{ mg.modelos.length !== 1 ? 's' : '' }}
                        </span>
                      </div>
                    </div>

                    <!-- Chips de Modelos -->
                    <div class="flex flex-wrap items-center gap-2 pt-1">
                      @for (mod of mg.modelos; track mod.id) {
                        @if (editandoModeloId() === mod.id) {
                          <div class="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 border border-purple-300 rounded-lg text-xs">
                            <input
                              type="text"
                              [(ngModel)]="editModeloNombre"
                              (keydown.enter)="guardarEdicionModelo(mod)"
                              (keydown.escape)="cancelarEdicionModelo()"
                              class="w-28 px-1.5 py-0.5 text-xs bg-white border border-purple-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                              autofocus
                            />
                            <button
                              (click)="guardarEdicionModelo(mod)"
                              [disabled]="actualizando()"
                              class="text-purple-700 hover:text-purple-900 font-bold px-1 cursor-pointer"
                              title="Guardar cambio"
                            >
                              ✓
                            </button>
                            <button
                              (click)="cancelarEdicionModelo()"
                              class="text-slate-400 hover:text-slate-600 px-1 cursor-pointer"
                              title="Cancelar"
                            >
                              ✕
                            </button>
                          </div>
                        } @else {
                          <div class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 transition-colors group">
                            <span>{{ mod.modelo }}</span>
                            <button
                              (click)="iniciarEdicionModelo(mod)"
                              class="text-slate-400 hover:text-purple-600 p-0.5 rounded-md transition-colors cursor-pointer"
                              title="Editar nombre del modelo"
                            >
                              ✎
                            </button>
                            <button
                              (click)="eliminarModelo(mod)"
                              class="text-slate-400 hover:text-red-600 p-0.5 rounded-md transition-colors cursor-pointer"
                              title="Eliminar este modelo"
                            >
                              ✕
                            </button>
                          </div>
                        }
                      }
                    </div>
                  </div>
                }
              </div>
            }

          </div>

          <!-- Footer -->
          <div class="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex justify-end">
            <button
              (click)="closeModal()"
              class="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Listo / Cerrar
            </button>
          </div>

        </div>
      </div>
    }
  `
})
export class TipoModelosModalComponent implements OnChanges {
  @Input() tipo: TipoActivo | null = null;
  @Input() isOpen = false;

  @Output() close = new EventEmitter<void>();
  @Output() changed = new EventEmitter<void>();

  private getAllModelosUC = inject(GetAllModelosUseCase);
  private createModeloUC = inject(CreateModeloUseCase);
  private updateModeloUC = inject(UpdateModeloUseCase);
  private deleteModeloUC = inject(DeleteModeloUseCase);

  modelos = signal<ModeloActivo[]>([]);
  cargando = signal(false);
  guardando = signal(false);
  actualizando = signal(false);
  editandoModeloId = signal<string | null>(null);
  editModeloNombre = '';

  nuevaMarca = '';
  nuevoModelo = '';
  errorForm = signal<string | null>(null);

  marcasAgrupadas = computed<MarcaGroup[]>(() => {
    const map = new Map<string, ModeloActivo[]>();
    for (const m of this.modelos()) {
      const marcaNorm = m.marca.trim();
      if (!map.has(marcaNorm)) {
        map.set(marcaNorm, []);
      }
      map.get(marcaNorm)!.push(m);
    }
    return Array.from(map.entries()).map(([marca, modelos]) => ({
      marca,
      modelos: modelos.sort((a, b) => a.modelo.localeCompare(b.modelo))
    })).sort((a, b) => a.marca.localeCompare(b.marca));
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen && this.tipo) {
      this.cargarModelos();
      this.nuevaMarca = '';
      this.nuevoModelo = '';
      this.errorForm.set(null);
    }
  }

  cargarModelos() {
    if (!this.tipo) return;
    this.cargando.set(true);
    this.getAllModelosUC.execute(this.tipo.id).subscribe({
      next: (data) => {
        this.modelos.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  agregarModelo() {
    if (!this.tipo) return;
    const marca = this.nuevaMarca.trim();
    const modelo = this.nuevoModelo.trim();

    if (!marca) {
      this.errorForm.set('La marca es obligatoria.');
      return;
    }
    if (!modelo) {
      this.errorForm.set('El modelo es obligatorio.');
      return;
    }

    // Verificar si ya existe esa marca y modelo exactamente
    const existe = this.modelos().some(
      m => m.marca.toLowerCase() === marca.toLowerCase() && m.modelo.toLowerCase() === modelo.toLowerCase()
    );
    if (existe) {
      this.errorForm.set(`El modelo "${modelo}" ya está registrado bajo la marca "${marca}".`);
      return;
    }

    this.errorForm.set(null);
    this.guardando.set(true);
    this.createModeloUC.execute({
      tipoActivoId: this.tipo.id,
      marca,
      modelo
    }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.nuevoModelo = ''; // Dejamos la marca para facilitar añadir múltiples modelos de la misma marca
        this.cargarModelos();
        this.changed.emit();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorForm.set(err.error?.message || 'Error al guardar.');
      }
    });
  }

  iniciarEdicionModelo(mod: ModeloActivo) {
    this.editandoModeloId.set(mod.id);
    this.editModeloNombre = mod.modelo;
    this.errorForm.set(null);
  }

  cancelarEdicionModelo() {
    this.editandoModeloId.set(null);
    this.editModeloNombre = '';
  }

  guardarEdicionModelo(mod: ModeloActivo) {
    const nuevoNombre = this.editModeloNombre.trim();
    if (!nuevoNombre) {
      this.errorForm.set('El nombre del modelo no puede estar vacío.');
      return;
    }
    if (nuevoNombre === mod.modelo) {
      this.cancelarEdicionModelo();
      return;
    }
    this.actualizando.set(true);
    this.updateModeloUC.execute(mod.id, { marca: mod.marca, modelo: nuevoNombre }).subscribe({
      next: () => {
        this.actualizando.set(false);
        this.cancelarEdicionModelo();
        this.cargarModelos();
        this.changed.emit();
      },
      error: (err) => {
        this.actualizando.set(false);
        this.errorForm.set(err.error?.message || 'Error al actualizar el modelo.');
      }
    });
  }

  eliminarModelo(mod: ModeloActivo) {
    if (!confirm(`¿Deseas eliminar el modelo "${mod.marca} ${mod.modelo}" de este tipo?`)) {
      return;
    }
    this.deleteModeloUC.execute(mod.id).subscribe({
      next: () => {
        this.cargarModelos();
        this.changed.emit();
      },
      error: (err) => {
        alert(err.error?.message || 'Error al eliminar modelo.');
      }
    });
  }

  closeModal() {
    this.close.emit();
  }
}
