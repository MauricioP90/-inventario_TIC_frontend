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
import { RejectMovementUseCase } from '../../../application/use-cases/reject-movement.use-case';
import { Movement, MovementStatus, MOVEMENT_TYPE_LABELS } from '../../../domain/models/movement.model';
import { MovementItemComponent } from '../../components/movement-item/movement-item.component';
import { GetOneActivoUseCase } from '../../../../inventory/application/use-cases/get-one-activo.use-case';
import { GetAllActivosUseCase } from '../../../../inventory/application/use-cases/get-all-activos.use-case';
import { Activo } from '../../../../inventory/domain/models/activo.model';
import { GetAllSimCardsUseCase } from '../../../../sim-cards/application/use-cases/get-all-sim-cards.use-case';
import { SimCardRepository } from '../../../../sim-cards/domain/repositories/sim-card.repository';
import { SimCard } from '../../../../sim-cards/domain/models/sim-card.model';

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
            <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <span class="text-emerald-500">✅</span>
              <p class="text-sm font-bold text-emerald-900">Movimiento registrado correctamente</p>
            </div>
          }

          @if (showError()) {
            <div class="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <span class="text-red-500">❌</span>
              <div>
                <p class="text-sm font-bold text-red-900">Error al registrar el movimiento</p>
                <p class="text-xs text-red-700 mt-0.5">{{ showError() }}</p>
              </div>
            </div>
          }

          <!-- Row 1: Responsable -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Usuario Responsable *
            </label>
            <select [(ngModel)]="responsibleId"
                    class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm appearance-none">
              <option value="">Seleccione el responsable...</option>
              @for (resp of filteredResponsiblesForDestination(); track resp.id) {
                <option [value]="resp.id">{{ resp.nombre }} ({{ resp.role.nombre }})</option>
              }
            </select>
          </div>

          <!-- Pestañas de Selección de Modo (Segmented Tab Control) -->
          <div class="flex p-1 bg-slate-100 rounded-xl border border-slate-200/60 shadow-inner">
            <button 
              type="button"
              (click)="setOperationMode('ACTIVO')"
              [class]="operationMode() === 'ACTIVO' ? 'flex-1 flex items-center justify-center gap-2 py-3 bg-white text-indigo-700 font-bold rounded-lg shadow-sm border border-slate-200/50 transition-all text-xs uppercase tracking-wider' : 'flex-1 flex items-center justify-center gap-2 py-3 text-slate-500 hover:text-slate-700 font-medium transition-all text-xs uppercase tracking-wider'">
              <span>💻</span> Operaciones de Activos
            </button>
            <button 
              type="button"
              (click)="setOperationMode('SIM')"
              [class]="operationMode() === 'SIM' ? 'flex-1 flex items-center justify-center gap-2 py-3 bg-white text-indigo-700 font-bold rounded-lg shadow-sm border border-slate-200/50 transition-all text-xs uppercase tracking-wider' : 'flex-1 flex items-center justify-center gap-2 py-3 text-slate-500 hover:text-slate-700 font-medium transition-all text-xs uppercase tracking-wider'">
              <span>📱</span> Traslado SIM en Bodega
            </button>
          </div>

          @if (operationMode() === 'ACTIVO') {
            <!-- MODO ACTIVO: Flujo Lineal de Activos -->
            
            <!-- Buscador de Activo -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Placa de Inventario *</label>          
              <div class="relative group">
                <input type="text" 
                       [ngModel]="searchQuery()" 
                       (input)="onSearchInput($any($event.target).value)" 
                       placeholder="Escriba Placa, Serie o Marca para buscar..."
                       class="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm">
                
                @if (searchQuery() || selectedActivo()) {
                  <button (click)="clearSelection()" 
                          class="absolute right-3 top-3 text-slate-300 hover:text-slate-500 transition-colors">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                }

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

            <!-- Vista Previa de Activo Premium -->
            @if (selectedActivo()) {
              <div class="p-4 bg-indigo-50/40 border border-indigo-100/50 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-1">
                <div class="flex items-center gap-3">
                  <span class="text-3xl">💻</span>
                  <div>
                    <h4 class="font-bold text-slate-800 text-sm leading-none flex items-center gap-2">
                      {{ selectedActivo()?.placa }}
                      <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                        {{ selectedActivo()?.marca }}
                      </span>
                    </h4>
                    <p class="text-xs text-slate-500 mt-1.5">
                      <span>Modelo: {{ selectedActivo()?.modelo || 'N/A' }}</span>
                      <span class="mx-2 text-slate-300">|</span>
                      <span class="font-mono">S/N: {{ selectedActivo()?.serial || 'N/A' }}</span>
                    </p>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200/50 bg-indigo-50/50 text-indigo-600">
                    {{ selectedActivo()?.location?.nombre || 'Sede N/A' }}
                  </span>
                  @if (selectedActivo()?.simCards?.length) {
                    <p class="text-[10px] text-purple-600 font-bold mt-1.5 flex items-center justify-end gap-1">
                      <span>📱 SIMs:</span>
                      <span class="font-mono">{{ getSimCardsNumbers(selectedActivo()?.simCards || []) }}</span>
                    </p>
                  }
                </div>
              </div>
            }

            <!-- Grid: Tipo Movimiento y Origen -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo de Movimiento *</label>
                <select [(ngModel)]="movementType"
                        class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none text-sm transition-all">
                  <option value="">Seleccione...</option>
                  @for (type of filteredMovementTypes(); track type[0]) {
                    <option [value]="type[0]">{{ type[1] }}</option>
                  }
                </select>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Ubicación Origen</label>
                <input type="text" [value]="selectedActivo()?.location?.nombre || 'Se cargará automáticamente...'" disabled
                       class="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm">
              </div>
            </div>

            <!-- Ubicación Destino (Si no es movimiento interno de SIM) -->
            @if (movementType && !['SIM_ASIGNACION', 'SIM_CAMBIO', 'SIM_RETIRO', 'SIM_RETIRO_TOTAL'].includes(movementType)) {
              <div class="space-y-1.5 relative">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Ubicación Destino *</label>
                <div class="relative group">
                  <input type="text" 
                         [ngModel]="destinationSearchQuery()" 
                         (focus)="showDestinationDropdown.set(true)"
                         (input)="destinationSearchQuery.set($any($event.target).value); showDestinationDropdown.set(true)"
                         placeholder="Escriba Código o Nombre de la Sede..."
                         class="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm">
                  
                  @if (destinationSearchQuery() || selectedDestination()) {
                    <button (click)="clearDestinationSelection()" 
                            class="absolute right-3 top-3 text-slate-300 hover:text-slate-500 transition-colors">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  }

                  @if (showDestinationDropdown() && filteredDestinations().length > 0) {
                    <div class="absolute z-20 w-full bg-white border border-slate-200 rounded-xl mt-1 shadow-2xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                      @for (loc of filteredDestinations(); track loc.id) {
                        <div (click)="selectDestination(loc)" 
                             class="p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-none flex flex-col gap-0.5 transition-colors">
                          <p class="text-sm font-bold text-slate-800">{{ loc.nombre }}</p>
                          <p class="text-[10px] text-slate-500">Código: {{ loc.code }}</p>
                        </div>
                      }
                    </div>
                  }
                </div>

                @if (selectedDestination() && (!selectedDestination()!.responsibleIds || selectedDestination()!.responsibleIds.length === 0)) {
                  <div class="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 animate-in fade-in duration-200">
                    <span class="text-amber-500 text-sm">⚠️</span>
                    <p class="text-[11px] font-bold text-amber-800 leading-normal">
                      Advertencia: Esta sede no tiene responsables asignados. El traslado se registrará, pero te recomendamos asignarle uno en la sección de "Ubicaciones" para que alguien reciba el acta de entrega.
                    </p>
                  </div>
                }
              </div>
            }

          } @else {
            <!-- MODO SIM: Flujo Lineal Traslado SIM en Bodega -->
            
            <!-- Buscador de SIM (Siempre habilitado) -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Buscar SIM Card en Bodega *</label>
              <div class="relative group">
                <input type="text" 
                       [ngModel]="simTransferSearchQuery()" 
                       (focus)="showSimTransferDropdown.set(true)"
                       (input)="simTransferSearchQuery.set($any($event.target).value); showSimTransferDropdown.set(true)"
                       placeholder="Escriba ICCID, Número o Proveedor..."
                       class="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm">
                
                @if (simTransferSearchQuery() || selectedSimForTransfer()) {
                  <button (click)="clearSimTransferSelection()" 
                          class="absolute right-3 top-3 text-slate-300 hover:text-slate-500 transition-colors">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                }
                
                @if (showSimTransferDropdown() && filteredSimsForTransfer().length > 0) {
                  <div class="absolute z-20 w-full bg-white border border-slate-200 rounded-xl mt-1 shadow-2xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                    @for (sim of filteredSimsForTransfer(); track sim.id) {
                      <div (click)="selectSimForTransfer(sim)" 
                           class="p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-none flex flex-col gap-0.5 transition-colors">
                        <p class="text-sm font-bold text-slate-800">{{ sim.numero }}</p>
                        <div class="flex items-center justify-between">
                          <p class="text-[10px] text-slate-500">ICCID: {{ sim.iccid }} - Operador: {{ sim.operador }}</p>
                          <span class="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">{{ sim.location?.nombre || 'Sin Ubicación' }}</span>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>

            <!-- Vista Previa Premium de SIM Física -->
            @if (selectedSimForTransfer()) {
              <div [class]="'p-4 rounded-2xl border flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-1 ' + getSimCardBrandClasses(selectedSimForTransfer()?.operador)">
                <div class="flex items-center gap-3">
                  <span class="text-3xl">📱</span>
                  <div>
                    <h4 class="font-bold text-sm leading-none flex items-center gap-2">
                      {{ selectedSimForTransfer()?.numero }}
                      <span class="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full bg-white/60 border border-white/80">
                        {{ selectedSimForTransfer()?.operador }}
                      </span>
                    </h4>
                    <p class="text-[11px] font-mono opacity-80 mt-1.5">ICCID: {{ selectedSimForTransfer()?.iccid }}</p>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded bg-indigo-600 text-white shadow-sm">
                    BODEGA
                  </span>
                  <p class="text-[11px] opacity-75 mt-1.5 font-medium">Ubicación: {{ selectedSimForTransfer()?.location?.nombre || 'Sin Ubicación' }}</p>
                </div>
              </div>
            }

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Sede Origen de la SIM (Autocomplete) -->
              <div class="space-y-1.5 relative">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Ubicación Origen SIM *</label>
                <div class="relative group">
                  <input type="text" 
                         [ngModel]="originSearchQuery()" 
                         (focus)="selectedSimForTransfer()?.locationId ? null : showOriginDropdown.set(true)"
                         (input)="originSearchQuery.set($any($event.target).value); showOriginDropdown.set(true)"
                         [disabled]="!!selectedSimForTransfer()?.locationId"
                         placeholder="Escriba Código o Nombre de la Sede Origen..."
                         class="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm disabled:bg-slate-100 disabled:text-slate-500">
                  
                  @if (originSearchQuery() && !selectedSimForTransfer()?.locationId) {
                    <button (click)="clearOriginSelection()" 
                            class="absolute right-3 top-3 text-slate-300 hover:text-slate-500 transition-colors">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  }

                  @if (showOriginDropdown() && !selectedSimForTransfer()?.locationId && filteredOrigins().length > 0) {
                    <div class="absolute z-20 w-full bg-white border border-slate-200 rounded-xl mt-1 shadow-2xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                      @for (loc of filteredOrigins(); track loc.id) {
                        <div (click)="selectOrigin(loc)" 
                             class="p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-none flex flex-col gap-0.5 transition-colors">
                          <p class="text-sm font-bold text-slate-800">{{ loc.nombre }}</p>
                          <p class="text-[10px] text-slate-500">Código: {{ loc.code }}</p>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>

              <!-- Sede Destino de la SIM -->
              <div class="space-y-1.5 relative">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Ubicación Destino *</label>
                <div class="relative group">
                  <input type="text" 
                         [ngModel]="destinationSearchQuery()" 
                         (focus)="showDestinationDropdown.set(true)"
                         (input)="destinationSearchQuery.set($any($event.target).value); showDestinationDropdown.set(true)"
                         placeholder="Escriba Código o Nombre de la Sede Destino..."
                         class="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm">
                  
                  @if (destinationSearchQuery() || selectedDestination()) {
                    <button (click)="clearDestinationSelection()" 
                            class="absolute right-3 top-3 text-slate-300 hover:text-slate-500 transition-colors">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  }

                  @if (showDestinationDropdown() && filteredDestinations().length > 0) {
                    <div class="absolute z-20 w-full bg-white border border-slate-200 rounded-xl mt-1 shadow-2xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                      @for (loc of filteredDestinations(); track loc.id) {
                        <div (click)="selectDestination(loc)" 
                             class="p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-none flex flex-col gap-0.5 transition-colors">
                          <p class="text-sm font-bold text-slate-800">{{ loc.nombre }}</p>
                          <p class="text-[10px] text-slate-500">Código: {{ loc.code }}</p>
                        </div>
                      }
                    </div>
                  }
                </div>

                @if (selectedDestination() && (!selectedDestination()!.responsibleIds || selectedDestination()!.responsibleIds.length === 0)) {
                  <div class="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 animate-in fade-in duration-200 font-bold">
                    <span class="text-amber-500 text-sm">⚠️</span>
                    <p class="text-[11px] text-amber-800 leading-normal font-bold">
                      Advertencia: Esta sede no tiene responsables asignados. El traslado se registrará, pero te recomendamos asignarle uno en la sección de "Ubicaciones" para que alguien reciba el acta de entrega.
                    </p>
                  </div>
                }
              </div>
            </div>
          }

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

          <!-- INFORMACIÓN SIMCARD (Sección Dinámica) -->
          @if (['SIM_ASIGNACION', 'SIM_CAMBIO', 'SIM_RETIRO', 'SIM_RETIRO_TOTAL'].includes(movementType)) {
            <div class="border-2 border-dashed border-purple-300 bg-purple-50/10 rounded-2xl p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
              <h3 class="text-sm font-bold text-purple-700 flex items-center gap-2">
                <span>📱</span> Información SIMCARD
              </h3>

              <!-- ALERTA DE BLOQUEO (Para Asignación si ya hay 2 SIMs) -->
              @if (movementType === 'SIM_ASIGNACION' && selectedActivo()?.simCards?.length === 2) {
                <div class="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4 text-xs font-bold flex items-center gap-2">
                  <span>🚫</span> BLOQUEADO: Este equipo ya tiene 2 SIMs asignadas ({{ selectedActivo()?.simCards?.[0]?.numero }}, {{ selectedActivo()?.simCards?.[1]?.numero }}). No puedes asignar más.
                </div>
              }

              <!-- FORM: Asignación de SIMCARD -->
              @if (movementType === 'SIM_ASIGNACION' && (selectedActivo()?.simCards?.length || 0) < 2) {
                <div class="space-y-2">
                  <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Seleccionar SIM en Bodega para Asignar *</label>
                  <div class="relative">
                    <input type="text"
                           [(ngModel)]="simSearchQuery"
                           placeholder="Escriba número o ICCID..."
                           (focus)="showSimDropdown = true"
                           (input)="showSimDropdown = true"
                           class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all text-sm">
                    
                    @if (showSimDropdown && filteredBodegaSims().length > 0) {
                      <div class="absolute z-30 w-full bg-white border border-slate-200 rounded-xl mt-1 shadow-2xl max-h-40 overflow-y-auto">
                        @for (sim of filteredBodegaSims(); track sim.id) {
                          <div (click)="selectSimForAssign(sim)"
                               class="p-3 hover:bg-purple-50 cursor-pointer border-b border-slate-50 last:border-none flex flex-col gap-0.5 transition-colors">
                            <p class="text-sm font-bold text-slate-800">{{ sim.numero }}</p>
                            <div class="flex items-center justify-between">
                              <p class="text-[10px] text-slate-500">ICCID: {{ sim.iccid }}</p>
                              <span class="text-[9px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded font-bold uppercase">{{ sim.operador }}</span>
                            </div>
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- FORM: Cambio de SIMCARD -->
              @if (movementType === 'SIM_CAMBIO') {
                <div class="space-y-4">
                  <!-- Reemplazo -->
                  <div class="space-y-2">
                    <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">¿Cuál SIM del equipo deseas reemplazar? *</label>
                    <div class="flex flex-col gap-2">
                      @for (sim of selectedActivo()?.simCards; track sim.id; let i = $index) {
                        <label class="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                          <input type="radio" name="simToReplace" [value]="sim" [(ngModel)]="selectedSimToReplace" class="text-purple-600 focus:ring-purple-500">
                          <span class="text-sm text-slate-700 font-medium">📱 SIM {{ i + 1 }}: {{ sim.numero }} ({{ sim.operador }})</span>
                        </label>
                      } @empty {
                        <p class="text-xs text-slate-400 italic">Este equipo no tiene SIMs asignadas para reemplazar.</p>
                      }
                    </div>
                  </div>

                  <!-- Nueva SIM -->
                  <div class="space-y-2">
                    <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Seleccionar SIM en Bodega para Asignar *</label>
                    <div class="relative">
                      <input type="text"
                             [(ngModel)]="simSearchQuery"
                             placeholder="Escriba número o ICCID..."
                             (focus)="showSimDropdown = true"
                             (input)="showSimDropdown = true"
                             class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all text-sm">
                      
                      @if (showSimDropdown && filteredBodegaSims().length > 0) {
                        <div class="absolute z-30 w-full bg-white border border-slate-200 rounded-xl mt-1 shadow-2xl max-h-40 overflow-y-auto">
                          @for (sim of filteredBodegaSims(); track sim.id) {
                            <div (click)="selectSimForAssign(sim)"
                                 class="p-3 hover:bg-purple-50 cursor-pointer border-b border-slate-50 last:border-none flex flex-col gap-0.5 transition-colors">
                              <p class="text-sm font-bold text-slate-800">{{ sim.numero }}</p>
                              <div class="flex items-center justify-between">
                                <p class="text-[10px] text-slate-500">ICCID: {{ sim.iccid }}</p>
                                <span class="text-[9px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded font-bold uppercase">{{ sim.operador }}</span>
                              </div>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Ubicación Bodega SIM que SALE -->
                  <div class="space-y-2">
                    <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Ubicación de BODEGA para la SIM que SALE *</label>
                    <select [(ngModel)]="removedSimLocationId"
                            class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none appearance-none text-sm transition-all">
                      <option value="">Escriba Código o Nombre...</option>
                      @for (loc of locations(); track loc.id) {
                        <option [value]="loc.id">{{ loc.nombre }}</option>
                      }
                    </select>
                  </div>
                </div>
              }

              <!-- FORM: Retiro de SIMCARD -->
              @if (movementType === 'SIM_RETIRO') {
                <div class="space-y-4">
                  <div class="space-y-2">
                    <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Seleccionar SIM a Retirar del Equipo *</label>
                    <select [(ngModel)]="selectedSimToRemove"
                            class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none appearance-none text-sm transition-all">
                      <option [ngValue]="null">Seleccione...</option>
                      @for (sim of selectedActivo()?.simCards; track sim.id) {
                        <option [ngValue]="sim">{{ sim.numero }} ({{ sim.operador }})</option>
                      }
                    </select>
                  </div>

                  <div class="space-y-2">
                    <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Nuevo Estado de la SIM *</label>
                    <select [(ngModel)]="removedSimNewState"
                            class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none appearance-none text-sm transition-all">
                      <option value="BODEGA">Bodega</option>
                      <option value="BAJA">Baja</option>
                    </select>
                  </div>

                  <div class="space-y-2">
                    <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Ubicación donde quedará la SIM *</label>
                    <select [(ngModel)]="removedSimLocationId"
                            class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none appearance-none text-sm transition-all">
                      <option value="">Escriba Código o Nombre...</option>
                      @for (loc of locations(); track loc.id) {
                        <option [value]="loc.id">{{ loc.nombre }}</option>
                      }
                    </select>
                  </div>
                </div>
              }

              <!-- FORM: Retiro de TODAS las SIMs -->
              @if (movementType === 'SIM_RETIRO_TOTAL') {
                <div class="space-y-6">
                  @for (sim of selectedActivo()?.simCards; track sim.id; let i = $index) {
                    <div class="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
                      <p class="text-sm font-bold text-purple-700">📱 SIM {{ i + 1 }}: {{ sim.numero }} ({{ sim.operador }})</p>
                      
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-2">
                          <label class="text-[10px] font-bold text-slate-500 uppercase">Ubicación destino SIM {{ i + 1 }} *</label>
                          <select [(ngModel)]="simDestinations[i]"
                                  class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-purple-500">
                            <option value="">Seleccione ubicación...</option>
                            @for (loc of locations(); track loc.id) {
                              <option [value]="loc.id">{{ loc.nombre }}</option>
                            }
                          </select>
                        </div>
                        <div class="space-y-2">
                          <label class="text-[10px] font-bold text-slate-500 uppercase">Nuevo estado SIM {{ i + 1 }} *</label>
                          <select [(ngModel)]="simStates[i]"
                                  class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-purple-500">
                            <option value="BODEGA">Bodega</option>
                            <option value="BAJA">Baja</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  } @empty {
                    <p class="text-xs text-slate-400 italic">Este equipo no tiene SIMs asignadas para retirar.</p>
                  }
                </div>
              }
            </div>
          }
               @if (movementType && !['SIM_ASIGNACION', 'SIM_CAMBIO', 'SIM_RETIRO', 'SIM_RETIRO_TOTAL', 'SIM_TRASLADO'].includes(movementType)) {
            <div class="space-y-3.5 p-6 bg-slate-50/80 border border-slate-200 rounded-2xl animate-in fade-in duration-200">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  📧 Enviar Soporte por Correo a:
                </label>
                <button (click)="selectAllEmails()" class="text-xs text-indigo-600 hover:text-indigo-800 font-bold transition-colors">
                  Seleccionar Todos
                </button>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto pr-2">
                @for (resp of responsables(); track resp.id) {
                  @if (resp.email) {
                    <label class="flex items-center gap-3 p-3 bg-white border border-slate-100 hover:border-slate-200 rounded-xl cursor-pointer transition-all shadow-sm">
                      <input type="checkbox" 
                             [checked]="selectedEmails().includes(resp.email)"
                             (change)="toggleEmail(resp.email)"
                             class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300">
                      <div class="flex flex-col min-w-0">
                        <span class="text-xs font-bold text-slate-800 truncate">{{ resp.nombre }}</span>
                        <span class="text-[10px] text-slate-400 truncate">{{ resp.email }}</span>
                      </div>
                    </label>
                  }
                }
              </div>
            </div>
          }
          <!-- Footer -->
          <div class="pt-4 flex justify-start">
            <button (click)="saveMovement()"
                    [disabled]="loading() || !responsibleId || !originId() || (movementType !== 'SIM_TRASLADO' && !selectedActivo()) || (movementType === 'SIM_TRASLADO' && !selectedSimForTransfer()) || (!destinationId && !['SIM_ASIGNACION', 'SIM_CAMBIO', 'SIM_RETIRO', 'SIM_RETIRO_TOTAL'].includes(movementType))"
                    class="px-8 py-3.5 bg-[#4f39f6a9] hover:bg-[#594af3] text-white font-bold rounded-xl shadow-lg shadow-orange-100 transition-all flex items-center gap-3 disabled:opacity-50">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke-width="2"/></svg>
              Registrar y Enviar Correo
            </button>
          </div>
        </div>
      </div>

      <!-- LISTADO: Gestión de Envíos (Tabs + Búsqueda) -->
      <div class="space-y-6">
        
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 class="text-xl font-bold text-slate-800">Gestión de Envíos</h2>
          
          <!-- Buscador -->
          <div class="relative w-full md:w-72">
            <input type="text"
                   [ngModel]="searchMovementQuery()"
                   (input)="searchMovementQuery.set($any($event.target).value)"
                   placeholder="Buscar placa, sede, responsable..."
                   class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm">
            <svg class="w-5 h-5 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            @if (searchMovementQuery()) {
              <button (click)="searchMovementQuery.set('')" class="absolute right-3 top-2.5 text-slate-300 hover:text-slate-500 transition-colors">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            }
          </div>
        </div>

        <!-- Pestañas (Tabs) -->
        <div class="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
          <button (click)="activeTab.set('PENDING')"
                  [class.bg-white]="activeTab() === 'PENDING'"
                  [class.shadow-sm]="activeTab() === 'PENDING'"
                  [class.text-indigo-700]="activeTab() === 'PENDING'"
                  [class.text-slate-500]="activeTab() !== 'PENDING'"
                  [class.hover:text-slate-700]="activeTab() !== 'PENDING'"
                  class="px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-amber-400"></span>
            En Curso
          </button>
          <button (click)="activeTab.set('HISTORY')"
                  [class.bg-white]="activeTab() === 'HISTORY'"
                  [class.shadow-sm]="activeTab() === 'HISTORY'"
                  [class.text-indigo-700]="activeTab() === 'HISTORY'"
                  [class.text-slate-500]="activeTab() !== 'HISTORY'"
                  [class.hover:text-slate-700]="activeTab() !== 'HISTORY'"
                  class="px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            Histórico
          </button>
        </div>

        <!-- Resultados (Cards) -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (mov of filteredMovements(); track mov.id) {
            <app-movement-item  
              [movement]="mov"
              (onDispatch)="openDispatchModal(mov)"
              (onReceive)="openReceiveModal(mov)"
              (onViewRoute)="openRouteModal(mov)"
              (onCopyMagicLink)="copyMagicLink(mov)">
            </app-movement-item>
          }
        </div>

        <!-- Empty States -->
        @if (filteredMovements().length === 0 && !loading()) {
          <div class="py-20 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
            @if (searchMovementQuery()) {
              <p class="text-slate-500 font-medium text-sm">No se encontraron resultados para "{{ searchMovementQuery() }}" en esta pestaña.</p>
            } @else if (activeTab() === 'PENDING') {
              <p class="text-slate-500 font-medium text-sm">✨ ¡Todo al día! No hay traslados en curso.</p>
            } @else {
              <p class="text-slate-500 font-medium text-sm">No hay registro histórico de movimientos.</p>
            }
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
                <div class="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 text-xs space-y-3">
                  <p class="flex justify-between">
                    <span class="text-slate-500">ID Traslado:</span> 
                    <span class="font-bold text-slate-800">{{ selectedMovementForAction.id.slice(-8) }}</span>
                  </p>
                  <p class="flex justify-between">
                    <span class="text-slate-500">Origen:</span> 
                    <span class="font-bold text-slate-800">{{ selectedMovementForAction.originLocation?.nombre || 'N/A' }}</span>
                  </p>
                  <p class="flex justify-between">
                    <span class="text-slate-500">Destino:</span> 
                    <span class="font-bold text-slate-800">{{ selectedMovementForAction.destinationLocation?.nombre || 'N/A' }}</span>
                  </p>
                  <p class="flex justify-between">
                    <span class="text-slate-500">Responsable:</span> 
                    <span class="font-bold text-slate-800">{{ selectedMovementForAction.responsible?.nombre || 'N/A' }}</span>
                  </p>
                  <div class="border-t border-indigo-100/50 pt-2 space-y-1.5">
                    @if (selectedMovementForAction.type === 'SIM_TRASLADO') {
                      <p class="text-slate-500 font-bold uppercase tracking-wider text-[10px]">SIM Cards Trasladadas:</p>
                      @for (sim of selectedMovementForAction.simCards; track sim.id) {
                        <div class="bg-purple-50/50 p-2.5 rounded-lg border border-purple-100/30 flex flex-col gap-0.5">
                          <p class="font-bold text-slate-800 text-[11px] flex items-center justify-between">
                            <span>📱 Número: {{ sim.numero }}</span>
                            <span class="text-[10px] text-purple-600 font-medium uppercase font-bold">{{ sim.operador }}</span>
                          </p>
                          <p class="text-[10px] text-slate-500 font-mono">ICCID: {{ sim.iccid || 'N/A' }}</p>
                        </div>
                      }
                    } @else {
                      <p class="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Equipos Trasladados:</p>
                      @for (act of selectedMovementForAction.activos; track act.id) {
                        <div class="bg-white/80 p-2.5 rounded-lg border border-indigo-100/30 flex flex-col gap-0.5">
                          <p class="font-bold text-slate-800 text-[11px] flex items-center justify-between">
                            <span>💻 Placa: {{ act.placa }}</span>
                            <span class="text-[10px] text-slate-500 font-medium">{{ act.marca }} {{ act.modelo }}</span>
                          </p>
                          <p class="text-[10px] text-slate-500 font-mono">S/N: {{ act.serial || 'N/A' }}</p>
                          @if (act.simCards && act.simCards.length > 0) {
                            <p class="text-[10px] text-purple-600 font-bold flex items-center gap-1 mt-0.5">
                              <span>📱 SIM Cards:</span>
                              <span>{{ getSimCardsNumbers(act.simCards) }}</span>
                            </p>
                          }
                        </div>
                      }
                    }
                  </div>
                </div>
              } @else {
                <div class="space-y-5">
                  @if (actionType === 'receive') {
                    <div class="space-y-1.5">
                      <label class="text-xs font-bold text-slate-500 uppercase">Responsable que recibe (ID):</label>
                      <select [(ngModel)]="modalReceiverId"
                             class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm transition-all">
                      <option value="">Seleccione el responsable...</option>
                      @for (resp of responsables(); track resp.id) {
                        <option [value]="resp.id">{{ resp.nombre }} ({{ resp.role.nombre || 'N/A' }})</option>
                      }
                      </select>
                    </div>
                       <div class="space-y-1.5">
                      <label class="text-xs font-bold text-slate-500 uppercase">Sede de Recepción real:</label>
                      <select [(ngModel)]="modalDestinationId"
                              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm appearance-none transition-all">
                        <option value="">Seleccione la sede...</option>
                        @for (loc of locations(); track loc.id) {
                          <option [value]="loc.id">{{ loc.nombre }}</option>
                        }
                      </select>
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

                  <!-- BOTÓN Y FORMULARIO DE RECHAZO / NOVEDADES -->
                  @if (actionType === 'receive' && selectedMovementForAction.type !== 'RETORNO_POR_RECHAZO') {
                    <div class="border-t border-slate-100 pt-4 mt-2">
                      @if (!showRejectionForm()) {
                        <button (click)="showRejectionForm.set(true)"
                                class="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs">
                          ⚠️ Reportar Novedad / Rechazar Traslado
                        </button>
                      } @else {
                        <div class="space-y-3 bg-rose-50/50 border border-rose-100 rounded-2xl p-4 animate-in fade-in duration-200">
                          <p class="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                            <span>⚠️</span> Reportar Novedad y Devolver Equipos
                          </p>
                          <div class="space-y-1.5">
                            <label class="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Motivo de Rechazo / Novedad *</label>
                            <textarea [ngModel]="rejectionReason()"
                                      (input)="rejectionReason.set($any($event.target).value)"
                                      rows="3"
                                      placeholder="Describa la novedad detalladamente (ej: El dispositivo llegó con la pantalla rota, faltan componentes, etc.)..."
                                      class="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none text-xs transition-all placeholder:text-slate-400"></textarea>
                          </div>
                          <div class="flex gap-2 pt-1">
                            <button (click)="confirmReject()"
                                    [disabled]="!rejectionReason().trim()"
                                    class="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
                              ❌ Confirmar Rechazo
                            </button>
                            <button (click)="showRejectionForm.set(false)"
                                    class="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-all">
                              Cancelar
                            </button>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
    <!-- Magic Link Modal -->
    @if (magicLinkUrl()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
          <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
            <h3 class="text-lg font-black text-indigo-900 flex items-center gap-2">
              <span>✨</span> Enlace Mágico
            </h3>
            <button (click)="magicLinkUrl.set(null)" class="text-slate-400 hover:text-slate-600 transition-colors p-2 bg-white rounded-full shadow-sm hover:shadow">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div class="p-6 space-y-4">
            <p class="text-sm text-slate-600 font-medium">
              Envía este enlace por WhatsApp al responsable en destino. No necesitará usuario ni contraseña para recibir los equipos.
            </p>
            <div class="relative">
              <textarea readonly 
                     [value]="magicLinkUrl()"
                     class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none resize-none h-24 shadow-inner"
                     #linkInput></textarea>
            </div>
            <p class="text-xs text-indigo-600 font-bold bg-indigo-50 p-3 rounded-lg border border-indigo-100 flex items-start gap-2">
              <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Selecciona todo el texto de arriba y cópialo (Ctrl+C o pulsación larga en móviles).
            </p>
          </div>
          <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
            <button (click)="magicLinkUrl.set(null)" 
                    class="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    }

  `,
  styles: []
})
export class MovementsPageComponent implements OnInit {
  getSimCardsNumbers(simCards: any[]): string {
    if (!simCards || simCards.length === 0) return '';
    return simCards.map((s: any) => s.numero).join(' - ');
  }

  locations = signal<Location[]>([]);
  responsables = signal<Responsable[]>([]);
  movements = signal<Movement[]>([]);
  activos = signal<Activo[]>([]);
  loading = signal(false);
  showSuccess = signal(false);
  showError = signal<string | null>(null);
  isLoadingPlaca = signal(false);
  
  // Nuevas señales para Tabs y Búsqueda de Movimientos
  activeTab = signal<'PENDING' | 'HISTORY'>('PENDING');
  searchMovementQuery = signal('');

  // 👇 Guarda los correos de los destinatarios elegidos
  selectedEmails = signal<string[]>([]);

  // Agrega o quita un correo del listado
  toggleEmail(email: string) {
    const current = this.selectedEmails();
    if (current.includes(email)) {
      this.selectedEmails.set(current.filter(e => e !== email));
    } else {
      this.selectedEmails.set([...current, email]);
    }
  }
  // Permite seleccionar todos los correos activos a la vez
  selectAllEmails() {
    const emails = this.responsables()
      .map(r => r.email)
      .filter((email): email is string => !!email);
    this.selectedEmails.set(emails);
  }

  movementTypes = Object.entries(MOVEMENT_TYPE_LABELS);
  filteredMovementTypes = computed(() => {
    const activo = this.selectedActivo();
    const mode = this.operationMode();

    if (mode === 'SIM') {
      return this.movementTypes.filter(([key]) => key === 'SIM_TRASLADO');
    }

    // Excluimos movimientos internos o automáticos que no se registran manualmente de esta forma
    let types = this.movementTypes.filter(([key]) => 
      !['SIM_TRASLADO', 'REINGRESO_SOPORTE', 'RETORNO_POR_RECHAZO'].includes(key)
    );

    if (activo) {
      if (activo.estado === 'MANTENIMIENTO') {
        const loc = this.locations().find(l => l.id === activo.locationId);
        const originType = loc?.tipo;
        if (originType === 'PROVEEDOR') {
          // Si está en Proveedor y en mantenimiento, solo puede retornar de proveedor
          types = types.filter(([key]) => key === 'RETORNO_PROVEEDOR');
        } else if (originType === 'BODEGA') {
          // Si está en Bodega y en mantenimiento, puede enviarse al proveedor o trasladarse a otra Bodega
          types = types.filter(([key]) => ['ENVIO_GARANTIA', 'TRASLADO_REGIONAL'].includes(key));
        } else {
          types = [];
        }
      } else {
        // Si no está en mantenimiento:
        // - No se permite Retorno de Proveedor
        // - Envío a Proveedor solo se permite si el activo está físicamente en una Bodega
        const loc = this.locations().find(l => l.id === activo.locationId);
        const originType = loc?.tipo;
        if (originType === 'BODEGA') {
          types = types.filter(([key]) => key !== 'RETORNO_PROVEEDOR');
        } else {
          types = types.filter(([key]) => key !== 'RETORNO_PROVEEDOR' && key !== 'ENVIO_GARANTIA');
        }
      }
    } else {
      types = types.filter(([key]) => !['RETORNO_PROVEEDOR', 'ENVIO_GARANTIA'].includes(key));
    }

    return types;
  });
  operationMode = signal<'ACTIVO' | 'SIM'>('ACTIVO');

  setOperationMode(mode: 'ACTIVO' | 'SIM') {
    this.operationMode.set(mode);
    if (mode === 'SIM') {
      this.movementType = 'SIM_TRASLADO';
      this.clearSelection();
      this.clearOriginSelection();
    } else {
      this.movementType = '';
      this.clearSimTransferSelection();
      this.originId.set('');
      this.clearOriginSelection();
    }
  }

  getSimCardBrandClasses(carrier?: string): string {
    if (!carrier) return 'bg-white border-slate-200 text-slate-700';
    switch (carrier.toLowerCase()) {
      case 'claro':
        return 'bg-red-50/50 border-red-200 text-red-900 shadow-red-50/20';
      case 'movistar':
        return 'bg-emerald-50/50 border-emerald-200 text-emerald-900 shadow-emerald-50/20';
      case 'tigo':
        return 'bg-blue-50/50 border-blue-200 text-blue-900 shadow-blue-50/20';
      case 'wom':
        return 'bg-purple-50/50 border-purple-200 text-purple-900 shadow-purple-50/20';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-900';
    }
  }

  movementType = '';
  originId = signal('');
  destinationId = '';
  responsibleId = '';
  searchQuery = signal('');
  notes = '';
  selectedActivo = signal<Activo | null>(null);

  // 👇 Control del buscador predictivo para Ubicación Origen (modo SIM)
  originSearchQuery = signal('');
  showOriginDropdown = signal(false);
  selectedOrigin = signal<Location | null>(null);

  filteredOrigins = computed(() => {
    const term = this.originSearchQuery().toLowerCase().trim();
    const todos = this.locations().filter(loc => loc.estado === 'ACTIVO');
    if (!term) return todos;
    return todos.filter(loc =>
      loc.nombre.toLowerCase().includes(term) ||
      loc.code.toLowerCase().includes(term)
    );
  });

  selectOrigin(loc: Location) {
    this.selectedOrigin.set(loc);
    this.originId.set(loc.id);
    this.originSearchQuery.set(loc.nombre);
    this.showOriginDropdown.set(false);
    
    if (this.selectedDestination()?.id === loc.id) {
      this.clearDestinationSelection();
    }
  }

  clearOriginSelection() {
    this.selectedOrigin.set(null);
    this.originId.set('');
    this.originSearchQuery.set('');
    this.showOriginDropdown.set(false);
  }

  // 👇 Control del buscador predictivo para Ubicación Destino
  destinationSearchQuery = signal('');
  showDestinationDropdown = signal(false);
  selectedDestination = signal<Location | null>(null);
  showRejectionForm = signal(false);
  rejectionReason = signal('');

  // Filtra las sedes activas según el término ingresado y aplica reglas de negocio
  filteredDestinations = computed(() => {
    const term = this.destinationSearchQuery().toLowerCase().trim();
    const origin = this.originId();
    const isMaintenance = this.operationMode() === 'ACTIVO' && this.selectedActivo()?.estado === 'MANTENIMIENTO';

    // 1. Filtrar las sedes activas
    let todos = this.locations().filter(loc => loc.estado === 'ACTIVO');

    // 2. Regla: No poder enviar a la misma oficina (excluir origen)
    if (origin) {
      todos = todos.filter(loc => loc.id !== origin);
    }

    // 3. Regla: Restricciones específicas por tipo de movimiento
    if (this.movementType === 'ENVIO_GARANTIA') {
      todos = todos.filter(loc => loc.tipo === 'PROVEEDOR');
    } else if (this.movementType === 'RETORNO_PROVEEDOR') {
      todos = todos.filter(loc => loc.tipo === 'BODEGA');
    } else if (this.movementType === 'TRASLADO_REGIONAL' && isMaintenance) {
      todos = todos.filter(loc => loc.tipo === 'BODEGA');
    } else if (isMaintenance) {
      const originType = this.locations().find(loc => loc.id === origin)?.tipo;
      if (originType === 'PROVEEDOR') {
        todos = todos.filter(loc => loc.tipo === 'BODEGA');
      } else {
        todos = todos.filter(loc => loc.tipo === 'BODEGA' || loc.tipo === 'PROVEEDOR');
      }
    }

    if (!term) return todos;
    return todos.filter(loc =>
      loc.nombre.toLowerCase().includes(term) ||
      loc.code.toLowerCase().includes(term)
    );
  });

  // 👇 Filtra los responsables según la Sede Destino seleccionada
  filteredResponsiblesForDestination = computed(() => {
    const dest = this.selectedDestination();
    const all = this.responsables().filter(r => r.estado === 'ACTIVO');

    if (!dest) {
      return all;
    }

    // Filtra solo los responsables que tienen asignada la sede destino
    const assigned = all.filter(r => r.locationIds?.includes(dest.id));

    // Si la sede no tiene a nadie asignado, retorna todos para permitir seleccionar una contingencia
    return assigned.length > 0 ? assigned : all;
  });

  // Filtro principal para los Movimientos (Tabs + Búsqueda)
  filteredMovements = computed(() => {
    const tab = this.activeTab();
    const query = this.searchMovementQuery().toLowerCase().trim();
    const allMovs = this.movements();

    // Filtro por Tab
    let filtered = allMovs.filter(m => {
      if (tab === 'PENDING') {
        return m.status === 'PENDING' || m.status === 'EN_TRANSIT';
      } else {
        return m.status === 'RECEIVED' || m.status === 'CANCELLED';
      }
    });

    // Filtro por Búsqueda
    if (query) {
      filtered = filtered.filter(m => {
        const idMatch = m.id.toLowerCase().includes(query);
        const typeMatch = (MOVEMENT_TYPE_LABELS[m.type] || m.type).toLowerCase().includes(query);
        const originMatch = m.originLocation?.nombre?.toLowerCase().includes(query);
        const destMatch = m.destinationLocation?.nombre?.toLowerCase().includes(query);
        const respMatch = m.responsible?.nombre?.toLowerCase().includes(query);
        const receiverMatch = m.receiver?.nombre?.toLowerCase().includes(query) || m.physicalReceiverName?.toLowerCase().includes(query);
        const activeMatch = m.activos?.some((a: any) => 
          a.placa?.toLowerCase().includes(query) || 
          (a.serial && a.serial.toLowerCase().includes(query))
        );

        return idMatch || typeMatch || originMatch || destMatch || respMatch || receiverMatch || activeMatch;
      });
    }

    return filtered;
  });

  // 👇 Campos para Traslado de SIM Card (SIM_TRASLADO)
  selectedSimForTransfer = signal<SimCard | null>(null);
  simTransferSearchQuery = signal('');
  showSimTransferDropdown = signal(false);

  filteredSimsForTransfer = computed(() => {
    const term = this.simTransferSearchQuery().toLowerCase().trim();
    const activeMovementSimIds = new Set<string>();
    this.movements().forEach(m => {
      if (m.status === 'PENDING' || m.status === 'EN_TRANSIT') {
        m.simCardIds?.forEach(id => activeMovementSimIds.add(id));
      }
    });

    const available = this.simCards().filter(s =>
      s.estado === 'BODEGA' && !activeMovementSimIds.has(s.id)
    );
    if (!term) return available;
    return available.filter(s =>
      s.numero.toLowerCase().includes(term) ||
      (s.iccid && s.iccid.toLowerCase().includes(term)) ||
      (s.operador && s.operador.toLowerCase().includes(term))
    );
  });

  selectSimForTransfer(sim: SimCard) {
    this.selectedSimForTransfer.set(sim);
    this.simTransferSearchQuery.set(`${sim.numero} | ICCID: ${sim.iccid} | ${sim.operador}`);
    this.showSimTransferDropdown.set(false);
    
    if (sim.locationId) {
      this.originId.set(sim.locationId);
      this.originSearchQuery.set(sim.location?.nombre || 'Bodega');
      const foundLoc = this.locations().find(l => l.id === sim.locationId);
      if (foundLoc) {
        this.selectedOrigin.set(foundLoc);
      } else {
        this.selectedOrigin.set({ id: sim.locationId, nombre: sim.location?.nombre || 'Bodega', code: '', estado: 'ACTIVO' } as any);
      }
      
      if (this.selectedDestination()?.id === sim.locationId) {
        this.clearDestinationSelection();
      }
    } else {
      this.clearOriginSelection();
    }
  }

  clearSimTransferSelection() {
    this.selectedSimForTransfer.set(null);
    this.simTransferSearchQuery.set('');
    this.clearOriginSelection();
  }

  onOriginChange(value: string) {
    this.originId.set(value);
    this.clearSimTransferSelection();
  }

  // SIM Card form states
  simCards = signal<SimCard[]>([]);
  simSearchQuery = '';
  showSimDropdown = false;
  selectedSimForAssign: SimCard | null = null;

  // Reemplazo/Cambio
  selectedSimToReplace: SimCard | null = null;
  removedSimLocationId = '';

  // Retiro
  selectedSimToRemove: SimCard | null = null;
  removedSimNewState: 'BODEGA' | 'BAJA' = 'BODEGA';

  // Retiro de TODAS
  simDestinations: string[] = ['', ''];
  simStates: ('BODEGA' | 'BAJA')[] = ['BODEGA', 'BODEGA'];

  filteredBodegaSims = computed(() => {
    const term = this.simSearchQuery.toLowerCase().trim();
    const activeOriginId = this.originId();
    const available = this.simCards().filter(s =>
      s.estado === 'BODEGA' && (!activeOriginId || s.locationId === activeOriginId)
    );
    if (!term) return available;
    return available.filter(s =>
      s.numero.toLowerCase().includes(term) ||
      (s.iccid && s.iccid.toLowerCase().includes(term)) ||
      (s.operador && s.operador.toLowerCase().includes(term))
    );
  });

  selectSimForAssign(sim: SimCard) {
    this.selectedSimForAssign = sim;
    this.simSearchQuery = `${sim.numero} | ICCID: ${sim.iccid} | ${sim.operador}`;
    this.showSimDropdown = false;
  }

  selectDestination(loc: Location) {
    this.selectedDestination.set(loc);
    this.destinationId = loc.id;
    this.destinationSearchQuery.set(loc.nombre);
    this.showDestinationDropdown.set(false);
  }
  clearDestinationSelection() {
    this.selectedDestination.set(null);
    this.destinationId = '';
    this.destinationSearchQuery.set('');
    this.showDestinationDropdown.set(false);
  }

  filteredActivos = computed(() => {
    const term = this.searchQuery().toLowerCase().trim();

    // Obtener los IDs de activos que están actualmente en un movimiento activo
    const activeMovementActivoIds = new Set<string>();
    this.movements().forEach(m => {
      if (m.status === 'PENDING' || m.status === 'EN_TRANSIT') {
        m.activoIds.forEach(id => activeMovementActivoIds.add(id));
      }
    });

    // Excluir BAJA, RECHAZADO y activos con movimientos activos pendientes/en tránsito
    const todos = this.activos().filter(a =>
      a.estado !== 'BAJA' &&
      a.estado !== 'RECHAZADO' &&
      !activeMovementActivoIds.has(a.id)
    );

    if (!term) return todos;
    return todos.filter(a =>
      a.placa.toLowerCase().includes(term) ||
      (a.serial && a.serial.toLowerCase().includes(term)) ||
      (a.marca && a.marca.toLowerCase().includes(term))
    );
  });

  // Modal State
  selectedMovementForAction: Movement | null = null;
  actionType: 'dispatch' | 'receive' | 'route' | null = null; // Modal Data
  modalReceiverId = '';
  modalEvidenceUrl = '';
  modalDestinationId = '';
  magicLinkUrl = signal<string | null>(null);

  constructor(
    private getAllLocations: GetAllLocationsUseCase,
    private getAllResponsables: GetAllResponsablesUseCase,
    private getAllMovements: GetAllMovementsUseCase,
    private registerMovement: RegisterMovementUseCase,
    private dispatchMovement: DispatchMovementUseCase,
    private receiveMovement: ReceiveMovementUseCase,
    private rejectMovementUC: RejectMovementUseCase,
    private getOneActivo: GetOneActivoUseCase,
    private getAllActivos: GetAllActivosUseCase,
    private getAllSimCards: GetAllSimCardsUseCase,
    private simCardRepo: SimCardRepository
  ) { }

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.loading.set(true);
    this.getAllLocations.execute().subscribe(locs => this.locations.set(locs));
    this.getAllResponsables.execute().subscribe(resps => this.responsables.set(resps));
    this.getAllActivos.execute().subscribe(acts => this.activos.set(acts));
    this.getAllSimCards.execute().subscribe(sims => this.simCards.set(sims));
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
    const newOriginId = activo.locationId || (activo as any).location?.id || '';
    this.originId.set(newOriginId);

    // Si el tipo de movimiento seleccionado actualmente no está permitido para el nuevo activo, se limpia
    const allowedKeys = this.filteredMovementTypes().map(([key]) => key);
    if (this.movementType && !allowedKeys.includes(this.movementType)) {
      this.movementType = '';
    }

    const dest = this.selectedDestination();
    if (dest) {
      const isMaintenance = activo.estado === 'MANTENIMIENTO';
      const isSameAsOrigin = dest.id === newOriginId;
      const originType = this.locations().find(loc => loc.id === newOriginId)?.tipo;
      let isInvalidForMaintenance = false;
      if (this.movementType === 'ENVIO_GARANTIA') {
        isInvalidForMaintenance = dest.tipo !== 'PROVEEDOR';
      } else if (this.movementType === 'RETORNO_PROVEEDOR') {
        isInvalidForMaintenance = dest.tipo !== 'BODEGA';
      } else if (this.movementType === 'TRASLADO_REGIONAL' && isMaintenance) {
        isInvalidForMaintenance = dest.tipo !== 'BODEGA';
      } else if (isMaintenance) {
        isInvalidForMaintenance = (dest.tipo !== 'BODEGA' && dest.tipo !== 'PROVEEDOR') ||
                                  (dest.tipo === 'PROVEEDOR' && originType === 'PROVEEDOR');
      }
      
      if (isSameAsOrigin || isInvalidForMaintenance) {
        this.clearDestinationSelection();
      }
    }
  }

  saveMovement() {
    this.showError.set(null);
    // Para operaciones locales de SIM, el destino es la misma sede del activo (origen)
    const isLocalSIM = ['SIM_ASIGNACION', 'SIM_CAMBIO', 'SIM_RETIRO', 'SIM_RETIRO_TOTAL'].includes(this.movementType);
    if (isLocalSIM && this.selectedActivo()) {
      this.destinationId = this.originId();
    }

    const needsActivo = this.movementType !== 'SIM_TRASLADO';
    if (!this.movementType || !this.originId() || !this.destinationId || !this.responsibleId || (needsActivo && !this.selectedActivo()) || (!needsActivo && !this.selectedSimForTransfer())) {
      alert('Completa los campos obligatorios');
      return;
    }

    // Validaciones específicas de SIM
    if (this.movementType === 'SIM_ASIGNACION') {
      if ((this.selectedActivo()?.simCards?.length || 0) >= 2) {
        alert('Este equipo ya tiene 2 SIMs asignadas. No puedes asignar más.');
        return;
      }
      if (!this.selectedSimForAssign) {
        alert('Por favor selecciona la SIM Card a asignar.');
        return;
      }
    } else if (this.movementType === 'SIM_CAMBIO') {
      if (!this.selectedSimToReplace) {
        alert('Por favor selecciona la SIM que deseas reemplazar.');
        return;
      }
      if (!this.selectedSimForAssign) {
        alert('Por favor selecciona la nueva SIM a asignar.');
        return;
      }
      if (!this.removedSimLocationId) {
        alert('Por favor selecciona la ubicación de bodega para la SIM que sale.');
        return;
      }
    } else if (this.movementType === 'SIM_RETIRO') {
      if (!this.selectedSimToRemove) {
        alert('Por favor selecciona la SIM a retirar del equipo.');
        return;
      }
      if (!this.removedSimLocationId) {
        alert('Por favor selecciona la ubicación donde quedará la SIM.');
        return;
      }
    } else if (this.movementType === 'SIM_RETIRO_TOTAL') {
      const activeSims = this.selectedActivo()?.simCards || [];
      if (activeSims.length === 0) {
        alert('Este equipo no tiene SIMs asignadas para retirar.');
        return;
      }
      if (activeSims.length >= 1 && !this.simDestinations[0]) {
        alert('Por favor selecciona la ubicación destino de la SIM 1.');
        return;
      }
      if (activeSims.length >= 2 && !this.simDestinations[1]) {
        alert('Por favor selecciona la ubicación destino de la SIM 2.');
        return;
      }
    }

    const dto = {
      type: this.movementType,
      originLocationId: this.originId(),
      destinationLocationId: this.destinationId,
      responsibleId: this.responsibleId,
      activoIds: this.movementType === 'SIM_TRASLADO' ? [] : [this.selectedActivo()!.id],
      simCardIds: this.movementType === 'SIM_TRASLADO' ? [this.selectedSimForTransfer()!.id] : [],
      notes: this.notes,
      recipients: this.selectedEmails() // 👈 Enviamos los destinatarios elegidos
    };

    this.registerMovement.execute(dto).subscribe({
      next: () => {
        // Ejecutar las operaciones de SIM Card correspondientes
        if (this.movementType === 'SIM_ASIGNACION' && this.selectedSimForAssign) {
          this.simCardRepo.assign(this.selectedSimForAssign.id, this.selectedActivo()!.placa).subscribe(() => this.finishSave());
        } else if (this.movementType === 'SIM_CAMBIO' && this.selectedSimToReplace && this.selectedSimForAssign) {
          // Desvincular SIM vieja
          this.simCardRepo.update(this.selectedSimToReplace.id, { estado: 'BODEGA', activoId: '', locationId: this.removedSimLocationId }).subscribe(() => {
            // Vincular SIM nueva
            this.simCardRepo.assign(this.selectedSimForAssign!.id, this.selectedActivo()!.placa).subscribe(() => this.finishSave());
          });
        } else if (this.movementType === 'SIM_RETIRO' && this.selectedSimToRemove) {
          this.simCardRepo.update(this.selectedSimToRemove.id, { estado: this.removedSimNewState, activoId: '', locationId: this.removedSimLocationId }).subscribe(() => this.finishSave());
        } else if (this.movementType === 'SIM_RETIRO_TOTAL') {
          const sims = this.selectedActivo()?.simCards || [];
          if (sims.length === 0) {
            this.finishSave();
          } else {
            let processed = 0;
            sims.forEach((sim, idx) => {
              const newState = this.simStates[idx];
              const destLocId = this.simDestinations[idx];
              this.simCardRepo.update(sim.id, { estado: newState, activoId: '', locationId: destLocId }).subscribe(() => {
                processed++;
                if (processed === sims.length) {
                  this.finishSave();
                }
              });
            });
          }
        } else {
          this.finishSave();
        }
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al registrar el movimiento';
        this.showError.set(msg);
      }
    });
  }

  finishSave() {
    this.showSuccess.set(true);
    this.showError.set(null);
    this.searchQuery.set('');
    this.selectedActivo.set(null);
    this.notes = '';
    this.selectedSimForAssign = null; // Reset SIM selections
    this.simSearchQuery = '';
    this.selectedSimToReplace = null;
    this.removedSimLocationId = '';
    this.selectedSimToRemove = null;
    this.simDestinations = ['', ''];
    this.simStates = ['BODEGA', 'BODEGA'];
    this.selectedSimForTransfer.set(null);
    this.simTransferSearchQuery.set('');
    this.clearDestinationSelection(); // Limpieza de sede destino
    this.setOperationMode('ACTIVO'); // Vuelve a activos por defecto
    this.fetchData(); // Recarga todo (incluyendo SIM cards actualizadas y activos)
    setTimeout(() => this.showSuccess.set(false), 5000);
  }

  // Modal Logic
  openDispatchModal(movement: Movement) {
    this.selectedMovementForAction = movement;
    this.actionType = 'dispatch';
  }
  openReceiveModal(movement: Movement) {
    this.selectedMovementForAction = movement;
    this.actionType = 'receive';
    this.modalReceiverId = '';
    this.modalEvidenceUrl = '';
    this.modalDestinationId = movement.destinationLocationId || '';
  }
  openRouteModal(movement: Movement) {
    this.selectedMovementForAction = movement;
    this.actionType = 'route';
  }
  closeModal() {
    this.selectedMovementForAction = null;
    this.actionType = null;
    this.showRejectionForm.set(false);
    this.rejectionReason.set('');
    this.magicLinkUrl.set(null);
  }
  confirmAction() {
    if (!this.selectedMovementForAction) return;
    const id = this.selectedMovementForAction.id;

    if (this.actionType === 'dispatch') {
      if (!this.modalEvidenceUrl) return alert('Ingresa soporte');
      this.dispatchMovement.execute(id, this.modalEvidenceUrl).subscribe({
        next: () => { this.loadMovements(); this.closeModal(); },
        error: (err) => alert(err.error?.message || err.message || 'Error al procesar el despacho/recepción')
      });
    } else if (this.actionType === 'receive') {
      if (!this.modalReceiverId || !this.modalEvidenceUrl) return alert('Completa datos');
      this.receiveMovement.execute(id, this.modalReceiverId, this.modalEvidenceUrl, this.modalDestinationId).subscribe({
        next: () => { this.loadMovements(); this.closeModal(); },
        error: (err) => alert(err.error?.message || err.message || 'Error al procesar el despacho/recepción')
      });
    }
  }

  confirmReject() {
    if (!this.selectedMovementForAction) return;
    const reason = this.rejectionReason().trim();
    if (!reason) return alert('Por favor, ingresa el motivo del rechazo / novedad.');

    this.rejectMovementUC.execute(this.selectedMovementForAction.id, reason).subscribe({
      next: () => {
        this.fetchData(); // Recarga todo (incluyendo SIM cards actualizadas y activos)
        this.closeModal();
      },
      error: (err) => alert(err.error?.message || err.message || 'Error al rechazar el traslado')
    });
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

  getFilteredLocations(): Location[] {
    const allLocs = this.locations();
    if (!this.responsibleId) return allLocs;
    const selectedResp = this.responsables().find(r => r.id === this.responsibleId);
    if (!selectedResp || !selectedResp.locationIds || selectedResp.locationIds.length === 0) return allLocs;
    return allLocs.filter(loc => selectedResp.locationIds.includes(loc.id));
  }

  copyMagicLink(movement: any) {
    if (!movement.magicLinkToken) {
      alert('Este movimiento no tiene un enlace mágico.');
      return;
    }
    const link = `${window.location.origin}/public/receive/${movement.magicLinkToken}`;
    this.magicLinkUrl.set(link);
  }
}