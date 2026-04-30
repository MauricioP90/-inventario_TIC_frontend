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
import { Movement, MovementStatus, MOVEMENT_TYPE_LABELS } from '../../../domain/models/movement.model';
import { MovementItemComponent } from '../../components/movement-item/movement-item.component';
import { GetOneActivoUseCase } from '../../../application/use-cases/get-one-activo.use-case';
import { GetAllActivosUseCase } from '../../../../inventory/application/use-cases/get-all-activos.use-case';
import { Activo } from '../../../../inventory/domain/models/activo.model';

interface PickItem {
  id: string;
  placa: string;
  type: string;
  model: string;
  serial: string;
}

@Component({
  selector: 'app-movements-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MovementItemComponent],
  template: `
    <div class="p-4 md:p-6 space-y-8 max-w-5xl mx-auto">
      
      <!-- FORM: Registrar Movimiento -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="px-6 py-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <h2 class="text-xl font-bold text-slate-700 flex items-center gap-3">
            <div class="p-2 bg-white rounded-lg shadow-sm">
              <svg class="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            Registrar Movimiento
          </h2>
        </div>

        <div class="p-6 space-y-6">
          @if (showSuccess()) {
            <div class="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <span class="text-emerald-500">✅</span>
              <p class="text-sm font-bold text-amber-900">Movimiento registrado correctamente</p>
            </div>
          }

          <!-- Row 1: Responsable -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Usuario Responsable
            </label>
            <select [(ngModel)]="responsibleId"
                    class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm appearance-none">
              <option value="">Seleccione el responsable...</option>
              @for (resp of responsables(); track resp.id) {
                <option [value]="resp.id">{{ resp.nombre }} ({{ resp.role.nombre }})</option>
              }
            </select>
          </div>

          <!-- Row 2: Placa & Tipo Mov -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Placa de Inventario</label>          
              <div class="relative group">
                <input type="text" 
                       [ngModel]="searchQuery()" 
                       (input)="onSearchInput($any($event.target).value)" 
                       placeholder="Escriba Placa o Tipo..."
                       class="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm">
                
                <!-- Botón de Limpiar (X) -->
                @if (searchQuery() || selectedActivo()) {
                  <button (click)="clearSelection()" 
                          class="absolute right-3 top-3 text-slate-300 hover:text-slate-500 transition-colors">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                }

                <!-- Resultados de búsqueda predictiva -->
                @if (searchQuery() && !selectedActivo()) {
                  <div class="absolute z-20 w-full bg-white border border-slate-200 rounded-xl mt-1 shadow-2xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                    @for (activo of filteredActivos(); track activo.id) {
                      <div (click)="selectActivo(activo)" 
                           class="p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-none flex flex-col gap-0.5 transition-colors">
                        <p class="text-sm font-bold text-slate-800">{{ activo.placa }}</p>
                        <div class="flex items-center justify-between">
                          <p class="text-[10px] text-slate-500">{{ activo.marca }} - {{ activo.serial }}</p>
                          <span class="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold uppercase">{{ activo.location?.nombre || 'Sede N/A' }}</span>
                        </div>
                      </div>
                    } @empty {
                      <div class="p-4 text-center">
                        <p class="text-xs text-slate-400 italic">No se encontraron activos...</p>
                      </div>
                    }
                  </div>
                }

                @if (isLoadingPlaca() && !searchQuery()) {
                  <div class="absolute right-3 top-3.5"><div class="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
                }
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo de Movimiento *</label>
              <select [(ngModel)]="movementType"
                      class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none text-sm transition-all">
                <option value="">Seleccione...</option>
                @for (type of movementTypes; track type[0]) {
                  <option [value]="type[0]">{{ type[1] }}</option>
                }
              </select>
            </div>
          </div>

          <!-- Row 3: Tipo Dispositivo & Serial -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo de Dispositivo</label>
              <input type="text" [value]="selectedActivo()?.marca || 'Se cargará automáticamente...'" disabled
                     class="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm">
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Número de Serie *</label>
              <input type="text" [value]="selectedActivo()?.serial || ''" placeholder="Serial" disabled
                     class="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm">
            </div>
          </div>

          <!-- Row 4: Origen & Destino -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Ubicacion Origen*</label>
              <input type="text" [value]="selectedActivo()?.location?.nombre || 'Se cargará automáticamente...'" disabled
                     class="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm">
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Ubicacion Destino *</label>
              <select [(ngModel)]="destinationId"
                      class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none text-sm transition-all">
                <option value="">Escriba Código o Nombre...</option>
                @for (loc of locations(); track loc.id) {
                  <option [value]="loc.id">{{ loc.nombre }}</option>
                }
              </select>
            </div>
          </div>

          <!-- Row 5: Observaciones & Documento -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Observaciones</label>
              <textarea [(ngModel)]="notes"
                        placeholder="Detalles adicionales del movimiento..."
                        rows="4"
                        class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm resize-none"></textarea>
            </div>
            <div class="space-y-4">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" stroke-width="2"/></svg>
                  Documento soporte (PDF/Imagen)
                </label>
                <div class="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center group hover:border-indigo-500 transition-colors">
                   <input type="file" class="hidden" id="fileInput">
                   <label for="fileInput" class="cursor-pointer text-xs text-slate-400 group-hover:text-indigo-600 font-medium">
                     Seleccionar archivo <span class="text-slate-300">| Ningún archivo seleccionado</span>
                   </label>
                </div>
                <p class="text-[10px] text-slate-400 italic">📎 Opcional: Adjunte el respaldo del movimiento</p>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="pt-4 flex justify-start">
            <button (click)="saveMovement()"
                    [disabled]="loading() || !responsibleId || !searchQuery || !destinationId"
                    class="px-8 py-3.5 bg-[#4f39f6a9] hover:bg-[#594af3] text-white font-bold rounded-xl shadow-lg shadow-orange-100 transition-all flex items-center gap-3 disabled:opacity-50">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke-width="2"/></svg>
              Registrar y Enviar Correo
            </button>
          </div>
        </div>
      </div>

      <!-- LISTADO: Envíos Recientes (Cards) -->
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold text-slate-800">Envíos Recientes</h2>
          <span class="text-[10px] bg-slate-100 text-slate-500 px-3 py-1 rounded-full border border-slate-200 font-bold">
            {{ movements().length }} TRASLADOS TOTALES
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (mov of movements(); track mov.id) {
            <app-movement-item  
              [movement]="mov"
              (onDispatch)="openDispatchModal(mov)"
              (onReceive)="openReceiveModal(mov)"
              (onViewRoute)="openRouteModal(mov)">
            </app-movement-item>
          }
        </div>

        @if (movements().length === 0 && !loading()) {
          <div class="py-20 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
            <p class="text-slate-400 text-sm italic">No hay traslados registrados aún.</p>
          </div>
        }
      </div>  

      <!-- Modals -->
      @if (selectedMovementForAction) {
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div class="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 class="font-bold text-slate-800 text-lg flex items-center gap-3">
                @if (actionType === 'dispatch') { 🚛 Despachar Traslado }
                @if (actionType === 'receive') { ✅ Recibir Traslado }
                @if (actionType === 'route') { 📍 Ruta del Dispositivo }
              </h3>
              <button (click)="closeModal()" class="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div class="p-8 space-y-6">
              @if (actionType === 'route') {
                <div class="flex items-center justify-between mb-10 relative px-4">
                  <div class="absolute top-1/2 left-0 w-full h-1.5 bg-slate-100 -z-10 -translate-y-1/2 rounded-full"></div>
                  <div class="absolute top-1/2 left-0 h-1.5 bg-indigo-500 -z-10 -translate-y-1/2 transition-all rounded-full" [style.width]="getRouteProgress()"></div>
                  
                  <div class="flex flex-col items-center gap-2">
                    <div class="w-12 h-12 rounded-full flex items-center justify-center bg-white border-4 border-indigo-500 shadow-md">
                      🏢
                    </div>
                    <span class="text-[10px] font-bold text-slate-600">Origen</span>
                  </div>
                  <div class="flex flex-col items-center gap-2">
                    <div class="w-12 h-12 rounded-full flex items-center justify-center bg-white border-4 shadow-md transition-colors" [class.border-indigo-500]="isEnTransitOrReceived()" [class.border-slate-200]="!isEnTransitOrReceived()">
                      🚛
                    </div>
                    <span class="text-[10px] font-bold text-slate-600">En Tránsito</span>
                  </div>
                  <div class="flex flex-col items-center gap-2">
                    <div class="w-12 h-12 rounded-full flex items-center justify-center bg-white border-4 shadow-md transition-colors" [class.border-emerald-500]="isReceived()" [class.border-slate-200]="!isReceived()">
                      🎯
                    </div>
                    <span class="text-[10px] font-bold text-slate-600">Destino</span>
                  </div>
                </div>
                <div class="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 text-xs space-y-2">
                  <p class="flex justify-between">
                    <span class="text-slate-500">ID Traslado:</span> 
                    <span class="font-bold text-slate-800">{{ selectedMovementForAction.id.slice(-8) }}</span>
                  </p>
                  <p class="flex justify-between">
                    <span class="text-slate-500">Activos:</span> 
                    <span class="font-bold text-slate-800">{{ selectedMovementForAction.activoIds.length }}</span>
                  </p>
                  <p class="flex justify-between">
                    <span class="text-slate-500">Responsable:</span> 
                    <span class="font-bold text-slate-800">{{ selectedMovementForAction.responsible?.nombre || 'N/A' }}</span>
                  </p>
                </div>
              } @else {
                <div class="space-y-5">
                  @if (actionType === 'receive') {
                    <div class="space-y-1.5">
                      <label class="text-xs font-bold text-slate-500 uppercase">Responsable que recibe (ID):</label>
                      <input type="text" [(ngModel)]="modalReceiverId" placeholder="Ej: 77f1f7d5..."
                             class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm transition-all">
                    </div>
                  }
                  <div class="space-y-1.5">
                    <label class="text-xs font-bold text-slate-500 uppercase">URL Soporte / Guía:</label>
                    <input type="text" [(ngModel)]="modalEvidenceUrl" placeholder="https://..."
                           class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm transition-all">
                  </div>
                  
                  <button (click)="confirmAction()"
                          class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 transition-all mt-4 flex items-center justify-center gap-2">
                    {{ actionType === 'dispatch' ? 'Confirmar Despacho' : 'Confirmar Recepción' }}
                  </button>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: []
})
export class MovementsPageComponent implements OnInit {
  locations = signal<Location[]>([]);
  responsables = signal<Responsable[]>([]);
  movements = signal<Movement[]>([]);
  activos = signal<Activo[]>([]);
  loading = signal(false);
  showSuccess = signal(false);
  isLoadingPlaca = signal(false);

  movementTypes = Object.entries(MOVEMENT_TYPE_LABELS);
  movementType = '';
  originId = signal('');
  destinationId = '';
  responsibleId = '';
  searchQuery = signal('');
  notes = '';
  selectedActivo = signal<Activo | null>(null);

  filteredActivos = computed(() => {
    const term = this.searchQuery().toLowerCase().trim();
    const todos = this.activos();

    if (!term) return todos;
    return todos.filter(a =>
      a.placa.toLowerCase().includes(term) ||
      (a.serial && a.serial.toLowerCase().includes(term)) ||
      (a.marca && a.marca.toLowerCase().includes(term))
    );
  });

  // Modal State
  selectedMovementForAction: Movement | null = null;
  actionType: 'dispatch' | 'receive' | 'route' | null = null;
  modalEvidenceUrl = '';
  modalReceiverId = '';

  constructor(
    private getAllLocations: GetAllLocationsUseCase,
    private getAllResponsables: GetAllResponsablesUseCase,
    private getAllMovements: GetAllMovementsUseCase,
    private registerMovement: RegisterMovementUseCase,
    private dispatchMovement: DispatchMovementUseCase,
    private receiveMovement: ReceiveMovementUseCase,
    private getOneActivo: GetOneActivoUseCase,
    private getAllActivos: GetAllActivosUseCase
  ) { }

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.loading.set(true);
    this.getAllLocations.execute().subscribe(locs => this.locations.set(locs));
    this.getAllResponsables.execute().subscribe(resps => this.responsables.set(resps));
    this.getAllActivos.execute().subscribe(acts => this.activos.set(acts));
    this.loadMovements();
  }

  loadMovements() {
    this.getAllMovements.execute().subscribe(movs => {
      this.movements.set(movs);
      this.loading.set(false);
    });
  }

  onPlacaChange() {
    if (!this.searchQuery()) {
      this.selectedActivo.set(null);
      return;
    }
    this.isLoadingPlaca.set(true);
    this.getOneActivo.execute(this.searchQuery()).subscribe({
      next: (activo) => {
        this.selectActivo(activo);
        this.isLoadingPlaca.set(false);
      },
      error: () => {
        this.selectedActivo.set(null);
        this.isLoadingPlaca.set(false);
        alert('Placa no encontrada');
      }
    });
  }

  onSearchInput(value: string) {
    this.searchQuery.set(value);
    // Si el usuario borra todo, reseteamos la selección y los datos pegados
    if (!value.trim()) {
      this.clearSelection();
    }
  }

  clearSelection() {
    this.selectedActivo.set(null);
    this.searchQuery.set('');
    this.originId.set('');
  }

  selectActivo(activo: Activo) {
    this.selectedActivo.set(activo);
    this.searchQuery.set(activo.placa);
    this.originId.set(activo.locationId || (activo as any).location?.id || '');
  }

  saveMovement() {
    if (!this.movementType || !this.destinationId || !this.responsibleId || !this.selectedActivo()) {
      alert('Completa los campos obligatorios');
      return;
    }

    const dto = {
      type: this.movementType,
      originLocationId: this.originId(),
      destinationLocationId: this.destinationId,
      responsibleId: this.responsibleId,
      activoIds: [this.selectedActivo()!.id],
      notes: this.notes
    };

    this.registerMovement.execute(dto).subscribe(() => {
      this.showSuccess.set(true);
      this.searchQuery.set('');
      this.selectedActivo.set(null);
      this.notes = '';
      this.loadMovements();
      setTimeout(() => this.showSuccess.set(false), 5000);
    });
  }

  // Modal Logic
  openDispatchModal(movement: Movement) {
    this.selectedMovementForAction = movement;
    this.actionType = 'dispatch';
  }
  openReceiveModal(movement: Movement) {
    this.selectedMovementForAction = movement;
    this.actionType = 'receive';
  }
  openRouteModal(movement: Movement) {
    this.selectedMovementForAction = movement;
    this.actionType = 'route';
  }
  closeModal() {
    this.selectedMovementForAction = null;
    this.actionType = null;
  }
  confirmAction() {
    if (!this.selectedMovementForAction) return;
    const id = this.selectedMovementForAction.id;

    if (this.actionType === 'dispatch') {
      if (!this.modalEvidenceUrl) return alert('Ingresa soporte');
      this.dispatchMovement.execute(id, this.modalEvidenceUrl).subscribe({
        next: () => { this.loadMovements(); this.closeModal(); },
        error: (err) => alert(err.message)
      });
    } else if (this.actionType === 'receive') {
      if (!this.modalReceiverId || !this.modalEvidenceUrl) return alert('Completa datos');
      this.receiveMovement.execute(id, this.modalReceiverId, this.modalEvidenceUrl).subscribe({
        next: () => { this.loadMovements(); this.closeModal(); },
        error: (err) => alert(err.message)
      });
    }
  }

  getRouteProgress() {
    if (!this.selectedMovementForAction) return '0%';
    const status = this.selectedMovementForAction.status;
    return status === 'RECEIVED' ? '100%' : (status === 'EN_TRANSIT' ? '50%' : '0%');
  }
  isEnTransitOrReceived() {
    return this.selectedMovementForAction && ['EN_TRANSIT', 'RECEIVED'].includes(this.selectedMovementForAction.status);
  }
  isReceived() {
    return this.selectedMovementForAction?.status === 'RECEIVED';
  }
}