import {
  Component, OnInit, inject, signal, computed, effect, Output, EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GetAllTiposUseCase } from '../../../application/use-cases/get-all-tipos.use-case';
import { CreateTipoUseCase } from '../../../application/use-cases/create-tipo.use-case';
import { UpdateTipoUseCase } from '../../../application/use-cases/update-tipo.use-case';
import { GetAllModelosUseCase } from '../../../application/use-cases/get-all-modelos.use-case';
import { CreateModeloUseCase } from '../../../application/use-cases/create-modelo.use-case';
import { TipoActivo } from '../../../domain/models/tipo-activo.model';
import { ModeloActivo } from '../../../domain/models/modelo-activo.model';
import { TipoModelosModalComponent } from '../tipo-modelos-modal/tipo-modelos-modal.component';

@Component({
  selector: 'app-tipos-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, TipoModelosModalComponent],
  template: `
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">

      <!-- Card Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-50">
            <svg class="w-4.5 h-4.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" />
            </svg>
          </div>
          <div>
            <h2 class="text-sm font-bold text-slate-800">Tipos de Activo</h2>
            <p class="text-xs text-slate-400">{{ tipos().length }} tipo{{ tipos().length !== 1 ? 's' : '' }} registrado{{ tipos().length !== 1 ? 's' : '' }}</p>
          </div>
        </div>

        <!-- Search -->
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            [(ngModel)]="searchTiposTerm"
            placeholder="Buscar tipo..."
            class="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50 w-52"
            id="search-tipos"
          />
        </div>
      </div>

      <!-- Inline Form: Nuevo Tipo -->
      @if (showForm()) {
        <div class="px-6 py-4 bg-indigo-50/60 border-b border-indigo-100 animate-fade-in">
          <p class="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3">Nuevo Tipo de Activo</p>
          <div class="flex flex-col lg:flex-row lg:items-start gap-4">
            <div class="flex-1 space-y-3">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label class="block text-[11px] font-semibold text-slate-600 mb-1">Nombre del Tipo <span class="text-red-500">*</span></label>
                  <input
                    type="text"
                    [(ngModel)]="newNombre"
                    placeholder="Ej: Monitor, Laptop, Terminal POS..."
                    class="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    [class.border-red-300]="formError()"
                    [class.border-slate-300]="!formError()"
                    (keydown.enter)="saveNew()"
                    id="input-nombre-tipo"
                    autofocus
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-slate-600 mb-1">Marca Inicial <span class="text-slate-400 font-normal">(Opcional)</span></label>
                  <input
                    type="text"
                    [(ngModel)]="newMarcaInicial"
                    placeholder="Ej: Sunmi, Newland, Dell..."
                    class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    (keydown.enter)="saveNew()"
                    id="input-marca-inicial"
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-slate-600 mb-1">Modelo Inicial <span class="text-slate-400 font-normal">(Opcional)</span></label>
                  <input
                    type="text"
                    [(ngModel)]="newModeloInicial"
                    placeholder="Ej: V2 Pro, CS10, Latitude..."
                    class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    (keydown.enter)="saveNew()"
                    id="input-modelo-inicial"
                  />
                </div>
              </div>
              @if (formError()) {
                <p class="text-xs text-red-600">{{ formError() }}</p>
              }
              <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
                <p class="text-[11px] text-slate-400">Normalizado a formato Título (ej: "laptop" → "Laptop"). Al guardar podrás seguir gestionando sus marcas y modelos.</p>
                <label class="inline-flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    [(ngModel)]="newAdmiteSoftware"
                    class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    id="checkbox-admite-software"
                  />
                  <span>¿Admite instalación de aplicativos y software?</span>
                </label>
              </div>
            </div>
            <div class="flex gap-2 lg:pt-6">
              <button
                (click)="saveNew()"
                [disabled]="saving()"
                class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                id="btn-guardar-tipo"
              >
                {{ saving() ? 'Guardando...' : 'Guardar' }}
              </button>
              <button
                (click)="cancelNew()"
                class="px-3 py-2 text-xs text-slate-600 hover:text-slate-900 font-medium hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Table Tipos -->
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
            <tr>
              <th class="px-6 py-3 font-semibold">Nombre del Tipo</th>
              <th class="px-6 py-3 font-semibold text-center w-48">Marcas y Modelos</th>
              <th class="px-6 py-3 font-semibold text-center w-40">Soporte Software</th>
              <th class="px-6 py-3 font-semibold text-center w-36">Estado</th>
              <th class="px-6 py-3 font-semibold text-right w-28">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @if (loadingTipos()) {
              <tr>
                <td colspan="5" class="px-6 py-12 text-center text-slate-400">
                  <div class="flex items-center justify-center gap-2">
                    <div class="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Cargando tipos de activo...</span>
                  </div>
                </td>
              </tr>
            } @else if (filteredTipos().length === 0) {
              <tr>
                <td colspan="5" class="px-6 py-12 text-center text-slate-400">
                  @if (searchTiposTerm) {
                    No se encontraron tipos que coincidan con "{{ searchTiposTerm }}".
                  } @else {
                    No hay tipos de activo registrados.
                  }
                </td>
              </tr>
            } @else {
              @for (tipo of paginatedTipos(); track tipo.id) {
                <tr
                  class="hover:bg-slate-50/80 transition-colors"
                  [class.bg-emerald-50]="newlyCreatedId() === tipo.id"
                  [id]="'row-tipo-' + tipo.id"
                >
                  <td class="px-6 py-3.5">
                    @if (editingTipoId() === tipo.id) {
                      <div class="flex items-center gap-2">
                        <input
                          type="text"
                          [(ngModel)]="editNombre"
                          class="px-2.5 py-1 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                          [class.border-red-300]="editError()"
                          [class.border-slate-300]="!editError()"
                          (keydown.enter)="saveEdit(tipo)"
                          (keydown.escape)="cancelEdit()"
                          [id]="'input-edit-' + tipo.id"
                          autofocus
                        />
                        <button
                          (click)="saveEdit(tipo)"
                          [disabled]="updatingTipo()"
                          class="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          ✓
                        </button>
                        <button
                          (click)="cancelEdit()"
                          class="px-2.5 py-1 text-slate-500 hover:text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          ✕
                        </button>
                        @if (editError()) {
                          <span class="text-xs text-red-500">{{ editError() }}</span>
                        }
                      </div>
                    } @else {
                      <div class="flex items-center gap-2.5">
                        <span class="font-medium text-slate-800">{{ tipo.nombre }}</span>
                        @if (newlyCreatedId() === tipo.id) {
                          <span class="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full animate-bounce">
                            ¡Nuevo!
                          </span>
                        }
                      </div>
                    }
                  </td>

                  <td class="px-6 py-3.5 text-center">
                    <button
                      (click)="openModelosModal(tipo)"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg border border-purple-200 transition-colors cursor-pointer"
                      title="Gestionar marcas y modelos de este tipo"
                    >
                      <svg class="w-3.5 h-3.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
                      </svg>
                      <span>Marcas y Modelos</span>
                      <span
                        class="px-1.5 py-0.5 text-[10px] font-bold rounded-full"
                        [class.bg-purple-200]="(modelosCountByTipo()[tipo.id] || 0) > 0"
                        [class.text-purple-800]="(modelosCountByTipo()[tipo.id] || 0) > 0"
                        [class.bg-amber-100]="(modelosCountByTipo()[tipo.id] || 0) === 0"
                        [class.text-amber-700]="(modelosCountByTipo()[tipo.id] || 0) === 0"
                      >
                        {{ modelosCountByTipo()[tipo.id] || 0 }}
                      </span>
                    </button>
                  </td>

                  <td class="px-6 py-3.5 text-center">
                    <button
                      (click)="toggleAdmiteSoftware(tipo)"
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer"
                      [class.bg-purple-50]="tipo.admiteSoftware"
                      [class.text-purple-700]="tipo.admiteSoftware"
                      [class.hover:bg-purple-100]="tipo.admiteSoftware"
                      [class.bg-slate-100]="!tipo.admiteSoftware"
                      [class.text-slate-500]="!tipo.admiteSoftware"
                      [class.hover:bg-slate-200]="!tipo.admiteSoftware"
                      [title]="'Click para ' + (tipo.admiteSoftware ? 'desactivar soporte de software' : 'activar soporte de software')"
                      [id]="'btn-toggle-software-' + tipo.id"
                    >
                      <span
                        class="w-1.5 h-1.5 rounded-full"
                        [class.bg-purple-500]="tipo.admiteSoftware"
                        [class.bg-slate-400]="!tipo.admiteSoftware"
                      ></span>
                      {{ tipo.admiteSoftware ? 'Admite Software' : 'No Aplica' }}
                    </button>
                  </td>

                  <td class="px-6 py-3.5 text-center">
                    <button
                      (click)="toggleEstadoTipo(tipo)"
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full transition-all cursor-pointer"
                      [class.bg-emerald-50]="tipo.estado === 'ACTIVO'"
                      [class.text-emerald-700]="tipo.estado === 'ACTIVO'"
                      [class.hover:bg-emerald-100]="tipo.estado === 'ACTIVO'"
                      [class.bg-slate-100]="tipo.estado === 'INACTIVO'"
                      [class.text-slate-500]="tipo.estado === 'INACTIVO'"
                      [class.hover:bg-slate-200]="tipo.estado === 'INACTIVO'"
                      [title]="'Click para ' + (tipo.estado === 'ACTIVO' ? 'desactivar' : 'activar')"
                      [id]="'btn-toggle-' + tipo.id"
                    >
                      <span
                        class="w-1.5 h-1.5 rounded-full"
                        [class.bg-emerald-500]="tipo.estado === 'ACTIVO'"
                        [class.bg-slate-400]="tipo.estado === 'INACTIVO'"
                      ></span>
                      {{ tipo.estado === 'ACTIVO' ? 'Activo' : 'Inactivo' }}
                    </button>
                  </td>

                  <td class="px-6 py-3.5 text-right">
                    @if (editingTipoId() !== tipo.id) {
                      <button
                        (click)="startEdit(tipo)"
                        class="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                        title="Editar nombre"
                        [id]="'btn-edit-' + tipo.id"
                      >
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                      </button>
                    }
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination Tipos -->
      @if (filteredTipos().length > 0) {
        <div class="flex items-center justify-between px-6 py-3.5 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500">
          <span>Mostrando {{ startTiposIndex() }}-{{ endTiposIndex() }} de {{ filteredTipos().length }} tipos</span>
          <div class="flex items-center gap-2">
            <button
              (click)="prevTiposPage()"
              [disabled]="currentTiposPage() === 1"
              class="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Anterior
            </button>
            <span>Página {{ currentTiposPage() }} de {{ totalTiposPages() }}</span>
            <button
              (click)="nextTiposPage()"
              [disabled]="currentTiposPage() === totalTiposPages()"
              class="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Siguiente
            </button>
          </div>
        </div>
      }

      <app-tipo-modelos-modal
        [tipo]="selectedTipoParaModelos()"
        [isOpen]="isModelosModalOpen()"
        (close)="closeModelosModal()"
        (changed)="onModelosChanged()"
      />
    </div>
  `
})
export class TiposTabComponent implements OnInit {
  private getAllTiposUC = inject(GetAllTiposUseCase);
  private createTipoUC = inject(CreateTipoUseCase);
  private updateTipoUC = inject(UpdateTipoUseCase);
  private getAllModelosUC = inject(GetAllModelosUseCase);
  private createModeloUC = inject(CreateModeloUseCase);

  @Output() countChanged = new EventEmitter<number>();
  @Output() showToast = new EventEmitter<{ type: 'success' | 'error'; message: string }>();

  tipos = signal<TipoActivo[]>([]);
  allModelos = signal<ModeloActivo[]>([]);
  loadingTipos = signal(false);
  saving = signal(false);
  updatingTipo = signal(false);
  showForm = signal(false);
  newNombre = '';
  newMarcaInicial = '';
  newModeloInicial = '';
  newAdmiteSoftware = false;
  formError = signal<string | null>(null);
  editingTipoId = signal<string | null>(null);
  editNombre = '';
  editError = signal<string | null>(null);
  newlyCreatedId = signal<string | null>(null);
  searchTiposTerm = '';

  selectedTipoParaModelos = signal<TipoActivo | null>(null);
  isModelosModalOpen = signal(false);

  modelosCountByTipo = computed<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    for (const m of this.allModelos()) {
      if (m.estado === 'ACTIVO') {
        counts[m.tipoActivoId] = (counts[m.tipoActivoId] || 0) + 1;
      }
    }
    return counts;
  });

  currentTiposPage = signal(1);
  pageSize = 10;

  filteredTipos = computed(() => {
    const term = this.searchTiposTerm.toLowerCase().trim();
    return this.tipos().filter(t =>
      !term || t.nombre.toLowerCase().includes(term)
    );
  });

  paginatedTipos = computed(() => {
    const list = this.filteredTipos();
    const start = (this.currentTiposPage() - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  startTiposIndex = computed(() => {
    if (this.filteredTipos().length === 0) return 0;
    return (this.currentTiposPage() - 1) * this.pageSize + 1;
  });

  endTiposIndex = computed(() => {
    const end = this.currentTiposPage() * this.pageSize;
    const total = this.filteredTipos().length;
    return end > total ? total : end;
  });

  totalTiposPages = computed(() => Math.max(1, Math.ceil(this.filteredTipos().length / this.pageSize)));

  constructor() {
    effect(() => {
      this.filteredTipos();
      setTimeout(() => this.currentTiposPage.set(1), 0);
    });
  }

  ngOnInit() {
    this.loadTipos();
    this.loadModelos();
  }

  loadTipos() {
    this.loadingTipos.set(true);
    this.getAllTiposUC.execute().subscribe({
      next: (tipos) => { 
        this.tipos.set(tipos); 
        this.loadingTipos.set(false);
        this.countChanged.emit(tipos.length);
      },
      error: () => { this.loadingTipos.set(false); }
    });
  }

  loadModelos() {
    this.getAllModelosUC.execute().subscribe({
      next: (modelos) => this.allModelos.set(modelos),
      error: () => {}
    });
  }

  openNewForm() {
    this.showForm.set(true);
    this.newNombre = '';
    this.newMarcaInicial = '';
    this.newModeloInicial = '';
    this.newAdmiteSoftware = false;
    this.formError.set(null);
  }

  cancelNew() {
    this.showForm.set(false);
    this.newNombre = '';
    this.newMarcaInicial = '';
    this.newModeloInicial = '';
    this.newAdmiteSoftware = false;
    this.formError.set(null);
  }

  saveNew() {
    const nombre = this.newNombre.trim();
    const marcaIni = this.newMarcaInicial.trim();
    const modeloIni = this.newModeloInicial.trim();
    if (!nombre) { this.formError.set('El nombre es obligatorio.'); return; }
    if (nombre.length < 3) { this.formError.set('Mínimo 3 caracteres.'); return; }
    if ((marcaIni && !modeloIni) || (!marcaIni && modeloIni)) {
      this.formError.set('Si indicas una marca o modelo inicial, debes completar ambos campos.');
      return;
    }
    this.formError.set(null);
    this.saving.set(true);
    this.createTipoUC.execute({ nombre, admiteSoftware: this.newAdmiteSoftware }).subscribe({
      next: (created) => {
        const finalizeCreation = (extraMsg = '') => {
          this.saving.set(false);
          this.showForm.set(false);
          this.newNombre = '';
          this.newMarcaInicial = '';
          this.newModeloInicial = '';
          this.newAdmiteSoftware = false;
          this.loadTipos();
          this.loadModelos();
          this.newlyCreatedId.set(created.id);
          this.showToast.emit({
            type: 'success',
            message: `Tipo "${created.nombre}" creado exitosamente.${extraMsg}`
          });
          setTimeout(() => this.newlyCreatedId.set(null), 3000);
          this.openModelosModal(created);
        };

        if (marcaIni && modeloIni) {
          this.createModeloUC.execute({
            tipoActivoId: created.id,
            marca: marcaIni,
            modelo: modeloIni
          }).subscribe({
            next: () => finalizeCreation(` Se registró el modelo inicial ${marcaIni} ${modeloIni}.`),
            error: () => finalizeCreation()
          });
        } else {
          finalizeCreation();
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err.error?.message || 'Error al crear el tipo.');
      }
    });
  }

  startEdit(tipo: TipoActivo) {
    this.editingTipoId.set(tipo.id);
    this.editNombre = tipo.nombre;
    this.editError.set(null);
  }

  cancelEdit() {
    this.editingTipoId.set(null);
    this.editNombre = '';
    this.editError.set(null);
  }

  saveEdit(tipo: TipoActivo) {
    const nombre = this.editNombre.trim();
    if (!nombre) { this.editError.set('El nombre es obligatorio.'); return; }
    if (nombre.length < 3) { this.editError.set('Mínimo 3 caracteres.'); return; }
    this.editError.set(null);
    this.updatingTipo.set(true);
    this.updateTipoUC.execute(tipo.id, { nombre }).subscribe({
      next: (updated) => {
        this.updatingTipo.set(false);
        this.editingTipoId.set(null);
        this.loadTipos();
        this.showToast.emit({ type: 'success', message: `Tipo actualizado a "${updated.nombre}".` });
      },
      error: (err) => {
        this.updatingTipo.set(false);
        this.editError.set(err.error?.message || 'Error al actualizar.');
      }
    });
  }

  toggleEstadoTipo(tipo: TipoActivo) {
    const newEstado = tipo.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    this.updatingTipo.set(true);
    this.updateTipoUC.execute(tipo.id, { estado: newEstado }).subscribe({
      next: () => {
        this.updatingTipo.set(false);
        this.loadTipos();
        this.showToast.emit({ type: 'success', message: `"${tipo.nombre}" marcado como ${newEstado}.` });
      },
      error: (err) => {
        this.updatingTipo.set(false);
        this.showToast.emit({ type: 'error', message: err.error?.message || 'Error al cambiar estado.' });
      }
    });
  }

  toggleAdmiteSoftware(tipo: TipoActivo) {
    const newAdmite = !tipo.admiteSoftware;
    this.updatingTipo.set(true);
    this.updateTipoUC.execute(tipo.id, { admiteSoftware: newAdmite }).subscribe({
      next: () => {
        this.updatingTipo.set(false);
        this.loadTipos();
        this.showToast.emit({
          type: 'success',
          message: `"${tipo.nombre}" ahora ${newAdmite ? 'admite aplicativos' : 'no admite aplicativos'}.`
        });
      },
      error: (err) => {
        this.updatingTipo.set(false);
        this.showToast.emit({ type: 'error', message: err.error?.message || 'Error al actualizar soporte de software.' });
      }
    });
  }

  prevTiposPage() { if (this.currentTiposPage() > 1) this.currentTiposPage.update(p => p - 1); }
  nextTiposPage() { if (this.currentTiposPage() < this.totalTiposPages()) this.currentTiposPage.update(p => p + 1); }

  openModelosModal(tipo: TipoActivo) {
    this.selectedTipoParaModelos.set(tipo);
    this.isModelosModalOpen.set(true);
  }

  closeModelosModal() {
    this.isModelosModalOpen.set(false);
    this.selectedTipoParaModelos.set(null);
  }

  onModelosChanged() {
    this.loadModelos();
  }
}
