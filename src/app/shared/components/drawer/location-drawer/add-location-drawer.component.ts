import { Component, EventEmitter, OnInit, Output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateLocationUseCase } from '../../../../features/locations/application/use-cases/create-location.use-case';
import { GetAllResponsablesUseCase } from '../../../../features/responsables/application/use-cases/get-all-responsables.use-case';
import { Responsable } from '../../../../features/responsables/domain/models/responsable.model';
import { UpdateLocationUseCase } from '../../../../features/locations/application/use-cases/update-location.use-case';
import { Location } from '../../../../features/locations/domain/models/location.model';
import { Area } from '../../../../features/responsables/domain/models/area.model';
import { GetAllAreasUseCase } from '../../../../features/responsables/application/use-cases/get-all-areas.use-case';

@Component({
  selector: 'app-add-location-drawer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 z-50 overflow-hidden" [class.invisible]="!isOpen()">
      <!-- Backdrop -->
      <div 
        class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
        [class.opacity-0]="!isOpen()"
        [class.opacity-100]="isOpen()"
        (click)="close()">
      </div>

      <!-- Drawer Content -->
      <div 
        class="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col"
        [class.translate-x-full]="!isOpen()"
        [class.translate-x-0]="isOpen()">
        
        <!-- Header -->
        <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 class="text-xl font-bold text-slate-800">{{ selectedLocation() ? 'Editar Ubicación' : 'Nueva Ubicación' }}</h2>
            <p class="text-xs text-slate-500 mt-1">Registra un nuevo punto físico o bodega</p>
          </div>
          <button (click)="close()" class="p-2 hover:bg-slate-200 rounded-lg text-slate-400">
             X
          </button>
        </div>

        <!-- Form -->
        <div class="flex-1 overflow-y-auto p-6">
          <form [formGroup]="locationForm" (ngSubmit)="save()" class="space-y-5">
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Código</label>
              <input 
                type="text" 
                formControlName="code"
                placeholder="Ej: BOG-01"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nombre</label>
              <input 
                type="text" 
                formControlName="nombre"
                placeholder="Ej: Bodega Principal"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Coordenadas</label>
              <input 
                type="text" 
                formControlName="coordenadas"
                placeholder="Ej: 4.653827,-74.1164715"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tipo de Ubicación</label>
              <select 
                formControlName="tipo"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm bg-white">
                <option value="OFICINA">Oficina</option>
                <option value="BODEGA">Bodega</option>
                <option value="REGIONAL">Regional</option>
                <option value="PROVEEDOR">Proveedor</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Observaciones / Detalles Adicionales</label>
              <textarea 
                formControlName="observaciones"
                placeholder="Ej: Oficina 402, Piso 4, Horario: 8am - 5pm"
                rows="3"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm resize-none"></textarea>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Responsables Asignados</label>
              
              <!-- Input de Búsqueda -->
              <div class="relative mb-2">
                <span class="absolute inset-y-0 left-3 flex items-center text-slate-400">🔍</span>
                <input 
                  type="text" 
                  [value]="searchResponsableTerm()"
                  (input)="searchResponsableTerm.set($any($event.target).value)"
                  placeholder="Buscar por nombre o correo..."
                  class="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-xs transition-all">
              </div>

              <!-- Lista con Checkboxes -->
              <div class="space-y-2 max-h-48 overflow-y-auto p-3 border border-slate-100 rounded-xl bg-slate-50/30">
                @for (resp of filteredResponsables(); track resp.id) {
                  <label class="flex items-center gap-3 p-2 hover:bg-white rounded-lg transition-colors cursor-pointer group">
                    <input 
                      type="checkbox" 
                      [checked]="isResponsableSelected(resp.id)"
                      (change)="toggleResponsable(resp.id)"
                      class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300">
                    <div class="flex flex-col">
                      <span class="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">{{ resp.nombre }}</span>
                      <span class="text-[10px] text-slate-400">{{ resp.email }}</span>
                    </div>
                  </label>
                } @empty {
                  <p class="text-[11px] text-slate-400 text-center py-4">No se encontraron responsables</p>
                }
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Áreas Asignadas</label>
              
              <!-- Input de Búsqueda -->
              <div class="relative mb-2">
                <span class="absolute inset-y-0 left-3 flex items-center text-slate-400">🔍</span>
                <input 
                  type="text" 
                  [value]="searchAreaTerm()"
                  (input)="searchAreaTerm.set($any($event.target).value)"
                  placeholder="Buscar área por nombre o código..."
                  class="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-xs transition-all">
              </div>

              <!-- Lista con Checkboxes -->
              <div class="space-y-2 max-h-48 overflow-y-auto p-3 border border-slate-100 rounded-xl bg-slate-50/30">
                @for (area of filteredAreas(); track area.id) {
                  <label class="flex items-center gap-3 p-2 hover:bg-white rounded-lg transition-colors cursor-pointer group">
                    <input 
                      type="checkbox" 
                      [checked]="isAreaSelected(area.id)"
                      (change)="toggleArea(area.id)"
                      class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300">
                    <div class="flex flex-col">
                      <span class="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">{{ area.nombre }}</span>
                      <span class="text-[10px] text-slate-400">{{ area.code }}</span>
                    </div>
                  </label>
                } @empty {
                  <p class="text-[11px] text-slate-400 text-center py-4">No se encontraron áreas</p>
                }
              </div>
            </div>

            <div class="pt-4 border-t border-slate-50 flex gap-3">
              <button 
                type="button" 
                (click)="close()"
                class="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all">
                Cancelar
              </button>
              <button 
                type="submit" 
                [disabled]="locationForm.invalid || saving()"
                class="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100">
                {{ saving() ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class AddLocationDrawerComponent implements OnInit {
  isOpen = signal(false);
  saving = signal(false);
  responsables = signal<Responsable[]>([]);
  selectedLocation = signal<Location | null>(null);
  selectedResponsibleIds = signal<string[]>([]);
  searchResponsableTerm = signal('');
  areas = signal<Area[]>([]);
  selectedAreaIds = signal<string[]>([]);
  searchAreaTerm = signal('');

  filteredResponsables = computed(() => {
    const term = this.searchResponsableTerm().toLowerCase().trim();
    const all = this.responsables();
    const selectedIds = this.selectedResponsibleIds();
    if (term) {
      return all.filter(resp =>
        resp.nombre.toLowerCase().includes(term) ||
        resp.email.toLowerCase().includes(term)
      );
    }
    return all.filter(resp => selectedIds.includes(resp.id));
  });

  filteredAreas = computed(() => {
    const term = this.searchAreaTerm().toLowerCase().trim();
    const all = this.areas();
    const selectedIds = this.selectedAreaIds();
    if (term) {
      return all.filter(area =>
        area.nombre.toLowerCase().includes(term) ||
        area.code.toLowerCase().includes(term)
      );
    }
    return all.filter(area => selectedIds.includes(area.id));
  });

  @Output() onSave = new EventEmitter<void>();

  locationForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private createLocation: CreateLocationUseCase,
    private getAllResponsables: GetAllResponsablesUseCase,
    private updateLocation: UpdateLocationUseCase,
    private getAllAreas: GetAllAreasUseCase
  ) {
    this.locationForm = this.fb.group({
      code: ['', [Validators.required]],
      nombre: ['', [Validators.required]],
      coordenadas: [''],
      tipo: ['OFICINA', [Validators.required]],
      observaciones: [''],
      estado: ['ACTIVO']
    });
  }

  ngOnInit() {
    this.getAllResponsables.execute().subscribe((data) => this.responsables.set(data));
    this.getAllAreas.execute().subscribe((data) => this.areas.set(data));
  }

  isResponsableSelected(id: string): boolean {
    return this.selectedResponsibleIds().includes(id);
  }

  toggleResponsable(id: string) {
    const current = this.selectedResponsibleIds();
    if (current.includes(id)) {
      this.selectedResponsibleIds.set(current.filter(item => item !== id));
    } else {
      this.selectedResponsibleIds.set([...current, id]);
    }
  }

  isAreaSelected(id: string): boolean {
    return this.selectedAreaIds().includes(id);
  }

  toggleArea(id: string) {
    const current = this.selectedAreaIds();
    if (current.includes(id)) {
      this.selectedAreaIds.set(current.filter(item => item !== id));
    } else {
      this.selectedAreaIds.set([...current, id]);
    }
  }

  open(location?: Location) {
    this.selectedLocation.set(location || null);
    this.searchResponsableTerm.set('');
    this.searchAreaTerm.set('');

    if (location) {
      this.locationForm.patchValue(location);
      this.selectedResponsibleIds.set(location.responsibleIds || []);
      this.selectedAreaIds.set(location.areas?.map(a => a.id) || []);
    } else {
      this.locationForm.reset({ estado: 'ACTIVO', tipo: 'OFICINA', observaciones: '' });
      this.selectedResponsibleIds.set([]);
      this.selectedAreaIds.set([]);
    }
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    this.locationForm.reset({ estado: 'ACTIVO', tipo: 'OFICINA', observaciones: '' });
    this.selectedResponsibleIds.set([]);
    this.selectedAreaIds.set([]);
    this.searchResponsableTerm.set('');
    this.searchAreaTerm.set('');
  }

  save() {
    if (this.locationForm.valid) {
      this.saving.set(true);
      const currentLoc = this.selectedLocation();

      const payload = {
        ...this.locationForm.value,
        responsibleIds: this.selectedResponsibleIds(),
        areaIds: this.selectedAreaIds()
      };

      const request$ = currentLoc
        ? this.updateLocation.execute(currentLoc.code, payload)
        : this.createLocation.execute(payload);

      request$.subscribe({
        next: () => {
          this.saving.set(false);
          this.onSave.emit();
          this.close();
        },
        error: (err: any) => {
          this.saving.set(false);
          console.error('Error al guardar ubicación:', err);
        }
      });
    }
  }
}
