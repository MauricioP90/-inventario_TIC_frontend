import { Component, Input, Output, EventEmitter, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment';
import { Location } from '../../../../locations/domain/models/location.model';
import { Responsable } from '../../../../responsables/domain/models/responsable.model';
import { Activo } from '../../../../inventory/domain/models/activo.model';
import { SimCard } from '../../../../sim-cards/domain/models/sim-card.model';
import { Movement, MOVEMENT_TYPE_LABELS } from '../../../domain/models/movement.model';
import { Area } from '../../../../responsables/domain/models/area.model';
import { RegisterMovementUseCase } from '../../../application/use-cases/register-movement.use-case';
import { GetOneActivoUseCase } from '../../../../inventory/application/use-cases/get-one-activo.use-case';
import { RoleService } from '../../../../../core/auth/services/role.service';

@Component({
  selector: 'app-movement-create-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
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
            <span>📱</span> Operaciones de SIM
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
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Relación de Equipos del Traslado *
              </label>
              <div class="flex items-center gap-2">
                @if (selectedActivos().length > 0) {
                  <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full border transition-all"
                        [ngClass]="selectedActivos().length >= maxAllowedActivos() 
                          ? 'bg-amber-50 text-amber-700 border-amber-200' 
                          : 'bg-indigo-50 text-indigo-700 border-indigo-100/60'">
                    {{ selectedActivos().length }} / {{ maxAllowedActivos() }} {{ selectedActivos().length === 1 ? 'equipo' : 'equipos' }}
                    @if (selectedActivos().length >= maxAllowedActivos()) {
                      <span class="ml-1 text-[10px] font-extrabold uppercase">(Límite alcanzado)</span>
                    }
                  </span>
                }
                @if (isSingleAssetMode()) {
                  <span class="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200" title="Requiere denuncio policial individual">
                    🚨 Denuncio Individual (Máx 1)
                  </span>
                } @else {
                  <span class="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200" title="Garantiza 1 sola hoja de acta oficial (hasta 10 equipos por remesa)">
                    📄 Máx 10 por Envío
                  </span>
                }
              </div>
            </div>
            <div class="relative group">
              <input type="text" 
                     [ngModel]="searchQuery()" 
                     (input)="onSearchInput($any($event.target).value)" 
                     placeholder="Escriba Placa, Serie, Marca o Modelo para agregar a la relación..."
                     class="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm">
              
              @if (searchQuery()) {
                <button (click)="searchQuery.set('')" 
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
                        <span class="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold uppercase">{{ activo.location?.nombre || 'Sede N/A' }}</span>
                      </div>
                      <div class="flex items-center justify-between">
                        <p class="text-[10px] text-slate-500">{{ activo.marca }} {{ activo.modelo || '' }} - S/N: {{ activo.serial }}</p>
                        <span class="text-[11px] text-indigo-600 font-bold hover:underline">+ Agregar</span>
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

          <!-- MODO MÚLTIPLE: Relación de Equipos del Traslado -->
          @if (isMultiAssetMode() && selectedActivos().length > 0) {
            <div class="space-y-2.5 animate-in fade-in slide-in-from-top-1">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                  <span>Relación de Equipos del Traslado</span>
                  <span class="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {{ selectedActivos().length }} de {{ maxAllowedActivos() }} máx
                  </span>
                </span>
                @if (selectedActivos().length > 1) {
                  <button type="button" 
                          (click)="clearAllActivos()" 
                          class="text-[11px] font-medium text-slate-400 hover:text-red-500 transition-colors cursor-pointer">
                    Limpiar lista
                  </button>
                }
              </div>

              <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
                @for (activo of selectedActivos(); track activo.id; let idx = $index) {
                  <div class="p-3 bg-white border border-slate-200/90 hover:border-indigo-300 rounded-xl flex items-center justify-between shadow-xs transition-all">
                    <div class="flex items-center gap-3 min-w-0">
                      <div class="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                        #{{ idx + 1 }}
                      </div>
                      <div class="min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                          <h5 class="font-bold text-slate-800 text-sm leading-none">{{ activo.placa }}</h5>
                          <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            {{ activo.marca }}
                          </span>
                          <span class="text-[11px] font-medium text-slate-500 truncate">
                            {{ activo.modelo || '' }}
                          </span>
                        </div>
                        <p class="text-[11px] text-slate-400 mt-1 font-mono">
                          S/N: {{ activo.serial || 'N/A' }}
                          @if (activo.area?.nombre) {
                            <span class="text-slate-300 mx-1">·</span>
                            <span class="font-sans text-slate-500">Área: {{ activo.area?.nombre }}</span>
                          }
                        </p>
                      </div>
                    </div>

                    <div class="flex items-center gap-2 shrink-0">
                      @if (activo.simCards && activo.simCards.length) {
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100/60 hidden sm:inline-block">
                          📱 {{ activo.simCards.length }} SIM
                        </span>
                      }
                      <button type="button" 
                              (click)="removeActivoFromRelacion(activo.id)" 
                              title="Quitar equipo de la relación"
                              class="w-7 h-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                }
              </div>

              <!-- Resumen de Sede Origen Común -->
              <div class="p-2.5 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center justify-between text-xs text-slate-600">
                <span class="flex items-center gap-1.5">
                  <span class="text-slate-400">📍 Sede de Origen común:</span>
                  <strong class="text-slate-800">{{ originLocationName() }}</strong>
                </span>
                <span class="text-[11px] text-slate-400 hidden sm:inline">
                  Todos los equipos saldrán de esta sede
                </span>
              </div>
            </div>
          }

          <!-- Banner Informativo para Equipo en Mantenimiento -->
          @if (hasEquipmentInMaintenance()) {
            <div class="p-4 bg-amber-50 border border-amber-200/90 rounded-2xl flex items-start gap-3 shadow-xs animate-in fade-in">
              <div class="p-2 bg-amber-100 text-amber-800 rounded-xl text-lg shrink-0">
                🔧
              </div>
              <div>
                <h4 class="text-sm font-bold text-amber-900 leading-tight">Equipo(s) en Estado de MANTENIMIENTO</h4>
                <p class="text-xs text-amber-800 mt-1 leading-relaxed">
                  Uno o más equipos seleccionados cuentan con un proceso de mantenimiento activo. Por regla de control, <strong>solo se permite su traslado hacia Bodega TI / Soporte Técnico</strong> o a un Proveedor.
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
              <input type="text" [value]="originLocationName()" disabled
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
                       [disabled]="!movementType || movementType === 'TRASLADO_AREA' || movementType === 'HURTO_PERDIDA'"
                       [placeholder]="!movementType ? 'Seleccione tipo de movimiento primero...' : (movementType === 'HURTO_PERDIDA' ? 'No aplica (Baja definitiva)' : 'Escriba Código o Nombre de la Sede...')"
                       class="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-700 disabled:bg-slate-100 disabled:text-slate-500">
                
                @if (destinationSearchQuery() && movementType && movementType !== 'TRASLADO_AREA' && movementType !== 'HURTO_PERDIDA') {
                  <button (click)="clearDestinationSelection()" 
                          class="absolute right-3 top-3 text-slate-300 hover:text-slate-500 transition-colors">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                }

                @if (showDestinationDropdown() && filteredDestinations().length > 0 && movementType && movementType !== 'TRASLADO_AREA' && movementType !== 'HURTO_PERDIDA') {
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
          @if (selectedDestination() && movementType && movementType !== 'HURTO_PERDIDA') {
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

          <!-- Responsables (Remitente Actual & Receptor Destino) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <!-- Responsable Remitente (Actual) -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Responsable Remitente (Actual)
              </label>
              <input type="text" [value]="originResponsibleName()" disabled
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
          <!-- MODO SIM: Operaciones de SIM -->
          
          <!-- 1. Selector de Operación SIM -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo de Operación de SIM *</label>
            <select [ngModel]="movementType"
                    (ngModelChange)="onMovementTypeChange($event)"
                    class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none text-sm transition-all font-medium text-slate-700">
              @for (type of filteredSimMovementTypes(); track type[0]) {
                <option [value]="type[0]">{{ type[1] }}</option>
              }
            </select>
          </div>

          @if (movementType === 'SIM_TRASLADO') {
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

            <!-- Vista Previa de SIM Física -->
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
              <!-- Ubicación Origen SIM -->
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
          } @else if (['SIM_ASIGNACION', 'SIM_CAMBIO', 'SIM_RETIRO', 'SIM_RETIRO_TOTAL'].includes(movementType)) {
            <!-- Flujo Operaciones SIM en Celulares / Equipos -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Celular o Equipo Destino *
                </label>
                @if (selectedActivo()) {
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
                
                @if (searchQuery() || selectedActivo()) {
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
            @if (selectedActivo()) {
              <div class="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center text-lg font-bold">
                      📱
                    </div>
                    <div>
                      <h4 class="font-bold text-slate-800 text-sm flex items-center gap-2">
                        {{ selectedActivo()?.placa }}
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {{ selectedActivo()?.marca }} {{ selectedActivo()?.modelo || '' }}
                        </span>
                      </h4>
                      <p class="text-xs text-slate-400 font-mono">Serial: {{ selectedActivo()?.serial || 'N/A' }}</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      📍 {{ selectedActivo()?.location?.nombre || 'Sede N/A' }}
                    </span>
                    <p class="text-[11px] text-slate-500 mt-1">
                      Custodio: <strong class="text-slate-700">{{ selectedActivo()?.responsible?.nombre || 'Sin Custodio' }}</strong>
                    </p>
                  </div>
                </div>

                @if (selectedActivo()?.simCards && selectedActivo()!.simCards!.length > 0) {
                  <div class="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                    <span class="text-[11px] font-bold text-slate-500">SIM Cards actuales ({{ selectedActivo()!.simCards!.length }}/2):</span>
                    @for (sim of selectedActivo()!.simCards; track sim.id) {
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

              <!-- Custodio / Responsable del Equipo -->
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  Custodio / Responsable del Equipo *
                  @if (responsibleId) {
                    <span class="text-emerald-500 text-[10px] font-bold normal-case">✓ Asignado</span>
                  }
                </label>
                <select [ngModel]="responsibleId"
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
        }

        <!-- Observaciones & Documento Soporte -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Observaciones</label>
            <textarea [(ngModel)]="notes"
                      placeholder="Detalles adicionales del movimiento..."
                      rows="2"
                      class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm resize-none"></textarea>
          </div>
          <div class="space-y-4">
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
                    <label class="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg cursor-pointer transition-colors bg-white shadow-2xs" title="Cambiar por otro archivo">
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

        <!-- Notificación de Despacho (Destinatarios de correo) -->
        @if (operationMode() === 'ACTIVO' && movementType && movementType !== 'BAJA_ACTIVO') {
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
                <button type="button" (click)="toggleShowAllRecipients()" class="text-indigo-600 hover:text-indigo-800 font-bold transition-colors cursor-pointer">
                  {{ showAllRecipients() ? '📍 Ver Solo Sedes' : '🌐 Ver Todos' }}
                </button>
                <span class="text-slate-300">|</span>
                <button type="button" (click)="selectAllRelevantEmails()" class="text-slate-600 hover:text-indigo-600 font-semibold transition-colors cursor-pointer">
                  Marcar Todos
                </button>
                <span class="text-slate-300">|</span>
                <button type="button" (click)="clearAllEmails()" class="text-slate-400 hover:text-red-600 font-semibold transition-colors cursor-pointer">
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
                  <button type="button" (click)="toggleShowAllRecipients()" class="mt-1.5 text-indigo-600 font-bold hover:underline cursor-pointer">
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

        <!-- Footer / Botón Submit -->
        <div class="pt-4 flex justify-start">
          <button (click)="saveMovement()"
                  [disabled]="!canSubmit()"
                  class="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center gap-2.5 disabled:opacity-50 cursor-pointer">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
            {{ operationMode() === 'SIM' ? 'Registrar Operación de SIM' : 'Registrar Movimiento' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class MovementCreateFormComponent {
  private registerMovement = inject(RegisterMovementUseCase);
  private getOneActivo = inject(GetOneActivoUseCase);
  public roleService = inject(RoleService);
  private http = inject(HttpClient);

  @Input() locations: Location[] = [];
  @Input() responsables: Responsable[] = [];
  @Input() activos: Activo[] = [];
  @Input() simCards: SimCard[] = [];
  @Input() movements: Movement[] = [];

  @Output() onMovementCreated = new EventEmitter<void>();

  loading = signal(false);
  showSuccess = signal(false);
  showError = signal<string | null>(null);
  isLoadingPlaca = signal(false);

  movementTypes = Object.entries(MOVEMENT_TYPE_LABELS);
  movementType = '';
  originId = signal('');
  destinationId = '';
  responsibleId = '';
  destinationAreaId = signal<string>('');
  searchQuery = signal('');
  notes = '';
  uploadingFile = signal(false);
  documentUrl = signal<string | null>(null);
  documentFileName = '';
  selectedActivo = signal<Activo | null>(null);
  selectedActivos = signal<Activo[]>([]);

  operationMode = signal<'ACTIVO' | 'SIM'>('ACTIVO');

  // Autocomplete Sedes Origen / Destino
  originSearchQuery = signal('');
  showOriginDropdown = signal(false);
  selectedOrigin = signal<Location | null>(null);

  destinationSearchQuery = signal('');
  showDestinationDropdown = signal(false);
  selectedDestination = signal<Location | null>(null);

  // SIM Cards
  simSearchQuery = '';
  showSimDropdown = false;
  selectedSimForAssign: SimCard | null = null;
  selectedSimToReplace: SimCard | null = null;
  removedSimLocationId = '';
  selectedSimToRemove: SimCard | null = null;
  removedSimNewState: 'BODEGA' | 'BAJA' = 'BODEGA';
  simDestinations: string[] = ['', ''];
  simStates: ('BODEGA' | 'BAJA')[] = ['BODEGA', 'BODEGA'];

  selectedSimForTransfer = signal<SimCard | null>(null);
  simTransferSearchQuery = signal('');
  showSimTransferDropdown = signal(false);

  // Destinatarios Notificación
  selectedEmails = signal<string[]>([]);
  showAllRecipients = signal<boolean>(false);

  readonly singleAssetMovementTypes = ['HURTO_PERDIDA'];

  isSingleAssetMode = computed(() => {
    return this.singleAssetMovementTypes.includes(this.movementType);
  });

  maxAllowedActivos = computed(() => {
    if (this.operationMode() === 'SIM') return 1;
    return this.isSingleAssetMode() ? 1 : 10;
  });

  isMultiAssetMode = computed(() => this.operationMode() === 'ACTIVO');

  originLocationName = computed(() => {
    if (this.isMultiAssetMode() && this.selectedActivos().length > 0) {
      return this.selectedActivos()[0]?.location?.nombre || 'Sede N/A';
    }
    return this.selectedActivo()?.location?.nombre || 'Se cargará automáticamente...';
  });

  originResponsibleName = computed(() => {
    if (this.isMultiAssetMode() && this.selectedActivos().length > 0) {
      const names = Array.from(new Set(this.selectedActivos().map(a => a.responsible?.nombre).filter(Boolean)));
      if (names.length === 0) return 'Sin custodio asignado';
      if (names.length === 1) return names[0] as string;
      return `${names[0]} (+${names.length - 1} más)`;
    }
    return this.selectedActivo()?.responsible?.nombre || 'Sin custodio asignado';
  });

  hasEquipmentInMaintenance = computed(() => {
    if (this.isMultiAssetMode()) {
      return this.selectedActivos().some(a => a.estado === 'MANTENIMIENTO');
    }
    return this.selectedActivo()?.estado === 'MANTENIMIENTO';
  });

  filteredOrigins = computed(() => {
    const term = this.originSearchQuery().toLowerCase().trim();
    const todos = this.locations.filter(loc => loc.estado === 'ACTIVO');
    if (!term) return todos;
    return todos.filter(loc =>
      loc.nombre.toLowerCase().includes(term) ||
      loc.code.toLowerCase().includes(term)
    );
  });

  filteredDestinations = computed(() => {
    const term = this.destinationSearchQuery().toLowerCase().trim();
    const origin = this.originId();
    const isMaintenance = this.operationMode() === 'ACTIVO' && this.hasEquipmentInMaintenance();

    let todos = this.locations.filter(loc => loc.estado === 'ACTIVO');
    const isBodegaType = (tipo?: string) => tipo === 'PUNTO_TI' || tipo === 'BODEGA';

    if (this.movementType === 'ENVIO_PROVEEDOR') {
      todos = todos.filter(loc => loc.tipo === 'PROVEEDOR');
    } else if (this.movementType === 'RETORNO_PROVEEDOR') {
      todos = todos.filter(loc => isBodegaType(loc.tipo));
    } else if (this.movementType === 'TRASLADO_REGIONAL' && isMaintenance) {
      todos = todos.filter(loc => isBodegaType(loc.tipo));
    } else if (isMaintenance) {
      const originType = this.locations.find(loc => loc.id === origin)?.tipo;
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

  filteredResponsiblesForDestination = computed(() => {
    const dest = this.selectedDestination();
    const all = this.responsables.filter(r => r.estado === 'ACTIVO');
    if (!dest) return [];

    let assigned = all.filter(r => r.locationIds?.includes(dest.id));
    const areaId = this.destinationAreaId();
    if (areaId && areaId !== '8b8b9c8c-1e2a-43cf-8a27-024848bb0000' && this.movementType !== 'TRASLADO_AREA') {
      assigned = assigned.filter(r => r.area?.id === areaId);
    }
    return assigned;
  });

  filteredSimsForTransfer = computed(() => {
    const term = this.simTransferSearchQuery().toLowerCase().trim();
    const activeMovementSimIds = new Set<string>();
    this.movements.forEach(m => {
      if (m.status === 'PENDING' || m.status === 'EN_TRANSIT') {
        m.simCardIds?.forEach(id => activeMovementSimIds.add(id));
      }
    });

    const available = this.simCards.filter(s =>
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
    const activeOriginId = this.originId();
    return this.simCards.filter(s =>
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
    const available = this.simCards.filter(s => s.estado === 'BODEGA' && s.locationId !== activeOriginId);
    
    const countsByLoc: Record<string, number> = {};
    for (const sim of available) {
      if (sim.locationId) {
        countsByLoc[sim.locationId] = (countsByLoc[sim.locationId] || 0) + 1;
      }
    }

    const locMap = this.locations.reduce((acc, l) => ({ ...acc, [l.id]: l.nombre }), {} as Record<string, string>);
    
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

  filteredActivos = computed(() => {
    const term = this.searchQuery().toLowerCase().trim();
    const activeMovementActivoIds = new Set<string>();
    this.movements.forEach(m => {
      if (m.status === 'PENDING' || m.status === 'EN_TRANSIT') {
        m.activoIds.forEach(id => activeMovementActivoIds.add(id));
      }
    });

    const selectedIds = new Set(this.selectedActivos().map(a => a.id));

    const todos = this.activos.filter(a =>
      a.estado !== 'BAJA' &&
      a.estado !== 'RECHAZADO' &&
      a.estado !== 'EN_TRANSITO' &&
      !activeMovementActivoIds.has(a.id) &&
      !selectedIds.has(a.id)
    );

    if (!term) return todos;
    return todos.filter(a =>
      a.placa.toLowerCase().includes(term) ||
      (a.serial && a.serial.toLowerCase().includes(term)) ||
      (a.marca && a.marca.toLowerCase().includes(term)) ||
      (a.modelo && a.modelo.toLowerCase().includes(term))
    );
  });

  filteredMovementTypes = computed(() => {
    const activo = this.selectedActivo();
    const canHurto = this.roleService.canRegisterHurto();

    let types = this.movementTypes.filter(([key]) =>
      !['SIM_TRASLADO', 'SIM_ASIGNACION', 'SIM_CAMBIO', 'SIM_RETIRO', 'SIM_RETIRO_TOTAL', 'REINGRESO_SOPORTE', 'RETORNO_POR_RECHAZO'].includes(key)
    );

    if (!canHurto) {
      types = types.filter(([key]) => key !== 'HURTO_PERDIDA');
    }

    if (activo) {
      if (activo.estado === 'MANTENIMIENTO') {
        const loc = this.locations.find(l => l.id === activo.locationId);
        const originType = loc?.tipo;
        const isOriginBodega = originType === 'PUNTO_TI' || originType === 'BODEGA';

        if (originType === 'PROVEEDOR') {
          types = types.filter(([key]) => key === 'RETORNO_PROVEEDOR');
        } else if (isOriginBodega) {
          types = types.filter(([key]) => ['ENVIO_PROVEEDOR', 'TRASLADO_REGIONAL'].includes(key));
        } else {
          types = types.filter(([key]) => key === 'TRASLADO_REGIONAL');
        }
      } else {
        const loc = this.locations.find(l => l.id === activo.locationId);
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

  filteredSimMovementTypes = computed(() => {
    return [
      ['SIM_TRASLADO', '🚚 Traslado de SIM en Bodega (Entre Sedes)'],
      ['SIM_ASIGNACION', '📲 Asignación de SIM a Celular / Equipo'],
      ['SIM_CAMBIO', '🔄 Cambio / Reemplazo de SIM en Celular'],
      ['SIM_RETIRO', '📤 Retiro Individual de SIM a Bodega'],
      ['SIM_RETIRO_TOTAL', '📦 Retiro Total de SIMs a Bodega']
    ];
  });

  relevantResponsibles = computed<Responsable[]>(() => {
    const all = this.responsables.filter(r => r.estado === 'ACTIVO' && !!r.email);
    if (this.showAllRecipients()) {
      return all;
    }

    const originLocId = this.originId();
    const destLocId = this.destinationId;
    const currentRespId = this.selectedActivo()?.responsibleId || (this.selectedActivo() as any)?.responsible?.id;
    const receiverRespId = this.responsibleId;

    if (!originLocId && !destLocId) {
      return all.filter(r => r.id === currentRespId || r.id === receiverRespId);
    }

    return all.filter(r => {
      const inOrigin = originLocId && r.locationIds?.includes(originLocId);
      const inDest = destLocId && r.locationIds?.includes(destLocId);
      const isCurrent = currentRespId && r.id === currentRespId;
      const isReceiver = receiverRespId && r.id === receiverRespId;
      return inOrigin || inDest || isCurrent || isReceiver;
    });
  });

  setOperationMode(mode: 'ACTIVO' | 'SIM') {
    this.operationMode.set(mode);
    this.clearSelection();
    this.clearSimTransferSelection();
    this.clearOriginSelection();
    this.clearDestinationSelection();
    this.showError.set(null);
    if (mode === 'SIM') {
      this.movementType = 'SIM_TRASLADO';
    } else {
      this.movementType = '';
    }
  }

  onMovementTypeChange(newType: string) {
    this.movementType = newType;
    this.destinationAreaId.set('');
    this.showError.set(null);
    this.selectedSimForAssign = null;
    this.selectedSimToReplace = null;
    this.selectedSimToRemove = null;
    this.simSearchQuery = '';

    if (newType === 'HURTO_PERDIDA' && this.selectedActivos().length > 1) {
      this.selectedActivos.update(list => list.slice(0, 1));
      this.selectedActivo.set(this.selectedActivos()[0]);
      alert('ℹ️ Se ajustó la lista al primer equipo: El reporte de Hurto o Pérdida requiere un denuncio policial individual por equipo.');
    }

    const isLocalSIM = ['SIM_ASIGNACION', 'SIM_CAMBIO', 'SIM_RETIRO', 'SIM_RETIRO_TOTAL'].includes(newType);

    if (newType === 'SIM_TRASLADO') {
      this.clearSelection();
      this.clearOriginSelection();
      this.clearDestinationSelection();
    } else if (isLocalSIM) {
      this.clearSimTransferSelection();
      const activo = this.selectedActivo();
      if (activo) {
        const loc = activo.location || this.locations.find(l => l.id === (activo.locationId || (activo as any).location?.id));
        if (loc) {
          this.selectedDestination.set(loc);
          this.destinationId = loc.id;
          this.destinationSearchQuery.set(loc.nombre);
          this.originId.set(loc.id);
        }
        const currentRespId = activo.responsibleId || (activo as any).responsible?.id;
        if (currentRespId) {
          this.responsibleId = currentRespId;
        }
      }
    } else if (newType === 'TRASLADO_AREA' || newType === 'HURTO_PERDIDA') {
      const activo = this.selectedActivo();
      if (activo) {
        const loc = activo.location || this.locations.find(l => l.id === (activo.locationId || (activo as any).location?.id));
        if (loc) {
          this.selectedDestination.set(loc);
          this.destinationId = loc.id;
          this.destinationSearchQuery.set(loc.nombre);
        }
        if (newType === 'HURTO_PERDIDA') {
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

  onSearchInput(value: string) {
    this.searchQuery.set(value);
    if (!value.trim() && !this.isMultiAssetMode()) {
      this.clearSelection();
    }
  }

  selectActivo(activo: Activo) {
    if (activo.estado === 'EN_TRANSITO' || (activo.estado as any) === 'EN_TRANSIT') {
      alert(`El equipo con placa "${activo.placa}" se encuentra actualmente EN TRÁNSITO y no puede ser seleccionado para un nuevo movimiento.`);
      return;
    }

    const newOriginId = activo.locationId || (activo as any).location?.id || '';

    if (this.isMultiAssetMode()) {
      const maxAllowed = this.maxAllowedActivos();
      if (this.selectedActivos().length >= maxAllowed) {
        if (maxAllowed === 1) {
          alert('⚠️ El reporte de Hurto o Pérdida solo permite 1 activo por denuncio policial.');
        } else {
          alert(`⚠️ Límite estricto de formato alcanzado:\n\nUn envío permite un máximo de ${maxAllowed} activos para garantizar que el Acta Oficial (GF-FO-29) quepa en una sola hoja carta.\n\nPara enviar más equipos, por favor genere una remesa adicional.`);
        }
        return;
      }

      if (this.selectedActivos().length > 0) {
        const currentOrigin = this.originId();
        if (currentOrigin && newOriginId && currentOrigin !== newOriginId) {
          const originLoc = this.locations.find(l => l.id === currentOrigin);
          const originName = originLoc?.nombre || 'la sede de origen seleccionada';
          const newName = activo.location?.nombre || (activo as any).location?.nombre || 'otra sede';
          alert(`⚠️ No se puede agregar este equipo:\n\nTodos los dispositivos del traslado deben pertenecer a la misma sede de origen ("${originName}").\n\nEl equipo con placa "${activo.placa}" está registrado en "${newName}".`);
          return;
        }

        if (this.selectedActivos().some(a => a.id === activo.id)) {
          return;
        }
      }

      this.selectedActivos.update(list => [...list, activo]);
      this.selectedActivo.set(this.selectedActivos()[0]);
      this.searchQuery.set('');
    } else {
      this.selectedActivos.set([activo]);
      this.selectedActivo.set(activo);
      this.searchQuery.set(activo.placa);
    }

    if (!this.originId() || !this.isMultiAssetMode()) {
      this.originId.set(newOriginId);
    }

    const allowedKeys = this.operationMode() === 'SIM'
      ? this.filteredSimMovementTypes().map(([key]) => key)
      : this.filteredMovementTypes().map(([key]) => key);
    if (this.movementType && !allowedKeys.includes(this.movementType)) {
      this.movementType = this.operationMode() === 'SIM' ? 'SIM_ASIGNACION' : '';
    }

    const isLocalSIM = ['SIM_ASIGNACION', 'SIM_CAMBIO', 'SIM_RETIRO', 'SIM_RETIRO_TOTAL'].includes(this.movementType);
    if ((this.movementType === 'TRASLADO_AREA' || isLocalSIM || this.movementType === 'HURTO_PERDIDA') && (activo.location || (activo as any).location || this.locations.find(l => l.id === newOriginId))) {
      const loc = activo.location || (activo as any).location || this.locations.find(l => l.id === newOriginId);
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
        const originType = this.locations.find(loc => loc.id === newOriginId)?.tipo;
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

    const currentRespEmail = activo.responsible?.email;
    if (currentRespEmail) {
      const current = this.selectedEmails();
      if (!current.includes(currentRespEmail)) {
        this.selectedEmails.set([...current, currentRespEmail]);
      }
    } else if (activo.responsibleId) {
      const resp = this.responsables.find(r => r.id === activo.responsibleId);
      if (resp && resp.email) {
        const current = this.selectedEmails();
        if (!current.includes(resp.email)) {
          this.selectedEmails.set([...current, resp.email]);
        }
      }
    }
  }

  removeActivoFromRelacion(activoId: string) {
    this.selectedActivos.update(list => list.filter(a => a.id !== activoId));
    if (this.selectedActivos().length === 0) {
      this.selectedActivo.set(null);
      this.originId.set('');
      this.searchQuery.set('');
    } else {
      this.selectedActivo.set(this.selectedActivos()[0]);
      this.originId.set(this.selectedActivos()[0].locationId || '');
    }
  }

  clearAllActivos() {
    this.selectedActivos.set([]);
    this.selectedActivo.set(null);
    this.originId.set('');
    this.searchQuery.set('');
  }

  clearSelection() {
    this.selectedActivo.set(null);
    this.selectedActivos.set([]);
    this.searchQuery.set('');
    this.originId.set('');
  }

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

  getAvailableDestinationAreas(): Area[] {
    const dest = this.selectedDestination();
    return dest?.areas || [];
  }

  onDestinationAreaChange(areaId: string) {
    this.destinationAreaId.set(areaId);
    this.responsibleId = '';
  }

  onResponsibleChange(newId: string) {
    this.responsibleId = newId;
    if (newId) {
      const resp = this.responsables.find(r => r.id === newId);
      if (resp && resp.email) {
        const current = this.selectedEmails();
        if (!current.includes(resp.email)) {
          this.selectedEmails.set([...current, resp.email]);
        }
      }
    }
  }

  selectSimForTransfer(sim: SimCard) {
    this.selectedSimForTransfer.set(sim);
    this.simTransferSearchQuery.set(`${sim.numero} | ICCID: ${sim.iccid} | ${sim.operador}`);
    this.showSimTransferDropdown.set(false);

    if (sim.locationId) {
      this.originId.set(sim.locationId);
      this.originSearchQuery.set(sim.location?.nombre || 'Bodega');
      const foundLoc = this.locations.find(l => l.id === sim.locationId);
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

  selectSimForAssign(sim: SimCard) {
    this.selectedSimForAssign = sim;
    this.simSearchQuery = `${sim.numero} | ICCID: ${sim.iccid} | ${sim.operador}`;
    this.showSimDropdown = false;
  }

  requestSimTransferToCurrentLocation() {
    const activo = this.selectedActivo();
    const currentLoc = activo?.location || this.locations.find(l => l.id === this.originId());
    
    this.setOperationMode('SIM');
    if (currentLoc) {
      this.selectDestination(currentLoc);
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
    const resp = this.responsables.find(r => r.id === this.responsibleId);
    return resp?.email === email;
  }

  isCurrentCustodian(email: string): boolean {
    const activo = this.selectedActivo();
    if (!activo) return false;
    const custodianEmail = activo.responsible?.email;
    if (custodianEmail) return custodianEmail === email;
    const currentRespId = activo.responsibleId || (activo as any).responsible?.id;
    if (currentRespId) {
      const resp = this.responsables.find(r => r.id === currentRespId);
      return resp?.email === email;
    }
    return false;
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

  canSubmit(): boolean {
    if (this.loading()) return false;

    if (this.operationMode() === 'ACTIVO') {
      if (!this.movementType) return false;
      if (this.selectedActivos().length === 0) return false;
      if (!this.originId()) return false;
      if (!this.responsibleId) return false;
      if (this.movementType === 'HURTO_PERDIDA') {
        return !!this.documentUrl();
      }
      if (this.movementType === 'TRASLADO_AREA') {
        return !!this.destinationAreaId();
      }
      return !!this.destinationId;
    }

    if (this.movementType === 'SIM_TRASLADO') {
      return !!(
        this.selectedSimForTransfer() &&
        this.originId() &&
        this.destinationId &&
        this.responsibleId
      );
    }

    if (!this.selectedActivo() || !this.responsibleId) return false;

    if (this.movementType === 'SIM_ASIGNACION') {
      const simCount = this.selectedActivo()?.simCards?.length || 0;
      return simCount < 2 && !!this.selectedSimForAssign;
    }

    if (this.movementType === 'SIM_CAMBIO') {
      return !!(this.selectedSimToReplace && this.selectedSimForAssign);
    }

    if (this.movementType === 'SIM_RETIRO') {
      return !!this.selectedSimToRemove;
    }

    if (this.movementType === 'SIM_RETIRO_TOTAL') {
      return (this.selectedActivo()?.simCards?.length || 0) > 0;
    }

    return false;
  }

  saveMovement() {
    this.showError.set(null);
    const isLocalSIM = ['SIM_ASIGNACION', 'SIM_CAMBIO', 'SIM_RETIRO', 'SIM_RETIRO_TOTAL'].includes(this.movementType);
    if (isLocalSIM && this.selectedActivo()) {
      this.destinationId = this.originId();
    }

    const isAreaTransfer = this.movementType === 'TRASLADO_AREA';
    const isTheftOrLoss = this.movementType === 'HURTO_PERDIDA';
    if ((isAreaTransfer || isTheftOrLoss) && this.selectedActivo()) {
      this.destinationId = this.originId();
      if (isTheftOrLoss && !this.responsibleId) {
        this.responsibleId = this.selectedActivo()?.responsibleId || (this.selectedActivo() as any)?.responsible?.id || '';
      }
    }

    if (isTheftOrLoss) {
      if (!this.documentUrl()) {
        alert('Para registrar un reporte de Hurto o Pérdida, es OBLIGATORIO adjuntar el archivo del denuncio policial (Fiscalía / Policía).');
        return;
      }
    }

    if (isAreaTransfer && !this.destinationAreaId()) {
      alert('Para un traslado entre áreas, debes seleccionar el Área Destino.');
      return;
    }

    const needsActivo = this.movementType !== 'SIM_TRASLADO';
    const hasEquipment = this.isMultiAssetMode() ? this.selectedActivos().length > 0 : !!this.selectedActivo();
    if (!this.movementType || !this.originId() || !this.destinationId || !this.responsibleId || (needsActivo && !hasEquipment) || (!needsActivo && !this.selectedSimForTransfer())) {
      alert('Completa los campos obligatorios');
      return;
    }

    if (this.isMultiAssetMode() && this.selectedActivos().length > this.maxAllowedActivos()) {
      alert(`⚠️ No se puede registrar el movimiento: Se superó el límite de ${this.maxAllowedActivos()} activo(s) para este tipo de formato.`);
      return;
    }

    this.loading.set(true);

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

    const activoIds = this.movementType === 'SIM_TRASLADO' 
      ? [] 
      : this.isMultiAssetMode() 
        ? this.selectedActivos().map(a => a.id) 
        : [this.selectedActivo()!.id];

    const dto: any = {
      type: this.movementType,
      originLocationId: this.originId(),
      destinationLocationId: this.destinationId,
      responsibleId: this.responsibleId,
      activoIds,
      simCardIds,
      notes: this.notes,
      documentUrl: this.documentUrl() || undefined,
      recipients: this.selectedEmails(),
      simCardIdToAssign: this.selectedSimForAssign?.id,
      simCardIdToReplace: this.selectedSimToReplace?.id,
      simCardIdToRemove: this.selectedSimToRemove?.id,
      removedSimNewState: this.removedSimNewState,
      simStates: this.simStates
    };

    if (this.movementType === 'TRASLADO_AREA' && this.destinationAreaId()) {
      dto.destinationAreaId = this.destinationAreaId();
    }

    this.registerMovement.execute(dto).subscribe({
      next: () => {
        this.finishSave();
        this.onMovementCreated.emit();
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al registrar el movimiento';
        this.showError.set(msg);
        this.loading.set(false);
      }
    });
  }

  finishSave() {
    this.showSuccess.set(true);
    this.showError.set(null);
    this.loading.set(false);
    this.searchQuery.set('');
    this.selectedActivo.set(null);
    this.selectedActivos.set([]);
    this.notes = '';
    this.documentUrl.set(null);
    this.documentFileName = '';
    this.selectedSimForAssign = null;
    this.simSearchQuery = '';
    this.selectedSimToReplace = null;
    this.removedSimLocationId = '';
    this.selectedSimToRemove = null;
    this.simDestinations = ['', ''];
    this.simStates = ['BODEGA', 'BODEGA'];
    this.selectedSimForTransfer.set(null);
    this.simTransferSearchQuery.set('');
    this.clearDestinationSelection();
    this.setOperationMode('ACTIVO');
    setTimeout(() => this.showSuccess.set(false), 8000);
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
}
