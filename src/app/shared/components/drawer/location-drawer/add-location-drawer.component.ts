import { Component, EventEmitter, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateLocationUseCase } from '../../../../features/locations/application/use-cases/create-location.use-case';
import { GetAllResponsablesUseCase } from '../../../../features/responsables/application/use-cases/get-all-responsables.use-case';
import { Responsable } from '../../../../features/responsables/domain/models/responsable.model';
import { UpdateLocationUseCase } from '../../../../features/locations/application/use-cases/update-location.use-case';
import { Location } from '../../../../features/locations/domain/models/location.model';

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
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l18 18"/></svg>
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
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Responsable</label>
              <select 
                formControlName="responsableId"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1em]">
                <option value="">Seleccione un responsable</option>
                @for (resp of responsables(); track resp.id) {
                  <option [value]="resp.id">{{ resp.name }}</option>
                }
              </select>
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

  @Output() onSave = new EventEmitter<void>();

  locationForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private createLocation: CreateLocationUseCase,
    private getAllResponsables: GetAllResponsablesUseCase,
    private updateLocation: UpdateLocationUseCase
  ) {
    this.locationForm = this.fb.group({
      code: ['', [Validators.required]],
      nombre: ['', [Validators.required]],
      coordenadas: [''],
      responsableId: ['', [Validators.required]],
      estado: ['ACTIVO']
    });
  }

  ngOnInit() {
    this.getAllResponsables.execute().subscribe((data: Responsable[]) => this.responsables.set(data));
  }
  open(location?: Location) {
    this.selectedLocation.set(location || null);

    if (location) {
      this.locationForm.patchValue(location);
    } else {
      this.locationForm.reset({ estado: 'ACTIVO' });
    }
    this.isOpen.set(true);
  }
  close() { this.isOpen.set(false); this.locationForm.reset({ estado: 'ACTIVO' }); }

  save() {
    if (this.locationForm.valid) {
      this.saving.set(true);

      // Si tenemos una ubicación seleccionada, es una actualización (PUT)
      const currentLoc = this.selectedLocation();

      const request$ = currentLoc
        ? this.updateLocation.execute(currentLoc.code, this.locationForm.value)
        : this.createLocation.execute(this.locationForm.value);
      request$.subscribe({
        next: () => {
          this.saving.set(false);
          this.onSave.emit();
          this.close();
        },
        error: (err: any) => {
          this.saving.set(false);
          console.error('Error al guardar ubicación:', err);
          // Tip: Aquí podrías añadir un mensaje de alerta para el usuario
        }
      });
    }
  }
}
