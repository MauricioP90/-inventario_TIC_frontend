import { Component, signal, computed, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Movement } from '../../../domain/models/movement.model';
import { Location } from '../../../../locations/domain/models/location.model';
import { TipoDocumentoOficial, OfficialDocumentData } from '../../../domain/models/document-template.model';
import { BuildMovementDocumentUseCase } from '../../../application/use-cases/build-movement-document.use-case';
import { DocumentPolicyService } from '../../../domain/services/document-policy.service';
import { MovementRepository } from '../../../domain/repositories/movement.repository';
import { GetAllLocationsUseCase } from '../../../../locations/application/use-cases/get-all-locations.use-case';
import { GetAllActivosUseCase } from '../../../../inventory/application/use-cases/get-all-activos.use-case';
import { Activo } from '../../../../inventory/domain/models/activo.model';
import { 
  formatFechaFormal, 
  formatMoneda, 
  numeroALetras, 
  getEstadoLabel, 
  extractSimFromActivo 
} from './templates/document-template.utils';
import { DocumentPrestamoTemplateComponent } from './templates/document-prestamo-template.component';
import { DocumentReintegroTemplateComponent } from './templates/document-reintegro-template.component';
import { DocumentMemorandoTemplateComponent } from './templates/document-memorando-template.component';
import { DocumentComodatoTemplateComponent } from './templates/document-comodato-template.component';
import { DocumentActaGeneralTemplateComponent } from './templates/document-acta-general-template.component';

@Component({
  selector: 'app-movement-document-modal',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    DocumentPrestamoTemplateComponent,
    DocumentReintegroTemplateComponent,
    DocumentMemorandoTemplateComponent,
    DocumentComodatoTemplateComponent,
    DocumentActaGeneralTemplateComponent
  ],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center p-2 sm:p-4 md:p-6 print:hidden">
        
        <div class="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[95vh]">
          
          <!-- BARRA SUPERIOR: ENCABEZADO DE VENTANA Y ACCIONES PRINCIPALES (Estándar UI/UX) -->
          <div class="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4 shrink-0">
            
            <!-- Título y Consecutivo -->
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-lg">
                📄
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="font-extrabold text-base text-slate-900 leading-tight">Documento Oficial de Traslado</h3>
                  @if (docData(); as doc) {
                    <span class="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono text-[11px] font-bold border border-indigo-100">
                      {{ doc.consecutivo }}
                    </span>
                  }
                </div>
                <p class="text-xs text-slate-500">Vista previa imprimible para actas, comodatos y constancias de entrega</p>
              </div>
            </div>

            <!-- Acciones: Imprimir + Botón Cerrar Rojo Estándar de Ventana -->
            <div class="flex items-center gap-2.5">
              <button 
                (click)="printDocument()"
                class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm shadow-indigo-100 cursor-pointer">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                </svg>
                Imprimir / Guardar PDF
              </button>

              <!-- Botón Cerrar: Estándar Rojo Suave en la Esquina Superior Derecha -->
              <button 
                (click)="close()"
                title="Cerrar ventana"
                class="h-9 w-9 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-200 transition-all cursor-pointer">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- PANEL DE CONFIGURACIÓN DEL DOCUMENTO (Selector de Formato + Observaciones) -->
          <div class="bg-slate-50/80 border-b border-slate-200 px-6 py-3.5 shrink-0">

            <!-- Selector dinámico de activo para formatos individuales en traslados multi-activo -->
            @if (isIndividualFormat() && movementActivos().length > 1) {
              <div class="mb-3.5 p-2.5 bg-indigo-50/90 border border-indigo-200/80 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                <div class="flex items-center gap-2.5">
                  <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-bold shadow-xs">
                    📱
                  </span>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-black text-indigo-950 uppercase tracking-tight">Envío Múltiple ({{ movementActivos().length }} Activos)</span>
                      <span class="text-[10px] bg-indigo-100 text-indigo-800 font-extrabold px-1.5 py-0.5 rounded border border-indigo-200">
                        Dispositivo {{ selectedMovementActivoIndex() + 1 }} de {{ movementActivos().length }}
                      </span>
                    </div>
                    <p class="text-[11px] text-indigo-700">Este formato legal emite 1 acta individual por dispositivo. Selecciona la placa para visualizar e imprimir su documento:</p>
                  </div>
                </div>

                <!-- Tabs de placas asociadas al envío -->
                <div class="flex items-center gap-1.5 flex-wrap">
                  @for (act of movementActivos(); track act.placa; let i = $index) {
                    <button
                      type="button"
                      (click)="onSelectMovementActivoIndex(i)"
                      [class.bg-indigo-600]="selectedMovementActivoIndex() === i"
                      [class.text-white]="selectedMovementActivoIndex() === i"
                      [class.border-indigo-600]="selectedMovementActivoIndex() === i"
                      [class.shadow-xs]="selectedMovementActivoIndex() === i"
                      [class.bg-white]="selectedMovementActivoIndex() !== i"
                      [class.text-slate-700]="selectedMovementActivoIndex() !== i"
                      [class.border-slate-300]="selectedMovementActivoIndex() !== i"
                      [class.hover:bg-slate-50]="selectedMovementActivoIndex() !== i"
                      class="px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5">
                      <span>🏷️ {{ act.placa }}</span>
                      <span class="text-[10px] font-sans font-normal opacity-90 truncate max-w-[120px]">({{ act.modelo || act.marca }})</span>
                    </button>
                  }
                </div>
              </div>
            }

            <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              
              <!-- 1. Selector de Formato Oficial -->
              <div [ngClass]="currentTipo() === 'COMODATO' ? 'md:col-span-6' : 'md:col-span-4'">
                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Tipo de Formato Oficial:
                </label>
                <div class="relative">
                  <select 
                    [ngModel]="currentTipo()"
                    (ngModelChange)="onTipoChange($event)"
                    class="w-full bg-white text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer shadow-2xs">
                    <option value="ACTA_ENTREGA">🏢 GF-FO-29 Acta de Entrega de Activos (V7 - Oficial)</option>
                    <option value="COMODATO">🤝 Contrato de Comodato (Partícipes - COM-01)</option>
                    <option value="PRESTAMO_DISPOSITIVO">📱 Entrega de Dispositivo en Calidad de Préstamo (Partícipes - DP-PR-01)</option>
                    <option value="REINTEGRO_DISPOSITIVO">🔄 Reintegro de Dispositivo y/o Devolución (Partícipes - DP-RD-01)</option>
                    <option value="MEMORANDO_REINTEGRO">📝 Memorando: Reintegro de Dispositivo (Oficina - GR-MEM-26)</option>
                    <option value="MEMORANDO_PRESTAMO">📝 Memorando: Préstamo de Dispositivo (Oficina - GR-MEM-26)</option>
                    <option value="GUIA_REMISION">🛠️ FOR-TIC-004 Guía Remisión Técnica (Taller)</option>
                  </select>
                </div>
              </div>

              <!-- 2. Sede / Oficina (Editable: Permite elegir libremente entre sedes / oficinas) -->
              <div [ngClass]="currentTipo() === 'COMODATO' ? 'md:col-span-6' : 'md:col-span-3'">
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Sede / Oficina:
                  </label>
                  @if (recipientAssignedLocations().length > 0) {
                    <span class="text-[9px] text-indigo-600 font-bold">
                      {{ recipientAssignedLocations().length }} asignada(s)
                    </span>
                  }
                </div>
                <select 
                  [ngModel]="selectedLocationId()"
                  (ngModelChange)="onLocationChange($event)"
                  class="w-full bg-white text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer shadow-2xs">
                  @if (recipientAssignedLocations().length > 0) {
                    <optgroup label="Sedes Asignadas al Colaborador">
                      @for (loc of recipientAssignedLocations(); track loc.id) {
                        <option [value]="loc.id">🏢 {{ loc.nombre }} ({{ loc.ciudad || 'Sin ciudad' }})</option>
                      }
                    </optgroup>
                    @if (otherLocations().length > 0) {
                      <optgroup label="Otras Sedes / Oficinas">
                        @for (loc of otherLocations(); track loc.id) {
                          <option [value]="loc.id">🏢 {{ loc.nombre }} ({{ loc.ciudad || 'Sin ciudad' }})</option>
                        }
                      </optgroup>
                    }
                  } @else {
                    @for (loc of allLocations(); track loc.id) {
                      <option [value]="loc.id">🏢 {{ loc.nombre }} ({{ loc.ciudad || 'Sin ciudad' }})</option>
                    }
                  }
                </select>
              </div>

              <!-- 3. Observaciones Particulares que se Imprimen en el Documento (Oculto en COMODATO) -->
              @if (currentTipo() !== 'COMODATO') {
                <div class="md:col-span-5">
                  <div class="flex items-center justify-between mb-1">
                    <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Observaciones en Documento:
                    </label>
                    @if (saveStatus() === 'SAVED') {
                      <span class="text-[10px] text-emerald-600 font-bold flex items-center gap-1 animate-fade-in">
                        ✓ Guardado en BD
                      </span>
                    }
                    @if (saveStatus() === 'ERROR') {
                      <span class="text-[10px] text-rose-600 font-bold flex items-center gap-1 animate-fade-in">
                        ✕ Error al guardar
                      </span>
                    }
                  </div>
                  <div class="flex items-center gap-2">
                    <input 
                      type="text" 
                      [(ngModel)]="customNotes" 
                      placeholder="Ej: Se entrega con cargador, funda..."
                      class="flex-1 bg-white text-slate-800 text-xs px-3 py-2 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs" />

                    <button 
                      (click)="saveNotesToDatabase()"
                      [disabled]="isSavingNotes() || !hasNotesChanged()"
                      [class.opacity-50]="isSavingNotes() || !hasNotesChanged()"
                      [class.cursor-not-allowed]="isSavingNotes() || !hasNotesChanged()"
                      title="Guardar observaciones en la base de datos para este traslado"
                      class="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs">
                      @if (isSavingNotes()) {
                        <span class="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span>
                      } @else {
                        <span>💾</span>
                      }
                      <span>Guardar</span>
                    </button>
                  </div>
                </div>
              }

              <!-- BARRA DE CONFIGURACIÓN ESPECÍFICA PARA PRÉSTAMO DE DISPOSITIVO (5 Campos Específicos) -->
              @if (currentTipo() === 'PRESTAMO_DISPOSITIVO') {
                <div class="md:col-span-12 pt-3 mt-1 border-t border-slate-200">
                  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 items-end">

                    <!-- 2. Fecha Contrato Colab. -->
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Fecha Contrato:
                      </label>
                      <input 
                        type="text" 
                        [ngModel]="fechaContrato()"
                        (ngModelChange)="fechaContrato.set($event)"
                        placeholder="Ej: 15 de marzo de 2024"
                        class="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs" />
                    </div>

                    <!-- 3. Buscador de Placa Averiada (Idéntico a Movimientos: Busca en TODOS los activos sin filtros de estado) -->
                    <div class="relative">
                      @if (showPlacaDropdown()) {
                        <div class="fixed inset-0 z-40" (click)="showPlacaDropdown.set(false)"></div>
                      }

                      <div class="flex items-center justify-between mb-1">
                        <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Placa Averiada:
                        </label>
                        @if (selectedActivoAveriado()) {
                          <span class="text-[9px] text-emerald-600 font-bold">✓ Seleccionado</span>
                        }
                      </div>

                      <div class="relative z-50">
                        <input 
                          type="text" 
                          [ngModel]="searchPlacaQuery()"
                          (input)="onSearchPlacaInput($any($event.target).value)"
                          (focus)="onSearchPlacaFocus()"
                          placeholder="Buscar placa, serie..."
                          class="w-full bg-white text-slate-800 font-mono text-xs pl-2.5 pr-6 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs" />
                        
                        @if (searchPlacaQuery()) {
                          <button 
                            type="button"
                            (click)="clearPlacaSearch()"
                            title="Limpiar búsqueda"
                            class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer">
                            ✕
                          </button>
                        }

                        @if (showPlacaDropdown() && filteredAveriados().length > 0) {
                          <div class="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 divide-y divide-slate-100">
                            @for (activo of filteredAveriados(); track activo.id) {
                              <button 
                                type="button"
                                (click)="selectActivoAveriado(activo)"
                                class="w-full text-left px-3 py-2 hover:bg-indigo-50/80 transition-colors flex items-center justify-between text-xs cursor-pointer">
                                <div>
                                  <span class="font-mono font-bold text-slate-800">{{ activo.placa }}</span>
                                  <span class="text-slate-500 text-[11px] ml-2">{{ activo.marca }} {{ activo.modelo }}</span>
                                </div>
                                <span class="text-[10px] px-1.5 py-0.5 rounded font-semibold text-slate-600 bg-slate-100">
                                  {{ activo.serial || 'S/N' }}
                                </span>
                              </button>
                            }
                          </div>
                        }
                      </div>
                    </div>

                    <!-- 4. Modelo Averiado (Carga automática o edición libre) -->
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Modelo Averiado:
                      </label>
                      <input 
                        type="text" 
                        [ngModel]="modeloAveriado()"
                        (ngModelChange)="modeloAveriado.set($event)"
                        placeholder="Ej: Galaxy A14"
                        class="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs" />
                    </div>

                    <!-- 5. Incluye Cargador -->
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Incluye Cargador:
                      </label>
                      <select 
                        [ngModel]="incluyeCargador()"
                        (ngModelChange)="incluyeCargador.set($event)"
                        class="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs font-semibold">
                        <option value="SÍ">SÍ</option>
                        <option value="NO">NO</option>
                      </select>
                    </div>

                    <!-- 6. Incluye Forro -->
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Incluye Forro:
                      </label>
                      <select 
                        [ngModel]="incluyeForro()"
                        (ngModelChange)="incluyeForro.set($event)"
                        class="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs font-semibold">
                        <option value="SÍ">SÍ</option>
                        <option value="NO">NO</option>
                      </select>
                    </div>

                  </div>
                </div>
              }

              <!-- BARRA DE CONFIGURACIÓN ESPECÍFICA PARA REINTEGRO DE DISPOSITIVO Y/O DEVOLUCIÓN -->
              @if (currentTipo() === 'REINTEGRO_DISPOSITIVO') {
                <div class="md:col-span-12 pt-3 mt-1 border-t border-slate-200">
                  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2.5 items-end">

                    <!-- 1. Fecha Contrato Colaboración -->
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Fecha Contrato:
                      </label>
                      <input 
                        type="text" 
                        [ngModel]="fechaContratoReintegro()"
                        (ngModelChange)="fechaContratoReintegro.set($event)"
                        placeholder="Ej: 14 de junio de 2013"
                        class="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs" />
                    </div>

                    <!-- 2. Cargador Reintegrado -->
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Cargador Reintegrado:
                      </label>
                      <select 
                        [ngModel]="incluyeCargadorReintegro()"
                        (ngModelChange)="incluyeCargadorReintegro.set($event)"
                        class="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs font-semibold">
                        <option value="Incluido">Incluido</option>
                        <option value="No incluido">No incluido</option>
                        <option value="Bueno">Bueno</option>
                        <option value="Regular">Regular</option>
                      </select>
                    </div>

                    <!-- 3. Forro Reintegrado -->
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Forro Reintegrado:
                      </label>
                      <select 
                        [ngModel]="incluyeForroReintegro()"
                        (ngModelChange)="incluyeForroReintegro.set($event)"
                        class="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs font-semibold">
                        <option value="No incluido">No incluido</option>
                        <option value="Incluido">Incluido</option>
                        <option value="Bueno">Bueno</option>
                        <option value="Regular">Regular</option>
                      </select>
                    </div>

                    <!-- 4. Checkbox Devolución de Préstamo -->
                    <div class="flex items-center h-[34px] px-2 bg-white rounded-lg border border-slate-300 shadow-2xs">
                      <label class="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                        <input 
                          type="checkbox"
                          [ngModel]="incluyeDevolucionPrestamo()"
                          (ngModelChange)="incluyeDevolucionPrestamo.set($event)"
                          class="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-slate-300 cursor-pointer" />
                        <span>¿Devuelve Préstamo?</span>
                      </label>
                    </div>

                    <!-- 5. Buscador Typeahead del Activo en Préstamo que se devuelve -->
                    @if (incluyeDevolucionPrestamo()) {
                      <div class="relative sm:col-span-2">
                        @if (showPlacaPrestadaDropdown()) {
                          <div class="fixed inset-0 z-40" (click)="showPlacaPrestadaDropdown.set(false)"></div>
                        }

                        <div class="flex items-center justify-between mb-1">
                          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Equipo en Préstamo a Devolver:
                          </label>
                          @if (selectedActivoPrestado()) {
                            <span class="text-[9px] text-emerald-600 font-bold">✓ Seleccionado</span>
                          }
                        </div>

                        <div class="relative z-50">
                          <input 
                            type="text" 
                            [ngModel]="searchPlacaPrestadaQuery()"
                            (input)="onSearchPlacaPrestadaInput($any($event.target).value)"
                            (focus)="onSearchPlacaPrestadaFocus()"
                            placeholder="Buscar placa o modelo en préstamo..."
                            class="w-full bg-white text-slate-800 font-mono text-xs pl-2.5 pr-6 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs" />
                          
                          @if (searchPlacaPrestadaQuery()) {
                            <button 
                              type="button"
                              (click)="clearPlacaPrestadaSearch()"
                              title="Limpiar búsqueda"
                              class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer">
                              ✕
                            </button>
                          }

                          @if (showPlacaPrestadaDropdown() && filteredPrestados().length > 0) {
                            <div class="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 divide-y divide-slate-100">
                              @for (activo of filteredPrestados(); track activo.id) {
                                <button 
                                  type="button"
                                  (click)="selectActivoPrestado(activo)"
                                  class="w-full text-left px-3 py-2 hover:bg-indigo-50/80 transition-colors flex items-center justify-between text-xs cursor-pointer">
                                  <div>
                                    <span class="font-mono font-bold text-slate-800">{{ activo.placa }}</span>
                                    <span class="text-slate-500 text-[11px] ml-2">{{ activo.marca }} {{ activo.modelo }}</span>
                                  </div>
                                  <span class="text-[10px] px-1.5 py-0.5 rounded font-semibold text-slate-600 bg-slate-100">
                                    {{ activo.serial || 'S/N' }}
                                  </span>
                                </button>
                              }
                            </div>
                          }
                        </div>
                      </div>
                    }

                  </div>
                </div>
              }

              <!-- BARRA DE CONFIGURACIÓN ESPECÍFICA PARA MEMORANDOS OFICIALES (Reintegro / Préstamo) -->
              @if (currentTipo() === 'MEMORANDO_REINTEGRO' || currentTipo() === 'MEMORANDO_PRESTAMO') {
                <div class="md:col-span-12 pt-3 mt-1 border-t border-slate-200">
                  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2.5 items-end">

                    <!-- Switch Memorando Tipo -->
                    <div class="sm:col-span-2">
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Subtipo de Memorando:
                      </label>
                      <div class="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg border border-slate-300">
                        <button 
                          type="button"
                          (click)="onTipoChange('MEMORANDO_REINTEGRO')"
                          [class.bg-white]="currentTipo() === 'MEMORANDO_REINTEGRO'"
                          [class.text-indigo-900]="currentTipo() === 'MEMORANDO_REINTEGRO'"
                          [class.font-bold]="currentTipo() === 'MEMORANDO_REINTEGRO'"
                          [class.shadow-2xs]="currentTipo() === 'MEMORANDO_REINTEGRO'"
                          class="flex-1 py-1 px-2 text-[11px] rounded-md transition-all text-slate-600 cursor-pointer text-center truncate">
                          🔄 Reintegro a Oficina
                        </button>
                        <button 
                          type="button"
                          (click)="onTipoChange('MEMORANDO_PRESTAMO')"
                          [class.bg-white]="currentTipo() === 'MEMORANDO_PRESTAMO'"
                          [class.text-indigo-900]="currentTipo() === 'MEMORANDO_PRESTAMO'"
                          [class.font-bold]="currentTipo() === 'MEMORANDO_PRESTAMO'"
                          [class.shadow-2xs]="currentTipo() === 'MEMORANDO_PRESTAMO'"
                          class="flex-1 py-1 px-2 text-[11px] rounded-md transition-all text-slate-600 cursor-pointer text-center truncate">
                          📱 Préstamo a Oficina
                        </button>
                      </div>
                    </div>

                    <!-- Buscador de Placa Averiada -->
                    <div class="relative sm:col-span-2">
                      @if (showPlacaDropdown()) {
                        <div class="fixed inset-0 z-40" (click)="showPlacaDropdown.set(false)"></div>
                      }

                      <div class="flex items-center justify-between mb-1">
                        <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Placa Averiada / Dañada:
                        </label>
                        @if (selectedActivoAveriado()) {
                          <span class="text-[9px] text-emerald-600 font-bold">✓ Seleccionado</span>
                        }
                      </div>

                      <div class="relative z-50">
                        <input 
                          type="text" 
                          [ngModel]="searchPlacaQuery()"
                          (input)="onSearchPlacaInput($any($event.target).value)"
                          (focus)="onSearchPlacaFocus()"
                          placeholder="Buscar placa averiada..."
                          class="w-full bg-white text-slate-800 font-mono text-xs pl-2.5 pr-6 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs" />
                        
                        @if (searchPlacaQuery()) {
                          <button 
                            type="button"
                            (click)="clearPlacaSearch()"
                            title="Limpiar búsqueda"
                            class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer">
                            ✕
                          </button>
                        }

                        @if (showPlacaDropdown() && filteredAveriados().length > 0) {
                          <div class="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 divide-y divide-slate-100">
                            @for (activo of filteredAveriados(); track activo.id) {
                              <button 
                                type="button"
                                (click)="selectActivoAveriado(activo)"
                                class="w-full text-left px-3 py-2 hover:bg-indigo-50/80 transition-colors flex items-center justify-between text-xs cursor-pointer">
                                <div>
                                  <span class="font-mono font-bold text-slate-800">{{ activo.placa }}</span>
                                  <span class="text-slate-500 text-[11px] ml-2">{{ activo.marca }} {{ activo.modelo }}</span>
                                </div>
                                <span class="text-[10px] px-1.5 py-0.5 rounded font-semibold text-slate-600 bg-slate-100">
                                  {{ activo.serial || 'S/N' }}
                                </span>
                              </button>
                            }
                          </div>
                        }
                      </div>
                    </div>

                    <!-- Modelo Averiado -->
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Modelo Averiado:
                      </label>
                      <input 
                        type="text" 
                        [ngModel]="modeloAveriado()"
                        (ngModelChange)="modeloAveriado.set($event)"
                        placeholder="Ej: Galaxy A14"
                        class="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs" />
                    </div>

                    <!-- Incluye Cargador -->
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Incluye Cargador:
                      </label>
                      <select 
                        [ngModel]="incluyeCargador()"
                        (ngModelChange)="incluyeCargador.set($event)"
                        class="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs font-semibold">
                        <option value="SÍ">SÍ</option>
                        <option value="NO">NO</option>
                      </select>
                    </div>

                  </div>
                </div>
              }

              <!-- BARRA DE CONFIGURACIÓN ESPECÍFICA PARA CONTRATO DE COMODATO -->
              @if (currentTipo() === 'COMODATO') {
                <div class="md:col-span-12 pt-3 mt-1 border-t border-slate-200">
                  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2.5 items-end">

                    <!-- 1. Placa de Inventario -->
                    <div class="md:col-span-2">
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Placa Inventario:
                      </label>
                      <div class="w-full bg-slate-100/90 text-slate-900 font-mono text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold truncate flex items-center gap-1.5 shadow-2xs" title="{{ getActivoComodato(docData())?.placa || 'Sin placa' }}">
                        <span class="text-indigo-600">🏷️</span>
                        <span class="truncate">{{ getActivoComodato(docData())?.placa || 'Sin placa' }}</span>
                      </div>
                    </div>

                    <!-- 2. Bien Entregado -->
                    <div class="md:col-span-3">
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Bien Entregado:
                      </label>
                      <div class="w-full bg-slate-100/90 text-slate-900 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold truncate flex items-center gap-1.5 shadow-2xs" title="{{ getBienEntregado(docData() || undefined) }}">
                        <span class="text-indigo-600">📱</span>
                        <span class="truncate">{{ getBienEntregado(docData() || undefined) }}</span>
                      </div>
                    </div>

                    <!-- 3. Precio Compra -->
                    <div class="md:col-span-2">
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Precio Compra:
                      </label>
                      <div class="w-full bg-slate-100/90 text-slate-900 font-mono text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold truncate shadow-2xs" title="{{ valorReposicionLetrasComodato() }}">
                        {{ valorReposicionComodato() }}
                      </div>
                    </div>

                    <!-- 4. Estado del Bien (Editable) -->
                    <div class="md:col-span-2">
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Estado del Bien:
                      </label>
                      <select 
                        [ngModel]="estadoBienComodato()"
                        (ngModelChange)="estadoBienComodato.set($event)"
                        class="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs font-semibold">
                        <option value="BUENO">BUENO</option>
                        <option value="EXCELENTE">EXCELENTE</option>
                        <option value="REGULAR">REGULAR</option>
                      </select>
                    </div>

                    <!-- 5. Fecha Contrato Colaboración (Editable) -->
                    <div class="md:col-span-3">
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Fecha Contrato Colab.:
                      </label>
                      <input 
                        type="text" 
                        [ngModel]="fechaContratoComodato()"
                        (ngModelChange)="fechaContratoComodato.set($event)"
                        placeholder="Ej: 14 de junio de 2013"
                        class="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs font-medium" />
                    </div>

                  </div>
                </div>
              }

            </div>
          </div>

          <!-- HOJA OFICIAL CON DISEÑO CORPORATIVO (Área imprimible) -->
          <div class="flex-1 p-6 md:p-10 bg-slate-100/50 overflow-y-auto">
            
            <div class="bg-white shadow-md border border-slate-300 p-8 md:p-10 max-w-3xl mx-auto rounded-lg text-slate-900" id="official-document-sheet">
              @if (docData(); as doc) {
                @switch (doc.config.tipo) {
                  @case ('PRESTAMO_DISPOSITIVO') {
                    <app-document-prestamo-template
                      [doc]="doc"
                      [selectedActivo]="selectedMovementActivo()"
                      [fechaContrato]="fechaContrato()"
                      [modeloAveriado]="modeloAveriado()"
                      [placaAveriada]="placaAveriada()"
                      [incluyeCargador]="incluyeCargador()"
                      [incluyeForro]="incluyeForro()" />
                  }
                  @case ('REINTEGRO_DISPOSITIVO') {
                    <app-document-reintegro-template
                      [doc]="doc"
                      [selectedActivo]="selectedMovementActivo()"
                      [fechaContratoReintegro]="fechaContratoReintegro()"
                      [incluyeCargadorReintegro]="incluyeCargadorReintegro()"
                      [incluyeForroReintegro]="incluyeForroReintegro()"
                      [incluyeDevolucionPrestamo]="incluyeDevolucionPrestamo()"
                      [modeloPrestado]="modeloPrestado()"
                      [placaPrestada]="placaPrestada()"
                      [serialPrestado]="serialPrestado()"
                      [fechaEntregaPrestamo]="fechaEntregaPrestamo()" />
                  }
                  @case ('MEMORANDO_REINTEGRO') {
                    <app-document-memorando-template
                      [doc]="doc"
                      [selectedActivo]="selectedMovementActivo()"
                      [modeloAveriado]="modeloAveriado()"
                      [placaAveriada]="placaAveriada()"
                      [serialAveriado]="serialAveriado()"
                      [incluyeCargador]="incluyeCargador()"
                      [incluyeForro]="incluyeForro()" />
                  }
                  @case ('MEMORANDO_PRESTAMO') {
                    <app-document-memorando-template
                      [doc]="doc"
                      [selectedActivo]="selectedMovementActivo()"
                      [modeloAveriado]="modeloAveriado()"
                      [placaAveriada]="placaAveriada()"
                      [serialAveriado]="serialAveriado()"
                      [incluyeCargador]="incluyeCargador()"
                      [incluyeForro]="incluyeForro()" />
                  }
                  @case ('COMODATO') {
                    <app-document-comodato-template
                      [doc]="doc"
                      [estadoBienComodato]="estadoBienComodato()"
                      [direccionComodatario]="direccionComodatario()"
                      [ciudadComodatario]="ciudadComodatario()"
                      [expedicionDocumentoComodatario]="expedicionDocumentoComodatario()"
                      [emailComodatario]="emailComodatario()"
                      [fechaContratoComodato]="fechaContratoComodato()"
                      [valorReposicionLetrasComodato]="valorReposicionLetrasComodato()"
                      [valorReposicionComodato]="valorReposicionComodato()"
                      [selectedActivoComodato]="selectedActivoComodato()"
                      [bienEntregadoComodato]="bienEntregadoComodato()"
                      [operadorSimComodato]="operadorSimComodato()"
                      [numeroSimComodato]="numeroSimComodato()" />
                  }
                  @default {
                    <app-document-acta-general-template
                      [doc]="doc"
                      [customEstados]="customEstados()"
                      (estadoChange)="setActivoEstado($event.placa, $event.estado)"
                      (setTodosEstados)="setTodosEstados($event)" />
                  }
                }
              }
            </div>

          </div>

        </div>

      </div>
    }
  `,
  styles: [`
    .page-break-inside-avoid {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .comodato-page-1 {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .comodato-page-2 {
      break-before: page !important;
      page-break-before: always !important;
    }
    @media print {
      .no-print {
        display: none !important;
      }
      .print-only {
        display: inline-block !important;
      }
    }
  `]
})
export class MovementDocumentModalComponent {
  private readonly buildDocUseCase = inject(BuildMovementDocumentUseCase);
  private readonly policy = inject(DocumentPolicyService);
  private readonly movementRepo = inject(MovementRepository);
  private readonly getAllLocationsUC = inject(GetAllLocationsUseCase);
  private readonly getAllActivosUC = inject(GetAllActivosUseCase);

  @Output() onMovementUpdated = new EventEmitter<Movement>();

  readonly isOpen = signal(false);
  readonly currentMovement = signal<Movement | null>(null);
  readonly currentDestinationLocation = signal<Location | null>(null);
  readonly allLocations = signal<Location[]>([]);
  readonly selectedLocationId = signal<string>('');
  readonly currentTipo = signal<TipoDocumentoOficial>('ACTA_ENTREGA');
  readonly isIndividualFormat = computed(() => 
    ['COMODATO', 'PRESTAMO_DISPOSITIVO', 'REINTEGRO_DISPOSITIVO', 'MEMORANDO_REINTEGRO', 'MEMORANDO_PRESTAMO'].includes(this.currentTipo())
  );
  readonly movementActivos = computed<any[]>(() => this.currentMovement()?.activos || []);
  readonly selectedMovementActivoIndex = signal<number>(0);
  readonly selectedMovementActivo = computed<any>(() => {
    const list = this.movementActivos();
    const idx = this.selectedMovementActivoIndex();
    return list[idx] || list[0] || null;
  });
  readonly isSavingNotes = signal(false);
  readonly saveStatus = signal<'IDLE' | 'SAVED' | 'ERROR'>('IDLE');
  readonly initialNotes = signal('');
  readonly customEstados = signal<Record<string, string>>({});
  customNotes = '';

  // Metadatos de Carta de Préstamo
  readonly fechaContrato = signal('………………');
  readonly searchPlacaQuery = signal<string>('');
  readonly placaAveriada = signal<string>('');
  readonly modeloAveriado = signal<string>('');
  readonly serialAveriado = signal<string>('');
  readonly incluyeCargador = signal('SÍ');
  readonly incluyeForro = signal('SÍ');
  
  // Catálogo de activos para typeahead
  readonly allActivos = signal<Activo[]>([]);
  readonly showPlacaDropdown = signal<boolean>(false);
  readonly selectedActivoAveriado = signal<Activo | null>(null);

  readonly filteredAveriados = computed<Activo[]>(() => {
    const term = this.searchPlacaQuery().toLowerCase().trim();
    if (!term || term.length < 2) return [];
    const todos = this.allActivos();
    return todos.filter(a =>
      (a.placa && a.placa.toLowerCase().includes(term)) ||
      (a.serial && a.serial.toLowerCase().includes(term)) ||
      (a.marca && a.marca.toLowerCase().includes(term)) ||
      (a.modelo && a.modelo.toLowerCase().includes(term))
    ).slice(0, 15);
  });

  // Metadatos de Reintegro
  readonly fechaContratoReintegro = signal<string>('14 de junio de 2013');
  readonly incluyeCargadorReintegro = signal<string>('No incluido');
  readonly incluyeForroReintegro = signal<string>('No incluido');
  readonly incluyeDevolucionPrestamo = signal<boolean>(true);
  readonly placaPrestada = signal<string>('');
  readonly modeloPrestado = signal<string>('');
  readonly serialPrestado = signal<string>('');
  readonly fechaEntregaPrestamo = signal<string>('');
  readonly searchPlacaPrestadaQuery = signal<string>('');
  readonly showPlacaPrestadaDropdown = signal<boolean>(false);
  readonly selectedActivoPrestado = signal<Activo | null>(null);

  readonly filteredPrestados = computed<Activo[]>(() => {
    const term = this.searchPlacaPrestadaQuery().toLowerCase().trim();
    if (!term || term.length < 2) return [];
    const todos = this.allActivos();
    return todos.filter(a =>
      (a.placa && a.placa.toLowerCase().includes(term)) ||
      (a.serial && a.serial.toLowerCase().includes(term)) ||
      (a.marca && a.marca.toLowerCase().includes(term)) ||
      (a.modelo && a.modelo.toLowerCase().includes(term))
    ).slice(0, 15);
  });

  // Metadatos de Comodato
  readonly searchPlacaComodatoQuery = signal<string>('');
  readonly showPlacaComodatoDropdown = signal<boolean>(false);
  readonly selectedActivoComodato = signal<Activo | null>(null);

  readonly filteredComodato = computed<Activo[]>(() => {
    const term = this.searchPlacaComodatoQuery().toLowerCase().trim();
    if (!term || term.length < 1) return [];
    const todos = this.allActivos();
    return todos.filter(a =>
      (a.placa && a.placa.toLowerCase().includes(term)) ||
      (a.serial && a.serial.toLowerCase().includes(term)) ||
      (a.marca && a.marca.toLowerCase().includes(term)) ||
      (a.modelo && a.modelo.toLowerCase().includes(term))
    ).slice(0, 15);
  });

  readonly bienEntregadoComodato = signal<string>('');
  readonly precioCompraInput = signal<string>('');
  readonly fechaContratoComodato = signal<string>('14 de junio de 2013');
  readonly direccionComodatario = signal<string>('');
  readonly ciudadComodatario = signal<string>('Bogotá D.C.');
  readonly expedicionDocumentoComodatario = signal<string>('Bogotá D.C.');
  readonly emailComodatario = signal<string>('');
  readonly operadorSimComodato = signal<string>('');
  readonly numeroSimComodato = signal<string>('');
  readonly valorReposicionComodato = signal<string>('$ 0');
  readonly valorReposicionLetrasComodato = signal<string>('CERO PESOS');
  readonly estadoBienComodato = signal<string>('BUENO');

  readonly recipientAssignedLocations = computed<Location[]>(() => {
    const mov = this.currentMovement();
    const all = this.allLocations();
    if (!mov) return [];
    const targetResp = mov.receiver || mov.responsible;

    const list: Location[] = [];
    const seen = new Set<string>();

    const currentDest = this.currentDestinationLocation() || mov.destinationLocation;
    if (currentDest?.id) {
      list.push(currentDest);
      seen.add(currentDest.id);
    }

    if (targetResp?.locations && Array.isArray(targetResp.locations)) {
      for (const loc of targetResp.locations) {
        if (loc?.id && !seen.has(loc.id)) {
          list.push(loc);
          seen.add(loc.id);
        }
      }
    }

    if (targetResp?.locationIds && Array.isArray(targetResp.locationIds)) {
      for (const id of targetResp.locationIds) {
        if (!seen.has(id)) {
          const found = all.find(l => l.id === id);
          if (found) {
            list.push(found);
            seen.add(id);
          }
        }
      }
    }

    return list;
  });

  readonly otherLocations = computed<Location[]>(() => {
    const assignedIds = new Set(this.recipientAssignedLocations().map(l => l.id));
    return this.allLocations().filter(l => !assignedIds.has(l.id));
  });

  readonly docData = computed<OfficialDocumentData | null>(() => {
    const mov = this.currentMovement();
    if (!mov) return null;
    return this.buildDocUseCase.execute(
      mov, 
      this.currentTipo(), 
      this.customNotes,
      this.currentDestinationLocation(),
      undefined,
      {
        fechaContrato: this.fechaContrato(),
        modeloAveriado: this.modeloAveriado(),
        serialAveriado: this.serialAveriado(),
        placaAveriada: this.placaAveriada(),
        cargador: this.incluyeCargador(),
        forro: this.incluyeForro()
      },
      {
        fechaContrato: this.fechaContratoReintegro(),
        cargador: this.incluyeCargadorReintegro(),
        forro: this.incluyeForroReintegro(),
        incluyeDevolucionPrestamo: this.incluyeDevolucionPrestamo(),
        modeloPrestado: this.modeloPrestado(),
        serialPrestado: this.serialPrestado(),
        placaPrestada: this.placaPrestada(),
        fechaEntregaPrestamo: this.fechaEntregaPrestamo()
      },
      {
        modeloAveriado: this.modeloAveriado(),
        serialAveriado: this.serialAveriado(),
        placaAveriada: this.placaAveriada(),
        cargador: this.incluyeCargador(),
        forro: this.incluyeForro()
      },
      {
        fechaContratoColaboracion: this.fechaContratoComodato(),
        lugarFecha: `${this.currentDestinationLocation()?.ciudad || mov.destinationLocation?.ciudad || 'Bogotá D.C.'}, ${formatFechaFormal(mov.createdAt)}`,
        bienEntregado: this.bienEntregadoComodato(),
        precioCompra: parseInt(this.precioCompraInput(), 10) || undefined,
        direccionComodatario: this.direccionComodatario(),
        ciudadComodatario: this.ciudadComodatario(),
        emailComodatario: this.emailComodatario(),
        operadorSim: this.operadorSimComodato(),
        numeroSim: this.numeroSimComodato(),
        valorReposicion: this.valorReposicionComodato(),
        valorReposicionLetras: this.valorReposicionLetrasComodato(),
        estadoBien: this.estadoBienComodato()
      }
    );
  });

  onLocationChange(locationId: string) {
    this.selectedLocationId.set(locationId);
    const found = this.allLocations().find(l => l.id === locationId);
    if (found) {
      this.currentDestinationLocation.set(found);
    }
  }

  onSearchPlacaInput(value: string) {
    this.searchPlacaQuery.set(value);
    this.placaAveriada.set(value);
    this.showPlacaDropdown.set(true);
    if (this.selectedActivoAveriado() && this.selectedActivoAveriado()?.placa !== value) {
      this.selectedActivoAveriado.set(null);
    }
  }

  onSearchPlacaFocus() {
    if (this.searchPlacaQuery().trim().length >= 2) {
      this.showPlacaDropdown.set(true);
    }
  }

  selectActivoAveriado(activo: Activo) {
    this.selectedActivoAveriado.set(activo);
    this.searchPlacaQuery.set(activo.placa);
    this.placaAveriada.set(activo.placa);
    const modeloCompleto = [activo.marca, activo.modelo].filter(Boolean).join(' ') || activo.modelo || 'Equipo Móvil';
    this.modeloAveriado.set(modeloCompleto);
    if (activo.serial) {
      this.serialAveriado.set(activo.serial);
    }
    this.showPlacaDropdown.set(false);
  }

  clearPlacaSearch() {
    this.searchPlacaQuery.set('');
    this.placaAveriada.set('');
    this.modeloAveriado.set('');
    this.serialAveriado.set('');
    this.selectedActivoAveriado.set(null);
    this.showPlacaDropdown.set(false);
  }

  onSearchPlacaPrestadaInput(value: string) {
    this.searchPlacaPrestadaQuery.set(value);
    this.placaPrestada.set(value);
    this.showPlacaPrestadaDropdown.set(true);
    if (this.selectedActivoPrestado() && this.selectedActivoPrestado()?.placa !== value) {
      this.selectedActivoPrestado.set(null);
    }
  }

  onSearchPlacaPrestadaFocus() {
    if (this.searchPlacaPrestadaQuery().trim().length >= 2) {
      this.showPlacaPrestadaDropdown.set(true);
    }
  }

  selectActivoPrestado(activo: Activo) {
    this.selectedActivoPrestado.set(activo);
    this.searchPlacaPrestadaQuery.set(activo.placa);
    this.placaPrestada.set(activo.placa);
    const modeloCompleto = [activo.marca, activo.modelo].filter(Boolean).join(' ') || activo.modelo || 'Equipo Móvil';
    this.modeloPrestado.set(modeloCompleto);
    if (activo.serial) {
      this.serialPrestado.set(activo.serial);
    }
    this.showPlacaPrestadaDropdown.set(false);
  }

  clearPlacaPrestadaSearch() {
    this.searchPlacaPrestadaQuery.set('');
    this.placaPrestada.set('');
    this.modeloPrestado.set('');
    this.serialPrestado.set('');
    this.selectedActivoPrestado.set(null);
    this.showPlacaPrestadaDropdown.set(false);
  }

  onSearchPlacaComodatoInput(value: string) {
    this.searchPlacaComodatoQuery.set(value);
    if (!value.trim()) {
      this.clearPlacaComodatoSearch();
      return;
    }
    this.showPlacaComodatoDropdown.set(true);
    const match = this.allActivos().find(a => a.placa && a.placa.toLowerCase() === value.toLowerCase().trim());
    if (match) {
      this.selectActivoComodato(match);
    } else if (this.selectedActivoComodato() && this.selectedActivoComodato()?.placa !== value) {
      this.selectedActivoComodato.set(null);
      this.bienEntregadoComodato.set('');
      this.precioCompraInput.set('');
      this.valorReposicionComodato.set('$ 0');
      this.valorReposicionLetrasComodato.set('CERO PESOS');
      this.operadorSimComodato.set('');
      this.numeroSimComodato.set('');
    }
  }

  onSearchPlacaComodatoFocus() {
    if (this.searchPlacaComodatoQuery().trim().length >= 1) {
      this.showPlacaComodatoDropdown.set(true);
    }
  }

  selectActivoComodato(activo: Activo) {
    this.selectedActivoComodato.set(activo);
    this.searchPlacaComodatoQuery.set(activo.placa || '');
    this.showPlacaComodatoDropdown.set(false);

    const tipo = (activo as any).tipo || (activo as any).tipoActivo?.nombre || (activo as any).category?.nombre || 'Dispositivo';
    const tipoCap = tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase();
    const modelo = activo.modelo && activo.modelo !== 'N/A' ? activo.modelo.trim() : (activo.marca && activo.marca !== 'N/A' ? activo.marca.trim() : '');
    const bien = `${tipoCap} ${modelo}`.trim();
    this.bienEntregadoComodato.set(bien);

    const precio = (activo as any).precioCompra ? Number((activo as any).precioCompra) : null;
    if (precio && precio > 0) {
      this.precioCompraInput.set(String(precio));
      this.valorReposicionComodato.set(formatMoneda(precio));
      this.valorReposicionLetrasComodato.set(numeroALetras(precio));
    } else {
      this.precioCompraInput.set('');
      this.valorReposicionComodato.set('$ 0');
      this.valorReposicionLetrasComodato.set('CERO PESOS');
    }

    const simInfo = extractSimFromActivo(activo);
    this.operadorSimComodato.set(simInfo.operador);
    this.numeroSimComodato.set(simInfo.numero);
  }

  clearPlacaComodatoSearch() {
    this.searchPlacaComodatoQuery.set('');
    this.selectedActivoComodato.set(null);
    this.showPlacaComodatoDropdown.set(false);
    this.bienEntregadoComodato.set('');
    this.precioCompraInput.set('');
    this.valorReposicionComodato.set('$ 0');
    this.valorReposicionLetrasComodato.set('CERO PESOS');
    this.operadorSimComodato.set('');
    this.numeroSimComodato.set('');
  }

  getActivoComodato(doc?: OfficialDocumentData | null): any {
    const selected = this.selectedActivoComodato();
    if (selected) {
      return {
        id: selected.id,
        placa: selected.placa,
        tipo: (selected as any).tipo || (selected as any).tipoActivo?.nombre || 'Dispositivo',
        marca: selected.marca || 'N/A',
        modelo: selected.modelo || 'N/A',
        serial: selected.serial || 'S/N',
        estado: selected.estado || 'BUENO',
        precioCompra: selected.precioCompra ? Number(selected.precioCompra) : undefined,
        simCard: (selected as any).simCard,
        simCards: selected.simCards
      };
    }
    if (doc && doc.activos && doc.activos.length > 0) {
      return doc.activos[0];
    }
    const mov = this.currentMovement();
    if (mov && mov.activos && mov.activos.length > 0) {
      const a = mov.activos[0];
      return {
        id: a.id,
        placa: a.placa,
        tipo: a.tipo || a.tipoActivo?.nombre || 'Dispositivo',
        marca: a.marca || 'N/A',
        modelo: a.modelo || 'N/A',
        serial: a.serial || 'S/N',
        estado: a.estado || 'BUENO',
        precioCompra: a.precioCompra ? Number(a.precioCompra) : undefined,
        simCard: a.simCard,
        simCards: a.simCards
      };
    }
    return null;
  }

  getBienEntregado(doc?: OfficialDocumentData | null): string {
    const act = this.getActivoComodato(doc);
    if (act) {
      const tipo = (act as any).tipo || (act as any).tipoActivo?.nombre || 'Dispositivo';
      const tipoCap = tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase();
      const mod = act.modelo && act.modelo !== 'N/A' ? act.modelo.trim() : (act.marca && act.marca !== 'N/A' ? act.marca.trim() : '');
      return `${tipoCap} ${mod}`.trim();
    }
    if (this.bienEntregadoComodato() && this.bienEntregadoComodato().trim()) {
      return this.bienEntregadoComodato().trim();
    }
    return 'Dispositivo';
  }

  onPrecioCompraChange(val: string | number) {
    const str = String(val).replace(/[^0-9]/g, '');
    this.precioCompraInput.set(str);
    const num = parseInt(str, 10);
    if (!isNaN(num) && num > 0) {
      this.valorReposicionComodato.set(formatMoneda(num));
      this.valorReposicionLetrasComodato.set(numeroALetras(num));
    } else {
      this.valorReposicionComodato.set('$ 0');
      this.valorReposicionLetrasComodato.set('CERO PESOS');
    }
  }

  setActivoEstado(placa: string, nuevoEstado: string) {
    this.customEstados.update(prev => ({
      ...prev,
      [placa]: nuevoEstado
    }));
  }

  setTodosEstados(nuevoEstado: string) {
    const mov = this.currentMovement();
    if (!mov || !mov.activos) return;
    const updated: Record<string, string> = { ...this.customEstados() };
    for (const activo of mov.activos) {
      if (activo.placa) {
        updated[activo.placa] = nuevoEstado;
      }
    }
    this.customEstados.set(updated);
  }

  hasNotesChanged(): boolean {
    return this.customNotes.trim() !== this.initialNotes().trim();
  }

  saveNotesToDatabase() {
    const mov = this.currentMovement();
    if (!mov) return;

    this.isSavingNotes.set(true);
    this.saveStatus.set('IDLE');

    this.movementRepo.updateNotes(mov.id, this.customNotes.trim()).subscribe({
      next: (updatedMov) => {
        this.isSavingNotes.set(false);
        this.saveStatus.set('SAVED');
        this.initialNotes.set(this.customNotes.trim());

        const safeMerged: Movement = {
          ...mov,
          ...updatedMov,
          notes: this.customNotes.trim(),
          responsible: updatedMov.responsible || mov.responsible,
          receiver: updatedMov.receiver || mov.receiver,
          originLocation: updatedMov.originLocation || mov.originLocation,
          destinationLocation: updatedMov.destinationLocation || mov.destinationLocation,
          activos: (updatedMov.activos && updatedMov.activos.length > 0) ? updatedMov.activos : mov.activos,
          simCards: (updatedMov.simCards && updatedMov.simCards.length > 0) ? updatedMov.simCards : mov.simCards
        };

        this.currentMovement.set(safeMerged);
        this.onMovementUpdated.emit(safeMerged);
        setTimeout(() => {
          if (this.saveStatus() === 'SAVED') {
            this.saveStatus.set('IDLE');
          }
        }, 3500);
      },
      error: (err) => {
        console.error('Error guardando notas del movimiento:', err);
        this.isSavingNotes.set(false);
        this.saveStatus.set('ERROR');
      }
    });
  }

  open(movement: Movement, destinationLocation?: Location | null) {
    this.currentMovement.set(movement);
    const initialLoc = destinationLocation || movement.destinationLocation || null;
    this.currentDestinationLocation.set(initialLoc);
    if (initialLoc?.id) {
      this.selectedLocationId.set(initialLoc.id);
    }

    this.getAllLocationsUC.execute().subscribe({
      next: (locations) => {
        this.allLocations.set(locations);
        if (!this.selectedLocationId()) {
          const assigned = this.recipientAssignedLocations();
          if (assigned.length > 0) {
            this.selectedLocationId.set(assigned[0].id);
            this.currentDestinationLocation.set(assigned[0]);
          } else if (locations.length > 0) {
            this.selectedLocationId.set(locations[0].id);
            this.currentDestinationLocation.set(locations[0]);
          }
        }
      },
      error: (err) => console.error('Error cargando sedes en modal:', err)
    });

    this.getAllActivosUC.execute().subscribe({
      next: (activos) => {
        this.allActivos.set(activos);
        const primer = movement.activos && movement.activos.length > 0 ? movement.activos[0] : null;
        if (primer?.placa) {
          const full = activos.find(a => a.placa && a.placa.toLowerCase() === primer.placa.toLowerCase());
          if (full) {
            this.selectActivoComodato(full);
          }
        }
      },
      error: (err) => console.error('Error cargando activos para buscador:', err)
    });

    const sugerido = this.policy.sugerirTipoDocumento(movement, destinationLocation);
    this.currentTipo.set(sugerido);
    this.selectedMovementActivoIndex.set(0);
    this.customNotes = movement.notes || '';
    this.initialNotes.set(this.customNotes);
    this.fechaContrato.set('………………');
    this.searchPlacaQuery.set('');
    this.placaAveriada.set('');
    this.modeloAveriado.set('');
    this.serialAveriado.set('');
    this.selectedActivoAveriado.set(null);
    this.showPlacaDropdown.set(false);
    this.incluyeCargador.set('SÍ');
    this.incluyeForro.set('SÍ');

    this.fechaContratoComodato.set('14 de junio de 2013');
    const targetPerson = movement.receiver || movement.responsible;
    this.direccionComodatario.set(targetPerson?.direccion || targetPerson?.address || '');
    this.ciudadComodatario.set(targetPerson?.ciudad || initialLoc?.ciudad || 'Bogotá D.C.');
    this.expedicionDocumentoComodatario.set(targetPerson?.lugarExpedicion || targetPerson?.expedicion || targetPerson?.ciudadExpedicion || 'Bogotá D.C.');
    this.emailComodatario.set(targetPerson?.email || '');

    const primerActivo = movement.activos && movement.activos.length > 0 ? movement.activos[0] : null;
    if (primerActivo) {
      this.selectActivoComodato(primerActivo as any);
    } else {
      this.clearPlacaComodatoSearch();
    }
    this.estadoBienComodato.set('BUENO');

    const initialMap: Record<string, string> = {};
    if (movement.activos && movement.activos.length > 0) {
      for (const activo of movement.activos) {
        if (activo.placa) {
          initialMap[activo.placa] = getEstadoLabel(activo.estado);
        }
      }
    }
    this.customEstados.set(initialMap);

    this.saveStatus.set('IDLE');
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    this.currentMovement.set(null);
    this.currentDestinationLocation.set(null);
    this.selectedLocationId.set('');
    this.selectedMovementActivoIndex.set(0);
    this.searchPlacaQuery.set('');
    this.placaAveriada.set('');
    this.modeloAveriado.set('');
    this.serialAveriado.set('');
    this.selectedActivoAveriado.set(null);
    this.showPlacaDropdown.set(false);
    this.clearPlacaComodatoSearch();
    this.fechaContratoComodato.set('14 de junio de 2013');
    this.direccionComodatario.set('');
    this.ciudadComodatario.set('Bogotá D.C.');
    this.expedicionDocumentoComodatario.set('Bogotá D.C.');
    this.emailComodatario.set('');
    this.operadorSimComodato.set('');
    this.numeroSimComodato.set('');
    this.estadoBienComodato.set('BUENO');
  }

  onSelectMovementActivoIndex(index: number | string) {
    const idx = Number(index);
    this.selectedMovementActivoIndex.set(idx);
    const act = this.movementActivos()[idx];
    if (act) {
      const full = this.allActivos().find(a => a.placa && act.placa && a.placa.toLowerCase() === act.placa.toLowerCase());
      if (full) {
        this.selectActivoComodato(full);
      } else {
        this.selectActivoComodato(act as any);
      }
    }
  }

  onTipoChange(nuevoTipo: TipoDocumentoOficial) {
    this.currentTipo.set(nuevoTipo);
  }

  /**
   * Motor de Impresión Aislado mediante IFrame:
   * Garantiza que el diálogo de impresión imprima ÚNICAMENTE la hoja oficial del documento
   * con sus estilos Tailwind, tipografía y logo, sin mezclar la pantalla de movimientos de fondo.
   */
  printDocument() {
    const printElement = document.getElementById('official-document-sheet');
    if (!printElement) return;

    let iframe = document.getElementById('isolated-print-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.remove();
    }
    iframe = document.createElement('iframe');
    iframe.id = 'isolated-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.left = '-10000px';
    iframe.style.top = '0';
    iframe.style.width = '215.9mm';
    iframe.style.height = '279.4mm';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) return;

    const styleTags = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(node => node.outerHTML)
      .join('\n');

    const titulo = this.docData()?.config.titulo || 'Documento Oficial';
    const consecutivo = this.docData()?.consecutivo || '';

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>${titulo} - ${consecutivo}</title>
        ${styleTags}
        <style>
          @page {
            size: letter;
            margin: 8mm 12mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            height: auto !important;
            min-height: 100% !important;
            max-height: none !important;
            overflow: visible !important;
            overflow-x: visible !important;
            overflow-y: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
          }
          .page-break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .comodato-page-1 {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
            min-height: auto !important;
            height: auto !important;
            margin-bottom: 0 !important;
          }
          .comodato-page-2 {
            page-break-before: always !important;
            break-before: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
            min-height: auto !important;
            height: auto !important;
            margin-top: 0 !important;
            padding-top: 0 !important;
            border-top: none !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: inline-block !important;
          }
        </style>
      </head>
      <body class="bg-white" style="margin: 0; padding: 0;">
        ${printElement.innerHTML}
      </body>
      </html>
    `);
    iframeDoc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 400);
  }
}
