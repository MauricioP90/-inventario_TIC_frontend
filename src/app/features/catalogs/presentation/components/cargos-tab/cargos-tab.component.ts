import {
  Component, OnInit, inject, signal, computed, effect, Output, EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Cargo } from '../../../../responsables/domain/models/cargo.model';
import { GetAllCargosUseCase } from '../../../../responsables/application/use-cases/get-all-cargos.use-case';
import { CreateCargoUseCase } from '../../../../responsables/application/use-cases/create-cargo.use-case';
import { UpdateCargoUseCase } from '../../../../responsables/application/use-cases/update-cargo.use-case';
import { ToggleCargoStatusUseCase } from '../../../../responsables/application/use-cases/toggle-cargo-status.use-case';

@Component({
  selector: 'app-cargos-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">

      <!-- Card Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-50">
            <svg class="w-4.5 h-4.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h2 class="text-sm font-bold text-slate-800">Catálogo de Cargos / Puestos</h2>
            <p class="text-xs text-slate-400">{{ cargos().length }} cargo{{ cargos().length !== 1 ? 's' : '' }} registrado{{ cargos().length !== 1 ? 's' : '' }} en la organización</p>
          </div>
        </div>

        <!-- Search -->
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            [(ngModel)]="searchCargosTerm"
            placeholder="Buscar cargo..."
            class="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50 w-52"
            id="search-cargos"
          />
        </div>
      </div>

      <!-- Inline Form: Nuevo Cargo -->
      @if (showCargoForm()) {
        <div class="px-6 py-4 bg-indigo-50/60 border-b border-indigo-100 animate-fade-in">
          <p class="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3">Nuevo Cargo Organizacional</p>
          <div class="flex items-start gap-3">
            <div class="flex-1 space-y-1.5">
              <input
                type="text"
                [(ngModel)]="newCargoNombre"
                placeholder="Ej: Auxiliar, Analista, Coordinador, Conductor..."
                class="w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                [class.border-red-300]="cargoFormError()"
                [class.border-slate-300]="!cargoFormError()"
                (keydown.enter)="saveNewCargo()"
                id="input-nombre-cargo"
                autofocus
              />
              @if (cargoFormError()) {
                <p class="text-xs text-red-600">{{ cargoFormError() }}</p>
              }
              <p class="text-[11px] text-slate-400">El nombre se normalizará automáticamente a formato Título (ej: "coordinador ti" → "Coordinador Ti").</p>
            </div>
            <div class="flex gap-2 pt-0.5">
              <button
                (click)="saveNewCargo()"
                [disabled]="savingCargo()"
                class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                id="btn-guardar-cargo"
              >
                {{ savingCargo() ? 'Guardando...' : 'Guardar Cargo' }}
              </button>
              <button
                (click)="cancelNewCargo()"
                class="px-3 py-2.5 text-xs text-slate-600 hover:text-slate-900 font-medium hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Table Cargos -->
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
            <tr>
              <th class="px-6 py-3 font-semibold">Nombre del Cargo</th>
              <th class="px-6 py-3 font-semibold text-center w-36">Estado</th>
              <th class="px-6 py-3 font-semibold text-right w-28">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @if (loadingCargos()) {
              <tr>
                <td colspan="3" class="px-6 py-12 text-center text-slate-400">
                  <div class="flex items-center justify-center gap-2">
                    <div class="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Cargando catálogo de cargos...</span>
                  </div>
                </td>
              </tr>
            } @else if (filteredCargos().length === 0) {
              <tr>
                <td colspan="3" class="px-6 py-12 text-center text-slate-400">
                  @if (searchCargosTerm) {
                    No se encontraron cargos que coincidan con "{{ searchCargosTerm }}".
                  } @else {
                    No hay cargos registrados.
                  }
                </td>
              </tr>
            } @else {
              @for (cargo of paginatedCargos(); track cargo.id) {
                <tr
                  class="hover:bg-slate-50/80 transition-colors"
                  [class.bg-emerald-50]="newlyCreatedCargoId() === cargo.id"
                  [id]="'row-cargo-' + cargo.id"
                >
                  <td class="px-6 py-3.5">
                    @if (editingCargoId() === cargo.id) {
                      <div class="flex items-center gap-2">
                        <input
                          type="text"
                          [(ngModel)]="editCargoNombre"
                          class="px-2.5 py-1 text-sm border border-indigo-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white w-64"
                          (keydown.enter)="saveEditCargo(cargo)"
                          (keydown.escape)="cancelEditCargo()"
                          [id]="'input-edit-cargo-' + cargo.id"
                          autofocus
                        />
                        <button
                          (click)="saveEditCargo(cargo)"
                          [disabled]="updatingCargo()"
                          class="p-1 text-emerald-600 hover:text-emerald-800 disabled:opacity-50 cursor-pointer"
                          title="Guardar"
                        >
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </button>
                        <button
                          (click)="cancelEditCargo()"
                          class="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                          title="Cancelar"
                        >
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        @if (editCargoError()) {
                          <span class="text-xs text-red-600">{{ editCargoError() }}</span>
                        }
                      </div>
                    } @else {
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-slate-800">{{ cargo.nombre }}</span>
                      </div>
                    }
                  </td>

                  <td class="px-6 py-3.5 text-center">
                    <button
                      (click)="toggleCargoStatus(cargo)"
                      [disabled]="updatingCargo()"
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full transition-all cursor-pointer"
                      [class.bg-emerald-50]="cargo.estado === 'ACTIVO'"
                      [class.text-emerald-700]="cargo.estado === 'ACTIVO'"
                      [class.hover:bg-emerald-100]="cargo.estado === 'ACTIVO'"
                      [class.bg-slate-100]="cargo.estado === 'INACTIVO'"
                      [class.text-slate-500]="cargo.estado === 'INACTIVO'"
                      [class.hover:bg-slate-200]="cargo.estado === 'INACTIVO'"
                      [title]="'Click para ' + (cargo.estado === 'ACTIVO' ? 'desactivar' : 'activar')"
                      [id]="'btn-toggle-cargo-' + cargo.id"
                    >
                      <span
                        class="w-1.5 h-1.5 rounded-full"
                        [class.bg-emerald-500]="cargo.estado === 'ACTIVO'"
                        [class.bg-slate-400]="cargo.estado === 'INACTIVO'"
                      ></span>
                      {{ cargo.estado === 'ACTIVO' ? 'Activo' : 'Inactivo' }}
                    </button>
                  </td>

                  <td class="px-6 py-3.5 text-right">
                    @if (editingCargoId() !== cargo.id) {
                      <button
                        (click)="startEditCargo(cargo)"
                        class="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                        title="Editar nombre"
                        [id]="'btn-edit-cargo-' + cargo.id"
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

      <!-- Pagination Cargos -->
      @if (filteredCargos().length > 0) {
        <div class="flex items-center justify-between px-6 py-3.5 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500">
          <span>Mostrando {{ startCargosIndex() }}-{{ endCargosIndex() }} de {{ filteredCargos().length }} cargos</span>
          <div class="flex items-center gap-2">
            <button
              (click)="prevCargosPage()"
              [disabled]="currentCargosPage() === 1"
              class="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Anterior
            </button>
            <span>Página {{ currentCargosPage() }} de {{ totalCargosPages() }}</span>
            <button
              (click)="nextCargosPage()"
              [disabled]="currentCargosPage() === totalCargosPages()"
              class="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Siguiente
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class CargosTabComponent implements OnInit {
  private getAllCargosUC = inject(GetAllCargosUseCase);
  private createCargoUC = inject(CreateCargoUseCase);
  private updateCargoUC = inject(UpdateCargoUseCase);
  private toggleCargoUC = inject(ToggleCargoStatusUseCase);

  @Output() countChanged = new EventEmitter<number>();
  @Output() showToast = new EventEmitter<{ type: 'success' | 'error'; message: string }>();

  cargos = signal<Cargo[]>([]);
  loadingCargos = signal(false);
  savingCargo = signal(false);
  updatingCargo = signal(false);
  showCargoForm = signal(false);
  newCargoNombre = '';
  cargoFormError = signal<string | null>(null);
  editingCargoId = signal<string | null>(null);
  editCargoNombre = '';
  editCargoError = signal<string | null>(null);
  newlyCreatedCargoId = signal<string | null>(null);
  searchCargosTerm = '';

  currentCargosPage = signal(1);
  cargosPageSize = 10;

  filteredCargos = computed(() => {
    const term = this.searchCargosTerm.toLowerCase().trim();
    return this.cargos().filter(c =>
      !term || c.nombre.toLowerCase().includes(term)
    );
  });

  paginatedCargos = computed(() => {
    const list = this.filteredCargos();
    const start = (this.currentCargosPage() - 1) * this.cargosPageSize;
    return list.slice(start, start + this.cargosPageSize);
  });

  startCargosIndex = computed(() => {
    if (this.filteredCargos().length === 0) return 0;
    return (this.currentCargosPage() - 1) * this.cargosPageSize + 1;
  });

  endCargosIndex = computed(() => {
    const end = this.currentCargosPage() * this.cargosPageSize;
    const total = this.filteredCargos().length;
    return end > total ? total : end;
  });

  totalCargosPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredCargos().length / this.cargosPageSize))
  );

  constructor() {
    effect(() => {
      this.filteredCargos();
      setTimeout(() => this.currentCargosPage.set(1), 0);
    });
  }

  ngOnInit() {
    this.loadCargos();
  }

  loadCargos() {
    this.loadingCargos.set(true);
    this.getAllCargosUC.execute().subscribe({
      next: (cargos) => { 
        this.cargos.set(cargos); 
        this.loadingCargos.set(false);
        this.countChanged.emit(cargos.length);
      },
      error: () => { this.loadingCargos.set(false); }
    });
  }

  openNewCargoForm() {
    this.showCargoForm.set(true);
    this.newCargoNombre = '';
    this.cargoFormError.set(null);
  }

  cancelNewCargo() {
    this.showCargoForm.set(false);
    this.newCargoNombre = '';
    this.cargoFormError.set(null);
  }

  saveNewCargo() {
    const nombre = this.newCargoNombre.trim();
    if (!nombre) { this.cargoFormError.set('El nombre es obligatorio.'); return; }
    if (nombre.length < 3) { this.cargoFormError.set('Mínimo 3 caracteres.'); return; }
    this.cargoFormError.set(null);
    this.savingCargo.set(true);
    this.createCargoUC.execute(nombre).subscribe({
      next: (created: Cargo) => {
        this.savingCargo.set(false);
        this.showCargoForm.set(false);
        this.newCargoNombre = '';
        this.loadCargos();
        this.newlyCreatedCargoId.set(created.id);
        this.showToast.emit({ type: 'success', message: `Cargo "${created.nombre}" creado exitosamente.` });
        setTimeout(() => this.newlyCreatedCargoId.set(null), 3000);
      },
      error: (err: any) => {
        this.savingCargo.set(false);
        this.cargoFormError.set(err.error?.message || 'Error al crear el cargo.');
      }
    });
  }

  startEditCargo(cargo: Cargo) {
    this.editingCargoId.set(cargo.id);
    this.editCargoNombre = cargo.nombre;
    this.editCargoError.set(null);
  }

  cancelEditCargo() {
    this.editingCargoId.set(null);
    this.editCargoNombre = '';
    this.editCargoError.set(null);
  }

  saveEditCargo(cargo: Cargo) {
    const nombre = this.editCargoNombre.trim();
    if (!nombre) { this.editCargoError.set('El nombre es obligatorio.'); return; }
    if (nombre.length < 3) { this.editCargoError.set('Mínimo 3 caracteres.'); return; }
    this.editCargoError.set(null);
    this.updatingCargo.set(true);
    this.updateCargoUC.execute(cargo.id, nombre).subscribe({
      next: (updated: Cargo) => {
        this.updatingCargo.set(false);
        this.editingCargoId.set(null);
        this.loadCargos();
        this.showToast.emit({ type: 'success', message: `Cargo actualizado a "${updated.nombre}".` });
      },
      error: (err: any) => {
        this.updatingCargo.set(false);
        this.editCargoError.set(err.error?.message || 'Error al actualizar.');
      }
    });
  }

  toggleCargoStatus(cargo: Cargo) {
    this.updatingCargo.set(true);
    this.toggleCargoUC.execute(cargo.id).subscribe({
      next: (updated: Cargo) => {
        this.updatingCargo.set(false);
        this.loadCargos();
        this.showToast.emit({ type: 'success', message: `"${updated.nombre}" marcado como ${updated.estado}.` });
      },
      error: (err: any) => {
        this.updatingCargo.set(false);
        this.showToast.emit({ type: 'error', message: err.error?.message || 'Error al cambiar estado.' });
      }
    });
  }

  prevCargosPage() { if (this.currentCargosPage() > 1) this.currentCargosPage.update(p => p - 1); }
  nextCargosPage() { if (this.currentCargosPage() < this.totalCargosPages()) this.currentCargosPage.update(p => p + 1); }
}
