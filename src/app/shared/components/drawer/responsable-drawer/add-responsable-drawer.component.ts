import { Component, EventEmitter, OnInit, Output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Responsable } from '../../../../features/responsables/domain/models/responsable.model';
import { Location } from '../../../../features/locations/domain/models/location.model';
import { CreateResponsableUseCase } from '../../../../features/responsables/application/use-cases/create-responsable.use-case';
import { UpdateResponsableUseCase } from '../../../../features/responsables/application/use-cases/update-responsable.use-case';
import { GetAllLocationsUseCase } from '../../../../features/locations/application/use-cases/get-all-locations.use-case';
import { InactiveResponsableUseCase } from '../../../../features/responsables/application/use-cases/inactive-responsable.use-case';
import { Role } from '../../../../features/responsables/domain/models/role.model';
import { GetAllRolesUseCase } from '../../../../features/responsables/application/use-cases/get-all-roles.use-case';
import { Area } from '../../../../features/responsables/domain/models/area.model';
import { GetAllAreasUseCase } from '../../../../features/responsables/application/use-cases/get-all-areas.use-case';



@Component({
  selector: 'app-add-responsable-drawer',
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
            <h2 class="text-xl font-bold text-slate-800">{{ selectedResponsable() ? 'Editar Responsable' : 'Nuevo Responsable' }}</h2>
            <p class="text-xs text-slate-500 mt-1">Registra personal o encargados de inventario</p>
          </div>
          <button (click)="close()" class="p-2 hover:bg-slate-200 rounded-lg text-slate-400 text-sm">
            X
          </button>
        </div>

        <!-- Form -->
        <div class="flex-1 overflow-y-auto p-6">
          <form [formGroup]="responsibleForm" (ngSubmit)="save()" class="space-y-5">
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nombre Completo</label>
              <input 
                type="text" 
                formControlName="nombre"
                placeholder="Ej: Juan Pérez"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Correo Electrónico</label>
              <input 
                type="email" 
                formControlName="email"
                placeholder="ejemplo@empresa.com"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm">
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Teléfono</label>
                <input 
                  type="text" 
                  formControlName="telefono"
                  placeholder="3001234567"
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Rol</label>
                <select 
                  formControlName="roleId"
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm bg-white">
                  @for (role of roles(); track role.id) {
                    <option [value]="role.id">{{ role.nombre }}</option>
                  }
                </select>
              </div>
            </div>

            <!-- Área / Departamento -->
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Área / Departamento</label>
              <select 
                formControlName="area"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm bg-white">
                <option [value]="null">-- Seleccionar Área --</option>
                @for (area of areas(); track area.id) {
                  <option [value]="area.id">{{ area.nombre }}</option>
                }
              </select>
            </div>

            <!-- Offices Multi-select -->
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sedes / Oficinas Asignadas</label>
              <!-- Input de Búsqueda -->
              <div class="relative mb-2">
                <span class="absolute inset-y-0 left-3 flex items-center text-slate-400">🔍</span>
                <input 
                  type="text" 
                  [value]="searchLocationTerm()"
                  (input)="searchLocationTerm.set($any($event.target).value)"
                  placeholder="Mínimo 3 letras... Ej: BOG o Medellin"
                  class="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-xs transition-all">
              </div>
              <div class="space-y-2 max-h-48 overflow-y-auto p-3 border border-slate-100 rounded-xl bg-slate-50/30">
                @for (loc of filteredLocations(); track loc.id) {
                  <label class="flex items-center gap-3 p-2 hover:bg-white rounded-lg transition-colors cursor-pointer group">
                    <input 
                      type="checkbox" 
                      [value]="loc.id"
                      [checked]="isLocationSelected(loc.id)"
                      (change)="toggleLocation(loc.id)"
                      class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300">
                    <div class="flex flex-col">
                      <span class="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">{{ loc.nombre }}</span>
                      <span class="text-[10px] text-slate-400">{{ loc.code }}</span>
                    </div>
                  </label>
                } @empty {
                  <p class="text-[11px] text-slate-400 text-center py-4">No hay oficinas registradas</p>
                }
              </div>
              
              <!-- Warning Message (Notification) -->
              @if (showWarning()) {
                <div class="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg flex gap-3 animate-pulse">
                  <div class="text-amber-500 font-bold">!</div>
                  <p class="text-[11px] text-amber-700 leading-relaxed font-medium">
                    Atención: Una o más de las sedes seleccionadas ya cuentan con responsables asignados.
                  </p>
                </div>
              }
            </div>
            <div class="pt-4 border-t border-slate-50 flex gap-3">

              <!-- Mostrar Botón Inactivar SI está ACTIVO -->
              @if (selectedResponsable() && selectedResponsable()?.estado === 'ACTIVO') {
                <button 
                  type="button" 
                  (click)="inactivate()"
                  [disabled]="saving()"
                  class="px-4 py-3 rounded-xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 disabled:opacity-50 transition-all border border-red-100"
                  title="Inactivar Responsable">
                  🗑️ Inactivar
                </button>
              }
              <!-- Mostrar Botón Activar SI está INACTIVO -->
              @if (selectedResponsable() && selectedResponsable()?.estado === 'INACTIVO') {
                <button 
                  type="button" 
                  (click)="activate()"
                  [disabled]="saving()"
                  class="px-4 py-3 rounded-xl bg-green-50 text-green-600 font-bold text-sm hover:bg-green-100 disabled:opacity-50 transition-all border border-green-100"
                  title="Activar Responsable">
                  ✅ Activar
                </button>
              }
              <button 
                type="button" 
                (click)="close()"
                class="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all">
                Cancelar
              </button>
              <button 
                type="submit" 
                [disabled]="responsibleForm.invalid || saving()"
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
export class AddResponsableDrawerComponent implements OnInit {
  isOpen = signal(false);
  saving = signal(false);
  locations = signal<Location[]>([]);
  roles = signal<Role[]>([]);
  areas = signal<Area[]>([]);
  selectedResponsable = signal<Responsable | null>(null);
  selectedLocationIds = signal<string[]>([]);
  showWarning = signal(false);
  searchLocationTerm = signal('');
  filteredLocations = computed(() => {
    const term = this.searchLocationTerm().toLowerCase().trim();
    const all = this.locations();
    const selectedIds = this.selectedLocationIds();

    if (term) {
      return all.filter(loc =>
        loc.nombre.toLowerCase().includes(term) ||
        loc.code.toLowerCase().includes(term)
      );
    }

    return all.filter(loc => selectedIds.includes(loc.id));;
  });




  @Output() onSave = new EventEmitter<string>();

  responsibleForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private createResponsable: CreateResponsableUseCase,
    private updateResponsable: UpdateResponsableUseCase,
    private getAllLocations: GetAllLocationsUseCase,
    private inactiveResponsable: InactiveResponsableUseCase,
    private getAllRoles: GetAllRolesUseCase,
    private getAllAreas: GetAllAreasUseCase
  ) {
    this.responsibleForm = this.fb.group({
      nombre: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required]],
      roleId: [null, [Validators.required]],
      area: [null],
      estado: ['ACTIVO']
    });
  }

  ngOnInit() {
    this.fetchLocations();
    this.getAllRoles.execute().subscribe(res => this.roles.set(res));
    this.getAllAreas.execute().subscribe(res => this.areas.set(res));
  }

  fetchLocations() {
    this.getAllLocations.execute().subscribe(data => this.locations.set(data));
  }

  isLocationSelected(id: string): boolean {
    return this.selectedLocationIds().includes(id);
  }

  toggleLocation(id: string) {
    const current = this.selectedLocationIds();
    if (current.includes(id)) {
      this.selectedLocationIds.set(current.filter(item => item !== id));
    } else {
      this.selectedLocationIds.set([...current, id]);
    }
    this.checkWarning();
  }

  checkWarning() {
    const ids = this.selectedLocationIds();
    const hasOccupied = this.locations().some(loc =>
      ids.includes(loc.id) && loc.responsibleIds && loc.responsibleIds.length > 0
    );
    this.showWarning.set(hasOccupied);
  }

  open(responsable?: Responsable) {
    this.selectedResponsable.set(responsable || null);
    this.showWarning.set(false);

    if (responsable) {
      this.responsibleForm.patchValue({ ...responsable, roleId: responsable.role?.id, area: responsable.area?.id });
      this.selectedLocationIds.set(responsable.locationIds || []);
    } else {
      this.responsibleForm.reset({ roleId: null, area: null, estado: 'ACTIVO' });
      this.selectedLocationIds.set([]);
      this.searchLocationTerm.set('');
    }
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    this.responsibleForm.reset({ roleId: null, area: null, estado: 'ACTIVO' });
    this.selectedLocationIds.set([]);
    this.searchLocationTerm.set('');
  }

  save() {
    if (this.responsibleForm.valid) {
      this.saving.set(true);
      const current = this.selectedResponsable();

      const payload: any = {
        ...this.responsibleForm.value,
        role: this.responsibleForm.value.roleId,
        locationIds: this.selectedLocationIds()
      };

      const request$ = current
        ? this.updateResponsable.execute(current.id, payload)
        : this.createResponsable.execute(payload);

      request$.subscribe({
        next: () => {
          this.saving.set(false);
          this.onSave.emit(payload.email);
          this.close();
        },
        error: (err) => {
          this.saving.set(false);
          console.error('Error al guardar responsable:', err);
        }
      });
    }
  }

  inactivate() {
    const current = this.selectedResponsable();
    // Validamos que exista un responsable seleccionado
    if (!current) return;
    // Pequeña confirmación nativa para evitar "dedos gordos"
    if (confirm(`¿Estás seguro de que deseas inactivar al responsable ${current.nombre}?`)) {
      this.saving.set(true);

      this.inactiveResponsable.execute(current.id).subscribe({
        next: () => {
          this.saving.set(false);
          this.onSave.emit(current.email); // Actualizamos la tabla de fondo
          this.close();       // Cerramos el drawer
        },
        error: (err) => {
          this.saving.set(false);
          // OJO: Aquí el backend nos dirá si no se puede inactivar (por ej. si tiene equipos)
          alert(err.error?.message || 'No se pudo inactivar el responsable. Revisa si tiene equipos a cargo.');
          console.error(err);
        }
      });
    }
  }

  activate() {
    const current = this.selectedResponsable();
    if (!current) return;
    if (confirm(`¿Deseas volver a activar al responsable ${current.nombre}?`)) {
      this.saving.set(true);

      // Armamos el payload tomando los datos del formulario, pero forzando el estado
      const payload: any = {
        ...this.responsibleForm.value,
        role: this.responsibleForm.value.roleId,
        locationIds: this.selectedLocationIds(),
        estado: 'ACTIVO' // <-- Forzamos la activación
      };
      this.updateResponsable.execute(current.id, payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.onSave.emit(current.email);
          this.close();
        },
        error: (err) => {
          this.saving.set(false);
          alert('Error al intentar activar al responsable');
          console.error(err);
        }
      });
    }
  }
}
