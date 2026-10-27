import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Location } from '../../../../../locations/domain/models/location.model';
import { Responsable } from '../../../../../responsables/domain/models/responsable.model';
import { Activo } from '../../../../../inventory/domain/models/activo.model';
import { SimCard } from '../../../../../sim-cards/domain/models/sim-card.model';
import { Movement } from '../../../../domain/models/movement.model';
import { Area } from '../../../../../responsables/domain/models/area.model';

@Component({
  selector: 'app-movement-sim-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- MODO SIM: Operaciones de SIM -->
    <div class="space-y-6">
      <!-- 1. Selector de Operación SIM -->
      <div class="space-y-1.5">
        <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo de Operación de SIM *</label>
        <select [ngModel]="_movementType()"
                (ngModelChange)="onMovementTypeChange($event)"
                class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none text-sm transition-all font-medium text-slate-700">
          @for (type of filteredSimMovementTypes(); track type[0]) {
            <option [value]="type[0]">{{ type[1] }}</option>
          }
        </select>
      </div>

      @if (_movementType() === 'SIM_TRASLADO') {
        <!-- Flujo Traslado SIM en Bodega -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Buscar SIM Card Disponible *</label>
          <div class="relative group">
            <input type="text" 
                   [ngModel]="simTransferSearchQuery()" 
                   (focus)="showSimTransferDropdown.set(true)"
                   (input)="simTransferSearchQuery.set($any($event.target).value); showSimTransferDropdown.set(true)"
                   placeholder="Escriba ICCID, Número o Proveedor..."
                   class="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm">
            
            @if (simTransferSearchQuery() || _selectedSimForTransfer()) {
              <button (click)="clearSimTransferSelection()" 
                      class="absolute right-3 top-3 text-slate-300 hover:text-slate-500 transition-colors cursor-pointer">
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

        <!-- Vista Previa de SIM Física -->
        @if (_selectedSimForTransfer()) {
          <div [class]="'p-4 rounded-2xl border flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-1 ' + getSimCardBrandClasses(_selectedSimForTransfer()?.operador)">
            <div class="flex items-center gap-3">
              <span class="text-3xl">📱</span>
              <div>
                <h4 class="font-bold text-sm leading-none flex items-center gap-2">
                  {{ _selectedSimForTransfer()?.numero }}
                  <span class="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full bg-white/60 border border-white/80">
                    {{ _selectedSimForTransfer()?.operador }}
                  </span>
                </h4>
                <p class="text-[11px] font-mono opacity-80 mt-1.5">ICCID: {{ _selectedSimForTransfer()?.iccid }}</p>
              </div>
            </div>
            <div class="text-right">
              <span class="text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded bg-indigo-600 text-white shadow-sm">
                BODEGA
              </span>
              <p class="text-[11px] opacity-75 mt-1.5 font-medium">Ubicación: {{ _selectedSimForTransfer()?.location?.nombre || 'Sin Ubicación' }}</p>
            </div>
          </div>
        }

        <!-- Grid: Ubicación Origen e Ubicación Destino SIM -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Ubicación Origen SIM -->
          <div class="space-y-1.5 relative">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Ubicación Origen SIM *</label>
            <div class="relative group">
              <input type="text" 
                     [ngModel]="originSearchQuery()" 
                     (focus)="_selectedSimForTransfer()?.locationId ? null : showOriginDropdown.set(true)"
                     (input)="originSearchQuery.set($any($event.target).value); showOriginDropdown.set(true)"
                     [disabled]="!!_selectedSimForTransfer()?.locationId"
                     placeholder="Escriba Código o Nombre de la Sede Origen..."
                     class="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-700 disabled:bg-slate-100 disabled:text-slate-500">
              
              @if (originSearchQuery() && !_selectedSimForTransfer()?.locationId) {
                <button (click)="clearOriginSelection()" 
                        class="absolute right-3 top-3 text-slate-300 hover:text-slate-500 transition-colors">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              }

              @if (showOriginDropdown() && !_selectedSimForTransfer()?.locationId && filteredOrigins().length > 0) {
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

          <!-- Ubicación Destino SIM -->
          <div class="space-y-1.5 relative">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Ubicación Destino *</label>
            <div class="relative group">
              <input type="text" 
                     [ngModel]="destinationSearchQuery()" 
                     (focus)="showDestinationDropdown.set(true)"
                     (input)="destinationSearchQuery.set($any($event.target).value); showDestinationDropdown.set(true)"
                     placeholder="Escriba Código o Nombre de la Sede Destino..."
                     class="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-700">
              
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
                  Advertencia: Esta sede no tiene responsables asignados.
                </p>
              </div>
            }
          </div>
        </div>

        <!-- Área Destino SIM -->
        @if (selectedDestination()) {
          <div class="space-y-1.5 mt-4">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Área Destino *</label>
            @if (getAvailableDestinationAreas().length > 0) {
              <select [ngModel]="_destinationAreaId()"
                      (ngModelChange)="onDestinationAreaChange($event)"
                      class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none text-sm transition-all bg-white font-medium text-slate-700">
                <option value="">Todas las áreas / Seleccione...</option>
                @for (area of getAvailableDestinationAreas(); track area.id) {
                  <option [value]="area.id">{{ area.nombre }}</option>
                }
              </select>
            } @else {
              <select [disabled]="true"
                      class="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm font-medium">
                <option value="8b8b9c8c-1e2a-43cf-8a27-024848bb0000">NO APLICA</option>
              </select>
            }
          </div>
        }

        <!-- Responsables (Remitente y Receptor en SIM_TRASLADO) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Responsable Remitente
            </label>
            <input type="text" value="No aplica (SIM en Bodega)" disabled
                   class="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm font-medium">
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Responsable Receptor *
              @if (_responsibleId()) {
                <span class="text-emerald-500 text-[10px] font-bold normal-case">✓ Seleccionado</span>
              }
            </label>
            <select [ngModel]="_responsibleId()"
                    (ngModelChange)="onResponsibleChange($event)"
                    class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm appearance-none font-medium text-slate-700">
              <option value="">Seleccione el responsable receptor...</option>
              @for (resp of filteredResponsiblesForDestination(); track resp.id) {
                <option [value]="resp.id">{{ resp.nombre }}{{ resp.area?.nombre ? ' — ' + resp.area?.nombre : '' }}</option>
              }
            </select>
            @if (filteredResponsiblesForDestination().length === 0) {
              <p class="text-[10px] text-amber-600 font-medium">⚠️ No hay responsables activos en el destino seleccionado.</p>
            }
          </div>
        </div>
      } @else if (['SIM_ASIGNACION', 'SIM_CAMBIO', 'SIM_RETIRO', 'SIM_RETIRO_TOTAL'].includes(_movementType())) {
        <!-- Flujo Operaciones SIM en Celulares / Equipos -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Celular o Equipo Destino *
            </label>
            @if (_selectedActivo()) {
              <span class="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                Equipo seleccionado
              </span>
            }
          </div>
          <div class="relative group">
            <input type="text" 
                   [ngModel]="searchQuery()" 
                   (input)="onSearchInput($any($event.target).value)" 
                   placeholder="Buscar Celular por Placa, Serie, Marca o Modelo..."
                   class="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all text-sm">
            
            @if (searchQuery() || _selectedActivo()) {
              <button (click)="clearSelection(); searchQuery.set('')" 
                      class="absolute right-3 top-3 text-slate-300 hover:text-slate-500 transition-colors cursor-pointer">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            }

            @if (searchQuery()) {
              <div class="absolute z-20 w-full bg-white border border-slate-200 rounded-xl mt-1 shadow-2xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                @for (activo of filteredActivos(); track activo.id) {
                  <div (click)="selectActivo(activo)" 
                       class="p-3.5 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-none flex flex-col gap-0.5 transition-colors">
                    <div class="flex items-center justify-between">
                      <p class="text-sm font-bold text-slate-800">{{ activo.placa }}</p>
                      <span class="text-[9px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-bold uppercase">{{ activo.location?.nombre || 'Sede N/A' }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <p class="text-[10px] text-slate-500">{{ activo.marca }} {{ activo.modelo || '' }} - S/N: {{ activo.serial }}</p>
                      <span class="text-[11px] text-purple-700 font-bold hover:underline">Seleccionar</span>
                    </div>
                  </div>
                } @empty {
                  <div class="p-4 text-center">
                    <p class="text-xs text-slate-400 italic">No se encontraron equipos...</p>
                  </div>
                }
              </div>
            }

            @if (isLoadingPlaca() && !searchQuery()) {
              <div class="absolute right-3 top-3.5"><div class="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>
            }
          </div>
        </div>

        <!-- Vista Previa del Equipo Seleccionado -->
        @if (_selectedActivo()) {
          <div class="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center text-lg font-bold">
                  📱
                </div>
                <div>
                  <h4 class="font-bold text-slate-800 text-sm flex items-center gap-2">
                    {{ _selectedActivo()?.placa }}
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {{ _selectedActivo()?.marca }} {{ _selectedActivo()?.modelo || '' }}
                    </span>
                  </h4>
                  <p class="text-xs text-slate-400 font-mono">Serial: {{ _selectedActivo()?.serial || 'N/A' }}</p>
                </div>
              </div>
              <div class="text-right">
                <span class="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  📍 {{ _selectedActivo()?.location?.nombre || 'Sede N/A' }}
                </span>
                <p class="text-[11px] text-slate-500 mt-1">
                  Custodio: <strong class="text-slate-700">{{ _selectedActivo()?.responsible?.nombre || 'Sin Custodio' }}</strong>
                </p>
              </div>
            </div>

            @if (_selectedActivo()?.simCards && _selectedActivo()!.simCards!.length > 0) {
              <div class="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                <span class="text-[11px] font-bold text-slate-500">SIM Cards actuales ({{ _selectedActivo()!.simCards!.length }}/2):</span>
                @for (sim of _selectedActivo()!.simCards; track sim.id) {
                  <span class="text-[11px] font-mono px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100 font-medium">
                    📱 {{ sim.numero }} ({{ sim.operador }})
                  </span>
                }
              </div>
            } @else {
              <div class="pt-2 border-t border-slate-100 text-[11px] text-slate-400 italic">
                Sin SIM Cards asignadas actualmente (0/2 slots ocupados).
              </div>
            }
          </div>

          <!-- INFORMACIÓN SIMCARD -->
          <div class="border-2 border-dashed border-purple-300 bg-purple-50/10 rounded-2xl p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
            <h3 class="text-sm font-bold text-purple-700 flex items-center gap-2">
              <span>📱</span> Configuración de SIM Card
            </h3>

            <!-- ALERTA DE BLOQUEO -->
            @if (_movementType() === 'SIM_ASIGNACION' && _selectedActivo()?.simCards?.length === 2) {
              <div class="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4 text-xs font-bold flex items-center gap-2">
                <span>🚫</span> BLOQUEADO: Este equipo ya tiene 2 SIMs asignadas ({{ _selectedActivo()?.simCards?.[0]?.numero }}, {{ _selectedActivo()?.simCards?.[1]?.numero }}). No puedes asignar más.
              </div>
            }

            <!-- FORM: Asignación de SIMCARD -->
            @if (_movementType() === 'SIM_ASIGNACION' && (_selectedActivo()?.simCards?.length || 0) < 2) {
              <div class="space-y-2">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Seleccionar SIM Card Disponible *</label>
                @if (availableBodegaSimsInOrigin().length === 0) {
                  <div class="p-4 bg-amber-50 border border-amber-200/80 rounded-xl space-y-2.5 animate-in fade-in">
                    <div class="flex items-center gap-2 text-amber-900 font-bold text-xs">
                      <span>⚠️</span>
                      <span>No hay SIM Cards disponibles en BODEGA en {{ _selectedActivo()?.location?.nombre || 'esta sede' }}.</span>
                    </div>
                    @if (otherLocationsWithAvailableSims().length > 0) {
                      <p class="text-[11px] text-amber-800 leading-relaxed">
                        Hay SIM Cards disponibles en otras sedes: <span class="font-bold">{{ otherLocationsWithAvailableSimsText() }}</span>.
                      </p>
                      <button type="button"
                              (click)="requestSimTransferToCurrentLocation()"
                              class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer">
                        <span>🚚</span> Solicitar traslado de SIM a esta sede →
                      </button>
                    } @else {
                      <p class="text-[11px] text-amber-800">
                        Actualmente no hay ninguna SIM Card en estado BODEGA en ninguna sede del sistema.
                      </p>
                    }
                  </div>
                } @else {
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
                }
              </div>
            }

            <!-- FORM: Cambio de SIMCARD -->
            @if (_movementType() === 'SIM_CAMBIO') {
              <div class="space-y-4">
                <div class="space-y-2">
                  <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">¿Cuál SIM del equipo deseas reemplazar? *</label>
                  <div class="flex flex-col gap-2">
                    @for (sim of _selectedActivo()?.simCards; track sim.id; let i = $index) {
                      <label class="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                        <input type="radio" name="simToReplace" [value]="sim" [ngModel]="selectedSimToReplace" (ngModelChange)="onSimToReplaceChange($event)" class="text-purple-600 focus:ring-purple-500">
                        <span class="text-sm text-slate-700 font-medium">📱 SIM {{ i + 1 }}: {{ sim.numero }} ({{ sim.operador }})</span>
                      </label>
                    } @empty {
                      <p class="text-xs text-slate-400 italic">Este equipo no tiene SIMs asignadas para reemplazar.</p>
                    }
                  </div>
                </div>

                <div class="space-y-2">
                  <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Seleccionar SIM Card Disponible *</label>
                  @if (availableBodegaSimsInOrigin().length === 0) {
                    <div class="p-4 bg-amber-50 border border-amber-200/80 rounded-xl space-y-2.5 animate-in fade-in">
                      <div class="flex items-center gap-2 text-amber-900 font-bold text-xs">
                        <span>⚠️</span>
                        <span>No hay SIM Cards disponibles en BODEGA en {{ _selectedActivo()?.location?.nombre || 'esta sede' }}.</span>
                      </div>
                      @if (otherLocationsWithAvailableSims().length > 0) {
                        <p class="text-[11px] text-amber-800 leading-relaxed">
                          Hay SIM Cards disponibles en otras sedes: <span class="font-bold">{{ otherLocationsWithAvailableSimsText() }}</span>.
                        </p>
                        <button type="button"
                                (click)="requestSimTransferToCurrentLocation()"
                                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer">
                          <span>🚚</span> Solicitar traslado de SIM a esta sede →
                        </button>
                      } @else {
                        <p class="text-[11px] text-amber-800">
                          Actualmente no hay ninguna SIM Card en estado BODEGA en ninguna sede del sistema.
                        </p>
                      }
                    </div>
                  } @else {
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
                  }
                </div>

                <!-- Ubicación Bodega SIM que SALE -->
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Ubicación de BODEGA para la SIM que sale</label>
                  <div class="px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 flex items-center justify-between">
                    <span>📍 {{ _selectedActivo()?.location?.nombre || 'Sede actual del equipo' }}</span>
                    <span class="text-[10px] bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded-full font-semibold">Sede actual del activo</span>
                  </div>
                  <p class="text-[11px] text-slate-500">La SIM saliente queda registrada en BODEGA en esta misma sede física.</p>
                </div>
              </div>
            }

            <!-- FORM: Retiro de SIMCARD -->
            @if (_movementType() === 'SIM_RETIRO') {
              <div class="space-y-4">
                <div class="space-y-2">
                  <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Seleccionar SIM a Retirar del Equipo *</label>
                  <select [ngModel]="selectedSimToRemove"
                          (ngModelChange)="onSimToRemoveChange($event)"
                          class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none appearance-none text-sm transition-all">
                    <option [ngValue]="null">Seleccione...</option>
                    @for (sim of _selectedActivo()?.simCards; track sim.id) {
                      <option [ngValue]="sim">{{ sim.numero }} ({{ sim.operador }})</option>
                    }
                  </select>
                </div>

                <div class="space-y-2">
                  <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Nuevo Estado de la SIM *</label>
                  <select [ngModel]="removedSimNewState"
                          (ngModelChange)="onRemovedSimNewStateChange($event)"
                          class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none appearance-none text-sm transition-all">
                    <option value="BODEGA">Bodega</option>
                    <option value="BAJA">Baja</option>
                  </select>
                </div>

                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Ubicación donde quedará la SIM</label>
                  <div class="px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 flex items-center justify-between">
                    <span>📍 {{ _selectedActivo()?.location?.nombre || 'Sede actual del equipo' }}</span>
                    <span class="text-[10px] bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded-full font-semibold">Sede actual del activo</span>
                  </div>
                  <p class="text-[11px] text-slate-500">La SIM retirada permanecerá en la sede física actual del equipo.</p>
                </div>
              </div>
            }

            <!-- FORM: Retiro de TODAS las SIMs -->
            @if (_movementType() === 'SIM_RETIRO_TOTAL') {
              <div class="space-y-6">
                @for (sim of _selectedActivo()?.simCards; track sim.id; let i = $index) {
                  <div class="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
                    <p class="text-sm font-bold text-purple-700">📱 SIM {{ i + 1 }}: {{ sim.numero }} ({{ sim.operador }})</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div class="space-y-1.5">
                        <label class="text-[10px] font-bold text-slate-500 uppercase">Ubicación destino SIM {{ i + 1 }}</label>
                        <div class="px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center justify-between">
                          <span>📍 {{ _selectedActivo()?.location?.nombre || 'Sede actual' }}</span>
                          <span class="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-medium">Sede actual</span>
                        </div>
                      </div>
                      <div class="space-y-2">
                        <label class="text-[10px] font-bold text-slate-500 uppercase">Nuevo estado SIM {{ i + 1 }} *</label>
                        <select [ngModel]="simStates[i]"
                                (ngModelChange)="onSimStateItemChange(i, $event)"
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

          <!-- Custodio / Responsable del Equipo -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              Custodio / Responsable del Equipo *
              @if (_responsibleId()) {
                <span class="text-emerald-500 text-[10px] font-bold normal-case">✓ Asignado</span>
              }
            </label>
            <select [ngModel]="_responsibleId()"
                    (ngModelChange)="onResponsibleChange($event)"
                    class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm appearance-none font-medium text-slate-700">
              <option value="">Seleccione el responsable...</option>
              @for (resp of filteredResponsiblesForDestination(); track resp.id) {
                <option [value]="resp.id">{{ resp.nombre }}{{ resp.area?.nombre ? ' — ' + resp.area?.nombre : '' }}</option>
              }
            </select>
          </div>
        }
      }
    </div>
  `
})
export class MovementSimSectionComponent {
  @Input() set locations(val: Location[]) { this._locations.set(val || []); }
  @Input() set responsables(val: Responsable[]) { this._responsables.set(val || []); }
  @Input() set activos(val: Activo[]) { this._activos.set(val || []); }
  @Input() set simCards(val: SimCard[]) { this._simCards.set(val || []); }
  @Input() set movements(val: Movement[]) { this._movements.set(val || []); }

  @Input() set movementType(val: string) { this._movementType.set(val || 'SIM_TRASLADO'); }
  @Input() set originId(val: string) { this._originId.set(val || ''); }
  @Input() set destinationId(val: string) { 
    this._destinationId.set(val || '');
    if (val) {
      const loc = this._locations().find(l => l.id === val);
      if (loc) {
        this.selectedDestination.set(loc);
        this.destinationSearchQuery.set(loc.nombre);
      }
    } else {
      this.selectedDestination.set(null);
      this.destinationSearchQuery.set('');
    }
  }
  @Input() set destinationAreaId(val: string) { this._destinationAreaId.set(val || ''); }
  @Input() set responsibleId(val: string) { this._responsibleId.set(val || ''); }
  @Input() set selectedActivo(val: Activo | null) { 
    this._selectedActivo.set(val);
    if (val) {
      this.searchQuery.set(val.placa);
    }
  }
  @Input() set selectedSimForTransfer(val: SimCard | null) { 
    this._selectedSimForTransfer.set(val);
    if (val) {
      this.simTransferSearchQuery.set(`${val.numero} | ICCID: ${val.iccid} | ${val.operador}`);
    } else {
      this.simTransferSearchQuery.set('');
    }
  }

  @Input() selectedSimForAssign: SimCard | null = null;
  @Input() selectedSimToReplace: SimCard | null = null;
  @Input() selectedSimToRemove: SimCard | null = null;
  @Input() removedSimNewState: 'BODEGA' | 'BAJA' = 'BODEGA';
  @Input() simStates: ('BODEGA' | 'BAJA')[] = ['BODEGA', 'BODEGA'];

  @Output() movementTypeChange = new EventEmitter<string>();
  @Output() originIdChange = new EventEmitter<string>();
  @Output() destinationIdChange = new EventEmitter<string>();
  @Output() destinationAreaIdChange = new EventEmitter<string>();
  @Output() responsibleIdChange = new EventEmitter<string>();
  @Output() selectedActivoChange = new EventEmitter<Activo | null>();
  @Output() selectedSimForTransferChange = new EventEmitter<SimCard | null>();
  @Output() selectedSimForAssignChange = new EventEmitter<SimCard | null>();
  @Output() selectedSimToReplaceChange = new EventEmitter<SimCard | null>();
  @Output() selectedSimToRemoveChange = new EventEmitter<SimCard | null>();
  @Output() removedSimNewStateChange = new EventEmitter<'BODEGA' | 'BAJA'>();
  @Output() simStatesChange = new EventEmitter<('BODEGA' | 'BAJA')[]>();
  @Output() recipientAdded = new EventEmitter<string>();
  @Output() requestSimTransfer = new EventEmitter<Location>();

  _locations = signal<Location[]>([]);
  _responsables = signal<Responsable[]>([]);
  _activos = signal<Activo[]>([]);
  _simCards = signal<SimCard[]>([]);
  _movements = signal<Movement[]>([]);

  _movementType = signal('SIM_TRASLADO');
  _originId = signal('');
  _destinationId = signal('');
  _destinationAreaId = signal('');
  _responsibleId = signal('');
  _selectedActivo = signal<Activo | null>(null);
  _selectedSimForTransfer = signal<SimCard | null>(null);

  searchQuery = signal('');
  isLoadingPlaca = signal(false);

  simTransferSearchQuery = signal('');
  showSimTransferDropdown = signal(false);

  originSearchQuery = signal('');
  showOriginDropdown = signal(false);
  selectedOrigin = signal<Location | null>(null);

  destinationSearchQuery = signal('');
  showDestinationDropdown = signal(false);
  selectedDestination = signal<Location | null>(null);

  simSearchQuery = '';
  showSimDropdown = false;

  filteredSimMovementTypes = computed(() => {
    return [
      ['SIM_TRASLADO', '🚚 Traslado de SIM en Bodega (Entre Sedes)'],
      ['SIM_ASIGNACION', '📲 Asignación de SIM a Celular / Equipo'],
      ['SIM_CAMBIO', '🔄 Cambio / Reemplazo de SIM en Celular'],
      ['SIM_RETIRO', '📤 Retiro Individual de SIM a Bodega'],
      ['SIM_RETIRO_TOTAL', '📦 Retiro Total de SIMs a Bodega']
    ];
  });

  filteredSimsForTransfer = computed(() => {
    const term = this.simTransferSearchQuery().toLowerCase().trim();
    const activeMovementSimIds = new Set<string>();
    this._movements().forEach(m => {
      if (m.status === 'PENDING' || m.status === 'EN_TRANSIT') {
        m.simCardIds?.forEach((id: string) => activeMovementSimIds.add(id));
      }
    });

    const available = this._simCards().filter(s =>
      s.estado === 'BODEGA' && !activeMovementSimIds.has(s.id)
    );
    if (!term) return available;
    return available.filter(s =>
      s.numero.toLowerCase().includes(term) ||
      (s.iccid && s.iccid.toLowerCase().includes(term)) ||
      (s.operador && s.operador.toLowerCase().includes(term))
    );
  });

  availableBodegaSimsInOrigin = computed(() => {
    const activeOriginId = this._originId();
    return this._simCards().filter(s =>
      s.estado === 'BODEGA' && (!activeOriginId || s.locationId === activeOriginId)
    );
  });

  filteredBodegaSims = computed(() => {
    const term = this.simSearchQuery.toLowerCase().trim();
    const available = this.availableBodegaSimsInOrigin();
    if (!term) return available;
    return available.filter(s =>
      s.numero.toLowerCase().includes(term) ||
      (s.iccid && s.iccid.toLowerCase().includes(term)) ||
      (s.operador && s.operador.toLowerCase().includes(term))
    );
  });

  otherLocationsWithAvailableSims = computed(() => {
    const activeOriginId = this._originId();
    const available = this._simCards().filter(s => s.estado === 'BODEGA' && s.locationId !== activeOriginId);
    
    const countsByLoc: Record<string, number> = {};
    for (const sim of available) {
      if (sim.locationId) {
        countsByLoc[sim.locationId] = (countsByLoc[sim.locationId] || 0) + 1;
      }
    }

    const locMap = this._locations().reduce((acc, l) => ({ ...acc, [l.id]: l.nombre }), {} as Record<string, string>);
    
    return Object.entries(countsByLoc).map(([locId, count]) => ({
      locationId: locId,
      locationName: locMap[locId] || 'Sede sin nombre',
      count
    }));
  });

  otherLocationsWithAvailableSimsText = computed(() => {
    const list = this.otherLocationsWithAvailableSims();
    if (list.length === 0) return '';
    return list.map(item => `${item.locationName} (${item.count})`).join(' · ');
  });

  filteredOrigins = computed(() => {
    const term = this.originSearchQuery().toLowerCase().trim();
    const todos = this._locations().filter(loc => loc.estado === 'ACTIVO');
    if (!term) return todos;
    return todos.filter(loc =>
      loc.nombre.toLowerCase().includes(term) ||
      loc.code.toLowerCase().includes(term)
    );
  });

  filteredDestinations = computed(() => {
    const term = this.destinationSearchQuery().toLowerCase().trim();
    const todos = this._locations().filter(loc => loc.estado === 'ACTIVO');
    if (!term) return todos;
    return todos.filter(loc =>
      loc.nombre.toLowerCase().includes(term) ||
      loc.code.toLowerCase().includes(term)
    );
  });

  filteredResponsiblesForDestination = computed(() => {
    const dest = this.selectedDestination();
    const all = this._responsables().filter(r => r.estado === 'ACTIVO');
    if (!dest) return [];

    let assigned = all.filter(r => r.locationIds?.includes(dest.id));
    const areaId = this._destinationAreaId();
    if (areaId && areaId !== '8b8b9c8c-1e2a-43cf-8a27-024848bb0000') {
      assigned = assigned.filter(r => r.area?.id === areaId);
    }
    return assigned;
  });

  filteredActivos = computed(() => {
    const term = this.searchQuery().toLowerCase().trim();
    const activeMovementActivoIds = new Set<string>();
    this._movements().forEach(m => {
      if (m.status === 'PENDING' || m.status === 'EN_TRANSIT') {
        m.activoIds.forEach((id: string) => activeMovementActivoIds.add(id));
      }
    });

    const todos = this._activos().filter(a =>
      a.estado !== 'BAJA' &&
      a.estado !== 'RECHAZADO' &&
      a.estado !== 'EN_TRANSITO' &&
      !activeMovementActivoIds.has(a.id)
    );

    if (!term) return todos;
    return todos.filter(a =>
      a.placa.toLowerCase().includes(term) ||
      (a.serial && a.serial.toLowerCase().includes(term)) ||
      (a.marca && a.marca.toLowerCase().includes(term)) ||
      (a.modelo && a.modelo.toLowerCase().includes(term))
    );
  });

  onMovementTypeChange(newType: string) {
    this._movementType.set(newType);
    this.movementTypeChange.emit(newType);

    this._destinationAreaId.set('');
    this.destinationAreaIdChange.emit('');

    this.selectedSimForAssign = null;
    this.selectedSimForAssignChange.emit(null);
    this.selectedSimToReplace = null;
    this.selectedSimToReplaceChange.emit(null);
    this.selectedSimToRemove = null;
    this.selectedSimToRemoveChange.emit(null);
    this.simSearchQuery = '';

    const isLocalSIM = ['SIM_ASIGNACION', 'SIM_CAMBIO', 'SIM_RETIRO', 'SIM_RETIRO_TOTAL'].includes(newType);

    if (newType === 'SIM_TRASLADO') {
      this.clearSelection();
      this.clearOriginSelection();
      this.clearDestinationSelection();
    } else if (isLocalSIM) {
      this.clearSimTransferSelection();
      const activo = this._selectedActivo();
      if (activo) {
        const loc = activo.location || this._locations().find(l => l.id === (activo.locationId || (activo as any).location?.id));
        if (loc) {
          this.selectedDestination.set(loc);
          this._destinationId.set(loc.id);
          this.destinationIdChange.emit(loc.id);
          this.destinationSearchQuery.set(loc.nombre);
          this._originId.set(loc.id);
          this.originIdChange.emit(loc.id);
        }
        const currentRespId = activo.responsibleId || (activo as any).responsible?.id;
        if (currentRespId) {
          this._responsibleId.set(currentRespId);
          this.responsibleIdChange.emit(currentRespId);
        }
      }
    } else {
      this.clearDestinationSelection();
    }
  }

  selectSimForTransfer(sim: SimCard) {
    this._selectedSimForTransfer.set(sim);
    this.selectedSimForTransferChange.emit(sim);
    this.simTransferSearchQuery.set(`${sim.numero} | ICCID: ${sim.iccid} | ${sim.operador}`);
    this.showSimTransferDropdown.set(false);

    if (sim.locationId) {
      this._originId.set(sim.locationId);
      this.originIdChange.emit(sim.locationId);
      this.originSearchQuery.set(sim.location?.nombre || 'Bodega');
      const foundLoc = this._locations().find(l => l.id === sim.locationId);
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
    this._selectedSimForTransfer.set(null);
    this.selectedSimForTransferChange.emit(null);
    this.simTransferSearchQuery.set('');
    this.clearOriginSelection();
  }

  selectOrigin(loc: Location) {
    this.selectedOrigin.set(loc);
    this._originId.set(loc.id);
    this.originIdChange.emit(loc.id);
    this.originSearchQuery.set(loc.nombre);
    this.showOriginDropdown.set(false);

    if (this.selectedDestination()?.id === loc.id) {
      this.clearDestinationSelection();
    }
  }

  clearOriginSelection() {
    this.selectedOrigin.set(null);
    this._originId.set('');
    this.originIdChange.emit('');
    this.originSearchQuery.set('');
    this.showOriginDropdown.set(false);
  }

  selectDestination(loc: Location) {
    this.selectedDestination.set(loc);
    this._destinationId.set(loc.id);
    this.destinationIdChange.emit(loc.id);
    this.destinationSearchQuery.set(loc.nombre);
    this.showDestinationDropdown.set(false);

    this._destinationAreaId.set('');
    this.destinationAreaIdChange.emit('');
    this._responsibleId.set('');
    this.responsibleIdChange.emit('');
  }

  clearDestinationSelection() {
    this.selectedDestination.set(null);
    this._destinationId.set('');
    this.destinationIdChange.emit('');
    this.destinationSearchQuery.set('');
    this.showDestinationDropdown.set(false);

    this._destinationAreaId.set('');
    this.destinationAreaIdChange.emit('');
    this._responsibleId.set('');
    this.responsibleIdChange.emit('');
  }

  getAvailableDestinationAreas(): Area[] {
    const dest = this.selectedDestination();
    return dest?.areas || [];
  }

  onDestinationAreaChange(areaId: string) {
    this._destinationAreaId.set(areaId);
    this.destinationAreaIdChange.emit(areaId);
    this._responsibleId.set('');
    this.responsibleIdChange.emit('');
  }

  onResponsibleChange(newId: string) {
    this._responsibleId.set(newId);
    this.responsibleIdChange.emit(newId);
    if (newId) {
      const resp = this._responsables().find(r => r.id === newId);
      if (resp && resp.email) {
        this.recipientAdded.emit(resp.email);
      }
    }
  }

  onSearchInput(value: string) {
    this.searchQuery.set(value);
    if (!value.trim()) {
      this.clearSelection();
    }
  }

  selectActivo(activo: Activo) {
    if (activo.estado === 'EN_TRANSITO' || (activo.estado as any) === 'EN_TRANSIT') {
      alert(`El equipo con placa "${activo.placa}" se encuentra actualmente EN TRÁNSITO y no puede ser seleccionado para un nuevo movimiento.`);
      return;
    }

    this._selectedActivo.set(activo);
    this.selectedActivoChange.emit(activo);
    this.searchQuery.set(activo.placa);

    const newOriginId = activo.locationId || (activo as any).location?.id || '';
    this._originId.set(newOriginId);
    this.originIdChange.emit(newOriginId);

    const isLocalSIM = ['SIM_ASIGNACION', 'SIM_CAMBIO', 'SIM_RETIRO', 'SIM_RETIRO_TOTAL'].includes(this._movementType());
    if (isLocalSIM && (activo.location || (activo as any).location || this._locations().find(l => l.id === newOriginId))) {
      const loc = activo.location || (activo as any).location || this._locations().find(l => l.id === newOriginId);
      if (loc) {
        this.selectedDestination.set(loc);
        this._destinationId.set(loc.id);
        this.destinationIdChange.emit(loc.id);
        this.destinationSearchQuery.set(loc.nombre);
      }
      const currentRespId = activo.responsibleId || (activo as any).responsible?.id || '';
      if (currentRespId) {
        this._responsibleId.set(currentRespId);
        this.responsibleIdChange.emit(currentRespId);
      }
    }

    const currentRespEmail = activo.responsible?.email;
    if (currentRespEmail) {
      this.recipientAdded.emit(currentRespEmail);
    } else if (activo.responsibleId) {
      const resp = this._responsables().find(r => r.id === activo.responsibleId);
      if (resp && resp.email) {
        this.recipientAdded.emit(resp.email);
      }
    }
  }

  clearSelection() {
    this._selectedActivo.set(null);
    this.selectedActivoChange.emit(null);
    this.searchQuery.set('');
    this._originId.set('');
    this.originIdChange.emit('');
  }

  selectSimForAssign(sim: SimCard) {
    this.selectedSimForAssign = sim;
    this.selectedSimForAssignChange.emit(sim);
    this.simSearchQuery = `${sim.numero} | ICCID: ${sim.iccid} | ${sim.operador}`;
    this.showSimDropdown = false;
  }

  onSimToReplaceChange(sim: SimCard | null) {
    this.selectedSimToReplace = sim;
    this.selectedSimToReplaceChange.emit(sim);
  }

  onSimToRemoveChange(sim: SimCard | null) {
    this.selectedSimToRemove = sim;
    this.selectedSimToRemoveChange.emit(sim);
  }

  onRemovedSimNewStateChange(state: 'BODEGA' | 'BAJA') {
    this.removedSimNewState = state;
    this.removedSimNewStateChange.emit(state);
  }

  onSimStateItemChange(index: number, state: 'BODEGA' | 'BAJA') {
    const updated = [...this.simStates];
    updated[index] = state;
    this.simStates = updated;
    this.simStatesChange.emit(updated);
  }

  requestSimTransferToCurrentLocation() {
    const activo = this._selectedActivo();
    const currentLoc = activo?.location || this._locations().find(l => l.id === this._originId());
    
    this.onMovementTypeChange('SIM_TRASLADO');
    if (currentLoc) {
      this.selectDestination(currentLoc);
      this.requestSimTransfer.emit(currentLoc);
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

  reset() {
    this._selectedActivo.set(null);
    this._selectedSimForTransfer.set(null);
    this._originId.set('');
    this._destinationId.set('');
    this._destinationAreaId.set('');
    this._responsibleId.set('');
    this.searchQuery.set('');
    this.simTransferSearchQuery.set('');
    this.originSearchQuery.set('');
    this.destinationSearchQuery.set('');
    this.showSimTransferDropdown.set(false);
    this.showOriginDropdown.set(false);
    this.showDestinationDropdown.set(false);
    this.selectedOrigin.set(null);
    this.selectedDestination.set(null);
    this.simSearchQuery = '';
    this.showSimDropdown = false;
    this.selectedSimForAssign = null;
    this.selectedSimToReplace = null;
    this.selectedSimToRemove = null;
    this.removedSimNewState = 'BODEGA';
    this.simStates = ['BODEGA', 'BODEGA'];
  }
}
