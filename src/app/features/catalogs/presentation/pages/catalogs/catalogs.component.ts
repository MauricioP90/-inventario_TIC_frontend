import {
  Component, OnInit, inject, signal, computed, effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GetAllTiposUseCase } from '../../../application/use-cases/get-all-tipos.use-case';
import { CreateTipoUseCase } from '../../../application/use-cases/create-tipo.use-case';
import { UpdateTipoUseCase } from '../../../application/use-cases/update-tipo.use-case';
import { CatalogsRepository } from '../../../domain/repositories/catalogs.repository';
import { HttpCatalogsRepository } from '../../../infrastructure/adapters/http-catalogs.repository';
import { TipoActivo } from '../../../domain/models/tipo-activo.model';

@Component({
  selector: 'app-catalogs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    { provide: CatalogsRepository, useClass: HttpCatalogsRepository },
    GetAllTiposUseCase,
    CreateTipoUseCase,
    UpdateTipoUseCase,
  ],
  template: `
    <div class="min-h-screen bg-slate-50 p-6 space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Catálogos</h1>
          <p class="text-sm text-slate-500 mt-0.5">Administración de datos maestros del sistema</p>
        </div>
        <button
          (click)="openNewForm()"
          [disabled]="showForm()"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
          id="btn-nuevo-tipo"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo Tipo
        </button>
      </div>

      <!-- Card Tipos de Activo -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

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
              [(ngModel)]="searchTerm"
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
            <div class="flex items-start gap-3">
              <div class="flex-1 space-y-1.5">
                <input
                  type="text"
                  [(ngModel)]="newNombre"
                  placeholder="Ej: Monitor, Laptop, Tablet..."
                  class="w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  [class.border-red-300]="formError()"
                  [class.border-slate-300]="!formError()"
                  (keydown.enter)="saveNew()"
                  id="input-nombre-tipo"
                  autofocus
                />
                @if (formError()) {
                  <p class="text-xs text-red-600">{{ formError() }}</p>
                }
                <p class="text-[11px] text-slate-400">El nombre se normalizará automáticamente a formato Título (ej: "laptop" → "Laptop").</p>
              </div>
              <div class="flex gap-2 pt-0.5">
                <button
                  (click)="saveNew()"
                  [disabled]="saving()"
                  class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                  id="btn-guardar-tipo"
                >
                  @if (saving()) {
                    <div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  }
                  Guardar
                </button>
                <button
                  (click)="cancelNew()"
                  [disabled]="saving()"
                  class="px-3 py-2.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Toast -->
        @if (toast()) {
          <div class="px-6 py-3 border-b border-slate-100">
            <div
              class="text-sm rounded-lg px-4 py-3 font-medium"
              [class]="toast()!.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-red-50 border border-red-200 text-red-700'"
            >
              {{ toast()!.message }}
            </div>
          </div>
        }

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-100">
                <th class="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">#</th>
                <th class="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre</th>
                <th class="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                <th class="text-right px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @if (loading()) {
                @for (i of [1,2,3,4,5]; track i) {
                  <tr class="border-b border-slate-50">
                    <td class="px-6 py-4"><div class="h-4 w-6 bg-slate-200 rounded animate-pulse"></div></td>
                    <td class="px-6 py-4"><div class="h-4 w-36 bg-slate-200 rounded animate-pulse"></div></td>
                    <td class="px-6 py-4"><div class="h-6 w-20 bg-slate-200 rounded-full animate-pulse"></div></td>
                    <td class="px-6 py-4 text-right"><div class="h-4 w-24 bg-slate-200 rounded animate-pulse ml-auto"></div></td>
                  </tr>
                }
              } @else if (paginatedTipos().length === 0) {
                <tr>
                  <td colspan="4" class="px-6 py-16 text-center text-slate-400">
                    <div class="flex flex-col items-center gap-2">
                      <svg class="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                      </svg>
                      <p class="text-sm font-medium text-slate-500">
                        {{ searchTerm ? 'Sin resultados para "' + searchTerm + '"' : 'No hay tipos de activo registrados.' }}
                      </p>
                      @if (!searchTerm) {
                        <p class="text-xs text-slate-400">Crea el primero usando el botón "Nuevo Tipo".</p>
                      }
                    </div>
                  </td>
                </tr>
              } @else {
                @for (tipo of paginatedTipos(); track tipo.id; let i = $index) {
                  <tr
                    class="border-b border-slate-50 transition-colors duration-150 hover:bg-slate-50/70"
                    [class.bg-emerald-50]="newlyCreatedId() === tipo.id"
                  >
                    <!-- Index -->
                    <td class="px-6 py-4 text-slate-400 text-xs font-mono">
                      {{ startIndex() + i }}
                    </td>

                    <!-- Nombre (editable inline) -->
                    <td class="px-6 py-4">
                      @if (editingId() === tipo.id) {
                        <div class="flex items-center gap-2">
                          <input
                            type="text"
                            [(ngModel)]="editNombre"
                            class="px-2.5 py-1.5 text-sm border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white w-52"
                            (keydown.enter)="saveEdit(tipo)"
                            (keydown.escape)="cancelEdit()"
                            id="input-edit-nombre"
                          />
                          @if (editError()) {
                            <span class="text-xs text-red-500">{{ editError() }}</span>
                          }
                        </div>
                      } @else {
                        <span class="font-semibold text-slate-800">{{ tipo.nombre }}</span>
                      }
                    </td>

                    <!-- Estado -->
                    <td class="px-6 py-4">
                      <span
                        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border"
                        [class]="tipo.estado === 'ACTIVO'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'"
                      >
                        <span class="w-1.5 h-1.5 rounded-full"
                          [class]="tipo.estado === 'ACTIVO' ? 'bg-emerald-500' : 'bg-slate-400'">
                        </span>
                        {{ tipo.estado }}
                      </span>
                    </td>

                    <!-- Acciones -->
                    <td class="px-6 py-4 text-right">
                      @if (editingId() === tipo.id) {
                        <div class="flex items-center justify-end gap-2">
                          <button
                            (click)="saveEdit(tipo)"
                            [disabled]="updating()"
                            class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                          >
                            @if (updating()) {
                              <span class="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            } @else { Guardar }
                          </button>
                          <button
                            (click)="cancelEdit()"
                            class="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      } @else {
                        <div class="flex items-center justify-end gap-2">
                          <!-- Editar nombre -->
                          <button
                            (click)="startEdit(tipo)"
                            class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Editar nombre"
                          >
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                            </svg>
                          </button>
                          <!-- Activar / Inactivar -->
                          <button
                            (click)="toggleEstado(tipo)"
                            [disabled]="updating()"
                            class="p-1.5 rounded-lg transition-colors disabled:opacity-40"
                            [class]="tipo.estado === 'ACTIVO'
                              ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'"
                            [title]="tipo.estado === 'ACTIVO' ? 'Inactivar tipo' : 'Activar tipo'"
                          >
                            @if (tipo.estado === 'ACTIVO') {
                              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            } @else {
                              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            }
                          </button>
                        </div>
                      }
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination Footer -->
        @if (filteredTipos().length > 0) {
          <div class="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50/50">
            <div class="flex items-center gap-3 text-xs text-slate-500">
              <span>Mostrando <strong>{{ startIndex() }}</strong> a <strong>{{ endIndex() }}</strong> de <strong>{{ filteredTipos().length }}</strong></span>
              <select
                [(ngModel)]="pageSize"
                (ngModelChange)="onPageSizeChange()"
                class="px-2 py-1 border border-slate-200 rounded-lg bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              >
                <option [value]="5">5 por página</option>
                <option [value]="10">10 por página</option>
                <option [value]="25">25 por página</option>
                <option [value]="50">50 por página</option>
              </select>
            </div>
            <div class="flex items-center gap-1">
              <button
                (click)="prevPage()"
                [disabled]="currentPage() === 1"
                class="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors border border-slate-200 bg-white"
              >← Anterior</button>
              <span class="px-3 py-1.5 text-xs font-bold text-indigo-600">{{ currentPage() }} / {{ totalPages() }}</span>
              <button
                (click)="nextPage()"
                [disabled]="currentPage() === totalPages()"
                class="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors border border-slate-200 bg-white"
              >Siguiente →</button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in { animation: fade-in 0.2s ease-out; }
  `]
})
export class CatalogsComponent implements OnInit {
  private getAllTiposUC = inject(GetAllTiposUseCase);
  private createTipoUC = inject(CreateTipoUseCase);
  private updateTipoUC = inject(UpdateTipoUseCase);

  // Data
  tipos = signal<TipoActivo[]>([]);
  loading = signal(true);
  toast = signal<{ type: 'success' | 'error'; message: string } | null>(null);
  newlyCreatedId = signal<string | null>(null);

  // New form
  showForm = signal(false);
  newNombre = '';
  saving = signal(false);
  formError = signal<string | null>(null);

  // Inline edit
  editingId = signal<string | null>(null);
  editNombre = '';
  editError = signal<string | null>(null);
  updating = signal(false);

  // Search
  searchTerm = '';

  // Pagination
  currentPage = signal(1);
  pageSize = 10;

  filteredTipos = computed(() => {
    const term = this.searchTerm.toLowerCase().trim();
    return this.tipos().filter(t =>
      !term || t.nombre.toLowerCase().includes(term)
    );
  });

  paginatedTipos = computed(() => {
    const list = this.filteredTipos();
    const start = (this.currentPage() - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  startIndex = computed(() => {
    if (this.filteredTipos().length === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize + 1;
  });

  endIndex = computed(() => {
    const end = this.currentPage() * this.pageSize;
    const total = this.filteredTipos().length;
    return end > total ? total : end;
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredTipos().length / this.pageSize)));

  constructor() {
    // Reset page on search
    effect(() => {
      // Access filteredTipos to track
      this.filteredTipos();
      // Reset without writing to tracked signal in same context
      setTimeout(() => this.currentPage.set(1), 0);
    });
  }

  ngOnInit() { this.load(); }

  private load() {
    this.loading.set(true);
    this.getAllTiposUC.execute().subscribe({
      next: (tipos) => { this.tipos.set(tipos); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }

  openNewForm() {
    this.showForm.set(true);
    this.newNombre = '';
    this.formError.set(null);
  }

  cancelNew() {
    this.showForm.set(false);
    this.newNombre = '';
    this.formError.set(null);
  }

  saveNew() {
    const nombre = this.newNombre.trim();
    if (!nombre) { this.formError.set('El nombre es obligatorio.'); return; }
    if (nombre.length < 3) { this.formError.set('Mínimo 3 caracteres.'); return; }
    this.formError.set(null);
    this.saving.set(true);
    this.createTipoUC.execute({ nombre }).subscribe({
      next: (created) => {
        this.saving.set(false);
        this.showForm.set(false);
        this.newNombre = '';
        this.load();
        this.newlyCreatedId.set(created.id);
        this.showToast('success', `Tipo "${created.nombre}" creado exitosamente.`);
        setTimeout(() => this.newlyCreatedId.set(null), 3000);
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err.error?.message || 'Error al crear el tipo.');
      }
    });
  }

  startEdit(tipo: TipoActivo) {
    this.editingId.set(tipo.id);
    this.editNombre = tipo.nombre;
    this.editError.set(null);
  }

  cancelEdit() {
    this.editingId.set(null);
    this.editNombre = '';
    this.editError.set(null);
  }

  saveEdit(tipo: TipoActivo) {
    const nombre = this.editNombre.trim();
    if (!nombre) { this.editError.set('El nombre es obligatorio.'); return; }
    if (nombre.length < 3) { this.editError.set('Mínimo 3 caracteres.'); return; }
    this.editError.set(null);
    this.updating.set(true);
    this.updateTipoUC.execute(tipo.id, { nombre }).subscribe({
      next: (updated) => {
        this.updating.set(false);
        this.editingId.set(null);
        this.load();
        this.showToast('success', `Tipo actualizado a "${updated.nombre}".`);
      },
      error: (err) => {
        this.updating.set(false);
        this.editError.set(err.error?.message || 'Error al actualizar.');
      }
    });
  }

  toggleEstado(tipo: TipoActivo) {
    const newEstado = tipo.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    this.updating.set(true);
    this.updateTipoUC.execute(tipo.id, { estado: newEstado }).subscribe({
      next: () => {
        this.updating.set(false);
        this.load();
        this.showToast('success', `"${tipo.nombre}" marcado como ${newEstado}.`);
      },
      error: (err) => {
        this.updating.set(false);
        this.showToast('error', err.error?.message || 'Error al cambiar estado.');
      }
    });
  }

  onPageSizeChange() { this.currentPage.set(1); }
  prevPage() { if (this.currentPage() > 1) this.currentPage.update(p => p - 1); }
  nextPage() { if (this.currentPage() < this.totalPages()) this.currentPage.update(p => p + 1); }

  private showToast(type: 'success' | 'error', message: string) {
    this.toast.set({ type, message });
    setTimeout(() => this.toast.set(null), 3500);
  }
}
