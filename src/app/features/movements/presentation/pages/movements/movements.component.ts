import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Location } from '../../../../locations/domain/models/location.model';
import { Responsable } from '../../../../responsables/domain/models/responsable.model';
import { GetAllLocationsUseCase } from '../../../../locations/application/use-cases/get-all-locations.use-case';
import { GetAllResponsablesUseCase } from '../../../../responsables/application/use-cases/get-all-responsables.use-case';
import { GetAllMovementsUseCase } from '../../../application/use-cases/get-all-movements.use-case';
import { RegisterMovementUseCase } from '../../../application/use-cases/register-movement.use-case';
import { DispatchMovementUseCase } from '../../../application/use-cases/dispatch-movement.use-case';
import { ReceiveMovementUseCase } from '../../../application/use-cases/receive-movement.use-case';
import { Movement, MovementStatus } from '../../../domain/models/movement.model';
import { MovementItemComponent } from '../../components/movement-item/movement-item.component';
import { LucideAngularModule } from 'lucide-angular';

interface PickItem {
  placa: string;
  type: string;
  model: string;
  serial: string;
}

@Component({
  selector: 'app-movements-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MovementItemComponent, LucideAngularModule],
  template: `
    <div class="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <!-- Header -->
      <div class="flex items-center gap-3">
        <div class="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
          <svg class="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-slate-800">Nuevo Movimiento</h1>
          <p class="text-sm text-slate-500">Registra transferencias y asignaciones de equipos</p>
        </div>
      </div>

      <!-- Movement Type -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-slate-700">Tipo de Movimiento</label>
          <select [(ngModel)]="movementType"
                  class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none transition-all">
            <option value="">Seleccionar tipo...</option>
            <option value="assignment">Asignación a Oficina</option>
            <option value="transfer">Transferencia Regional</option>
            <option value="disposal">Baja de Activo</option>
            <option value="repair">Envío a Reparación</option>
          </select>
        </div>
      </div>

      <!-- Locations selection -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
        <div class="bg-indigo-50/20 border border-slate-100 rounded-xl p-5">
          <div class="flex items-center gap-2 mb-3 text-indigo-600">
            <span class="text-xs font-bold uppercase tracking-wider">Origen</span>
          </div>
          <select [(ngModel)]="originId"
                  class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none transition-all text-sm">
            <option value="">Ubicación de origen...</option>
            @for (loc of locations(); track loc.id) {
              <option [value]="loc.id">{{ loc.nombre }} ({{ loc.code }})</option>
            }
          </select>
        </div>

        <div class="bg-emerald-50/20 border border-slate-100 rounded-xl p-5">
          <div class="flex items-center gap-2 mb-3 text-emerald-600">
            <span class="text-xs font-bold uppercase tracking-wider">Destino</span>
          </div>
          <select [(ngModel)]="destinationId"
                  (change)="onDestinationChange()"
                  class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none transition-all text-sm">
            <option value="">Ubicación de destino...</option>
            @for (loc of locations(); track loc.id) {
              <option [value]="loc.id">{{ loc.nombre }} ({{ loc.code }})</option>
            }
          </select>
        </div>
      </div>

      <!-- Responsible selection (Filtered by Destination) -->
      @if (destinationId) {
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3 animate-in fade-in slide-in-from-top-2">
          <div class="flex items-center justify-between">
            <label class="text-sm font-bold text-slate-700">Responsable en Destino</label>
            <span class="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded">Many-to-Many Ready</span>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select [(ngModel)]="responsibleId"
                    class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none transition-all text-sm">
              <optgroup label="Sugeridos (Asignados a esta sede)">
                @for (resp of suggestedResponsibles(); track resp.id) {
                  <option [value]="resp.id">{{ resp.nombre }} ({{ resp.role.nombre }})</option>
                }
              </optgroup>
              <optgroup label="Otros responsables">
                @for (resp of otherResponsibles(); track resp.id) {
                  <option [value]="resp.id">{{ resp.nombre }}</option>
                }
              </optgroup>
            </select>
            
            <div class="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
              <div class="text-amber-500 text-lg">💡</div>
              <p class="text-[11px] text-amber-700 font-medium">
                {{ suggestedResponsibles().length > 0 
                    ? 'Existen ' + suggestedResponsibles().length + ' responsables vinculados a esta sede.' 
                    : 'No hay responsables directos vinculados. Selecciona de la lista general.' }}
              </p>
            </div>
          </div>
        </div>
      }

      <!-- Picking List -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div class="flex items-center gap-2 mb-4">
          <svg class="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          <h2 class="text-base font-semibold text-slate-800">Lista de Equipos</h2>
        </div>

        <div class="relative mb-6">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input type="text" [(ngModel)]="searchQuery" 
                 (keydown.enter)="addItem()"
                 placeholder="Escanear código o buscar por placa / serial..."
                 class="w-full pl-10 pr-4 h-11 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all focus:bg-white">
        </div>

        <!-- Items list -->
        @if (pickList().length === 0) {
          <div class="py-10 text-center text-slate-400 border-2 border-dashed border-slate-50 rounded-xl">
             <p class="text-xs">Agregue activos para el movimiento</p>
          </div>
        } @else {
          <div class="space-y-2">
            @for (item of pickList(); track item.placa; let i = $index) {
              <div class="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-white transition-colors group">
                <div class="flex items-center gap-3">
                  <div class="h-8 w-8 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px]">
                    {{ item.placa.slice(-3) }}
                  </div>
                  <div>
                    <span class="font-bold text-xs text-slate-800">{{ item.placa }}</span>
                    <p class="text-[10px] text-slate-500">{{ item.model }}</p>
                  </div>
                </div>
                <button (click)="removeItem(item.placa)" class="p-1 hover:text-red-500"> X </button>
              </div>
            }
          </div>
        }
      </div>

      <!-- Save Button -->
      <button (click)="saveMovement()"
              class="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all">
        Guardar Movimiento
      </button>
      <div class="mt-12 space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold text-slate-800">Envíos Recientes</h2>
          <span class="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
            {{ movements().length }} traslados totales
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (mov of movements(); track mov.id) {
            <app-movement-item  
              [movement]="mov"
              (onDispatch)="onDispatch($event)"
              (onReceive)="onReceive($event)">
            </app-movement-item>
          }
        </div>

        @if (movements().length === 0 && !loading()) {
          <div class="py-20 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
            <p class="text-slate-400 text-sm italic">No hay traslados registrados aún.</p>
          </div>
        }
      </div>  
    </div>
    `,
  styles: []
})
export class MovementsPageComponent implements OnInit {
  locations = signal<Location[]>([]);
  responsables = signal<Responsable[]>([]);
  movements = signal<Movement[]>([]);
  loading = signal(false);

  movementType = '';
  originId = '';
  destinationId = '';
  responsibleId = '';
  searchQuery = '';
  pickList = signal<PickItem[]>([]);

  // Filtering Logic
  suggestedResponsibles = computed(() => {
    if (!this.destinationId) return [];
    return this.responsables().filter(r => r.locationIds?.includes(this.destinationId));
  });

  otherResponsibles = computed(() => {
    if (!this.destinationId) return this.responsables();
    return this.responsables().filter(r => !r.locationIds?.includes(this.destinationId));
  });

  constructor(
    private getAllLocations: GetAllLocationsUseCase,
    private getAllResponsables: GetAllResponsablesUseCase,
    private getAllMovements: GetAllMovementsUseCase,
    private registerMovement: RegisterMovementUseCase,
    private dispatchMovement: DispatchMovementUseCase,
    private receiveMovement: ReceiveMovementUseCase
  ) { }

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.loading.set(true);
    this.getAllLocations.execute().subscribe(locs => this.locations.set(locs));
    this.getAllResponsables.execute().subscribe(resps => this.responsables.set(resps));
    this.loadMovements();
  }

  loadMovements() {
    this.getAllMovements.execute().subscribe(movs => {
      this.movements.set(movs);
      this.loading.set(false);
    });
  }

  onDestinationChange() {
    this.responsibleId = ''; // Reset when destination changes
  }

  addItem() {
    // Picking logic (simplified for demonstration, typically would call a use case)
    if (!this.searchQuery) return;
    const item: PickItem = { placa: this.searchQuery, type: 'Device', model: 'Unknown', serial: 'N/A' };
    this.pickList.update(prev => [item, ...prev]);
    this.searchQuery = '';
  }

  removeItem(placa: string) {
    this.pickList.update(prev => prev.filter(i => i.placa !== placa));
  }

  saveMovement() {
    if (!this.movementType || !this.destinationId || !this.responsibleId || this.pickList().length === 0) {
      alert('Completa los campos obligatorios');
      return;
    }

    const dto = {
      type: this.movementType,
      originLocationId: this.originId,
      destinationLocationId: this.destinationId,
      responsibleId: this.responsibleId,
      activoIds: this.pickList().map(i => i.placa), // En producción usaríamos IDs, aquí simplificamos con placa si es lo que envía el scanner
      notes: ''
    };

    this.registerMovement.execute(dto).subscribe(() => {
      alert('Movimiento registrado con éxito');
      this.pickList.set([]);
      this.loadMovements();
    });
  }

  onDispatch(id: string) {
    this.dispatchMovement.execute(id).subscribe(() => {
      this.loadMovements();
    });
  }

  onReceive(id: string) {
    this.receiveMovement.execute(id).subscribe(() => {
      this.loadMovements();
    });
  }
}
