import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import Keycloak from 'keycloak-js';
import { environment } from '../../../../../../environments/environment';
import { Location } from '../../../../locations/domain/models/location.model';
import { Responsable } from '../../../../responsables/domain/models/responsable.model';
import { GetAllLocationsUseCase } from '../../../../locations/application/use-cases/get-all-locations.use-case';
import { GetAllResponsablesUseCase } from '../../../../responsables/application/use-cases/get-all-responsables.use-case';
import { GetAllMovementsUseCase } from '../../../application/use-cases/get-all-movements.use-case';
import { RegisterMovementUseCase } from '../../../application/use-cases/register-movement.use-case';
import { DispatchMovementUseCase } from '../../../application/use-cases/dispatch-movement.use-case';
import { ReceiveMovementUseCase } from '../../../application/use-cases/receive-movement.use-case';
import { RejectMovementUseCase } from '../../../application/use-cases/reject-movement.use-case';
import { CancelMovementUseCase } from '../../../application/use-cases/cancel-movement.use-case';
import { Movement, MovementStatus, MOVEMENT_TYPE_LABELS } from '../../../domain/models/movement.model';
import { MovementRepository } from '../../../domain/repositories/movement.repository';
import { MovementItemComponent } from '../../components/movement-item/movement-item.component';
import { MovementDocumentModalComponent } from '../../components/movement-document-modal/movement-document-modal.component';
import { GetOneActivoUseCase } from '../../../../inventory/application/use-cases/get-one-activo.use-case';
import { GetAllActivosUseCase } from '../../../../inventory/application/use-cases/get-all-activos.use-case';
import { Activo } from '../../../../inventory/domain/models/activo.model';
import { GetAllSimCardsUseCase } from '../../../../sim-cards/application/use-cases/get-all-sim-cards.use-case';
import { SimCardRepository } from '../../../../sim-cards/domain/repositories/sim-card.repository';
import { SimCard } from '../../../../sim-cards/domain/models/sim-card.model';
import { Area } from '../../../../responsables/domain/models/area.model';
import { RoleService } from '../../../../../core/auth/services/role.service';
import * as QRCode from 'qrcode';

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
  imports: [CommonModule, FormsModule, MovementItemComponent, MovementDocumentModalComponent],
  template: `
    <div class="p-4 md:p-6 space-y-8 max-w-5xl mx-auto">
      
      <!-- FORM: Registrar Movimiento -->
      @if (roleService.canRegisterMovement()) {
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
            <div class="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3.5 animate-in fade-in slide-in-from-top-2 shadow-xs">
              <div class="h-9 w-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-lg shrink-0">
                📦
              </div>
              <div class="space-y-1">
                <h4 class="text-sm font-bold text-indigo-950">¡Traslado Registrado con Éxito! (Estado: En Curso)</h4>
                <p class="text-xs text-indigo-900 leading-relaxed">
                  El movimiento ha quedado generado en la pestaña <strong>"En Curso"</strong>. El correo formal de notificación con los documentos oficiales (Acta y Guía) se despachará en el siguiente paso cuando pulses <strong>"Despachar"</strong> en la tarjeta del traslado.
                </p>
              </div>
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
              <span>📱</span> Traslado de SIM Disponible
            </button>
          </div>

          @if (operationMode() === 'ACTIVO') {
            <!-- MODO ACTIVO: Flujo Lineal de Activos -->
            
            <!-- Tipo de Movimiento -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo de Movimiento *</label>
              <select [ngModel]="movementType"
                      (ngModelChange)="onMovementTypeChange($event)"
                      class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none text-sm transition-all font-medium text-slate-700">
                <option value="">Seleccione...</option>
                @for (type of filteredMovementTypes(); track type[0]) {
                  <option [value]="type[0]">{{ type[1] }}</option>
                }
              </select>
            </div>

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
                <div class="text-right flex flex-col items-end gap-1">
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200/50 bg-indigo-50/50 text-indigo-600">
                    {{ selectedActivo()?.location?.nombre || 'Sede N/A' }}
                  </span>
                  <span class="text-[10px] font-medium text-slate-500">
                    Área: {{ selectedActivo()?.area?.nombre || 'NO APLICA' }}
                  </span>
                  @if (selectedActivo()?.simCards?.length) {
                    <p class="text-[10px] text-purple-600 font-bold mt-0.5 flex items-center justify-end gap-1">
                      <span>📱 SIMs:</span>
                      <span class="font-mono">{{ getSimCardsNumbers(selectedActivo()?.simCards || []) }}</span>
                    </p>
                  }
                </div>
              </div>
            }

            <!-- Banner Informativo para Equipo en Mantenimiento -->
            @if (selectedActivo()?.estado === 'MANTENIMIENTO') {
              <div class="p-4 bg-amber-50 border border-amber-200/90 rounded-2xl flex items-start gap-3 shadow-xs animate-in fade-in">
                <div class="p-2 bg-amber-100 text-amber-800 rounded-xl text-lg shrink-0">
                  🔧
                </div>
                <div>
                  <h4 class="text-sm font-bold text-amber-900 leading-tight">Equipo en Estado de MANTENIMIENTO</h4>
                  <p class="text-xs text-amber-800 mt-1 leading-relaxed">
                    Este equipo cuenta con un proceso de mantenimiento activo. Por regla de control, <strong>solo se permite el retiro de SIM Cards</strong> o su <strong>traslado hacia Bodega TI / Soporte Técnico</strong>.
                  </p>
                  <p class="text-[11px] text-amber-700 mt-1 font-medium">
                    ℹ️ Para asignar o cambiar SIM Card, el equipo debe ser liberado de mantenimiento y pasar a estado <strong>DISPONIBLE</strong>.
                  </p>
                </div>
              </div>
            }

            <!-- Banner de Alerta para Hurto o Pérdida -->
            @if (movementType === 'HURTO_PERDIDA') {
              <div class="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 shadow-xs animate-in fade-in">
                <div class="p-2 bg-rose-100 text-rose-700 rounded-xl text-lg shrink-0">
                  🚨
                </div>
                <div>
                  <h4 class="text-sm font-bold text-rose-900 leading-tight">Reporte Oficial de Hurto / Pérdida de Activo</h4>
                  <p class="text-xs text-rose-700 mt-1 leading-relaxed">
                    Este movimiento dará de <strong>baja definitiva</strong> al activo en el sistema, lo desvinculará de su custodio actual y notificará de forma inmediata a los correos suscritos de <strong>Seguridad, Jurídica y Contabilidad</strong>.
                  </p>
                  <p class="text-[11px] font-bold text-rose-800 mt-1.5 flex items-center gap-1">
                    ⚠️ Es OBLIGATORIO adjuntar el archivo del denuncio policial ante la Fiscalía / Policía Nacional en la sección de documentos abajo.
                  </p>
                </div>
              </div>
            }

            <!-- Grid: Ubicaciones (Origen & Destino) -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Ubicación Origen -->
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Ubicación Origen</label>
                <input type="text" [value]="selectedActivo()?.location?.nombre || 'Se cargará automáticamente...'" disabled
                       class="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm font-medium">
              </div>

              <!-- Ubicación Destino -->
              <div class="space-y-1.5 relative">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Ubicación Destino *</label>
                <div class="relative group">
                  <input type="text" 
                         [ngModel]="movementType === 'HURTO_PERDIDA' ? 'No aplica (Baja definitiva por hurto)' : destinationSearchQuery()" 
                         (focus)="(!movementType || movementType === 'TRASLADO_AREA' || movementType === 'HURTO_PERDIDA') ? null : showDestinationDropdown.set(true)"
                         (input)="destinationSearchQuery.set($any($event.target).value); showDestinationDropdown.set(true)"
                         [disabled]="!movementType || movementType === 'TRASLADO_AREA' || movementType === 'HURTO_PERDIDA' || ['SIM_ASIGNACION', 'SIM_CAMBIO', 'SIM_RETIRO', 'SIM_RETIRO_TOTAL'].includes(movementType)"
                         [placeholder]="!movementType ? 'Seleccione tipo de movimiento primero...' : (movementType === 'HURTO_PERDIDA' ? 'No aplica (Baja definitiva)' : (['SIM_ASIGNACION', 'SIM_CAMBIO', 'SIM_RETIRO', 'SIM_RETIRO_TOTAL'].includes(movementType) ? 'No aplica (Mismo equipo)' : 'Escriba Código o Nombre de la Sede...'))"
                         class="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-700 disabled:bg-slate-100 disabled:text-slate-500">
                  
                  @if (destinationSearchQuery() && movementType && movementType !== 'TRASLADO_AREA' && movementType !== 'HURTO_PERDIDA' && !['SIM_ASIGNACION', 'SIM_CAMBIO', 'SIM_RETIRO', 'SIM_RETIRO_TOTAL'].includes(movementType)) {
                    <button (click)="clearDestinationSelection()" 
                            class="absolute right-3 top-3 text-slate-300 hover:text-slate-500 transition-colors">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  }

                  @if (showDestinationDropdown() && filteredDestinations().length > 0 && movementType && movementType !== 'TRASLADO_AREA' && movementType !== 'HURTO_PERDIDA' && !['SIM_ASIGNACION', 'SIM_CAMBIO', 'SIM_RETIRO', 'SIM_RETIRO_TOTAL'].includes(movementType)) {
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

                @if (selectedDestination() && movementType !== 'TRASLADO_AREA' && movementType !== 'HURTO_PERDIDA' && (!selectedDestination()!.responsibleIds || selectedDestination()!.responsibleIds.length === 0)) {
                  <div class="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 animate-in fade-in duration-200">
                    <span class="text-amber-500 text-sm">⚠️</span>
                    <p class="text-[11px] font-bold text-amber-800 leading-normal">
                      Advertencia: Esta sede no tiene responsables asignados. El traslado se registrará, pero te recomendamos asignarle uno en la sección de "Ubicaciones" para que alguien reciba el acta de entrega.
                    </p>
                  </div>
                }
              </div>
            </div>

            <!-- Área Destino -->
            @if (selectedDestination() && movementType && movementType !== 'HURTO_PERDIDA' && !['SIM_ASIGNACION', 'SIM_CAMBIO', 'SIM_RETIRO', 'SIM_RETIRO_TOTAL'].includes(movementType)) {
              <div class="space-y-1.5 mt-4">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Área Destino *</label>
                @if (getAvailableDestinationAreas().length > 0) {
                  <select [ngModel]="destinationAreaId()"
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

            <!-- Responsables (Remitente Actual & Receptor Destino) (Grilla de 2 columnas) -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <!-- Responsable Remitente (Actual) -->
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  Responsable Remitente (Actual)
                </label>
                <input type="text" [value]="selectedActivo()?.responsible?.nombre || 'Sin custodio asignado'" disabled
                       class="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm font-medium">
              </div>

              <!-- Responsable Receptor (Destino) -->
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  Responsable Receptor *
                  @if (responsibleId) {
                    <span class="text-emerald-500 text-[10px] font-bold normal-case">✓ Seleccionado</span>
                  }
                </label>
                <select [ngModel]="responsibleId"
                        (ngModelChange)="onResponsibleChange($event)"
                        class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm appearance-none font-medium text-slate-700">
                  <option value="">Seleccione el responsable receptor...</option>
                  @for (resp of filteredResponsiblesForDestination(); track resp.id) {
                    <option [value]="resp.id">{{ resp.nombre }}{{ resp.area?.nombre ? ' — ' + resp.area?.nombre : '' }}</option>
                  }
                </select>
                @if (filteredResponsiblesForDestination().length === 0) {
                  <p class="text-[10px] text-amber-600 font-medium">⚠️ No hay responsables activos en el destino/área seleccionada.</p>
                }
              </div>
            </div>

          } @else {
            <!-- MODO SIM: Flujo Lineal Traslado SIM en Bodega -->
            
            <!-- 1. Buscador de SIM (Siempre habilitado) -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Buscar SIM Card Disponible *</label>
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

            <!-- Grid: Ubicación Origen e Ubicación Destino SIM -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Ubicación Origen SIM (Autocomplete) -->
              <div class="space-y-1.5 relative">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Ubicación Origen SIM *</label>
                <div class="relative group">
                  <input type="text" 
                         [ngModel]="originSearchQuery()" 
                         (focus)="selectedSimForTransfer()?.locationId ? null : showOriginDropdown.set(true)"
                         (input)="originSearchQuery.set($any($event.target).value); showOriginDropdown.set(true)"
                         [disabled]="!!selectedSimForTransfer()?.locationId"
                         placeholder="Escriba Código o Nombre de la Sede Origen..."
                         class="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-700 disabled:bg-slate-100 disabled:text-slate-500">
                  
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
                  <select [ngModel]="destinationAreaId()"
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

            <!-- Responsable Remitente y Responsable Receptor (en Grid) -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <!-- Responsable Remitente -->
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  Responsable Remitente
                </label>
                <input type="text" value="No aplica (SIM en Bodega)" disabled
                       class="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm font-medium">
              </div>

              <!-- Responsable Receptor -->
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  Responsable Receptor *
                  @if (responsibleId) {
                    <span class="text-emerald-500 text-[10px] font-bold normal-case">✓ Seleccionado</span>
                  }
                </label>
                <select [ngModel]="responsibleId"
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
          }

          <!-- Row 5: Observaciones & Documento -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Observaciones</label>
              <textarea [(ngModel)]="notes"
                        placeholder="Detalles adicionales del movimiento..."
                        rows="2"
                        class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm resize-none"></textarea>
            </div>
            <div class="space-y-4">
            <!-- Documento Soporte -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                </svg>
                @if (movementType === 'HURTO_PERDIDA') {
                  <span class="text-rose-700 font-bold">Denuncio Policial * (Obligatorio)</span>
                } @else {
                  <span>Soporte Externo / Solicitud previa <span class="text-slate-400 font-normal lowercase">(opcional - ticket, correo de autorización)</span></span>
                }
              </label>

              @if (documentUrl()) {
                <div class="flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl transition-all shadow-sm">
                  <div class="flex items-center gap-2.5 overflow-hidden">
                    <div class="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                      <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                    </div>
                    <div class="truncate">
                      <p class="text-xs font-bold text-slate-800 truncate">{{ documentFileName || 'Soporte externo cargado' }}</p>
                      <a [href]="documentUrl()" target="_blank" class="text-[11px] text-emerald-700 hover:underline font-semibold flex items-center gap-1 mt-0.5">
                        Ver / Descargar archivo
                        <svg class="w-3 h-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                      </a>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-1.5 shrink-0">
                    <label class="px-2 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg cursor-pointer transition-colors bg-white shadow-2xs" title="Cambiar por otro archivo">
                      Reemplazar
                      <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx" (change)="onDocumentFileChange($event)" />
                    </label>
                    <button type="button" (click)="removeDocumentFile()" class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors" title="Quitar archivo adjunto">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.562.621c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              } @else {
                <label class="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 h-[52px] px-4 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors">
                  @if (uploadingFile()) {
                    <div class="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                    <span class="text-xs text-slate-500 font-medium">Subiendo archivo...</span>
                  } @else {
                    <svg class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 16v-8m0 0l-3 3m3-3l3 3M6.5 20h11A2.5 2.5 0 0020 17.5V7.914a2.5 2.5 0 00-.732-1.768l-3.414-3.414A2.5 2.5 0 0014.086 2H6.5A2.5 2.5 0 004 4.5v13A2.5 2.5 0 006.5 20z"/>
                    </svg>
                    <span class="text-xs text-slate-600 font-medium">Subir soporte previo o autorización (PDF, PNG, JPG…)</span>
                  }
                  <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx" (change)="onDocumentFileChange($event)" />
                </label>
              }
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
                  <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Seleccionar SIM Card Disponible *</label>
                  @if (availableBodegaSimsInOrigin().length === 0) {
                    <div class="p-4 bg-amber-50 border border-amber-200/80 rounded-xl space-y-2.5 animate-in fade-in">
                      <div class="flex items-center gap-2 text-amber-900 font-bold text-xs">
                        <span>⚠️</span>
                        <span>No hay SIM Cards disponibles en BODEGA en {{ selectedActivo()?.location?.nombre || 'esta sede' }}.</span>
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
                    <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Seleccionar SIM Card Disponible *</label>
                    @if (availableBodegaSimsInOrigin().length === 0) {
                      <div class="p-4 bg-amber-50 border border-amber-200/80 rounded-xl space-y-2.5 animate-in fade-in">
                        <div class="flex items-center gap-2 text-amber-900 font-bold text-xs">
                          <span>⚠️</span>
                          <span>No hay SIM Cards disponibles en BODEGA en {{ selectedActivo()?.location?.nombre || 'esta sede' }}.</span>
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
                      <span>📍 {{ selectedActivo()?.location?.nombre || 'Sede actual del equipo' }}</span>
                      <span class="text-[10px] bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded-full font-semibold">Sede actual del activo</span>
                    </div>
                    <p class="text-[11px] text-slate-500">La SIM saliente queda registrada en BODEGA en esta misma sede física.</p>
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

                  <div class="space-y-1.5">
                    <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Ubicación donde quedará la SIM</label>
                    <div class="px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 flex items-center justify-between">
                      <span>📍 {{ selectedActivo()?.location?.nombre || 'Sede actual del equipo' }}</span>
                      <span class="text-[10px] bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded-full font-semibold">Sede actual del activo</span>
                    </div>
                    <p class="text-[11px] text-slate-500">La SIM retirada permanecerá en la sede física actual del equipo.</p>
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
                        <div class="space-y-1.5">
                          <label class="text-[10px] font-bold text-slate-500 uppercase">Ubicación destino SIM {{ i + 1 }}</label>
                          <div class="px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center justify-between">
                            <span>📍 {{ selectedActivo()?.location?.nombre || 'Sede actual' }}</span>
                            <span class="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-medium">Sede actual</span>
                          </div>
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
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <label class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    📧 Destinatarios para la Notificación de Despacho:
                  </label>
                  @if (!showAllRecipients()) {
                    <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                      📍 Sedes Involucradas ({{ relevantResponsibles().length }})
                    </span>
                  } @else {
                    <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      🌐 Todos los Responsables ({{ relevantResponsibles().length }})
                    </span>
                  }
                </div>
                <div class="flex items-center gap-3 text-xs">
                  <button type="button" (click)="toggleShowAllRecipients()" class="text-indigo-600 hover:text-indigo-800 font-bold transition-colors">
                    {{ showAllRecipients() ? '📍 Ver Solo Sedes' : '🌐 Ver Todos' }}
                  </button>
                  <span class="text-slate-300">|</span>
                  <button type="button" (click)="selectAllRelevantEmails()" class="text-slate-600 hover:text-indigo-600 font-semibold transition-colors">
                    Marcar Todos
                  </button>
                  <span class="text-slate-300">|</span>
                  <button type="button" (click)="clearAllEmails()" class="text-slate-400 hover:text-red-600 font-semibold transition-colors">
                    Limpiar
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                @for (resp of relevantResponsibles(); track resp.id) {
                  @if (resp.email) {
                    <label class="flex items-center gap-3 p-2.5 bg-white border rounded-xl cursor-pointer transition-all shadow-sm group select-none"
                           [class.border-indigo-300]="selectedEmails().includes(resp.email)"
                           [class.bg-indigo-50/40]="selectedEmails().includes(resp.email)"
                           [class.border-slate-200]="!selectedEmails().includes(resp.email)">
                      <input type="checkbox" 
                             [checked]="selectedEmails().includes(resp.email)"
                             (change)="toggleEmail(resp.email)"
                             class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300">
                      <div class="flex flex-col min-w-0 flex-1">
                        <div class="flex items-center gap-1.5">
                          <span class="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{{ resp.nombre }}</span>
                          @if (isReceiver(resp.email)) {
                            <span class="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                              ✓ Receptor
                            </span>
                          } @else if (isCurrentCustodian(resp.email)) {
                            <span class="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-300 shrink-0">
                              👤 Custodio Origen
                            </span>
                          }
                        </div>
                        <span class="text-[10px] text-slate-400 truncate">{{ resp.email }}</span>
                      </div>
                    </label>
                  }
                } @empty {
                  <div class="col-span-full py-6 text-center text-xs text-slate-400 bg-white border border-slate-100 rounded-xl">
                    <p>No se encontraron responsables con correo en las sedes seleccionadas.</p>
                    <button type="button" (click)="toggleShowAllRecipients()" class="mt-1.5 text-indigo-600 font-bold hover:underline">
                      Pulsa aquí para ver todos los responsables del sistema
                    </button>
                  </div>
                }
              </div>

              @if (selectedEmails().length > 0) {
                <div class="text-[11px] text-slate-500 font-medium pt-1">
                  ℹ️ Se notificará formalmente a <strong class="text-slate-800 font-bold">{{ selectedEmails().length }}</strong> destinatario(s) al confirmar el despacho con los soportes adjuntos.
                </div>
              }
            </div>
          }
          <!-- Footer -->
          <div class="pt-4 flex justify-start">
            <button (click)="saveMovement()"
                    [disabled]="loading() || !responsibleId || !originId() || (movementType !== 'SIM_TRASLADO' && !selectedActivo()) || (movementType === 'SIM_TRASLADO' && !selectedSimForTransfer()) || (!destinationId && !['SIM_ASIGNACION', 'SIM_CAMBIO', 'SIM_RETIRO', 'SIM_RETIRO_TOTAL'].includes(movementType))"
                    class="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center gap-2.5 disabled:opacity-50 cursor-pointer">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
              Registrar
            </button>
          </div>
        </div>
      </div>
      }

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

        <!-- Notificación de Anulación Exitosa -->
        @if (cancelToastMessage()) {
          <div class="mb-4 bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 shadow-xs">
            <div class="flex items-center gap-2.5">
              <span class="text-rose-600 text-base">🚫</span>
              <p class="text-xs font-bold text-rose-900">{{ cancelToastMessage() }}</p>
            </div>
            <button (click)="cancelToastMessage.set(null)" class="text-rose-700 text-xs font-bold hover:underline cursor-pointer">✕</button>
          </div>
        }

        <!-- Notificación de Soportes Guardados Exitosamente -->
        @if (attachSuccessMessage()) {
          <div class="mb-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 shadow-xs">
            <div class="flex items-center gap-2.5">
              <span class="text-emerald-600 text-base">📎</span>
              <p class="text-xs font-bold text-emerald-900">{{ attachSuccessMessage() }}</p>
            </div>
            <button (click)="attachSuccessMessage.set(null)" class="text-emerald-700 text-xs font-bold hover:underline cursor-pointer">✕</button>
          </div>
        }

        <!-- Resultados (Cards) -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (mov of filteredMovements(); track mov.id) {
            <app-movement-item  
              [movement]="mov"
              (onDispatch)="openDispatchModal(mov)"
              (onReceive)="openReceiveModal(mov)"
              (onViewRoute)="openRouteModal(mov)"
              (onCopyMagicLink)="copyMagicLink(mov)"
              (onGenerateDocument)="openDocumentModal(mov, documentModal)"
              (onCancel)="openCancelModal(mov)"
              (onAttachDocument)="openAttachDocumentModal(mov)">
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
          <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div class="p-5 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
              <h3 class="font-bold text-slate-800 text-lg flex items-center gap-3">
                @if (actionType === 'dispatch') { 🚛 Despachar Traslado }
                @if (actionType === 'receive') { ✅ Recibir Traslado }
                @if (actionType === 'route') { 📍 Ruta del Dispositivo }
              </h3>
              <button (click)="closeModal()" class="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div class="p-6 space-y-5 flex-1 overflow-y-auto">
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
                  <!-- Resumen del Traslado a Recibir/Despachar -->
                  <div class="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2 text-xs">
                    <div class="flex justify-between">
                      <span class="text-slate-500 font-medium">Tipo:</span>
                      <span class="font-bold text-slate-800"
                            [class.text-rose-600]="selectedMovementForAction.type === 'BAJA_ACTIVO'">
                        {{ getMovementTypeLabel(selectedMovementForAction.type) }}
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-500 font-medium">Origen:</span>
                      <span class="font-bold text-slate-800">{{ selectedMovementForAction.originLocation?.nombre || 'N/A' }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-500 font-medium">Destino:</span>
                      <span class="font-bold text-slate-800">{{ selectedMovementForAction.destinationLocation?.nombre || 'N/A' }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-500 font-medium">Responsable:</span>
                      <span class="font-bold text-slate-800">{{ selectedMovementForAction.responsible?.nombre || 'N/A' }}</span>
                    </div>
                    @if (selectedMovementForAction.notes) {
                      <div class="pt-1.5 border-t border-slate-200/60 mt-1">
                        <span class="text-slate-500 font-medium block mb-0.5 text-xs">Notas / Motivo de Rechazo:</span>
                        <span class="font-semibold text-rose-600 block leading-relaxed bg-rose-50/50 p-2 rounded-lg border border-rose-100/50 text-xs max-h-24 overflow-y-auto">{{ selectedMovementForAction.notes }}</span>
                      </div>
                    }
                    <div class="pt-1.5 border-t border-slate-200/60 mt-1">
                      <span class="text-slate-500 font-medium block mb-1">Equipos en traslado:</span>
                      <div class="space-y-1">
                        @for (act of selectedMovementForAction.activos; track act.id) {
                          <div class="flex justify-between items-center bg-white px-2.5 py-1 rounded border border-slate-100 font-mono text-[10px]">
                            <span class="text-slate-800 font-bold">{{ act.placa }}</span>
                            <span class="text-slate-500">{{ act.marca }} (S/N: {{ act.serial || 'N/A' }})</span>
                          </div>
                        }
                        @for (sim of selectedMovementForAction.simCards; track sim.id) {
                          <div class="flex justify-between items-center bg-white px-2.5 py-1 rounded border border-slate-100 font-mono text-[10px]">
                            <span class="text-purple-800 font-bold">{{ sim.numero }}</span>
                            <span class="text-slate-500">{{ sim.operador }}</span>
                          </div>
                        }
                      </div>
                    </div>
                  </div>

                  @if (actionType === 'receive') {
                    <div class="space-y-1.5">
                      <label class="text-xs font-bold text-slate-500 uppercase">Responsable que recibe (ID):</label>
                      <select [(ngModel)]="modalReceiverId"
                             class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm transition-all">
                      <option value="">Seleccione el responsable...</option>
                      @for (resp of responsables(); track resp.id) {
                        <option [value]="resp.id">{{ resp.nombre }}{{ resp.area?.nombre ? ' — ' + resp.area?.nombre : '' }}</option>
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
                  <!-- Comodato / Acta de Soporte ya registrado (solo lectura) -->
                  <!-- ============================================== -->
                  <!-- CASO 1: MODAL DE DESPACHO (GUÍA + COMODATO)    -->
                  <!-- ============================================== -->
                  @if (actionType === 'dispatch') {
                    <div class="space-y-4">
                      <!-- 1. GUÍA DE ENVÍO / TRANSPORTE (evidenceUrl) -->
                      <div class="p-4 bg-slate-50/80 border border-slate-200/90 rounded-2xl space-y-2.5">
                        <div class="flex items-center justify-between">
                          <label class="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                            <span>🚚</span> Guía de Envío / Transporte
                          </label>
                          <span class="text-[10px] text-slate-400 font-medium">(Transportadora, remesa o conductor)</span>
                        </div>

                        @if (modalEvidenceUrl) {
                          <div class="flex items-center justify-between p-3 bg-white border border-indigo-200 rounded-xl shadow-2xs">
                            <div class="flex items-center gap-2.5 overflow-hidden">
                              <div class="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                🚚
                              </div>
                              <div class="truncate">
                                <p class="text-xs font-bold text-slate-800 truncate">{{ modalFileName || 'Guía de transporte adjunta' }}</p>
                                <a [href]="modalEvidenceUrl" target="_blank" class="text-[11px] text-indigo-600 hover:underline font-semibold flex items-center gap-1 mt-0.5">
                                  Ver / Descargar guía ↗
                                </a>
                              </div>
                            </div>
                            <div class="flex items-center gap-1.5 shrink-0">
                              <label class="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg cursor-pointer transition-colors bg-white shadow-2xs">
                                Reemplazar
                                <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx" (change)="onModalFileChange($event)" />
                              </label>
                              <button type="button" (click)="removeModalFile()" class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.562.621c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                              </button>
                            </div>
                          </div>
                        } @else {
                          <div class="space-y-2">
                            <label class="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-white h-[50px] px-4 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors">
                              @if (uploadingModalFile()) {
                                <div class="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                                <span class="text-xs text-slate-500 font-medium">Subiendo guía...</span>
                              } @else {
                                <svg class="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 16v-8m0 0l-3 3m3-3l3 3M6.5 20h11A2.5 2.5 0 0020 17.5V7.914a2.5 2.5 0 00-.732-1.768l-3.414-3.414A2.5 2.5 0 0014.086 2H6.5A2.5 2.5 0 004 4.5v13A2.5 2.5 0 006.5 20z"/></svg>
                                <span class="text-xs text-slate-700 font-semibold">Subir Guía de Envío (PDF, PNG, JPG)</span>
                              }
                              <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx" (change)="onModalFileChange($event)" />
                            </label>
                            <div class="flex items-center gap-2">
                              <span class="text-[10px] text-slate-400 font-medium whitespace-nowrap">O pegar URL:</span>
                              <input type="text" [(ngModel)]="modalEvidenceUrl" placeholder="https://..."
                                     class="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-400 transition-all">
                            </div>
                          </div>
                        }
                      </div>

                      <!-- 2. COMODATO O ACTA FIRMADA (documentUrl) -->
                      <div class="p-4 bg-slate-50/80 border border-slate-200/90 rounded-2xl space-y-2.5">
                        <div class="flex items-center justify-between">
                          <label class="text-xs font-bold text-violet-900 uppercase tracking-wider flex items-center gap-1.5">
                            <span>📋</span> Comodato o Acta Firmada
                          </label>
                          <span class="text-[10px] text-slate-400 font-medium">(Documento legal con firmas del receptor)</span>
                        </div>

                        @if (modalDocumentUrl) {
                          <div class="flex items-center justify-between p-3 bg-white border border-violet-200 rounded-xl shadow-2xs">
                            <div class="flex items-center gap-2.5 overflow-hidden">
                              <div class="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600 shrink-0">
                                📋
                              </div>
                              <div class="truncate">
                                <p class="text-xs font-bold text-slate-800 truncate">{{ modalDocFileName || 'Comodato / Acta adjunta' }}</p>
                                <a [href]="modalDocumentUrl" target="_blank" class="text-[11px] text-violet-600 hover:underline font-semibold flex items-center gap-1 mt-0.5">
                                  Ver / Descargar documento ↗
                                </a>
                              </div>
                            </div>
                            <div class="flex items-center gap-1.5 shrink-0">
                              <label class="px-2.5 py-1 text-[11px] font-semibold text-violet-700 hover:bg-violet-50 border border-violet-200 rounded-lg cursor-pointer transition-colors bg-white shadow-2xs">
                                Reemplazar
                                <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx" (change)="onModalDocFileChange($event)" />
                              </label>
                              <button type="button" (click)="removeModalDocFile()" class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.562.621c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                              </button>
                            </div>
                          </div>
                        } @else {
                          <div class="space-y-2">
                            <label class="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-white h-[50px] px-4 cursor-pointer hover:border-violet-400 hover:bg-violet-50/40 transition-colors">
                              @if (uploadingModalDocFile()) {
                                <div class="animate-spin h-4 w-4 border-2 border-violet-500 border-t-transparent rounded-full"></div>
                                <span class="text-xs text-slate-500 font-medium">Subiendo documento...</span>
                              } @else {
                                <svg class="h-4 w-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                <span class="text-xs text-slate-700 font-semibold">Subir Comodato / Acta Firmada (PDF, PNG, JPG)</span>
                              }
                              <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx" (change)="onModalDocFileChange($event)" />
                            </label>
                            <div class="flex items-center gap-2">
                              <span class="text-[10px] text-slate-400 font-medium whitespace-nowrap">O pegar URL:</span>
                              <input type="text" [(ngModel)]="modalDocumentUrl" placeholder="https://..."
                                     class="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-violet-400 transition-all">
                            </div>
                          </div>
                        }
                      </div>

                      <!-- 3. NOTIFICACIÓN POR WHATSAPP (Wasapi) -->
                      <div class="p-4 rounded-2xl border transition-all"
                           [class.bg-emerald-50/70]="modalNotifyWhatsApp()"
                           [class.border-emerald-200]="modalNotifyWhatsApp()"
                           [class.bg-slate-50/80]="!modalNotifyWhatsApp()"
                           [class.border-slate-200/90]="!modalNotifyWhatsApp()">
                        <div class="flex items-start justify-between gap-3">
                          <div class="flex items-start gap-2.5">
                            <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-2xs"
                                 [class.bg-emerald-500]="modalNotifyWhatsApp()"
                                 [class.text-white]="modalNotifyWhatsApp()"
                                 [class.bg-slate-200]="!modalNotifyWhatsApp()"
                                 [class.text-slate-500]="!modalNotifyWhatsApp()">
                              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                            </div>
                            <div>
                              <p class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                Notificación por WhatsApp
                                @if (modalRecipientPhone()) {
                                  <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                                        [class.bg-emerald-100]="modalNotifyWhatsApp()"
                                        [class.text-emerald-800]="modalNotifyWhatsApp()"
                                        [class.bg-slate-200]="!modalNotifyWhatsApp()"
                                        [class.text-slate-600]="!modalNotifyWhatsApp()">
                                    {{ modalNotifyWhatsApp() ? 'Activada' : 'Omitida' }}
                                  </span>
                                }
                              </p>
                              @if (modalRecipientPhone()) {
                                <p class="text-[11px] text-slate-500 mt-0.5">
                                  Enviar enlace de recepción al receptor: <strong class="text-slate-700 font-mono">+{{ modalRecipientPhone() }}</strong>
                                  @if (modalRecipientName()) {
                                    <span class="text-slate-600">({{ modalRecipientName() }})</span>
                                  }
                                </p>
                              } @else {
                                <p class="text-[11px] text-amber-700 mt-0.5">
                                  ⚠️ El receptor no tiene celular registrado. La notificación se enviará únicamente por correo corporativo.
                                </p>
                              }
                            </div>
                          </div>

                          @if (modalRecipientPhone()) {
                            <label class="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                              <input type="checkbox"
                                     [checked]="modalNotifyWhatsApp()"
                                     (change)="modalNotifyWhatsApp.set(!modalNotifyWhatsApp())"
                                     class="sr-only peer">
                              <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                            </label>
                          }
                        </div>
                      </div>
                    </div>
                  }

                  <!-- ============================================== -->
                  <!-- CASO 2: MODAL DE RECEPCIÓN                     -->
                  <!-- ============================================== -->
                  @if (actionType === 'receive') {
                    <!-- Soportes previos del traslado (lectura) -->
                    @if (selectedMovementForAction.documentUrl || selectedMovementForAction.evidenceUrl) {
                      <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                        <p class="text-[10px] text-slate-500 uppercase font-bold">Documentos del Traslado:</p>
                        <div class="flex flex-wrap gap-2">
                          @if (selectedMovementForAction.documentUrl) {
                            <a [href]="selectedMovementForAction.documentUrl" target="_blank"
                               class="text-xs font-semibold text-violet-700 hover:text-violet-900 bg-white border border-violet-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-2xs">
                              📋 Ver Comodato / Acta ↗
                            </a>
                          }
                          @if (selectedMovementForAction.evidenceUrl) {
                            <a [href]="selectedMovementForAction.evidenceUrl" target="_blank"
                               class="text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-white border border-indigo-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-2xs">
                              🚚 Ver Guía de Envío ↗
                            </a>
                          }
                        </div>
                      </div>
                    }

                    <!-- Soporte de Recepción -->
                    <div class="space-y-2">
                      <label class="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                        <span>📦 Soporte de Recepción *</span>
                        <span class="text-[10px] text-slate-400 font-normal lowercase">(Firma / Foto / Acta de Recibido)</span>
                      </label>

                      @if (modalEvidenceUrl) {
                        <div class="flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl transition-all shadow-sm">
                          <div class="flex items-center gap-2.5 overflow-hidden">
                            <div class="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                              📦
                            </div>
                            <div class="truncate">
                              <p class="text-xs font-bold text-slate-800 truncate">{{ modalFileName || 'Soporte de recepción cargado' }}</p>
                              <a [href]="modalEvidenceUrl" target="_blank" class="text-[11px] text-emerald-700 hover:underline font-semibold flex items-center gap-1 mt-0.5">
                                Ver / Descargar archivo ↗
                              </a>
                            </div>
                          </div>
                          
                          <div class="flex items-center gap-1.5 shrink-0">
                            <label class="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg cursor-pointer transition-colors bg-white shadow-2xs">
                              Reemplazar
                              <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx" (change)="onModalFileChange($event)" />
                            </label>
                            <button type="button" (click)="removeModalFile()" class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.562.621c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                            </button>
                          </div>
                        </div>
                      } @else {
                        <div class="space-y-2">
                          <label class="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 h-[56px] px-4 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/40 transition-colors">
                            @if (uploadingModalFile()) {
                              <div class="animate-spin h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
                              <span class="text-xs text-slate-500 font-medium">Subiendo soporte...</span>
                            } @else {
                              <svg class="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 16v-8m0 0l-3 3m3-3l3 3M6.5 20h11A2.5 2.5 0 0020 17.5V7.914a2.5 2.5 0 00-.732-1.768l-3.414-3.414A2.5 2.5 0 0014.086 2H6.5A2.5 2.5 0 004 4.5v13A2.5 2.5 0 006.5 20z"/></svg>
                              <span class="text-xs text-slate-700 font-semibold">Subir Soporte de Recepción (PDF, Imagen)</span>
                            }
                            <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx" (change)="onModalFileChange($event)" />
                          </label>
                          
                          <div class="flex items-center gap-2 pt-0.5">
                            <span class="text-[10px] text-slate-400 font-medium whitespace-nowrap">O pegar URL:</span>
                            <input type="text" [(ngModel)]="modalEvidenceUrl" placeholder="https://..."
                                   class="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-400 transition-all">
                          </div>
                        </div>
                      }
                    </div>
                  }
                  
                  <button (click)="confirmAction()"
                          class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 transition-all mt-4 flex items-center justify-center gap-2 cursor-pointer">
                    {{ actionType === 'dispatch' ? 'Confirmar Despacho y Notificar' : 'Confirmar Recepción' }}
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
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
            <h3 class="text-base font-black text-indigo-900 flex items-center gap-2">
              <span>✨</span> Autenticación única
            </h3>
            <button (click)="closeMagicLinkModal()" class="text-slate-400 hover:text-slate-600 transition-colors p-2 bg-white rounded-full shadow-sm hover:shadow">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <!-- Tabs Selector -->
          <div class="px-6 pt-3 flex border-b border-slate-100 bg-slate-50/50">
            <button (click)="magicLinkTab.set('link')" 
                    [class]="'flex-1 pb-3 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ' + 
                             (magicLinkTab() === 'link' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-500')">
              <span>🔗</span> Enviar Enlace
            </button>
            <button (click)="magicLinkTab.set('qr')" 
                    [class]="'flex-1 pb-3 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ' + 
                             (magicLinkTab() === 'qr' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-500')">
              <span>📱</span> Código QR
            </button>
          </div>

          <!-- Body -->
          <div class="p-6">
            @if (magicLinkTab() === 'link') {
              <div class="space-y-4 animate-in fade-in-50 duration-150">
                <p class="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Copia este enlace de un solo uso y envíalo al responsable en destino para que confirme la recepción sin contraseñas.
                </p>
                <div class="relative">
                  <textarea readonly 
                         [value]="magicLinkUrl()"
                         class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs focus:outline-none resize-none h-16 shadow-inner font-mono select-all"
                         #linkInput></textarea>
                </div>
                <p class="text-[10px] text-indigo-600 font-semibold bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-100 flex items-start gap-2">
                  <svg class="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  El enlace se desactivará inmediatamente tras completar la firma.
                </p>
              </div>
            }

            @if (magicLinkTab() === 'qr') {
              <div class="flex flex-col items-center justify-center space-y-3 animate-in fade-in-50 duration-150">
                <p class="text-[11px] text-slate-500 font-medium text-center leading-relaxed">
                  Muestra este código QR al responsable para que lo escanee desde su dispositivo móvil y firme la recepción en el sitio.
                </p>
                @if (qrCodeDataUrl()) {
                  <div class="p-2.5 bg-white rounded-2xl border border-slate-200/60 shadow-md flex items-center justify-center">
                    <img [src]="qrCodeDataUrl()" alt="Código QR" class="w-36 h-36" />
                  </div>
                }
                <span class="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Escaneo local offline</span>
              </div>
            }
          </div>

          <!-- Footer Actions -->
          <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
            @if (magicLinkTab() === 'link') {
              <button (click)="copyToClipboard()"
                      class="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all text-xs shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5 cursor-pointer">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                Copiar Enlace
              </button>
            } @else {
              <button (click)="downloadQrCode()"
                      class="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all text-xs shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5 cursor-pointer">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Descargar QR
              </button>
            }
            <button (click)="closeMagicLinkModal()" 
                    class="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all text-xs cursor-pointer">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Modal de Anulación de Movimiento (Auditoría e Integridad) -->
    @if (cancelMovementTarget()) {
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col border border-slate-100">
          <div class="p-5 border-b border-rose-100 bg-rose-50/70 flex justify-between items-center">
            <h3 class="font-bold text-rose-900 text-base flex items-center gap-2">
              <span>🚫</span> Anular Traslado #{{ cancelMovementTarget()!.id.slice(-6).toUpperCase() }}
            </h3>
            <button (click)="closeCancelModal()" class="w-8 h-8 rounded-full bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center shadow-xs cursor-pointer">
              ✕
            </button>
          </div>
          
          <div class="p-6 space-y-4">
            <div class="p-3.5 bg-amber-50/90 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
              <p class="font-bold flex items-center gap-1.5">
                <span>⚠️</span> Advertencia de Auditoría:
              </p>
              <p class="leading-relaxed text-amber-800">
                El traslado quedará registrado como <strong class="font-bold text-rose-700">ANULADO</strong> en la auditoría histórica y los equipos/SIMs involucrados se liberarán de inmediato en su sede de origen.
              </p>
            </div>

            <div class="text-xs text-slate-600 space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <p><span class="font-bold text-slate-700">Origen:</span> {{ cancelMovementTarget()!.originLocation?.nombre || 'Sede Origen' }}</p>
              <p><span class="font-bold text-slate-700">Destino:</span> {{ cancelMovementTarget()!.destinationLocation?.nombre || 'Sede Destino' }}</p>
              <p><span class="font-bold text-slate-700">Equipos/SIMs:</span> {{ cancelMovementTarget()!.activoIds.length }} equipo(s) / chip(s)</p>
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Motivo de la Anulación *
              </label>
              <textarea [ngModel]="cancelReason()" (ngModelChange)="cancelReason.set($event)" rows="3"
                        placeholder="Ej: Error al seleccionar sede destino / Digitación equivocada de activo..."
                        class="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all resize-none"></textarea>
              <p class="text-[11px] text-slate-400 italic">El motivo quedará guardado permanentemente para trazabilidad.</p>
            </div>
          </div>

          <div class="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
            <button type="button" (click)="closeCancelModal()" [disabled]="isCancelling()"
                    class="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all cursor-pointer">
              Cerrar
            </button>
            <button type="button" (click)="confirmCancelMovement()" [disabled]="isCancelling() || !cancelReason().trim()"
                    class="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-200/50 transition-all flex items-center gap-2 cursor-pointer">
              @if (isCancelling()) {
                <span class="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></span>
                Anulando...
              } @else {
                <span>Confirmar Anulación</span>
              }
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Modal de Documentos Oficiales (Actas / Comodatos) -->
    <app-movement-document-modal 
      #documentModal 
      (onMovementUpdated)="handleMovementUpdated($event)" />

    <!-- Modal para Adjuntar / Actualizar Soportes Firmados -->
    @if (showAttachDocModal() && selectedMovementForDoc()) {
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
          <!-- Header -->
          <div class="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
            <div>
              <h3 class="font-bold text-slate-800 text-base flex items-center gap-2">
                <span>📎</span> Soportes y Documentos Oficiales
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">
                Traslado #{{ selectedMovementForDoc()!.id.slice(-8) }} &bull; {{ selectedMovementForDoc()!.originLocation?.nombre || 'Origen' }} &rarr; {{ selectedMovementForDoc()!.destinationLocation?.nombre || 'Destino' }}
              </p>
            </div>
            <button (click)="closeAttachDocModal()" class="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center cursor-pointer">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div class="p-6 space-y-5 flex-1 overflow-y-auto">
            <div class="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-2xl text-xs text-indigo-900 leading-relaxed">
              <span class="font-bold">Auditoría y Trazabilidad:</span> Puedes subir o actualizar el comodato/acta firmado con ambas firmas (remitente y receptor), o la evidencia de recepción del destinatario. Cada cambio queda registrado en la bitácora con tu usuario y marca de tiempo.
            </div>

            @if (attachModalError()) {
              <div class="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in duration-150">
                <span class="text-rose-600 text-sm shrink-0">❌</span>
                <div class="space-y-0.5">
                  <p class="font-bold text-rose-900">Error al guardar soportes</p>
                  <p class="text-[11px] text-rose-700 leading-relaxed">{{ attachModalError() }}</p>
                </div>
              </div>
            }

            <!-- 1. Comodato o Acta Oficial Firmada (Ambas firmas) -->
            <div class="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2.5">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-violet-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📋</span> Comodato / Acta Oficial Firmada
                </label>
                <span class="text-[10px] text-slate-400 font-medium">(Con ambas firmas)</span>
              </div>

              @if (attachDocUrl()) {
                <div class="flex items-center justify-between p-3 bg-white border border-violet-200 rounded-xl shadow-2xs">
                  <div class="flex items-center gap-2.5 overflow-hidden">
                    <div class="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600 shrink-0">
                      📋
                    </div>
                    <div class="truncate">
                      <p class="text-xs font-bold text-slate-800 truncate">{{ attachDocFileName() || 'Comodato / Acta adjunta' }}</p>
                      <a [href]="attachDocUrl()" target="_blank" class="text-[11px] text-violet-600 hover:underline font-semibold flex items-center gap-1 mt-0.5">
                        Ver / Descargar documento ↗
                      </a>
                    </div>
                  </div>
                  <div class="flex items-center gap-1.5 shrink-0">
                    <label class="px-2.5 py-1 text-[11px] font-semibold text-violet-700 hover:bg-violet-50 border border-violet-200 rounded-lg cursor-pointer transition-colors bg-white shadow-2xs">
                      Reemplazar
                      <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp" (change)="onAttachDocFileSelected($event, 'document')" />
                    </label>
                    <button type="button" (click)="removeAttachDocFile('document')" class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.562.621c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                    </button>
                  </div>
                </div>
              } @else {
                <div class="space-y-2">
                  <label class="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-white h-[50px] px-4 cursor-pointer hover:border-violet-400 hover:bg-violet-50/40 transition-colors">
                    @if (uploadingAttachDoc()) {
                      <div class="animate-spin h-4 w-4 border-2 border-violet-500 border-t-transparent rounded-full"></div>
                      <span class="text-xs text-slate-500 font-medium">Subiendo comodato...</span>
                    } @else {
                      <svg class="h-4 w-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                      <span class="text-xs text-slate-700 font-semibold">Subir Comodato / Acta Firmada (PDF, Imagen máx 5MB)</span>
                    }
                    <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp" (change)="onAttachDocFileSelected($event, 'document')" />
                  </label>
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] text-slate-400 font-medium whitespace-nowrap">O pegar URL:</span>
                    <input type="text" [ngModel]="attachDocUrl()" (ngModelChange)="attachDocUrl.set($event)" placeholder="https://..."
                           class="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-violet-400 transition-all">
                  </div>
                </div>
              }
            </div>

            <!-- 2. Evidencia de Recepción Física / Entrega -->
            <div class="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2.5">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📦</span> Evidencia de Recepción / Entrega
                </label>
                <span class="text-[10px] text-slate-400 font-medium">(Foto del activo en sitio / firma de recepción)</span>
              </div>

              @if (attachReceivedEvidenceUrl()) {
                <div class="flex items-center justify-between p-3 bg-white border border-emerald-200 rounded-xl shadow-2xs">
                  <div class="flex items-center gap-2.5 overflow-hidden">
                    <div class="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                      📦
                    </div>
                    <div class="truncate">
                      <p class="text-xs font-bold text-slate-800 truncate">{{ attachReceivedFileName() || 'Soporte de recepción adjunto' }}</p>
                      <a [href]="attachReceivedEvidenceUrl()" target="_blank" class="text-[11px] text-emerald-600 hover:underline font-semibold flex items-center gap-1 mt-0.5">
                        Ver / Descargar evidencia ↗
                      </a>
                    </div>
                  </div>
                  <div class="flex items-center gap-1.5 shrink-0">
                    <label class="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded-lg cursor-pointer transition-colors bg-white shadow-2xs">
                      Reemplazar
                      <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp" (change)="onAttachDocFileSelected($event, 'evidence')" />
                    </label>
                    <button type="button" (click)="removeAttachDocFile('evidence')" class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.562.621c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                    </button>
                  </div>
                </div>
              } @else {
                <div class="space-y-2">
                  <label class="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-white h-[50px] px-4 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/40 transition-colors">
                    @if (uploadingAttachEvidence()) {
                      <div class="animate-spin h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
                      <span class="text-xs text-slate-500 font-medium">Subiendo evidencia...</span>
                    } @else {
                      <svg class="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 16v-8m0 0l-3 3m3-3l3 3M6.5 20h11A2.5 2.5 0 0020 17.5V7.914a2.5 2.5 0 00-.732-1.768l-3.414-3.414A2.5 2.5 0 0014.086 2H6.5A2.5 2.5 0 004 4.5v13A2.5 2.5 0 006.5 20z"/></svg>
                      <span class="text-xs text-slate-700 font-semibold">Subir Soporte de Recepción (PDF, Imagen máx 5MB)</span>
                    }
                    <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp" (change)="onAttachDocFileSelected($event, 'evidence')" />
                  </label>
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] text-slate-400 font-medium whitespace-nowrap">O pegar URL:</span>
                    <input type="text" [ngModel]="attachReceivedEvidenceUrl()" (ngModelChange)="attachReceivedEvidenceUrl.set($event)" placeholder="https://..."
                           class="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-400 transition-all">
                  </div>
                </div>
              }
            </div>

            <!-- 3. Nota de Auditoría -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Nota / Detalle de la actualización (Opcional)</label>
              <textarea [ngModel]="attachDocNotes()" (ngModelChange)="attachDocNotes.set($event)"
                        rows="2"
                        placeholder="Ej: Se adjunta comodato firmado físicamente por el receptor y el despachador..."
                        class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-xs transition-all"></textarea>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
            <button type="button" (click)="closeAttachDocModal()" [disabled]="savingAttachDoc()"
                    class="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all cursor-pointer">
              Cancelar
            </button>
            <button type="button" (click)="confirmSaveAttachedDocuments()" [disabled]="savingAttachDoc() || (!attachDocUrl() && !attachReceivedEvidenceUrl() && !attachDocNotes().trim())"
                    class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200/50 transition-all flex items-center gap-2 cursor-pointer">
              @if (savingAttachDoc()) {
                <span class="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></span>
                Guardando...
              } @else {
                <span>Guardar Soportes</span>
              }
            </button>
          </div>
        </div>
      </div>
    }

  `,
  styles: []
})
export class MovementsPageComponent implements OnInit {
  openDocumentModal(mov: Movement, modal: MovementDocumentModalComponent) {
    const dest = this.locations().find(l => l.id === mov.destinationLocationId) || mov.destinationLocation;
    modal.open(mov, dest);
  }

  handleMovementUpdated(updated: Movement) {
    this.movements.update(list => list.map(m => m.id === updated.id ? { ...m, notes: updated.notes } : m));
  }
  getSimCardsNumbers(simCards: any[]): string {
    if (!simCards || simCards.length === 0) return '';
    return simCards.map((s: any) => s.numero).join(' - ');
  }

  getMovementTypeLabel(type: string): string {
    return MOVEMENT_TYPE_LABELS[type] || type;
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
  destinationAreaId = signal<string>('');

  getAvailableDestinationAreas(): Area[] {
    const dest = this.selectedDestination();
    return dest?.areas || [];
  }

  onDestinationAreaChange(areaId: string) {
    this.destinationAreaId.set(areaId);
    this.responsibleId = '';
  }

  onMovementTypeChange(newType: string) {
    this.movementType = newType;
    this.destinationAreaId.set('');
    this.responsibleId = '';

    const isLocalSIM = ['SIM_ASIGNACION', 'SIM_CAMBIO', 'SIM_RETIRO', 'SIM_RETIRO_TOTAL'].includes(newType);
    if (newType === 'TRASLADO_AREA' || newType === 'HURTO_PERDIDA' || isLocalSIM) {
      const activo = this.selectedActivo();
      if (activo) {
        const loc = activo.location || this.locations().find(l => l.id === (activo.locationId || (activo as any).location?.id));
        if (loc) {
          this.selectedDestination.set(loc);
          this.destinationId = loc.id;
          this.destinationSearchQuery.set(loc.nombre);
        }
        if (newType === 'HURTO_PERDIDA' || isLocalSIM) {
          const currentRespId = activo.responsibleId || (activo as any).responsible?.id;
          if (currentRespId) {
            this.responsibleId = currentRespId;
          }
        }
      } else {
        this.clearDestinationSelection();
      }
    } else {
      this.clearDestinationSelection();
    }
  }

  // 👇 Guarda los correos de los destinatarios elegidos
  selectedEmails = signal<string[]>([]);
  showAllRecipients = signal<boolean>(false);

  // 👇 Computa la lista de responsables relevantes (sedes origen y destino + custodio actual + receptor)
  relevantResponsibles = computed<Responsable[]>(() => {
    const all = this.responsables().filter(r => r.estado === 'ACTIVO' && !!r.email);
    if (this.showAllRecipients()) {
      return all;
    }

    const originLocId = this.originId();
    const destLocId = this.destinationId;
    const currentRespId = this.selectedActivo()?.responsibleId || (this.selectedActivo() as any)?.responsible?.id;
    const receiverRespId = this.responsibleId;

    // Si no hay sedes seleccionadas aún, mostramos los que coincidan con el receptor o custodio
    if (!originLocId && !destLocId) {
      return all.filter(r => r.id === currentRespId || r.id === receiverRespId);
    }

    // Filtramos los responsables asignados a la sede origen o sede destino, o que sean el custodio/receptor
    return all.filter(r => {
      const inOrigin = originLocId && r.locationIds?.includes(originLocId);
      const inDest = destLocId && r.locationIds?.includes(destLocId);
      const isCurrent = currentRespId && r.id === currentRespId;
      const isReceiver = receiverRespId && r.id === receiverRespId;
      return inOrigin || inDest || isCurrent || isReceiver;
    });
  });

  onResponsibleChange(newId: string) {
    this.responsibleId = newId;
    if (newId) {
      const resp = this.responsables().find(r => r.id === newId);
      if (resp && resp.email) {
        const current = this.selectedEmails();
        if (!current.includes(resp.email)) {
          this.selectedEmails.set([...current, resp.email]);
        }
      }
    }
  }

  toggleShowAllRecipients() {
    this.showAllRecipients.set(!this.showAllRecipients());
  }

  toggleEmail(email: string) {
    const current = this.selectedEmails();
    if (current.includes(email)) {
      this.selectedEmails.set(current.filter(e => e !== email));
    } else {
      this.selectedEmails.set([...current, email]);
    }
  }

  selectAllRelevantEmails() {
    const emails = this.relevantResponsibles()
      .map(r => r.email)
      .filter((email): email is string => !!email);
    this.selectedEmails.set(emails);
  }

  clearAllEmails() {
    this.selectedEmails.set([]);
  }

  isReceiver(email: string): boolean {
    if (!this.responsibleId) return false;
    const resp = this.responsables().find(r => r.id === this.responsibleId);
    return resp?.email === email;
  }

  isCurrentCustodian(email: string): boolean {
    const activo = this.selectedActivo();
    if (!activo) return false;
    const custodianEmail = activo.responsible?.email;
    if (custodianEmail) return custodianEmail === email;
    const currentRespId = activo.responsibleId || (activo as any).responsible?.id;
    if (currentRespId) {
      const resp = this.responsables().find(r => r.id === currentRespId);
      return resp?.email === email;
    }
    return false;
  }

  public roleService = inject(RoleService);
  isAdmin = computed(() => this.roleService.isAdmin());

  movementTypes = Object.entries(MOVEMENT_TYPE_LABELS);
  filteredMovementTypes = computed(() => {
    const activo = this.selectedActivo();
    const mode = this.operationMode();
    const canHurto = this.roleService.canRegisterHurto();

    if (mode === 'SIM') {
      return this.movementTypes.filter(([key]) => key === 'SIM_TRASLADO');
    }

    // Excluimos movimientos internos o automáticos que no se registran manualmente de esta forma
    let types = this.movementTypes.filter(([key]) =>
      !['SIM_TRASLADO', 'REINGRESO_SOPORTE', 'RETORNO_POR_RECHAZO'].includes(key)
    );

    // Restringir HURTO_PERDIDA únicamente a usuarios con rol ADMIN
    if (!canHurto) {
      types = types.filter(([key]) => key !== 'HURTO_PERDIDA');
    }

    if (activo) {
      if (activo.estado === 'MANTENIMIENTO') {
        const loc = this.locations().find(l => l.id === activo.locationId);
        const originType = loc?.tipo;
        const isOriginBodega = originType === 'PUNTO_TI' || originType === 'BODEGA';
        const hasSims = (activo.simCards?.length || 0) > 0;

        if (originType === 'PROVEEDOR') {
          // Si está en Proveedor y en mantenimiento, solo puede retornar de proveedor
          types = types.filter(([key]) => key === 'RETORNO_PROVEEDOR');
        } else if (isOriginBodega) {
          // Si está en Bodega/Punto TI y en mantenimiento, puede enviarse a proveedor, trasladarse a otra Bodega o retirar SIMs
          types = types.filter(([key]) => {
            if (['ENVIO_PROVEEDOR', 'TRASLADO_REGIONAL'].includes(key)) return true;
            if (hasSims && ['SIM_RETIRO', 'SIM_RETIRO_TOTAL'].includes(key)) return true;
            return false;
          });
        } else {
          // Si está en una Oficina y en mantenimiento: puede trasladarse a Bodega TI o retirar sus SIMs
          types = types.filter(([key]) => {
            if (key === 'TRASLADO_REGIONAL') return true;
            if (hasSims && ['SIM_RETIRO', 'SIM_RETIRO_TOTAL'].includes(key)) return true;
            return false;
          });
        }
      } else {
        // Si no está en mantenimiento:
        // - No se permite Retorno de Proveedor
        // - Envío a Proveedor solo se permite si el activo está físicamente en una Bodega / Punto TI
        const loc = this.locations().find(l => l.id === activo.locationId);
        const originType = loc?.tipo;
        const isOriginBodega = originType === 'PUNTO_TI' || originType === 'BODEGA';
        if (isOriginBodega) {
          types = types.filter(([key]) => key !== 'RETORNO_PROVEEDOR');
        } else {
          types = types.filter(([key]) => key !== 'RETORNO_PROVEEDOR' && key !== 'ENVIO_PROVEEDOR');
        }
      }
    } else {
      types = types.filter(([key]) => !['RETORNO_PROVEEDOR', 'ENVIO_PROVEEDOR'].includes(key));
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
  uploadingFile = signal(false);
  documentUrl = signal<string | null>(null);
  documentFileName = '';
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

    // 2. Regla: Permitir enviar a la misma oficina para traslados internos entre áreas/responsables.
    // if (origin) {
    //   todos = todos.filter(loc => loc.id !== origin);
    // }

    // 3. Regla: Restricciones específicas por tipo de movimiento
    const isBodegaType = (tipo?: string) => tipo === 'PUNTO_TI' || tipo === 'BODEGA';
    if (this.movementType === 'ENVIO_PROVEEDOR') {
      todos = todos.filter(loc => loc.tipo === 'PROVEEDOR');
    } else if (this.movementType === 'RETORNO_PROVEEDOR') {
      todos = todos.filter(loc => isBodegaType(loc.tipo));
    } else if (this.movementType === 'TRASLADO_REGIONAL' && isMaintenance) {
      todos = todos.filter(loc => isBodegaType(loc.tipo));
    } else if (isMaintenance) {
      const originType = this.locations().find(loc => loc.id === origin)?.tipo;
      if (originType === 'PROVEEDOR') {
        todos = todos.filter(loc => isBodegaType(loc.tipo));
      } else {
        todos = todos.filter(loc => isBodegaType(loc.tipo) || loc.tipo === 'PROVEEDOR');
      }
    }

    if (!term) return todos;
    return todos.filter(loc =>
      loc.nombre.toLowerCase().includes(term) ||
      loc.code.toLowerCase().includes(term)
    );
  });

  // 👇 Filtra los responsables según la Sede Destino y el Área Destino seleccionadas (sin fallback)
  filteredResponsiblesForDestination = computed(() => {
    const dest = this.selectedDestination();
    const all = this.responsables().filter(r => r.estado === 'ACTIVO');

    if (!dest) {
      return [];
    }

    // Filtra solo los responsables que tienen asignada la sede destino
    let assigned = all.filter(r => r.locationIds?.includes(dest.id));

    // Si se ha seleccionado un área destino específica, filtrar por área
    // EXCEPCIÓN: Para TRASLADO_AREA NO filtramos por área actual del responsable,
    // ya que el receptor es quien asumirá la custodia en el área destino (puede venir de cualquier área).
    const areaId = this.destinationAreaId();
    if (areaId && areaId !== '8b8b9c8c-1e2a-43cf-8a27-024848bb0000' && this.movementType !== 'TRASLADO_AREA') {
      assigned = assigned.filter(r => r.area?.id === areaId);
    }

    return assigned;
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

  availableBodegaSimsInOrigin = computed(() => {
    const activeOriginId = this.originId();
    return this.simCards().filter(s =>
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
    const activeOriginId = this.originId();
    const available = this.simCards().filter(s => s.estado === 'BODEGA' && s.locationId !== activeOriginId);
    
    const countsByLoc: Record<string, number> = {};
    for (const sim of available) {
      if (sim.locationId) {
        countsByLoc[sim.locationId] = (countsByLoc[sim.locationId] || 0) + 1;
      }
    }

    const locMap = this.locations().reduce((acc, l) => ({ ...acc, [l.id]: l.nombre }), {} as Record<string, string>);
    
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

  requestSimTransferToCurrentLocation() {
    const activo = this.selectedActivo();
    const currentLoc = activo?.location || this.locations().find(l => l.id === this.originId());
    
    this.setOperationMode('SIM');
    if (currentLoc) {
      this.selectDestination(currentLoc);
    }
  }

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
    this.destinationAreaId.set('');
    this.responsibleId = '';
  }
  clearDestinationSelection() {
    this.selectedDestination.set(null);
    this.destinationId = '';
    this.destinationSearchQuery.set('');
    this.showDestinationDropdown.set(false);
    this.destinationAreaId.set('');
    this.responsibleId = '';
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

    // Excluir BAJA, RECHAZADO, EN_TRANSITO y activos con movimientos activos pendientes/en tránsito
    const todos = this.activos().filter(a =>
      a.estado !== 'BAJA' &&
      a.estado !== 'RECHAZADO' &&
      a.estado !== 'EN_TRANSITO' &&
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
  qrCodeDataUrl = signal<string | null>(null);
  magicLinkTab = signal<'link' | 'qr'>('link');
  modalNotifyWhatsApp = signal<boolean>(true);
  modalRecipientPhone = signal<string | null>(null);
  modalRecipientName = signal<string | null>(null);

  // Cancel Movement Modal State (Auditoría)
  cancelMovementTarget = signal<Movement | null>(null);
  cancelReason = signal<string>('');
  isCancelling = signal<boolean>(false);
  cancelToastMessage = signal<string | null>(null);

  private route = inject(ActivatedRoute);
  private movementRepo = inject(MovementRepository);

  showAttachDocModal = signal(false);
  selectedMovementForDoc = signal<Movement | null>(null);
  attachDocUrl = signal('');
  attachDocFileName = signal('');
  attachReceivedEvidenceUrl = signal('');
  attachReceivedFileName = signal('');
  attachDocNotes = signal('');
  uploadingAttachDoc = signal(false);
  uploadingAttachEvidence = signal(false);
  savingAttachDoc = signal(false);
  attachSuccessMessage = signal<string | null>(null);
  attachModalError = signal<string | null>(null);

  constructor(
    private getAllLocations: GetAllLocationsUseCase,
    private getAllResponsables: GetAllResponsablesUseCase,
    private getAllMovements: GetAllMovementsUseCase,
    private registerMovement: RegisterMovementUseCase,
    private dispatchMovement: DispatchMovementUseCase,
    private receiveMovement: ReceiveMovementUseCase,
    private rejectMovementUC: RejectMovementUseCase,
    private cancelMovementUC: CancelMovementUseCase,
    private getOneActivo: GetOneActivoUseCase,
    private getAllActivos: GetAllActivosUseCase,
    private getAllSimCards: GetAllSimCardsUseCase,
    private simCardRepo: SimCardRepository,
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        const tab = (params['tab'] as string).toUpperCase();
        if (tab === 'PENDING' || tab === 'HISTORY') {
          this.activeTab.set(tab as 'PENDING' | 'HISTORY');
        }
      }
      if (params['search']) {
        this.searchMovementQuery.set(params['search']);
      }
    });
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
    this.getAllMovements.execute().subscribe({
      next: (movs) => {
        this.movements.set(movs);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar movimientos:', err);
        this.loading.set(false);
      }
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
    if (activo.estado === 'EN_TRANSITO' || (activo.estado as any) === 'EN_TRANSIT') {
      alert(`El equipo con placa "${activo.placa}" se encuentra actualmente EN TRÁNSITO y no puede ser seleccionado para un nuevo movimiento.`);
      return;
    }

    this.selectedActivo.set(activo);
    this.searchQuery.set(activo.placa);
    const newOriginId = activo.locationId || (activo as any).location?.id || '';
    this.originId.set(newOriginId);

    // Si el tipo de movimiento seleccionado actualmente no está permitido para el nuevo activo, se limpia
    const allowedKeys = this.filteredMovementTypes().map(([key]) => key);
    if (this.movementType && !allowedKeys.includes(this.movementType)) {
      this.movementType = '';
    }

    const isLocalSIM = ['SIM_ASIGNACION', 'SIM_CAMBIO', 'SIM_RETIRO', 'SIM_RETIRO_TOTAL'].includes(this.movementType);
    if ((this.movementType === 'TRASLADO_AREA' || isLocalSIM || this.movementType === 'HURTO_PERDIDA') && (activo.location || (activo as any).location || this.locations().find(l => l.id === newOriginId))) {
      const loc = activo.location || (activo as any).location || this.locations().find(l => l.id === newOriginId);
      if (loc) {
        this.selectedDestination.set(loc);
        this.destinationId = loc.id;
        this.destinationSearchQuery.set(loc.nombre);
      }
      if (isLocalSIM || this.movementType === 'HURTO_PERDIDA') {
        const currentRespId = activo.responsibleId || (activo as any).responsible?.id || '';
        if (currentRespId) {
          this.responsibleId = currentRespId;
        }
      }
    } else {
      const dest = this.selectedDestination();
      if (dest) {
        const isSameAsOrigin = dest.id === newOriginId;
        const originType = this.locations().find(loc => loc.id === newOriginId)?.tipo;
        const isMaintenance = activo.estado === 'MANTENIMIENTO';
        let isInvalidForMaintenance = false;
        const isDestBodega = dest.tipo === 'PUNTO_TI' || dest.tipo === 'BODEGA';
        if (this.movementType === 'ENVIO_PROVEEDOR') {
          isInvalidForMaintenance = dest.tipo !== 'PROVEEDOR';
        } else if (this.movementType === 'RETORNO_PROVEEDOR') {
          isInvalidForMaintenance = !isDestBodega;
        } else if (this.movementType === 'TRASLADO_REGIONAL' && isMaintenance) {
          isInvalidForMaintenance = !isDestBodega;
        } else if (isMaintenance) {
          isInvalidForMaintenance = (!isDestBodega && dest.tipo !== 'PROVEEDOR') ||
            (dest.tipo === 'PROVEEDOR' && originType === 'PROVEEDOR');
        }

        if (isSameAsOrigin || isInvalidForMaintenance) {
          this.clearDestinationSelection();
        }
      }
    }

    // Preseleccionar el correo del custodio actual del activo si existe
    const currentRespEmail = activo.responsible?.email;
    if (currentRespEmail) {
      const current = this.selectedEmails();
      if (!current.includes(currentRespEmail)) {
        this.selectedEmails.set([...current, currentRespEmail]);
      }
    } else if (activo.responsibleId) {
      const resp = this.responsables().find(r => r.id === activo.responsibleId);
      if (resp && resp.email) {
        const current = this.selectedEmails();
        if (!current.includes(resp.email)) {
          this.selectedEmails.set([...current, resp.email]);
        }
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

    // Para TRASLADO_AREA o HURTO_PERDIDA, el destino es la misma sede que el origen
    const isAreaTransfer = this.movementType === 'TRASLADO_AREA';
    const isTheftOrLoss = this.movementType === 'HURTO_PERDIDA';
    if ((isAreaTransfer || isTheftOrLoss) && this.selectedActivo()) {
      this.destinationId = this.originId();
      if (isTheftOrLoss && !this.responsibleId) {
        this.responsibleId = this.selectedActivo()?.responsibleId || (this.selectedActivo() as any)?.responsible?.id || '';
      }
    }

    // Validación para HURTO_PERDIDA: obligatorio el denuncio policial
    if (isTheftOrLoss) {
      if (!this.documentUrl()) {
        alert('Para registrar un reporte de Hurto o Pérdida, es OBLIGATORIO adjuntar el archivo del denuncio policial (Fiscalía / Policía).');
        return;
      }
    }

    // Validación adicional para TRASLADO_AREA: se requiere área destino
    if (isAreaTransfer && !this.destinationAreaId()) {
      alert('Para un traslado entre áreas, debes seleccionar el Área Destino.');
      return;
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
    } else if (this.movementType === 'SIM_RETIRO') {
      if (!this.selectedSimToRemove) {
        alert('Por favor selecciona la SIM a retirar del equipo.');
        return;
      }
    } else if (this.movementType === 'SIM_RETIRO_TOTAL') {
      const activeSims = this.selectedActivo()?.simCards || [];
      if (activeSims.length === 0) {
        alert('Este equipo no tiene SIMs asignadas para retirar.');
        return;
      }
    }

    const simCardIds: string[] = [];
    if (this.movementType === 'SIM_TRASLADO' && this.selectedSimForTransfer()) {
      simCardIds.push(this.selectedSimForTransfer()!.id);
    } else if (this.movementType === 'SIM_ASIGNACION' && this.selectedSimForAssign) {
      simCardIds.push(this.selectedSimForAssign.id);
    } else if (this.movementType === 'SIM_CAMBIO' && this.selectedSimForAssign) {
      simCardIds.push(this.selectedSimForAssign.id);
    } else if (this.movementType === 'SIM_RETIRO' && this.selectedSimToRemove) {
      simCardIds.push(this.selectedSimToRemove.id);
    }

    const dto: any = {
      type: this.movementType,
      originLocationId: this.originId(),
      destinationLocationId: this.destinationId,
      responsibleId: this.responsibleId,
      activoIds: this.movementType === 'SIM_TRASLADO' ? [] : [this.selectedActivo()!.id],
      simCardIds,
      notes: this.notes,
      documentUrl: this.documentUrl() || undefined,
      recipients: this.selectedEmails(),
      // Datos para ejecución atómica de operaciones SIM en el backend
      simCardIdToAssign: this.selectedSimForAssign?.id,
      simCardIdToReplace: this.selectedSimToReplace?.id,
      simCardIdToRemove: this.selectedSimToRemove?.id,
      removedSimNewState: this.removedSimNewState,
      simStates: this.simStates
    };

    // Incluir área destino solo para TRASLADO_AREA
    if (this.movementType === 'TRASLADO_AREA' && this.destinationAreaId()) {
      dto.destinationAreaId = this.destinationAreaId();
    }

    this.registerMovement.execute(dto).subscribe({
      next: () => {
        this.finishSave();
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al registrar el movimiento';
        this.showError.set(msg);
        this.loading.set(false);
      }
    });
  }

  onDocumentFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      this.showError.set('El archivo no puede superar los 5MB.');
      return;
    }
    this.documentFileName = file.name;
    this.uploadingFile.set(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.http.post<{ url: string }>(`${environment.apiUrl}/files/upload`, {
        base64,
        fileName: file.name,
        folder: 'soportes'
      }).subscribe({
        next: (res) => {
          this.documentUrl.set(res.url);
          this.uploadingFile.set(false);
        },
        error: () => {
          this.uploadingFile.set(false);
          this.showError.set('Error al subir el archivo soporte.');
        }
      });
    };
    reader.readAsDataURL(file);
  }

  removeDocumentFile() {
    this.documentUrl.set(null);
    this.documentFileName = '';
  }

  uploadingModalFile = signal(false);
  modalFileName = '';

  onModalFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      this.showError.set('El archivo no puede superar los 5MB.');
      return;
    }
    this.modalFileName = file.name;
    this.uploadingModalFile.set(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.http.post<{ url: string }>(`${environment.apiUrl}/files/upload`, {
        base64,
        fileName: file.name,
        folder: 'soportes'
      }).subscribe({
        next: (res) => {
          this.modalEvidenceUrl = res.url;
          this.uploadingModalFile.set(false);
        },
        error: () => {
          this.uploadingModalFile.set(false);
          this.showError.set('Error al subir el soporte.');
        }
      });
    };
    reader.readAsDataURL(file);
  }

  removeModalFile() {
    this.modalEvidenceUrl = '';
    this.modalFileName = '';
  }

  // Soporte de Comodato / Acta Firmada en Modal de Despacho (Independiente y No Excluyente)
  uploadingModalDocFile = signal(false);
  modalDocFileName = '';
  modalDocumentUrl = '';

  onModalDocFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo no puede superar los 5MB.');
      return;
    }
    this.modalDocFileName = file.name;
    this.uploadingModalDocFile.set(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.http.post<{ url: string }>(`${environment.apiUrl}/files/upload`, {
        base64,
        fileName: file.name,
        folder: 'soportes'
      }).subscribe({
        next: (res) => {
          this.modalDocumentUrl = res.url;
          this.uploadingModalDocFile.set(false);
        },
        error: () => {
          this.uploadingModalDocFile.set(false);
          alert('Error al subir el comodato o acta.');
        }
      });
    };
    reader.readAsDataURL(file);
  }

  removeModalDocFile() {
    this.modalDocumentUrl = '';
    this.modalDocFileName = '';
  }

  finishSave() {
    this.showSuccess.set(true);
    this.showError.set(null);
    this.searchQuery.set('');
    this.selectedActivo.set(null);
    this.notes = '';
    this.documentUrl.set(null);
    this.documentFileName = '';
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
    setTimeout(() => this.showSuccess.set(false), 8000);
  }

  // Modal Logic
  openDispatchModal(movement: Movement) {
    this.selectedMovementForAction = movement;
    this.actionType = 'dispatch';
    this.modalEvidenceUrl = movement.evidenceUrl || '';
    this.modalFileName = movement.evidenceUrl ? '🚚 Guía de envío existente' : '';
    this.modalDocumentUrl = movement.documentUrl || '';
    this.modalDocFileName = movement.documentUrl ? '📋 Comodato / Acta existente' : '';

    // Detectar si el responsable/receptor tiene número de celular registrado
    const resp = this.responsables().find(r => r.id === movement.responsibleId) || movement.responsible;
    const phone = resp?.telefono?.trim();
    if (phone) {
      this.modalRecipientPhone.set(phone);
      this.modalRecipientName.set(resp?.nombre || 'Receptor');
      this.modalNotifyWhatsApp.set(true);
    } else {
      this.modalRecipientPhone.set(null);
      this.modalRecipientName.set(resp?.nombre || null);
      this.modalNotifyWhatsApp.set(false);
    }
  }
  openReceiveModal(movement: Movement) {
    this.selectedMovementForAction = movement;
    this.actionType = 'receive';
    this.modalReceiverId = '';
    // evidenceUrl del receptor — empieza vacío para que el receptor suba su soporte
    this.modalEvidenceUrl = movement.receivedEvidenceUrl || '';
    this.modalFileName = movement.receivedEvidenceUrl ? '📄 Soporte de recepción existente' : '';
    this.modalDestinationId = movement.destinationLocationId || '';
  }
  openRouteModal(movement: Movement) {
    this.selectedMovementForAction = movement;
    this.actionType = 'route';
  }
  closeModal() {
    this.selectedMovementForAction = null;
    this.actionType = null;
    this.modalEvidenceUrl = '';
    this.modalFileName = '';
    this.modalDocumentUrl = '';
    this.modalDocFileName = '';
    this.showRejectionForm.set(false);
    this.rejectionReason.set('');
    this.magicLinkUrl.set(null);
    this.qrCodeDataUrl.set(null);
  }
  confirmAction() {
    if (!this.selectedMovementForAction) return;
    const id = this.selectedMovementForAction.id;

    if (this.actionType === 'dispatch') {
      if (!this.modalEvidenceUrl && !this.modalDocumentUrl) {
        return alert('Por favor, adjunta al menos la Guía de Envío o el Comodato/Acta firmado para despachar.');
      }
      const recipientsToSend = this.selectedEmails().length > 0 ? this.selectedEmails() : undefined;
      const shouldNotifyWhatsApp = this.modalRecipientPhone() ? this.modalNotifyWhatsApp() : false;

      this.dispatchMovement.execute(
        id, 
        this.modalEvidenceUrl || undefined, 
        this.modalDocumentUrl || undefined, 
        recipientsToSend,
        shouldNotifyWhatsApp
      ).subscribe({
        next: () => { this.loadMovements(); this.closeModal(); },
        error: (err) => alert(err.error?.message || err.message || 'Error al procesar el despacho')
      });
    } else if (this.actionType === 'receive') {
      if (!this.modalReceiverId || !this.modalEvidenceUrl) return alert('Completa datos de recepción y soporte.');
      this.receiveMovement.execute(id, this.modalReceiverId, this.modalEvidenceUrl, this.modalDestinationId).subscribe({
        next: () => { this.loadMovements(); this.closeModal(); },
        error: (err) => alert(err.error?.message || err.message || 'Error al procesar la recepción')
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

  // Cancel Movement Modal Logic (Auditoría e Integridad)
  openCancelModal(movement: Movement) {
    this.cancelMovementTarget.set(movement);
    this.cancelReason.set('');
  }

  closeCancelModal() {
    this.cancelMovementTarget.set(null);
    this.cancelReason.set('');
    this.isCancelling.set(false);
  }

  confirmCancelMovement() {
    const target = this.cancelMovementTarget();
    if (!target) return;
    const reason = this.cancelReason().trim();
    if (!reason) {
      alert('Por favor, ingresa el motivo de la anulación.');
      return;
    }

    this.isCancelling.set(true);
    this.cancelMovementUC.execute(target.id, reason).subscribe({
      next: () => {
        this.isCancelling.set(false);
        this.closeCancelModal();
        this.cancelToastMessage.set(`El traslado #${target.id.slice(-6).toUpperCase()} ha sido ANULADO correctamente y los equipos han sido liberados.`);
        setTimeout(() => this.cancelToastMessage.set(null), 6000);
        this.loadMovements();
      },
      error: (err) => {
        this.isCancelling.set(false);
        alert(err.error?.message || err.message || 'Error al anular el traslado');
      }
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
      alert('Este movimiento no tiene un enlace de autenticación única.');
      return;
    }
    const link = `${window.location.origin}/public/receive/${movement.magicLinkToken}`;
    this.magicLinkUrl.set(link);
    this.magicLinkTab.set('link');

    // Auto-copiar directamente al portapapeles
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(link).catch(() => {});
    }

    // Generar código QR a partir del enlace
    QRCode.toDataURL(link, { margin: 2, scale: 6 })
      .then(url => {
        this.qrCodeDataUrl.set(url);
      })
      .catch(err => {
        console.error('Error al generar QR:', err);
        this.qrCodeDataUrl.set(null);
      });
  }

  closeMagicLinkModal() {
    this.magicLinkUrl.set(null);
    this.qrCodeDataUrl.set(null);
  }

  copyToClipboard() {
    const link = this.magicLinkUrl();
    if (link) {
      navigator.clipboard.writeText(link).then(() => {
        alert('Enlace copiado al portapapeles.');
      }).catch(err => {
        console.error('Error al copiar:', err);
      });
    }
  }

  downloadQrCode() {
    const dataUrl = this.qrCodeDataUrl();
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `QR-Autenticacion-Unica.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  openAttachDocumentModal(mov: Movement) {
    this.selectedMovementForDoc.set(mov);
    this.attachDocUrl.set(mov.documentUrl || '');
    this.attachDocFileName.set(mov.documentUrl ? mov.documentUrl.split('/').pop() || 'Comodato adjunto' : '');
    this.attachReceivedEvidenceUrl.set(mov.receivedEvidenceUrl || '');
    this.attachReceivedFileName.set(mov.receivedEvidenceUrl ? mov.receivedEvidenceUrl.split('/').pop() || 'Soporte de recepción' : '');
    this.attachDocNotes.set('');
    this.attachModalError.set(null);
    this.showAttachDocModal.set(true);
  }

  closeAttachDocModal() {
    this.showAttachDocModal.set(false);
    this.selectedMovementForDoc.set(null);
  }

  onAttachDocFileSelected(event: Event, type: 'document' | 'evidence') {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      this.showError.set('El archivo no puede superar los 5MB.');
      return;
    }
    if (type === 'document') {
      this.uploadingAttachDoc.set(true);
      this.attachDocFileName.set(file.name);
    } else {
      this.uploadingAttachEvidence.set(true);
      this.attachReceivedFileName.set(file.name);
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.http.post<{ url: string }>(`${environment.apiUrl}/files/upload`, {
        base64,
        fileName: file.name,
        folder: 'soportes'
      }).subscribe({
        next: (res) => {
          if (type === 'document') {
            this.attachDocUrl.set(res.url);
            this.uploadingAttachDoc.set(false);
          } else {
            this.attachReceivedEvidenceUrl.set(res.url);
            this.uploadingAttachEvidence.set(false);
          }
        },
        error: () => {
          if (type === 'document') this.uploadingAttachDoc.set(false);
          else this.uploadingAttachEvidence.set(false);
          this.showError.set('Error al subir el archivo soporte.');
        }
      });
    };
    reader.readAsDataURL(file);
  }

  removeAttachDocFile(type: 'document' | 'evidence') {
    if (type === 'document') {
      this.attachDocUrl.set('');
      this.attachDocFileName.set('');
    } else {
      this.attachReceivedEvidenceUrl.set('');
      this.attachReceivedFileName.set('');
    }
  }

  confirmSaveAttachedDocuments() {
    const mov = this.selectedMovementForDoc();
    if (!mov) return;
    this.attachModalError.set(null);
    this.savingAttachDoc.set(true);
    this.movementRepo.attachDocuments(mov.id, {
      documentUrl: this.attachDocUrl() || undefined,
      receivedEvidenceUrl: this.attachReceivedEvidenceUrl() || undefined,
      notes: this.attachDocNotes().trim() || undefined
    }).subscribe({
      next: (updatedMov) => {
        this.movements.update(list => list.map(m => m.id === mov.id ? {
          ...m,
          documentUrl: updatedMov.documentUrl ?? this.attachDocUrl() ?? m.documentUrl,
          receivedEvidenceUrl: updatedMov.receivedEvidenceUrl ?? this.attachReceivedEvidenceUrl() ?? m.receivedEvidenceUrl,
          notes: updatedMov.notes ?? m.notes
        } : m));
        this.loadMovements();
        this.savingAttachDoc.set(false);
        this.showAttachDocModal.set(false);
        this.selectedMovementForDoc.set(null);
        this.attachSuccessMessage.set('Soportes actualizados correctamente con registro de auditoría.');
        setTimeout(() => this.attachSuccessMessage.set(null), 4000);
      },
      error: (err) => {
        this.savingAttachDoc.set(false);
        const msg = err.error?.message || err.message || 'Error al guardar los documentos de soporte.';
        this.attachModalError.set(msg);
      }
    });
  }
}