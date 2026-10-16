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
import { ActivoRepository } from '../../../../inventory/domain/repositories/activo.repository';
import { GetAllActivosUseCase } from '../../../../inventory/application/use-cases/get-all-activos.use-case';
import { Activo } from '../../../../inventory/domain/models/activo.model';

@Component({
  selector: 'app-movement-document-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
                      <!-- Backdrop invisible para cerrar dropdown al hacer clic fuera -->
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
                            class="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 text-xs font-bold transition-colors cursor-pointer">
                            ✕
                          </button>
                        }

                        <!-- Menú Desplegable Flotante tipo Typeahead de Movimientos -->
                        @if (showPlacaDropdown() && filteredAveriados().length > 0) {
                          <div class="absolute z-50 left-0 w-72 max-w-[90vw] bg-white border border-slate-200 rounded-xl mt-1 shadow-2xl max-h-56 overflow-y-auto">
                            @for (activo of filteredAveriados(); track activo.id) {
                              <div 
                                (click)="selectActivoAveriado(activo)" 
                                class="p-2.5 hover:bg-indigo-50/70 cursor-pointer border-b border-slate-100 last:border-none flex flex-col gap-0.5 transition-colors">
                                <div class="flex items-center justify-between">
                                  <span class="text-xs font-bold font-mono text-slate-900">{{ activo.placa }}</span>
                                  <span class="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase"
                                    [ngClass]="{
                                      'bg-emerald-50 text-emerald-700': activo.estado === 'DISPONIBLE',
                                      'bg-blue-50 text-blue-700': activo.estado === 'OPERACION',
                                      'bg-amber-50 text-amber-700': activo.estado === 'MANTENIMIENTO',
                                      'bg-slate-100 text-slate-600': activo.estado !== 'DISPONIBLE' && activo.estado !== 'OPERACION' && activo.estado !== 'MANTENIMIENTO'
                                    }">
                                    {{ activo.estado }}
                                  </span>
                                </div>
                                <div class="flex items-center justify-between text-[11px] text-slate-600">
                                  <span>{{ activo.marca }} {{ activo.modelo }}</span>
                                  <span class="font-mono text-slate-400 text-[10px]">S/N: {{ activo.serial || 'N/A' }}</span>
                                </div>
                                @if (activo.location?.nombre) {
                                  <p class="text-[9px] text-slate-400 mt-0.5 truncate">📍 {{ activo.location?.nombre }}</p>
                                }
                              </div>
                            }
                          </div>
                        }
                      </div>
                    </div>

                    <!-- 4. Modelo Averiado (Autocompletado al seleccionar placa pero SIEMPRE editable) -->
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Modelo Averiado:
                      </label>
                      <input 
                        type="text" 
                        [ngModel]="modeloAveriado()"
                        (ngModelChange)="modeloAveriado.set($event)"
                        placeholder="Ej: Samsung Galaxy A14"
                        class="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs" />
                    </div>

                    <!-- 5. Cargador -->
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Cargador:
                      </label>
                      <select 
                        [ngModel]="incluyeCargador()"
                        (ngModelChange)="incluyeCargador.set($event)"
                        class="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs">
                        <option value="SÍ">SÍ</option>
                        <option value="NO">NO</option>
                        <option value="SOLO CABLE">SOLO CABLE</option>
                      </select>
                    </div>

                    <!-- 6. Forro -->
                    <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Forro:
                      </label>
                      <select 
                        [ngModel]="incluyeForro()"
                        (ngModelChange)="incluyeForro.set($event)"
                        class="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs">
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
                  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2.5 items-end">
                    
                    <!-- 1. Fecha Contrato Colaboración -->
                    <div class="md:col-span-3">
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Fecha Contrato Colab.:
                      </label>
                      <input 
                        type="text" 
                        [ngModel]="fechaContratoReintegro()"
                        (ngModelChange)="fechaContratoReintegro.set($event)"
                        placeholder="Ej: 14 de junio de 2013"
                        class="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs" />
                    </div>

                    <!-- 2. Cargador Reintegrado -->
                    <div class="md:col-span-2">
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Cargador Reintegrado:
                      </label>
                      <select 
                        [ngModel]="incluyeCargadorReintegro()"
                        (ngModelChange)="incluyeCargadorReintegro.set($event)"
                        class="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs">
                        <option value="No incluido">No incluido</option>
                        <option value="Incluido">Incluido</option>
                        <option value="Solo cable">Solo cable</option>
                      </select>
                    </div>

                    <!-- 3. Forro Reintegrado -->
                    <div class="md:col-span-2">
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Forro Reintegrado:
                      </label>
                      <select 
                        [ngModel]="incluyeForroReintegro()"
                        (ngModelChange)="incluyeForroReintegro.set($event)"
                        class="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs">
                        <option value="No incluido">No incluido</option>
                        <option value="Incluido">Incluido</option>
                      </select>
                    </div>

                    <!-- 4. Toggle: Devolución de equipo en préstamo -->
                    <div class="md:col-span-5 flex items-center justify-between bg-indigo-50/70 border border-indigo-200/80 rounded-lg px-3 py-1.5 shadow-2xs">
                      <div class="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id="chk-devolucion-prestamo"
                          [checked]="incluyeDevolucionPrestamo()"
                          (change)="incluyeDevolucionPrestamo.set($any($event.target).checked)"
                          class="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer" />
                        <label for="chk-devolucion-prestamo" class="text-xs font-bold text-indigo-950 cursor-pointer select-none">
                          Solicitar devolución de equipo prestado
                        </label>
                      </div>
                      <span class="text-[10px] text-indigo-700 font-extrabold uppercase">
                        {{ incluyeDevolucionPrestamo() ? '✓ Sí' : 'No' }}
                      </span>
                    </div>

                    <!-- 5. Campos condicionales si incluye devolución de préstamo -->
                    @if (incluyeDevolucionPrestamo()) {
                      <div class="md:col-span-12 pt-2 border-t border-slate-200">
                        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2.5 items-end">
                          
                          <!-- Buscador Placa Equipo en Préstamo a Devolver -->
                          <div class="md:col-span-4 relative">
                            @if (showPlacaPrestadaDropdown()) {
                              <div class="fixed inset-0 z-40" (click)="showPlacaPrestadaDropdown.set(false)"></div>
                            }
                            <div class="flex items-center justify-between mb-1">
                              <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Placa Equipo Prestado:
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
                                placeholder="Buscar placa, serie a devolver..."
                                class="w-full bg-white text-slate-800 font-mono text-xs pl-2.5 pr-6 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs" />
                              
                              @if (searchPlacaPrestadaQuery()) {
                                <button 
                                  type="button"
                                  (click)="clearPlacaPrestadaSearch()"
                                  title="Limpiar búsqueda"
                                  class="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 text-xs font-bold transition-colors cursor-pointer">
                                  ✕
                                </button>
                              }

                              <!-- Dropdown con filteredPrestados -->
                              @if (showPlacaPrestadaDropdown() && filteredPrestados().length > 0) {
                                <div class="absolute z-50 left-0 w-72 max-w-[90vw] bg-white border border-slate-200 rounded-xl mt-1 shadow-2xl max-h-56 overflow-y-auto">
                                  @for (activo of filteredPrestados(); track activo.id) {
                                    <div 
                                      (click)="selectActivoPrestado(activo)" 
                                      class="p-2.5 hover:bg-indigo-50/70 cursor-pointer border-b border-slate-100 last:border-none flex flex-col gap-0.5 transition-colors">
                                      <div class="flex items-center justify-between">
                                        <span class="text-xs font-bold font-mono text-slate-900">{{ activo.placa }}</span>
                                        <span class="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase"
                                          [ngClass]="{
                                            'bg-emerald-50 text-emerald-700': activo.estado === 'DISPONIBLE',
                                            'bg-blue-50 text-blue-700': activo.estado === 'OPERACION',
                                            'bg-amber-50 text-amber-700': activo.estado === 'MANTENIMIENTO',
                                            'bg-slate-100 text-slate-600': activo.estado !== 'DISPONIBLE' && activo.estado !== 'OPERACION' && activo.estado !== 'MANTENIMIENTO'
                                          }">
                                          {{ activo.estado }}
                                        </span>
                                      </div>
                                      <div class="flex items-center justify-between text-[11px] text-slate-600">
                                        <span>{{ activo.marca }} {{ activo.modelo }}</span>
                                        <span class="font-mono text-slate-400 text-[10px]">S/N: {{ activo.serial || 'N/A' }}</span>
                                      </div>
                                    </div>
                                  }
                                </div>
                              }
                            </div>
                          </div>

                          <!-- Modelo Equipo Prestado Editable -->
                          <div class="md:col-span-4">
                            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                              Modelo Equipo Prestado:
                            </label>
                            <input 
                              type="text" 
                              [ngModel]="modeloPrestado()"
                              (ngModelChange)="modeloPrestado.set($event)"
                              placeholder="Ej: Dispositivo CS10"
                              class="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs" />
                          </div>

                          <!-- Fecha de Entrega en Préstamo -->
                          <div class="md:col-span-4">
                            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                              Fecha Entrega del Préstamo:
                            </label>
                            <input 
                              type="text" 
                              [ngModel]="fechaEntregaPrestamo()"
                              (ngModelChange)="fechaEntregaPrestamo.set($event)"
                              placeholder="Ej: 10 de enero de 2026"
                              class="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs" />
                          </div>

                        </div>
                      </div>
                    }

                  </div>
                </div>
              }

              <!-- BARRA DE CONFIGURACIÓN ESPECÍFICA PARA MEMORANDO INTERNO (LÍDER DE OFICINA) -->
              @if (currentTipo() === 'MEMORANDO_REINTEGRO' || currentTipo() === 'MEMORANDO_PRESTAMO') {
                <div class="md:col-span-12 pt-3 mt-1 border-t border-slate-200">
                  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2.5 items-end">

                    <!-- 1. Switch Rápido: Tipo de Memorando -->
                    <div class="md:col-span-3">
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Subtipo Memorando:
                      </label>
                      <div class="flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-300">
                        <button 
                          type="button" 
                          (click)="onTipoChange('MEMORANDO_REINTEGRO')"
                          [class.bg-white]="currentTipo() === 'MEMORANDO_REINTEGRO'"
                          [class.text-indigo-900]="currentTipo() === 'MEMORANDO_REINTEGRO'"
                          [class.font-bold]="currentTipo() === 'MEMORANDO_REINTEGRO'"
                          [class.shadow-2xs]="currentTipo() === 'MEMORANDO_REINTEGRO'"
                          class="flex-1 py-1 text-[11px] rounded-md transition-all text-center cursor-pointer">
                          Reintegro
                        </button>
                        <button 
                          type="button" 
                          (click)="onTipoChange('MEMORANDO_PRESTAMO')"
                          [class.bg-white]="currentTipo() === 'MEMORANDO_PRESTAMO'"
                          [class.text-indigo-900]="currentTipo() === 'MEMORANDO_PRESTAMO'"
                          [class.font-bold]="currentTipo() === 'MEMORANDO_PRESTAMO'"
                          [class.shadow-2xs]="currentTipo() === 'MEMORANDO_PRESTAMO'"
                          class="flex-1 py-1 text-[11px] rounded-md transition-all text-center cursor-pointer">
                          Préstamo
                        </button>
                      </div>
                    </div>

                    <!-- 2. Buscador Placa Averiada (Typeahead) -->
                    <div class="md:col-span-3 relative">
                      @if (showPlacaDropdown()) {
                        <div class="fixed inset-0 z-40" (click)="showPlacaDropdown.set(false)"></div>
                      }
                      <div class="flex items-center justify-between mb-1">
                        <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Placa Averiada:
                        </label>
                        @if (selectedActivoAveriado()) {
                          <span class="text-[9px] text-emerald-600 font-bold">✓ Ok</span>
                        }
                      </div>
                      <div class="relative z-50">
                        <input 
                          type="text" 
                          [ngModel]="searchPlacaQuery()"
                          (input)="onSearchPlacaInput($any($event.target).value)"
                          (focus)="onSearchPlacaFocus()"
                          placeholder="Buscar placa..."
                          class="w-full bg-white text-slate-800 font-mono text-xs pl-2.5 pr-6 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs" />
                        @if (searchPlacaQuery()) {
                          <button 
                            type="button"
                            (click)="clearPlacaSearch()"
                            title="Limpiar búsqueda"
                            class="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 text-xs font-bold transition-colors cursor-pointer">
                            ✕
                          </button>
                        }
                        @if (showPlacaDropdown() && filteredAveriados().length > 0) {
                          <div class="absolute z-50 left-0 w-72 max-w-[90vw] bg-white border border-slate-200 rounded-xl mt-1 shadow-2xl max-h-56 overflow-y-auto">
                            @for (activo of filteredAveriados(); track activo.id) {
                              <div 
                                (click)="selectActivoAveriado(activo)" 
                                class="p-2.5 hover:bg-indigo-50/70 cursor-pointer border-b border-slate-100 last:border-none flex flex-col gap-0.5 transition-colors">
                                <div class="flex items-center justify-between">
                                  <span class="text-xs font-bold font-mono text-slate-900">{{ activo.placa }}</span>
                                  <span class="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase"
                                    [ngClass]="{
                                      'bg-emerald-50 text-emerald-700': activo.estado === 'DISPONIBLE',
                                      'bg-blue-50 text-blue-700': activo.estado === 'OPERACION',
                                      'bg-amber-50 text-amber-700': activo.estado === 'MANTENIMIENTO',
                                      'bg-slate-100 text-slate-600': activo.estado !== 'DISPONIBLE' && activo.estado !== 'OPERACION' && activo.estado !== 'MANTENIMIENTO'
                                    }">
                                    {{ activo.estado }}
                                  </span>
                                </div>
                                <div class="flex items-center justify-between text-[11px] text-slate-600">
                                  <span>{{ activo.marca }} {{ activo.modelo }}</span>
                                  <span class="font-mono text-slate-400 text-[10px]">S/N: {{ activo.serial || 'N/A' }}</span>
                                </div>
                              </div>
                            }
                          </div>
                        }
                      </div>
                    </div>

                    <!-- 3. Modelo Averiado Editable -->
                    <div class="md:col-span-2">
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Modelo Averiado:
                      </label>
                      <input 
                        type="text" 
                        [ngModel]="modeloAveriado()"
                        (ngModelChange)="modeloAveriado.set($event)"
                        placeholder="Ej: Pos CS10"
                        class="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs" />
                    </div>

                    <!-- 4. Cargador -->
                    <div class="md:col-span-2">
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Cargador:
                      </label>
                      <select 
                        [ngModel]="incluyeCargador()"
                        (ngModelChange)="incluyeCargador.set($event)"
                        class="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs">
                        <option value="SÍ">SÍ</option>
                        <option value="NO">NO</option>
                        <option value="SOLO CABLE">SOLO CABLE</option>
                        <option value="No incluido">No incluido</option>
                      </select>
                    </div>

                    <!-- 5. Forro -->
                    <div class="md:col-span-2">
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Forro:
                      </label>
                      <select 
                        [ngModel]="incluyeForro()"
                        (ngModelChange)="incluyeForro.set($event)"
                        class="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs">
                        <option value="SÍ">SÍ</option>
                        <option value="NO">NO</option>
                        <option value="No incluido">No incluido</option>
                      </select>
                    </div>

                  </div>
                </div>
              }

              <!-- BARRA DE CONFIGURACIÓN ESPECÍFICA PARA CONTRATO DE COMODATO -->
              @if (currentTipo() === 'COMODATO') {
                <div class="md:col-span-12 pt-3 mt-1 border-t border-slate-200">
                  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2.5 items-end">

                    <!-- 1. Placa de Inventario (Solo lectura: carga automática desde el activo) -->
                    <div class="md:col-span-2">
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Placa Inventario:
                      </label>
                      <div class="w-full bg-slate-100/90 text-slate-900 font-mono text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold truncate flex items-center gap-1.5 shadow-2xs" title="{{ getActivoComodato(docData())?.placa || 'Sin placa' }}">
                        <span class="text-indigo-600">🏷️</span>
                        <span class="truncate">{{ getActivoComodato(docData())?.placa || 'Sin placa' }}</span>
                      </div>
                    </div>

                    <!-- 2. Bien Entregado (Solo lectura: Tipo + Modelo) -->
                    <div class="md:col-span-3">
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Bien Entregado:
                      </label>
                      <div class="w-full bg-slate-100/90 text-slate-900 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold truncate flex items-center gap-1.5 shadow-2xs" title="{{ getBienEntregado(docData() || undefined) }}">
                        <span class="text-indigo-600">📱</span>
                        <span class="truncate">{{ getBienEntregado(docData() || undefined) }}</span>
                      </div>
                    </div>

                    <!-- 3. Precio Compra (Solo lectura: costo reposición) -->
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
                @if (doc.config.tipo === 'PRESTAMO_DISPOSITIVO') {
                  <!-- FORMATO OFICIAL: CARTA DE ENTREGA DE DISPOSITIVO EN CALIDAD DE PRÉSTAMO -->
                  <div class="space-y-5 text-slate-900 font-sans text-xs sm:text-[13px] leading-relaxed">
                    
                    <!-- Membrete Superior con Logo y Referencia -->
                    <div class="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-4">
                      <div class="flex items-center gap-3">
                        <img src="/Logo_FLM.png" alt="Flota La Macarena" class="h-14 w-auto object-contain" />
                        <div>
                          <h2 class="text-xs sm:text-sm font-black uppercase text-slate-900 tracking-tight leading-tight">FLOTA LA MACARENA S.A.</h2>
                          <p class="text-[10px] text-slate-600 font-semibold">NIT 860.007.607-1</p>
                          <p class="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Dirección Nacional de Transporte de Pasajeros</p>
                        </div>
                      </div>
                      <div class="text-right">
                        <span class="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-mono font-bold text-xs border border-slate-300">
                          {{ doc.consecutivo }}
                        </span>
                        <p class="text-[9px] text-slate-400 mt-1 uppercase font-semibold">Ref: DP-PR-01</p>
                      </div>
                    </div>

                    <!-- Ciudad y Fecha Formal -->
                    <div class="text-right font-semibold text-slate-800 mb-6">
                      {{ doc.ciudad }} {{ formatFechaFormal(doc.fechaEmision) }}
                    </div>

                    <!-- Datos del Destinatario -->
                    <div class="space-y-0.5 text-slate-900 mb-6 text-xs sm:text-[13px]">
                      <p>Señor(a)</p>
                      <p class="font-bold text-slate-900 uppercase text-sm tracking-tight">{{ doc.partes.entregadoA.nombre }}</p>
                      <p class="font-bold text-slate-800">Participe en Colaboración Empresarial</p>
                      <p class="font-bold text-slate-800">Oficina. <span class="font-semibold uppercase text-slate-900">{{ doc.partes.entregadoA.sede }}</span></p>
                      <p class="font-bold text-slate-800 uppercase">{{ doc.ciudad }}</p>
                    </div>

                    <!-- Asunto -->
                    <div class="mb-5">
                      <p class="font-bold text-slate-900 text-xs sm:text-[13px]">
                        Asunto: <span class="font-normal">Entrega de dispositivo {{ getPrimerActivo(doc)?.modelo || 'tecnológico' }} en calidad de préstamo</span>
                      </p>
                    </div>

                    <!-- Saludo -->
                    <div class="space-y-1 mb-5 text-xs sm:text-[13px]">
                      <p class="font-normal text-slate-900">Respetada Señor(a) {{ doc.partes.entregadoA.nombre }}:</p>
                      <p class="font-normal text-slate-800">Reciba un cordial saludo de parte de Flota La Macarena S.A.</p>
                    </div>

                    <!-- Párrafo 1: Causal / Contrato / Retiro del Averiado -->
                    <div class="text-justify text-slate-800 mb-4 leading-relaxed">
                      <p>
                        En desarrollo del Contrato de Colaboración en Operaciones Conjuntas que nos une celebrado el día <span class="font-semibold underline">{{ fechaContrato() || '………………' }}</span>, y previa autorización de la Gerencia General, en atención a lo informado sobre las fallas técnicas del equipo móvil modelo <strong>{{ modeloAveriado() || 'xxxx' }}</strong> (Placa de inventario: <strong>{{ placaAveriada() || 'xxxxxxx' }}</strong>) entregado previamente en comodato, solicitamos formalmente su devolución para proceder con la revisión técnica correspondiente.
                      </p>
                    </div>

                    <!-- Párrafo 2: Entrega del Dispositivo -->
                    <div class="text-justify text-slate-800 mb-3 leading-relaxed">
                      <p>
                        Por lo anterior, en tanto se realiza el diagnóstico e identificación del daño, la Empresa le hace entrega, en calidad de préstamo, del siguiente dispositivo:
                      </p>
                    </div>

                    <!-- Bloque de Características Técnicas del Dispositivo -->
                    <div class="bg-slate-50/70 border-2 border-slate-900 rounded-lg p-4 space-y-2 text-slate-900 my-4">
                      @if (doc.activos.length > 0) {
                        @for (activo of doc.activos; track activo.placa; let idx = $index) {
                          <div [class.mt-3]="idx > 0" [class.pt-3]="idx > 0" [class.border-t]="idx > 0" class="border-slate-300">
                            @if (doc.activos.length > 1) {
                              <p class="font-bold text-indigo-900 mb-1 text-xs">Dispositivo #{{ idx + 1 }}:</p>
                            }
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                              <p><strong class="font-bold text-slate-900">Modelo: </strong> <span class="font-semibold">{{ activo.modelo }} ({{ activo.marca }})</span></p>
                              <p><strong class="font-bold text-slate-900">Placa de Inventario: </strong> <span class="font-mono font-bold">{{ activo.placa }}</span> <span class="text-slate-500 font-mono text-[11px]">(Serial: {{ activo.serial }})</span></p>
                              <p><strong class="font-bold text-slate-900">Cargador: </strong> <span class="font-semibold">{{ incluyeCargador() }}</span></p>
                              <p><strong class="font-bold text-slate-900">Forro: </strong> <span class="font-semibold">{{ incluyeForro() }}</span></p>
                              <p class="sm:col-span-2">
                                <strong class="font-bold text-slate-900">SIM Card: </strong> 
                                <span class="font-semibold">{{ activo.simCard || (doc.simCards.length > 0 ? (doc.simCards[0].numero + ' - ' + doc.simCards[0].operador + ' [ICCID: ' + doc.simCards[0].iccid + ']') : 'No asignada') }}</span>
                              </p>
                            </div>
                          </div>
                        }
                      } @else {
                        <p class="italic text-slate-500 text-xs">No se encontraron activos asociados a este movimiento.</p>
                      }
                    </div>

                    <!-- Párrafo 3: Calidad de Depositario y Custodia -->
                    <div class="text-justify text-slate-800 mb-6 leading-relaxed">
                      <p>
                        Le recordamos que, conforme a lo estipulado en el contrato de colaboración en operaciones conjuntas, el Partícipe en Colaboración Empresarial asume la calidad de depositario de los elementos suministrados por la Empresa. En consecuencia, le solicitamos el uso adecuado, custodia y conservación de esta herramienta tecnológica, la cual está destinada exclusivamente al desarrollo del objeto del contrato.
                      </p>
                    </div>

                    @if (doc.observacionesGenerales) {
                      <div class="border border-slate-300 bg-slate-50 p-3 rounded-lg text-xs mb-6">
                        <strong class="text-slate-700 block mb-0.5">Observaciones Adicionales:</strong>
                        <p class="text-slate-800 italic">{{ doc.observacionesGenerales }}</p>
                      </div>
                    }

                    <!-- Firmas: Emisor Oficial Institucional y Constancia de Recibido -->
                    <div class="pt-6 grid grid-cols-2 gap-8 page-break-inside-avoid text-xs sm:text-[13px]">
                      
                      <!-- Emisor Institucional (Word Oficial) -->
                      <div class="space-y-1">
                        <p class="text-slate-700 font-semibold mb-12">Atentamente,</p>
                        <div class="border-t border-slate-900 pt-1">
                          <p class="font-black text-slate-900 uppercase">JOHAN HERNANDO VÁSQUEZ GONZÁLEZ</p>
                          <p class="text-slate-700 text-xs font-semibold">Director Nacional de Transporte de Pasajeros</p>
                          <p class="text-slate-500 text-[11px] font-mono mt-0.5">26-28</p>
                        </div>
                      </div>

                      <!-- Receptor / Partícipe (Constancia de Recibido) -->
                      <div class="space-y-1">
                        <p class="text-slate-700 font-semibold mb-12">Recibí a conformidad:</p>
                        <div class="border-t border-slate-900 pt-1">
                          <p class="font-bold text-slate-900 uppercase">{{ doc.partes.entregadoA.nombre }}</p>
                          <p class="text-slate-700 text-xs font-semibold">C.C. {{ doc.partes.entregadoA.identificacion || '__________________________' }}</p>
                          <p class="text-slate-500 text-[11px] mt-0.5">Partícipe / Receptor Autorizado</p>
                        </div>
                      </div>

                    </div>

                    <!-- Pie de Página Institucional y Elaboración -->
                    <div class="pt-4 mt-6 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-600">
                      <div class="flex items-center gap-1.5">
                        <span class="font-bold text-slate-800">Elaboró:</span>
                        <span class="font-semibold text-slate-900 uppercase">{{ doc.partes.elaboradoPor.nombre }}</span>
                        <span class="text-slate-400">—</span>
                        <span class="italic text-slate-600">{{ doc.partes.elaboradoPor.cargo }}</span>
                      </div>
                      <div class="text-[9px] text-slate-400">
                        Flota La Macarena S.A. • Nit: 860.007.607-1 • Ref: DP-PR-01
                      </div>
                    </div>

                  </div>
                } @else if (doc.config.tipo === 'REINTEGRO_DISPOSITIVO') {
                  <!-- FORMATO OFICIAL: REINTEGRO DE DISPOSITIVO Y/O DEVOLUCIÓN -->
                  <div class="space-y-5 text-slate-900 font-sans text-xs sm:text-[13px] leading-relaxed">
                    
                    <!-- Membrete Superior con Logo y Referencia -->
                    <div class="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-4">
                      <div class="flex items-center gap-3">
                        <img src="/Logo_FLM.png" alt="Flota La Macarena" class="h-14 w-auto object-contain" />
                        <div>
                          <h2 class="text-xs sm:text-sm font-black uppercase text-slate-900 tracking-tight leading-tight">FLOTA LA MACARENA S.A.</h2>
                          <p class="text-[10px] text-slate-600 font-semibold">NIT 860.007.607-1</p>
                          <p class="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Dirección Nacional de Transporte de Pasajeros</p>
                        </div>
                      </div>
                      <div class="text-right">
                        <span class="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-mono font-bold text-xs border border-slate-300">
                          {{ doc.consecutivo }}
                        </span>
                        <p class="text-[9px] text-slate-400 mt-1 uppercase font-semibold">Ref: DP-RD-01</p>
                      </div>
                    </div>

                    <!-- Ciudad y Fecha Formal -->
                    <div class="text-right font-semibold text-slate-800 mb-6">
                      {{ doc.ciudad }}, {{ formatFechaFormal(doc.fechaEmision) }}
                    </div>

                    <!-- Datos del Destinatario -->
                    <div class="space-y-0.5 text-slate-900 mb-6 text-xs sm:text-[13px]">
                      <p>Señor(a)</p>
                      <p class="font-bold text-slate-900 uppercase text-sm tracking-tight">{{ doc.partes.entregadoA.nombre }}</p>
                      <p class="font-bold text-slate-800">Participe en Colaboración Empresarial</p>
                      <p class="font-bold text-slate-800">Oficina. <span class="font-semibold uppercase text-slate-900">{{ doc.partes.entregadoA.sede }}</span></p>
                      <p class="font-bold text-slate-800 uppercase">{{ doc.ciudad }}</p>
                    </div>

                    <!-- Asunto -->
                    <div class="mb-5">
                      <p class="font-bold text-slate-900 text-xs sm:text-[13px]">
                        Asunto: 
                        <span class="font-normal">
                          @if (incluyeDevolucionPrestamo() && (placaPrestada() || modeloPrestado())) {
                            Reintegro de dispositivo {{ getPrimerActivo(doc)?.modelo || 'titular' }} (Serial: {{ getPrimerActivo(doc)?.serial || 'N/A' }}) y solicitud de devolución de equipo en préstamo {{ modeloPrestado() || 'móvil' }} (Placa de inventario: {{ placaPrestada() || 'N/A' }})
                          } @else {
                            Reintegro de dispositivo {{ getPrimerActivo(doc)?.modelo || 'titular' }} (Placa de inventario: {{ getPrimerActivo(doc)?.placa || 'N/A' }})
                          }
                        </span>
                      </p>
                    </div>

                    <!-- Saludo -->
                    <div class="space-y-1 mb-5 text-xs sm:text-[13px]">
                      <p class="font-normal text-slate-900">Respetada Señor(a) {{ doc.partes.entregadoA.nombre }}:</p>
                      <p class="font-normal text-slate-800">Reciba un cordial saludo de parte de Flota La Macarena S.A.</p>
                    </div>

                    <!-- Párrafo 1: Causal / Contrato / Reintegro del Dispositivo Reparado -->
                    <div class="text-justify text-slate-800 mb-4 leading-relaxed">
                      <p>
                        En ejercicio de la facultad de supervisión y control derivada del Contrato de Colaboración Empresarial suscrito el <span class="font-semibold underline">{{ fechaContratoReintegro() || '…………………….' }}</span>, y en atención al reporte de fallas técnicas del equipo móvil modelo <strong>{{ getPrimerActivo(doc)?.modelo || 'xxxx' }}</strong> (Placa de inventario: <strong>{{ getPrimerActivo(doc)?.placa || 'xxxxxxx' }}</strong>) entregado en comodato, nos permitimos informarle que, tras la revisión técnica y reparación correspondiente, se procede al reintegro del dispositivo en óptimas condiciones de funcionamiento bajo las siguientes especificaciones:
                      </p>
                    </div>

                    <!-- Bloque de Características Técnicas del Dispositivo Reintegrado -->
                    <div class="bg-slate-50/70 border-2 border-slate-900 rounded-lg p-4 space-y-2 text-slate-900 my-4">
                      @if (doc.activos.length > 0) {
                        @for (activo of doc.activos; track activo.placa; let idx = $index) {
                          <div [class.mt-3]="idx > 0" [class.pt-3]="idx > 0" [class.border-t]="idx > 0" class="border-slate-300">
                            @if (doc.activos.length > 1) {
                              <p class="font-bold text-indigo-900 mb-1 text-xs">Dispositivo #{{ idx + 1 }}:</p>
                            }
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                              <p><strong class="font-bold text-slate-900">Modelo: </strong> <span class="font-semibold">{{ activo.modelo }} ({{ activo.marca }})</span></p>
                              <p><strong class="font-bold text-slate-900">Placa de Inventario: </strong> <span class="font-mono font-bold">{{ activo.placa }}</span> <span class="text-slate-500 font-mono text-[11px]">(Serial: {{ activo.serial }})</span></p>
                              <p><strong class="font-bold text-slate-900">Cargador: </strong> <span class="font-semibold">{{ incluyeCargadorReintegro() }}</span></p>
                              <p><strong class="font-bold text-slate-900">Forro: </strong> <span class="font-semibold">{{ incluyeForroReintegro() }}</span></p>
                              <p class="sm:col-span-2">
                                <strong class="font-bold text-slate-900">SIM Card: </strong> 
                                <span class="font-semibold">{{ activo.simCard || (doc.simCards.length > 0 ? (doc.simCards[0].numero + ' - ' + doc.simCards[0].operador + ' [ICCID: ' + doc.simCards[0].iccid + ']') : 'No incluida') }}</span>
                              </p>
                            </div>
                          </div>
                        }
                      } @else {
                        <p class="italic text-slate-500 text-xs">No se encontraron activos asociados a este movimiento.</p>
                      }
                    </div>

                    <!-- Párrafo 2: Solicitud formal de devolución del equipo en préstamo (Condicional) -->
                    @if (incluyeDevolucionPrestamo()) {
                      <div class="text-justify text-slate-800 mb-4 leading-relaxed bg-amber-50/60 border border-amber-200 p-3.5 rounded-lg">
                        <p>
                          Por otra parte, toda vez que el dispositivo relacionado en el comodato ha sido reparado y reintegrado, solicitamos formalmente la devolución del equipo <strong>{{ modeloPrestado() || 'móvil' }}</strong> (Placa de inventario: <strong>{{ placaPrestada() || 'xxxxxxx' }}</strong>@if (serialPrestado()) { - Serial: <strong>{{ serialPrestado() }}</strong>}), el cual le fue entregado en calidad de préstamo temporal el pasado <span class="font-semibold underline">{{ fechaEntregaPrestamo() || 'xxxxxxxxxxxxxx' }}</span>, con el fin de garantizar la continuidad de su operación durante el servicio técnico de dispositivo {{ getPrimerActivo(doc)?.modelo || 'titular' }}.
                        </p>
                      </div>
                    }

                    <!-- Párrafo 3: Calidad de Depositario y Custodia -->
                    <div class="text-justify text-slate-800 mb-6 leading-relaxed">
                      <p>
                        Le recordamos que, conforme a lo estipulado en el contrato de colaboración, el Partícipe asume la calidad de depositario de los elementos suministrados por la Empresa. En consecuencia, es su obligación velar por el uso adecuado, custodia y conservación de esta herramienta tecnológica, la cual está destinada exclusivamente al desarrollo del objeto contractual.
                      </p>
                    </div>

                    @if (doc.observacionesGenerales) {
                      <div class="border border-slate-300 bg-slate-50 p-3 rounded-lg text-xs mb-6">
                        <strong class="text-slate-700 block mb-0.5">Observaciones Adicionales:</strong>
                        <p class="text-slate-800 italic">{{ doc.observacionesGenerales }}</p>
                      </div>
                    }

                    <!-- Firmas: Emisor Oficial Institucional y Constancia de Recibido -->
                    <div class="pt-6 grid grid-cols-2 gap-8 page-break-inside-avoid text-xs sm:text-[13px]">
                      
                      <!-- Emisor Institucional (Word Oficial) -->
                      <div class="space-y-1">
                        <p class="text-slate-700 font-semibold mb-12">Atentamente,</p>
                        <div class="border-t border-slate-900 pt-1">
                          <p class="font-black text-slate-900 uppercase">JOHAN HERNANDO VÁSQUEZ GONZÁLEZ</p>
                          <p class="text-slate-700 text-xs font-semibold">Director Nacional de Transporte de Pasajeros</p>
                          <p class="text-slate-500 text-[11px] font-mono mt-0.5">26-28</p>
                        </div>
                      </div>

                      <!-- Receptor / Partícipe (Constancia de Recibido) -->
                      <div class="space-y-1">
                        <p class="text-slate-700 font-semibold mb-12">Recibí a conformidad:</p>
                        <div class="border-t border-slate-900 pt-1">
                          <p class="font-bold text-slate-900 uppercase">{{ doc.partes.entregadoA.nombre }}</p>
                          <p class="text-slate-700 text-xs font-semibold">C.C. {{ doc.partes.entregadoA.identificacion || '__________________________' }}</p>
                          <p class="text-slate-500 text-[11px] mt-0.5">Partícipe / Receptor Autorizado</p>
                        </div>
                      </div>

                    </div>

                    <!-- Pie de Página Institucional y Elaboración -->
                    <div class="pt-4 mt-6 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-600">
                      <div class="flex items-center gap-1.5">
                        <span class="font-bold text-slate-800">Elaboró:</span>
                        <span class="font-semibold text-slate-900 uppercase">{{ doc.partes.elaboradoPor.nombre }}</span>
                        <span class="text-slate-400">—</span>
                        <span class="italic text-slate-600">{{ doc.partes.elaboradoPor.cargo }}</span>
                      </div>
                      <div class="text-[9px] text-slate-400">
                        Flota La Macarena S.A. • Nit: 860.007.607-1 • Ref: DP-RD-01
                      </div>
                    </div>

                  </div>
                } @else if (doc.config.tipo === 'MEMORANDO_REINTEGRO' || doc.config.tipo === 'MEMORANDO_PRESTAMO') {
                  <!-- FORMATO OFICIAL: MEMORANDOS INTERNOS (GR-MEM-26) -->
                  <div class="space-y-5 text-slate-900 font-sans text-xs sm:text-[13px] leading-relaxed">
                    
                    <!-- Membrete Superior con Logo y Referencia -->
                    <div class="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-4">
                      <div class="flex items-center gap-3">
                        <img src="/Logo_FLM.png" alt="Flota La Macarena" class="h-14 w-auto object-contain" />
                        <div>
                          <h2 class="text-xs sm:text-sm font-black uppercase text-slate-900 tracking-tight leading-tight">FLOTA LA MACARENA S.A.</h2>
                          <p class="text-[10px] text-slate-600 font-semibold">NIT 860.007.607-1</p>
                          <p class="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Dirección Nacional de Transporte de Pasajeros</p>
                        </div>
                      </div>
                      <div class="text-right">
                        <span class="px-2.5 py-1 rounded-md bg-slate-100 text-slate-900 font-mono font-bold text-xs border border-slate-300">
                          MEMORANDO No. {{ doc.consecutivo }}
                        </span>
                        <p class="text-[9px] text-slate-400 mt-1 uppercase font-semibold">Ref: GR-MEM-26</p>
                      </div>
                    </div>

                    <!-- Encabezado Formal de Memorando (PARA / DE / ASUNTO / FECHA) -->
                    <div class="border-y border-slate-300 py-3.5 space-y-2 text-xs sm:text-[13px]">
                      <div class="grid grid-cols-12 gap-2">
                        <span class="col-span-2 font-bold text-slate-900">PARA:</span>
                        <div class="col-span-10">
                          <p class="font-bold text-slate-900 uppercase">{{ doc.partes.entregadoA.nombre }}</p>
                          <p class="font-semibold text-slate-700 uppercase">LÍDER DE OFICINA {{ doc.partes.entregadoA.sede }}</p>
                        </div>
                      </div>

                      <div class="grid grid-cols-12 gap-2">
                        <span class="col-span-2 font-bold text-slate-900">DE:</span>
                        <div class="col-span-10">
                          <p class="font-bold text-slate-900 uppercase">JOHAN HERNANDO VASQUEZ GONZALEZ</p>
                          <p class="text-slate-700 text-xs">Director Nacional de Transporte de Pasajeros</p>
                        </div>
                      </div>

                      <div class="grid grid-cols-12 gap-2">
                        <span class="col-span-2 font-bold text-slate-900">ASUNTO:</span>
                        <div class="col-span-10 font-bold text-slate-900">
                          @if (doc.config.tipo === 'MEMORANDO_REINTEGRO') {
                            Reintegro de dispositivo {{ getPrimerActivo(doc)?.modelo || 'móvil' }} (Placa de inventario: {{ getPrimerActivo(doc)?.placa || 'N/A' }}@if (getPrimerActivo(doc)?.serial) { - Serial: {{ getPrimerActivo(doc)?.serial }}})
                          } @else {
                            Entrega de dispositivo {{ getPrimerActivo(doc)?.modelo || 'móvil' }} en calidad de préstamo
                          }
                        </div>
                      </div>

                      <div class="grid grid-cols-12 gap-2">
                        <span class="col-span-2 font-bold text-slate-900">FECHA:</span>
                        <div class="col-span-10 font-semibold text-slate-800">
                          {{ doc.ciudad }}, {{ formatFechaFormal(doc.fechaEmision) }}
                        </div>
                      </div>
                    </div>

                    <!-- Cuerpo / Párrafo Causal -->
                    @if (doc.config.tipo === 'MEMORANDO_REINTEGRO') {
                      <!-- Caso 1: Reintegro de Dispositivo a Oficina -->
                      <div class="text-justify text-slate-800 mb-4 leading-relaxed">
                        <p>
                          Respetuosamente y en atención al reporte de fallas técnicas del equipo móvil modelo <strong>{{ modeloAveriado() || 'xxxx' }}</strong> (Placa de inventario: <strong>{{ placaAveriada() || 'xxxxxxx' }}</strong>@if (serialAveriado()) { - Serial: <strong>{{ serialAveriado() }}</strong>}) entregado a la oficina, nos permitimos informarle que, tras la revisión técnica y reparación correspondiente, se procede al reintegro del dispositivo en óptimas condiciones de funcionamiento bajo las siguientes especificaciones:
                        </p>
                      </div>
                    } @else {
                      <!-- Caso 2: Entrega en Calidad de Préstamo a Oficina -->
                      <div class="text-justify text-slate-800 mb-4 leading-relaxed space-y-3">
                        <p>
                          Respetuosamente, y en atención a lo informado sobre las fallas técnicas del equipo móvil modelo <strong>{{ modeloAveriado() || 'xxxx' }}</strong> (Placa de inventario: <strong>{{ placaAveriada() || 'xxxxxxx' }}</strong>@if (serialAveriado()) { - Serial: <strong>{{ serialAveriado() }}</strong>}) entregado a la oficina, solicitamos formalmente su devolución para proceder con la revisión técnica correspondiente.
                        </p>
                        <p>
                          Por lo anterior, en tanto se realiza el diagnóstico e identificación del daño, la Empresa hace entrega, en calidad de préstamo, del siguiente dispositivo:
                        </p>
                      </div>
                    }

                    <!-- Bloque de Características Técnicas del Dispositivo -->
                    <div class="bg-slate-50/70 border-2 border-slate-900 rounded-lg p-4 space-y-2 text-slate-900 my-4">
                      @if (doc.activos.length > 0) {
                        @for (activo of doc.activos; track activo.placa; let idx = $index) {
                          <div [class.mt-3]="idx > 0" [class.pt-3]="idx > 0" [class.border-t]="idx > 0" class="border-slate-300">
                            @if (doc.activos.length > 1) {
                              <p class="font-bold text-indigo-900 mb-1 text-xs">Dispositivo #{{ idx + 1 }}:</p>
                            }
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                              <p><strong class="font-bold text-slate-900">Modelo: </strong> <span class="font-semibold">{{ activo.modelo }} ({{ activo.marca }})</span></p>
                              <p><strong class="font-bold text-slate-900">Placa de Inventario: </strong> <span class="font-mono font-bold">{{ activo.placa }}</span> <span class="text-slate-500 font-mono text-[11px]">(Serial: {{ activo.serial }})</span></p>
                              <p><strong class="font-bold text-slate-900">Cargador: </strong> <span class="font-semibold">{{ incluyeCargador() }}</span></p>
                              <p><strong class="font-bold text-slate-900">Forro: </strong> <span class="font-semibold">{{ incluyeForro() }}</span></p>
                              <p class="sm:col-span-2">
                                <strong class="font-bold text-slate-900">SIM Card: </strong> 
                                <span class="font-semibold">{{ activo.simCard || (doc.simCards.length > 0 ? (doc.simCards[0].numero + ' - ' + doc.simCards[0].operador + ' [ICCID: ' + doc.simCards[0].iccid + ']') : 'No asignada') }}</span>
                              </p>
                            </div>
                          </div>
                        }
                      } @else {
                        <p class="italic text-slate-500 text-xs">No se encontraron activos asociados a este movimiento.</p>
                      }
                    </div>

                    <!-- Párrafo de Custodia y Responsabilidad del Líder de Oficina -->
                    <div class="text-justify text-slate-800 mb-6 leading-relaxed">
                      <p>
                        Es importante recordar que, como líder de oficina, es su responsabilidad velar por los bienes suministrados por la Empresa, garantizando así el uso correcto, la custodia y la conservación de esta herramienta tecnológica, la cual está destinada exclusivamente a la venta y expedición de tiquetes.
                      </p>
                    </div>

                    @if (doc.observacionesGenerales) {
                      <div class="border border-slate-300 bg-slate-50 p-3 rounded-lg text-xs mb-6">
                        <strong class="text-slate-700 block mb-0.5">Observaciones Adicionales:</strong>
                        <p class="text-slate-800 italic">{{ doc.observacionesGenerales }}</p>
                      </div>
                    }

                    <!-- Firmas: Emisor Oficial Institucional y Recibido del Líder de Oficina -->
                    <div class="pt-6 grid grid-cols-2 gap-8 page-break-inside-avoid text-xs sm:text-[13px]">
                      
                      <!-- Emisor Institucional -->
                      <div class="space-y-1">
                        <p class="text-slate-700 font-semibold mb-12">Atentamente,</p>
                        <div class="border-t border-slate-900 pt-1">
                          <p class="font-black text-slate-900 uppercase">JOHAN HERNANDO VÁSQUEZ GONZÁLEZ</p>
                          <p class="text-slate-700 text-xs font-semibold">Director Nacional de Transporte de Pasajeros</p>
                          <p class="text-slate-500 text-[11px] font-mono mt-0.5">26-28</p>
                        </div>
                      </div>

                      <!-- Receptor: Líder de Oficina -->
                      <div class="space-y-1">
                        <p class="text-slate-700 font-semibold mb-12">Recibí a conformidad:</p>
                        <div class="border-t border-slate-900 pt-1">
                          <p class="font-bold text-slate-900 uppercase">{{ doc.partes.entregadoA.nombre }}</p>
                          <p class="text-slate-700 text-xs font-semibold">C.C. {{ doc.partes.entregadoA.identificacion || '__________________________' }}</p>
                          <p class="text-slate-500 text-[11px] mt-0.5 uppercase">Líder de Oficina {{ doc.partes.entregadoA.sede }}</p>
                        </div>
                      </div>

                    </div>

                    <!-- Pie de Página Institucional y Elaboración -->
                    <div class="pt-4 mt-6 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-600">
                      <div class="flex items-center gap-1.5">
                        <span class="font-bold text-slate-800">Elaboró:</span>
                        <span class="font-semibold text-slate-900 uppercase">{{ doc.partes.elaboradoPor.nombre }}</span>
                        <span class="text-slate-400">—</span>
                        <span class="italic text-slate-600">{{ doc.partes.elaboradoPor.cargo }}</span>
                      </div>
                      <div class="text-[9px] text-slate-400">
                        Flota La Macarena S.A. • Nit: 860.007.607-1 • Ref: GR-MEM-26
                      </div>
                    </div>

                  </div>
                } @else if (doc.config.tipo === 'COMODATO') {
                  <!-- FORMATO OFICIAL: CONTRATO DE COMODATO DE BIEN MUEBLE -->
                  <div class="space-y-4 text-slate-900 font-sans text-xs sm:text-[11.5px] leading-snug">
                    
                    <!-- ==================== PÁGINA 1 DE 2 ==================== -->
                    <div class="comodato-page-1 flex flex-col justify-between min-h-[880px]">
                      <div class="space-y-2">

                        <!-- Membrete Superior con Logo y Referencia (SIN DIRECCIÓN NACIONAL DE PASAJEROS) -->
                        <div class="flex items-start justify-between border-b-2 border-slate-900 pb-1.5 mb-1.5">
                          <div class="flex items-center gap-3">
                            <img src="/Logo_FLM.png" alt="Flota La Macarena" class="h-10 sm:h-11 w-auto object-contain" />
                            <div>
                              <h2 class="text-xs sm:text-sm font-black uppercase text-slate-900 tracking-tight leading-tight">FLOTA LA MACARENA S.A.</h2>
                              <p class="text-[10px] text-slate-600 font-semibold">NIT 860.007.607-1</p>
                            </div>
                          </div>
                          <div class="text-right">
                            <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono font-bold text-xs border border-slate-300">
                              {{ doc.consecutivo }}
                            </span>
                            <p class="text-[9px] text-slate-400 mt-0.5 uppercase font-semibold">Ref: COM-01</p>
                          </div>
                        </div>

                        <!-- Título Central del Contrato -->
                        <div class="text-center py-0.5">
                          <h1 class="text-xs sm:text-sm font-black uppercase text-slate-900 tracking-tight">
                            CONTRATO DE COMODATO DE BIEN MUEBLE
                          </h1>
                        </div>

                        <!-- Tabla Resumen (Table 0 de COMODATO) -->
                        <div class="border border-slate-900 rounded-xs overflow-hidden text-[10.5px]">
                          <table class="w-full border-collapse">
                            <tbody class="divide-y divide-slate-300 text-slate-900">
                              <tr class="divide-x divide-slate-300">
                                <td class="w-1/4 bg-slate-100 font-bold px-2.5 py-0.5 uppercase text-[10px]">LUGAR Y FECHA:</td>
                                <td class="px-2.5 py-0.5 font-semibold text-slate-900">{{ doc.ciudad }}, {{ formatFechaFormal(doc.fechaEmision) }}</td>
                              </tr>
                              <tr class="divide-x divide-slate-300">
                                <td class="w-1/4 bg-slate-100 font-bold px-2.5 py-0.5 uppercase text-[10px]">COMODANTE</td>
                                <td class="px-2.5 py-0.5 text-slate-800 leading-tight text-[10px]">
                                   <strong>Flota la Macarena S.A.</strong> Nit 860.007.607-1 • R.L. <strong>Rafael Sarmiento Apolinar</strong> C.C. No 19.494.310 de Bogotá<br>
                                   Calle 127 A # 53 A – 45 Sede principal • Tel. 425 49 00 • www.flotalamacarena.com
                                </td>
                              </tr>
                              <tr class="divide-x divide-slate-300">
                                <td class="w-1/4 bg-slate-100 font-bold px-2.5 py-0.5 uppercase text-[10px]">COMODATARIO</td>
                                <td class="px-2.5 py-0.5 font-bold text-slate-900 uppercase">
                                  {{ doc.partes.entregadoA.nombre }} — C.C. No. {{ doc.partes.entregadoA.identificacion || '____________________' }}
                                </td>
                              </tr>
                              <tr class="divide-x divide-slate-300">
                                <td class="w-1/4 bg-slate-100 font-bold px-2.5 py-0.5 uppercase text-[10px]">BIEN ENTREGADO</td>
                                <td class="px-2.5 py-0.5 font-bold text-slate-900">{{ getBienEntregado(doc) }}</td>
                              </tr>
                              <tr class="divide-x divide-slate-300">
                                <td class="w-1/4 bg-slate-100 font-bold px-2.5 py-0.5 uppercase text-[10px]">ESTADO</td>
                                <td class="px-2.5 py-0.5 font-bold text-slate-900 uppercase">{{ estadoBienComodato() || 'BUENO' }}</td>
                              </tr>
                              <tr class="divide-x divide-slate-300">
                                <td class="w-1/4 bg-slate-100 font-bold px-2.5 py-0.5 uppercase text-[10px]">OFICINA</td>
                                <td class="px-2.5 py-0.5 font-bold text-slate-900 uppercase">{{ doc.partes.entregadoA.sede }}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <!-- Comparecencia e Introducción Legal -->
                        <div class="text-justify text-slate-800 leading-snug text-xs sm:text-[11.5px] pt-0.5">
                          <p>
                            Entre los suscritos: <strong>RAFAEL SARMIENTO APOLINAR</strong>, mayor de edad, vecino de Bogotá, D.C., identificado con la cédula de ciudadanía No. 19.494.310 expedida en Bogotá D.C., quien en este acto obra en nombre y representación de la Empresa <strong>FLOTA LA MACARENA S.A.</strong>, en su calidad de Gerente, sociedad mercantil con domicilio en Bogotá D.C. en la Calle 127 A # 53 A – 45, Torre 2, Piso 2, Oficina 201, del Edificio Colpatria, poseedora del correo electrónico: <span class="text-slate-900 font-semibold">gerencia&#64;flotalamacarena.com</span>, quien en adelante y para todos los efectos previstos en este contrato se denominará como <strong>EL COMODANTE</strong> y de otra parte, el señor(a) <strong class="uppercase">{{ doc.partes.entregadoA.nombre }}</strong>, mayor de edad, domiciliado y residente en la <span class="font-semibold underline">{{ direccionComodatario() || 'Calle ....................' }}</span>, de <span class="font-semibold underline">{{ ciudadComodatario() || doc.ciudad || 'Bogotá D.C.' }}</span>, identificado con la cédula de ciudadanía No. <strong class="underline">{{ doc.partes.entregadoA.identificacion || '....................' }}</strong> expedida en <span class="font-semibold underline">{{ expedicionDocumentoComodatario() || 'Bogotá D.C.' }}</span>, poseedor del correo electrónico: <span class="font-semibold underline">{{ emailComodatario() || '....................' }}</span>, quien en adelante y para todos los efectos previstos en este contrato se denominará <strong>EL COMODATARIO</strong>, quien a su vez es Partícipe en colaboración empresarial de la oficina de <strong class="uppercase text-slate-900">{{ doc.partes.entregadoA.sede }}</strong>, de manera libre, espontánea, ausente de vicios, y en concordancia con lo estipulado en el Parágrafo Segundo de la Cláusula Décima Primera del Contrato de Colaboración en Operaciones Conjuntas hemos convenido celebrar el presente <strong>CONTRATO DE COMODATO</strong>, el cual se regirá por las cláusulas que siguen, en lo no previsto en ellas, por la Ley Mercantil y en los vacíos de las dos anteriores, por la Ley Civil y exponen: <strong>PRIMERA:. EL COMODANTE</strong> entrega a <strong>EL COMODATARIO</strong>, gratuitamente, un {{ getDenominacionDispositivo(doc, 'simple') }}, incluida la sim card para comunicaciones, con las siguientes características:
                          </p>
                        </div>

                        <!-- Tabla de Características Técnicas (Table 1) -->
                        <div class="border border-slate-900 rounded-xs overflow-hidden text-[10.5px] my-1">
                          <table class="w-full border-collapse">
                            <tbody class="divide-y divide-slate-300 text-slate-900">
                              <tr class="divide-x divide-slate-300">
                                <td class="w-1/3 bg-slate-100 font-bold px-2.5 py-0.5 uppercase text-[10px]">Marca</td>
                                <td class="px-2.5 py-0.5 font-semibold">{{ getActivoComodato(doc)?.marca || getModeloActivo(doc) || 'N/A' }}</td>
                              </tr>
                              <tr class="divide-x divide-slate-300">
                                <td class="w-1/3 bg-slate-100 font-bold px-2.5 py-0.5 uppercase text-[10px]">Serial</td>
                                <td class="px-2.5 py-0.5 font-mono font-bold">{{ getActivoComodato(doc)?.serial || 'S/N' }}</td>
                              </tr>
                              <tr class="divide-x divide-slate-300">
                                <td class="w-1/3 bg-slate-100 font-bold px-2.5 py-0.5 uppercase text-[10px]">Placa de inventario</td>
                                <td class="px-2.5 py-0.5 font-mono font-bold">{{ getActivoComodato(doc)?.placa || 'S/P' }}</td>
                              </tr>
                              <tr class="divide-x divide-slate-300">
                                <td class="w-1/3 bg-slate-100 font-bold px-2.5 py-0.5 uppercase text-[10px]">Operador Sim Card</td>
                                <td class="px-2.5 py-0.5 font-semibold">{{ getOperadorSimComodato(doc) }}</td>
                              </tr>
                              <tr class="divide-x divide-slate-300">
                                <td class="w-1/3 bg-slate-100 font-bold px-2.5 py-0.5 uppercase text-[10px]">Numero Sim Card</td>
                                <td class="px-2.5 py-0.5 font-mono font-semibold">{{ getNumeroSimComodato(doc) }}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <!-- Cláusulas SEGUNDA, TERCERA y PARÁGRAFO PRIMERO (SIN CURSIVAS) -->
                        <div class="space-y-1.5 text-justify text-slate-800 leading-snug text-xs sm:text-[11.5px]">
                          <p>
                            <strong>SEGUNDA: ENTREGA.</strong> A la firma del presente contrato EL COMODANTE entregará a EL COMODATARIO el bien del comodato.
                          </p>

                          <p>
                            <strong>TERCERA. OBLIGACIONES DE EL COMODATARIO:</strong> EL COMODATARIO se obliga a: 
                            <strong>a)</strong> Utilizar el bien entregado - {{ getDenominacionDispositivo(doc, 'mayuscula') }}, incluida la sim card - para comunicaciones, única y exclusivamente para la plataforma de tiquetería de FLOTA LA MACARENA S.A. 
                            <strong>b)</strong> Emplear el mayor cuidado en la conservación del bien entregado - {{ getDenominacionDispositivo(doc, 'mayuscula') }}, incluida la sim card - para comunicaciones y responderá hasta de la culpa levísima, por lo tanto, responderá por cualquier deterioro que no provenga de la naturaleza o del uso legítimo del bien y si el deterioro es tal, que el bien no sea susceptible de emplearse en su uso ordinario, podrá EL COMODANTE exigir el precio del bien. 
                            <strong>c)</strong> Pagar a EL COMODANTE en caso de pérdida del bien entregado - {{ getDenominacionDispositivo(doc, 'mayuscula') }}, la suma de <strong>{{ valorReposicionLetrasComodato() }} ({{ valorReposicionComodato() }})</strong> incluye IVA. 
                            <strong>d)</strong> Pagar a EL COMODANTE en caso de daño producido del bien entregado - {{ getDenominacionDispositivo(doc, 'mayuscula') }}, el arreglo del equipo, dónde EL COMODANTE lo disponga. 
                            <strong>e)</strong> Permitir a EL COMODANTE, la revisión previa y posterior del {{ getDenominacionDispositivo(doc, 'simple') }}, a fin de Verificar el estado del mismo al inicio de la ejecución del contrato y a su finalización. 
                            <strong>f)</strong> Reportar inmediatamente a FLOTA LA MACARENA S.A. en caso de robo o pérdida del bien entregado - {{ getDenominacionDispositivo(doc, 'mayuscula') }}, a fin de proceder a bloquear el acceso a la plataforma por parte del área de Tecnología y reportar la pérdida de la sim card al proveedor de comunicaciones. 
                            <strong>g)</strong> Mantener el bien entregado - {{ getDenominacionDispositivo(doc, 'mayuscula') }}, con la correspondiente carga de energía para poder atender el proceso de ventas y despachos en la oficina asignada, siendo responsable por el suministro de energía. 
                            <strong>h)</strong> Reconocer a FLOTA LA MACARENA S.A., la suma de la totalidad de tiquetes emitidos y vendidos con el dispositivo conforme a las condiciones del CONTRATO DE COLABORACIÓN EN OPERACIONES CONJUNTAS.
                          </p>

                          <p class="pl-2 border-l-2 border-slate-300">
                            <strong>PARÁGRAFO PRIMERO:</strong> Cuando se presenten hechos que constituyan un caso fortuito, EL COMODATARIO no será responsable por el deterioro o pérdida del bien dado en comodato, salvo que 1) Haya empleado el bien en uso indebido, o demore su restitución, excepto que se demuestre que el deterioro se hubiera producido por su uso. 2) El caso fortuito hubiere sobrevenido por culpa suya, aunque levísima; 3) Cuando expresamente haya aceptado la responsabilidad del caso fortuito.
                          </p>
                        </div>

                      </div>

                      <!-- Pie de Página 1 -->
                      <div class="text-[9.5px] text-slate-400 text-center border-t border-slate-200 pt-1.5 mt-2 flex items-center justify-between">
                        <span>FLOTA LA MACARENA S.A. • Nit: 860.007.607-1 • Ref: COM-01</span>
                        <span class="font-bold text-slate-600">Página 1 de 2</span>
                      </div>
                    </div>

                    <!-- ==================== PÁGINA 2 DE 2 ==================== -->
                    <div class="comodato-page-2 flex flex-col justify-between min-h-[880px] pt-3 border-t-2 border-dashed border-slate-300 print:border-none print:pt-0">
                      <div class="space-y-2">

                        <!-- Cláusulas CUARTA a DÉCIMA (SIN CURSIVAS) -->
                        <div class="space-y-1.5 text-justify text-slate-800 leading-snug text-xs sm:text-[11.5px]">
                          <p>
                            <strong>CUARTA. -DESTINACIÓN: -</strong> {{ getDenominacionDispositivo(doc, 'articulo_mayuscula') }}, que EL COMODANTE entrega a EL COMODATARIO en comodato, debe ser utilizado por éste única y exclusivamente para el manejo de la plataforma de tiquetería, atender el proceso de ventas y despachos en la oficina asignada y los fines esenciales que sirven de justificación al contrato, caso contrario, EL COMODANTE impartirá las sanciones a que haya lugar.
                          </p>

                          <p>
                            <strong>QUINTA. TÉRMINO:</strong> El préstamo de uso acá acordado, tendrá el mismo término pactado en el CONTRATO DE COLABORACIÓN EN OPERACIONES CONJUNTAS, suscrito entre el (la) señor (a) <strong class="uppercase">{{ doc.partes.entregadoA.nombre }}</strong>, y la EMPRESA de fecha <span class="font-semibold underline">{{ fechaContratoComodato() || '………………' }}</span>, empezando a surtir sus efectos a partir de la fecha de la entrega y firma del presente contrato.
                          </p>

                          <p>
                            <strong>SEXTA. RESTITUCIÓN.</strong> EL COMODATARIO deberá restituir {{ getDenominacionDispositivo(doc, 'articulo') }} a EL COMODANTE, a la siguiente dirección: Calle 127 A # 53 A – 45, Torre 2, Piso 2, Oficina 201, del Edificio Colpatria en la ciudad de Bogotá D.C., o en su efecto a la persona que EL COMODANTE designe para su recepción, en los siguientes casos: 
                            <strong>a)</strong> En el mismo momento que se dé por terminado el CONTRATO DE COLABORACIÓN EN OPERACIONES CONJUNTAS, suscrito entre el (la) señor (a) <strong class="uppercase">{{ doc.partes.entregadoA.nombre }}</strong>, y la EMPRESA de fecha <span class="font-semibold underline">{{ fechaContratoComodato() || '………………' }}</span>, 
                            <strong>b)</strong> Por el incumplimiento de las obligaciones en relación con la destinación, la utilización inadecuada, o el deterioro del equipo por su culpa. 
                            <strong>c)</strong> Por muerte de EL COMODATARIO. 
                            <strong>d)</strong> Por la terminación de los servicios a los que se destinó {{ getDenominacionDispositivo(doc, 'articulo') }}.
                          </p>

                          <p>
                            <strong>SÉPTIMA. GRATUIDAD. -</strong> El presente contrato es gratuito; por ello EL COMODATARIO no contrae obligación dineraria alguna por el uso del bien, según lo convenido.
                          </p>

                          <p>
                            <strong>OCTAVA. CESIÓN. -</strong> Queda prohibida la cesión del contrato, y del {{ getDenominacionDispositivo(doc, 'simple') }}, a cualquier persona natural o jurídica, sin autorización previa escrita de EL COMODANTE.
                          </p>

                          <p>
                            <strong>NOVENA. DERECHOS DE EL COMODANTE. -</strong> EL COMODANTE conservará sobre el bien prestado, todos los derechos que antes tenía; pero no su ejercicio, en cuanto fuere incompatible con el uso concedido a EL COMODATARIO, igualmente vigilará que no se varíe la destinación del {{ getDenominacionDispositivo(doc, 'simple') }}, ni que se traslade a ubicación diferente de la oficina, sin autorización escrita.
                          </p>

                          <p>
                            <strong>DÉCIMA. RÉGIMEN LEGAL. -</strong> Los vacíos en la estipulación se llenará, en el presente contrato, con las reglas contenidas en el Código Civil, libro IV, título XXIX.
                          </p>
                        </div>

                        <!-- Cierre y Lugar / Fecha en Letras -->
                        <div class="pt-0.5 text-justify text-slate-800 leading-snug text-xs sm:text-[11.5px]">
                          <p>
                            Para constancia de lo pactado se firma en {{ doc.ciudad }}, hoy <strong>{{ getFechaComodatoLetras(doc.fechaEmision).diaLetras }}</strong> ({{ getFechaComodatoLetras(doc.fechaEmision).diaNumero }}) de <strong>{{ getFechaComodatoLetras(doc.fechaEmision).mesNombre }}</strong> del Dos mil <strong>{{ getFechaComodatoLetras(doc.fechaEmision).anioLetras }}</strong> ({{ getFechaComodatoLetras(doc.fechaEmision).anioNumero }}), en dos (02) ejemplares idénticos.
                          </p>
                          <p class="text-center font-bold text-slate-700 text-[10.5px] my-1 uppercase tracking-wider">
                            NO CAUSA IMPUESTO DE TIMBRE.
                          </p>
                        </div>

                        <!-- Firmas: Comodante (Rafael Sarmiento) y Comodatario -->
                        <div class="pt-2 grid grid-cols-2 gap-8 page-break-inside-avoid text-xs sm:text-[11.5px]">
                          
                          <!-- EL COMODANTE -->
                          <div class="space-y-1">
                            <p class="text-slate-900 font-extrabold uppercase mb-8">EL COMODANTE</p>
                            <div class="border-t border-slate-900 pt-1">
                              <p class="font-black text-slate-900 uppercase">FLOTA LA MACARENA S.A.</p>
                              <p class="font-extrabold text-slate-900 uppercase">RAFAEL SARMIENTO APOLINAR</p>
                              <p class="text-slate-700 text-xs font-semibold">C.C. 19.494.310 de Bogotá</p>
                              <p class="text-slate-500 text-[10.5px] font-semibold">Gerente</p>
                            </div>
                          </div>

                          <!-- EL COMODATARIO -->
                          <div class="space-y-1">
                            <p class="text-slate-900 font-extrabold uppercase mb-8">EL COMODATARIO</p>
                            <div class="border-t border-slate-900 pt-1">
                              <p class="font-extrabold text-slate-900 uppercase">{{ doc.partes.entregadoA.nombre }}</p>
                              <p class="text-slate-700 text-xs font-semibold">C.C. No. {{ doc.partes.entregadoA.identificacion || '__________________________' }}</p>
                              <p class="text-slate-700 text-xs font-semibold">Oficina <span class="uppercase font-bold">{{ doc.partes.entregadoA.sede }}</span></p>
                              <p class="text-slate-500 text-[10.5px]">Partícipe en Colaboración Empresarial</p>
                            </div>
                          </div>

                        </div>

                        <!-- Pie Institucional de Elaboración, Revisión y Aprobación (SIN CURSIVA) -->
                        <div class="pt-2 mt-2 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-700">
                          <div class="flex items-center gap-1.5">
                            <span class="font-bold text-slate-900">Elaboró:</span>
                            <span class="font-semibold text-slate-900 uppercase">{{ doc.partes.elaboradoPor.nombre }}</span>
                            <span class="text-slate-400">—</span>
                            <span class="text-slate-600">{{ doc.partes.elaboradoPor.cargo }}</span>
                          </div>
                          <div class="flex items-center gap-3 text-[10px]">
                            <div><span class="font-bold text-slate-900">Revisó:</span> <span class="text-slate-700">Dra. Daniela Calderon</span></div>
                            <div><span class="font-bold text-slate-900">Aprobó:</span> <span class="text-slate-700">Ing. Johan Vasquez</span></div>
                          </div>
                        </div>

                      </div>

                      <!-- Pie de Página 2 -->
                      <div class="text-[9.5px] text-slate-400 text-center border-t border-slate-200 pt-1.5 mt-2 flex items-center justify-between">
                        <span>CONTRATO DE COMODATO ENTRE FLOTA LA MACARENA S.A. y {{ doc.partes.entregadoA.nombre }} • Ref: COM-01</span>
                        <span class="font-bold text-slate-600">Página 2 de 2</span>
                      </div>
                    </div>

                  </div>
                } @else {
                
                <!-- ENCABEZADO INSTITUCIONAL OFICIAL (GF-FO-29) -->
                <div class="border-2 border-slate-900 mb-5">
                  <div class="grid grid-cols-12 divide-x-2 divide-slate-900 text-slate-900">
                    
                    <!-- Logo y Empresa -->
                    <div class="col-span-3 p-2.5 flex flex-col items-center justify-center text-center">
                      <img src="/Logo_FLM.png" alt="Flota La Macarena" class="h-12 w-auto object-contain mb-1" />
                      <p class="text-[9px] font-extrabold uppercase tracking-tight">Flota La Macarena S.A.</p>
                      <p class="text-[8px] text-slate-600">NIT 860.007.607-1</p>
                    </div>

                    <!-- Título Central y Tipo de Activo -->
                    <div class="col-span-6 p-2.5 flex flex-col items-center justify-center text-center">
                      <p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">SISTEMA INTEGRADO DE GESTIÓN</p>
                      <h1 class="text-xs sm:text-sm font-black uppercase text-slate-900 tracking-tight leading-snug">
                        {{ doc.config.titulo }}
                      </h1>
                      <p class="text-[9px] font-bold text-slate-700 uppercase mt-0.5">{{ doc.config.subtitulo }}</p>
                    </div>

                    <!-- Metadatos de Calidad -->
                    <div class="col-span-3 p-2 text-[9px] flex flex-col justify-center divide-y divide-slate-300">
                      <p class="pb-0.5"><span class="font-bold">Código:</span> <span class="font-mono font-bold">{{ doc.config.codigoCalidad }}</span></p>
                      <p class="py-0.5"><span class="font-bold">Versión:</span> {{ doc.config.version }}</p>
                      <p class="py-0.5"><span class="font-bold">Consecutivo:</span> <span class="font-mono font-bold text-indigo-950">{{ doc.consecutivo }}</span></p>
                      <p class="pt-0.5"><span class="font-bold">Fecha:</span> {{ doc.fechaEmision | date:'dd/MM/yyyy' }}</p>
                    </div>

                  </div>
                </div>

                <!-- 1. INFORMACIÓN DEL TRABAJADOR / RECEPTOR (Estructura oficial GF-FO-29) -->
                <div class="border border-slate-900 rounded-xs overflow-hidden mb-4 text-[10px]">
                  <div class="bg-slate-100 border-b border-slate-900 px-3 py-1 font-bold uppercase tracking-wider text-slate-900 text-[10px]">
                    INFORMACIÓN DEL TRABAJADOR
                  </div>
                  
                  <div class="grid grid-cols-12 divide-x divide-slate-900 border-b border-slate-900">
                    <div class="col-span-7 p-2 flex items-center justify-between">
                      <span class="font-bold text-slate-900">FECHA ENTREGA Y/O ASIGNACIÓN:</span>
                      <span class="font-mono font-bold text-slate-900 text-xs">
                        {{ doc.fechaEmision | date:'dd' }} / {{ doc.fechaEmision | date:'MM' }} / {{ doc.fechaEmision | date:'yyyy' }}
                      </span>
                    </div>
                    <div class="col-span-5 p-2 flex items-center justify-between">
                      <span class="font-bold text-slate-900">DEPENDENCIA:</span>
                      <span class="font-semibold text-slate-900 uppercase">{{ doc.partes.entregadoA.sede }}</span>
                    </div>
                  </div>

                  <div class="grid grid-cols-12 divide-x divide-slate-900">
                    <div class="col-span-5 p-2 space-y-0.5">
                      <span class="font-bold text-slate-900 block text-[9px]">NOMBRE:</span>
                      <span class="font-bold text-slate-900 text-xs uppercase">{{ doc.partes.entregadoA.nombre }}</span>
                    </div>
                    <div class="col-span-4 p-2 space-y-0.5">
                      <span class="font-bold text-slate-900 block text-[9px]">No. IDENTIFICACIÓN:</span>
                      <span class="font-mono font-bold text-slate-900">{{ doc.partes.entregadoA.identificacion || '______________________' }}</span>
                    </div>
                    <div class="col-span-3 p-2 space-y-0.5">
                      <span class="font-bold text-slate-900 block text-[9px]">CARGO:</span>
                      <span class="font-semibold text-slate-900 uppercase">{{ doc.partes.entregadoA.cargo }}</span>
                    </div>
                  </div>
                </div>

                <!-- 2. INFORMACIÓN DEL ACTIVO (Tabla oficial GF-FO-29) -->
                @if (doc.activos.length > 0) {
                  <div class="border border-slate-900 rounded-xs overflow-hidden mb-4">
                    <div class="bg-slate-100 border-b border-slate-900 px-3 py-1 font-bold uppercase tracking-wider text-slate-900 text-[10px]">
                      INFORMACIÓN DEL ACTIVO (Total: {{ doc.activos.length }})
                    </div>
                    <table class="w-full text-left text-[10px] divide-y divide-slate-300">
                      <thead class="bg-slate-50 text-slate-900 font-bold uppercase tracking-wider text-[9px] border-b border-slate-900">
                        <tr class="divide-x divide-slate-300">
                          <th class="px-2 py-1.5 text-center w-8">Ítem</th>
                          <th class="px-2.5 py-1.5">Descripción</th>
                          <th class="px-2.5 py-1.5">Placa</th>
                          <th class="px-2.5 py-1.5">Serie</th>
                          <th class="px-2.5 py-1.5">Marca</th>
                          <th class="px-2.5 py-1.5">Modelo</th>
                          <th class="px-2 py-1.5 text-center w-24">*Estado</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-200 text-slate-800">
                        @for (activo of doc.activos; track activo.placa; let idx = $index) {
                          <tr class="divide-x divide-slate-200 hover:bg-slate-50/50">
                            <td class="px-2 py-1.5 text-center font-mono text-slate-500">{{ idx + 1 }}</td>
                            <td class="px-2.5 py-1.5 font-medium text-slate-900">{{ activo.tipo }}</td>
                            <td class="px-2.5 py-1.5 font-mono font-bold text-slate-900">{{ activo.placa }}</td>
                            <td class="px-2.5 py-1.5 font-mono text-slate-700">{{ activo.serial }}</td>
                            <td class="px-2.5 py-1.5">{{ activo.marca }}</td>
                            <td class="px-2.5 py-1.5">{{ activo.modelo }}</td>
                            <td class="px-2 py-1 text-center font-semibold text-slate-900">
                              <!-- Selector interactivo en pantalla -->
                              <div class="no-print flex items-center justify-center">
                                <select 
                                  [ngModel]="getActivoEstado(activo.placa, activo.estado)"
                                  (ngModelChange)="setActivoEstado(activo.placa, $event)"
                                  class="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[9px] font-bold text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs hover:border-slate-400 transition-colors">
                                  <option value="(B) Bueno">(B) Bueno</option>
                                  <option value="(R) Regular">(R) Regular</option>
                                  <option value="(M) Malo">(M) Malo</option>
                                </select>
                              </div>
                              <!-- Texto oficial para impresión física o PDF -->
                              <span class="print-only hidden font-semibold text-slate-900 text-[10px]">
                                {{ getActivoEstado(activo.placa, activo.estado) }}
                              </span>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                    <div class="bg-slate-50 border-t border-slate-300 px-3 py-1 text-[9px] text-slate-600 font-medium flex items-center justify-between">
                      <span>* Estado: (B) Bueno | (R) Regular | (M) Malo</span>
                      @if (doc.activos.length > 1) {
                        <div class="no-print flex items-center gap-1.5 text-[9px]">
                          <span class="text-slate-400 font-semibold">Marcar todos:</span>
                          <button 
                            type="button" 
                            (click)="setTodosEstados('(B) Bueno')"
                            class="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer">
                            (B) Bueno
                          </button>
                          <span class="text-slate-300">|</span>
                          <button 
                            type="button" 
                            (click)="setTodosEstados('(R) Regular')"
                            class="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer">
                            (R) Regular
                          </button>
                          <span class="text-slate-300">|</span>
                          <button 
                            type="button" 
                            (click)="setTodosEstados('(M) Malo')"
                            class="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer">
                            (M) Malo
                          </button>
                        </div>
                      }
                    </div>
                  </div>
                }

                <!-- TABLA COMPLEMENTARIA DE SIM CARDS (Si hay líneas asociadas) -->
                @if (doc.simCards && doc.simCards.length > 0) {
                  <div class="border border-slate-900 rounded-xs overflow-hidden mb-4">
                    <div class="bg-slate-100 border-b border-slate-900 px-3 py-1 font-bold uppercase tracking-wider text-slate-900 text-[10px]">
                      INFORMACIÓN DE LÍNEAS CELULARES / SIM CARDS (Total: {{ doc.simCards.length }})
                    </div>
                    <table class="w-full text-left text-[10px] divide-y divide-slate-300">
                      <thead class="bg-slate-50 text-slate-900 font-bold uppercase tracking-wider text-[9px] border-b border-slate-900">
                        <tr class="divide-x divide-slate-300">
                          <th class="px-2 py-1.5 text-center w-8">Ítem</th>
                          <th class="px-2.5 py-1.5">Número Telefónico</th>
                          <th class="px-2.5 py-1.5">ICCID (Serial SIM)</th>
                          <th class="px-2.5 py-1.5">Operador</th>
                          <th class="px-2 py-1.5 text-center w-24">Estado</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-200 text-slate-800">
                        @for (sim of doc.simCards; track sim.iccid; let idx = $index) {
                          <tr class="divide-x divide-slate-200 hover:bg-slate-50/50">
                            <td class="px-2 py-1.5 text-center font-mono text-slate-500">{{ idx + 1 }}</td>
                            <td class="px-2.5 py-1.5 font-mono font-bold text-slate-900">📱 {{ sim.numero }}</td>
                            <td class="px-2.5 py-1.5 font-mono text-slate-700">{{ sim.iccid }}</td>
                            <td class="px-2.5 py-1.5 font-bold uppercase">{{ sim.operador }}</td>
                            <td class="px-2 py-1.5 text-center font-semibold text-slate-700">{{ sim.estado }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }

                <!-- OBSERVACIONES (Estructura oficial GF-FO-29) -->
                <div class="border border-slate-900 rounded-xs overflow-hidden mb-4 text-[10px]">
                  <div class="bg-slate-100 border-b border-slate-900 px-3 py-1 font-bold uppercase tracking-wider text-slate-900 text-[10px]">
                    OBSERVACIONES:
                  </div>
                  <div class="p-2.5 min-h-10 text-slate-800 text-[10px] leading-relaxed">
                    {{ doc.observacionesGenerales || 'Se entrega en normal estado de funcionamiento y presentación.' }}
                  </div>
                </div>

                <!-- CLÁUSULAS ADICIONALES (Para formatos contractuales como Comodato) -->
                @if (doc.config.clausulas && doc.config.clausulas.length > 0) {
                  <div class="border border-slate-900 rounded-xs overflow-hidden mb-4">
                    <div class="bg-slate-100 border-b border-slate-900 px-3 py-1 font-bold uppercase tracking-wider text-slate-900 text-[10px]">
                      CLÁUSULAS Y CONDICIONES DEL DOCUMENTO
                    </div>
                    <div class="p-3 space-y-1.5 text-[10px] text-justify text-slate-800 leading-normal">
                      @for (clausula of doc.config.clausulas; track clausula.num) {
                        <p>
                          <span class="font-bold text-slate-900">{{ clausula.num }}. {{ clausula.titulo }}:</span>
                          {{ clausula.texto }}
                        </p>
                      }
                    </div>
                  </div>
                }

                <!-- CLÁUSULA DE COMPROMISO (Texto oficial literal de GF-FO-29) -->
                <div class="border border-slate-900 rounded-xs overflow-hidden mb-5">
                  <div class="bg-slate-100 border-b border-slate-900 px-3 py-1 font-bold uppercase tracking-wider text-slate-900 text-[10px]">
                    CLÁUSULA DE COMPROMISO
                  </div>
                  <div class="p-3 text-[10px] text-justify text-slate-800 leading-relaxed whitespace-pre-line">
                    {{ doc.config.compromisoReceptor }}
                  </div>
                </div>

                <!-- BLOQUE DE FIRMAS: ENTREGÓ / RECIBIÓ (Oficial GF-FO-29 Versión 07) -->
                <div class="grid grid-cols-2 divide-x divide-slate-900 border border-slate-900 rounded-xs mb-5 page-break-inside-avoid">
                  
                  <!-- ENTREGÓ -->
                  <div class="p-3.5 space-y-2 text-[10px]">
                    <div class="bg-slate-100 -mx-3.5 -mt-3.5 px-3.5 py-1 border-b border-slate-900 font-bold uppercase text-slate-900 mb-2.5">
                      ENTREGÓ
                    </div>
                    <div class="h-14 border-b border-slate-400 mb-2 flex items-end">
                      <span class="text-slate-300 text-[8px] italic">Firma del funcionario TIC</span>
                    </div>
                    <p class="flex items-baseline">
                      <span class="font-bold text-slate-900 inline-block min-w-16 mr-3">FIRMA:</span>
                      <span class="flex-1 border-b border-slate-300"></span>
                    </p>
                    <p class="flex items-baseline">
                      <span class="font-bold text-slate-900 inline-block min-w-16 mr-3">NOMBRE:</span>
                      <span class="uppercase font-semibold text-slate-800">{{ doc.partes.elaboradoPor.nombre }}</span>
                    </p>
                    <p class="flex items-baseline">
                      <span class="font-bold text-slate-900 inline-block min-w-16 mr-3">CARGO:</span>
                      <span class="font-semibold text-slate-700">{{ doc.partes.elaboradoPor.cargo }}</span>
                    </p>
                  </div>

                  <!-- RECIBIÓ -->
                  <div class="p-3.5 space-y-2 text-[10px]">
                    <div class="bg-slate-100 -mx-3.5 -mt-3.5 px-3.5 py-1 border-b border-slate-900 font-bold uppercase text-slate-900 mb-2.5">
                      RECIBIÓ
                    </div>
                    <div class="h-14 border-b border-slate-400 mb-2 flex items-end">
                      <span class="text-slate-300 text-[8px] italic">Firma del trabajador receptor</span>
                    </div>
                    <p class="flex items-baseline">
                      <span class="font-bold text-slate-900 inline-block min-w-28 mr-3">FIRMA:</span>
                      <span class="flex-1 border-b border-slate-300"></span>
                    </p>
                    <p class="flex items-baseline">
                      <span class="font-bold text-slate-900 inline-block min-w-28 mr-3">NOMBRE:</span>
                      <span class="uppercase font-semibold text-slate-800">{{ doc.partes.entregadoA.nombre }}</span>
                    </p>
                    <p class="flex items-baseline">
                      <span class="font-bold text-slate-900 inline-block min-w-28 mr-3">CARGO:</span>
                      <span class="font-semibold text-slate-700">{{ doc.partes.entregadoA.cargo }}</span>
                    </p>
                    <p class="flex items-baseline">
                      <span class="font-bold text-slate-900 inline-block min-w-28 mr-3">No. IDENTIFICACIÓN:</span>
                      <span class="font-mono font-semibold text-slate-800">{{ doc.partes.entregadoA.identificacion || '______________________' }}</span>
                    </p>
                  </div>

                </div>

                <!-- Pie de Elaboración Oficial (Idéntico a Préstamo de Dispositivos) -->
                <div class="pt-2.5 pb-1 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-600">
                  <div class="flex items-center gap-1.5">
                    <span class="font-bold text-slate-800">Elaboró:</span>
                    <span class="font-semibold text-slate-900 uppercase">{{ doc.partes.elaboradoPor.nombre }}</span>
                    <span class="text-slate-400">—</span>
                    <span class="italic text-slate-600">{{ doc.partes.elaboradoPor.cargo }}</span>
                  </div>
                  <div class="text-[9px] text-slate-400">
                    Flota La Macarena S.A. • Nit: 860.007.607-1 • Ref: {{ doc.config.codigoCalidad || 'GF-FO-29' }}
                  </div>
                </div>

                <!-- PIE DE PÁGINA INSTITUCIONAL SGI (GF-FO-29) -->
                <div class="text-[8px] text-justify text-slate-500 border border-slate-300 p-2 rounded-xs bg-slate-50 leading-tight">
                  Si usted copia o imprime este documento, el proceso de Mejoramiento y Productividad de Flota la Macarena S.A., lo considerará <strong>NO CONTROLADO</strong> y no se hace responsable por su consulta o uso. Si usted desea consultar la versión actualizada y controlada de este documento, consulte siempre la intranet de la compañía.
                </div>
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
  private readonly activoRepo = inject(ActivoRepository);

  @Output() onMovementUpdated = new EventEmitter<Movement>();

  readonly isOpen = signal(false);
  readonly currentMovement = signal<Movement | null>(null);
  readonly currentDestinationLocation = signal<Location | null>(null);
  readonly allLocations = signal<Location[]>([]);
  readonly selectedLocationId = signal<string>('');
  readonly currentTipo = signal<TipoDocumentoOficial>('ACTA_ENTREGA');
  readonly isSavingNotes = signal(false);
  readonly saveStatus = signal<'IDLE' | 'SAVED' | 'ERROR'>('IDLE');
  readonly initialNotes = signal('');
  readonly customEstados = signal<Record<string, string>>({});
  customNotes = '';

  // Metadatos específicos de la Carta de Préstamo de Dispositivo
  readonly fechaContrato = signal('………………');
  readonly searchPlacaQuery = signal<string>('');
  readonly placaAveriada = signal<string>('');
  readonly modeloAveriado = signal<string>('');
  readonly serialAveriado = signal<string>('');
  readonly incluyeCargador = signal('SÍ');
  readonly incluyeForro = signal('SÍ');
  
  // Catálogo completo de activos para el buscador tipo typeahead
  readonly allActivos = signal<Activo[]>([]);
  readonly showPlacaDropdown = signal<boolean>(false);
  readonly selectedActivoAveriado = signal<Activo | null>(null);

  /**
   * Buscador de activos averiados: Busca en TODO el inventario sin exclusiones de estado,
   * permitiendo seleccionar equipos que estén en Operación, Mantenimiento, Disponible, etc.
   */
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

  // Metadatos específicos para Reintegro de Dispositivo y/o Devolución
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

  // Metadatos específicos de Contrato de Comodato
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

  /**
   * Sedes asignadas formalmente al funcionario receptor / responsable.
   * Sin listar otras sedes del sistema para evitar ruido visual, permitiendo elegir
   * con precisión entre las oficinas que el colaborador realmente tiene a cargo.
   */
  readonly recipientAssignedLocations = computed<Location[]>(() => {
    const mov = this.currentMovement();
    const all = this.allLocations();
    if (!mov) return [];
    const targetResp = mov.receiver || mov.responsible;

    const list: Location[] = [];
    const seen = new Set<string>();

    // 1. Sede destino actual del movimiento
    const currentDest = this.currentDestinationLocation() || mov.destinationLocation;
    if (currentDest?.id) {
      list.push(currentDest);
      seen.add(currentDest.id);
    }

    // 2. Sedes asignadas formalmente al responsable
    if (targetResp?.locations && Array.isArray(targetResp.locations)) {
      for (const loc of targetResp.locations) {
        if (loc?.id && !seen.has(loc.id)) {
          list.push(loc);
          seen.add(loc.id);
        }
      }
    }

    // 3. Si tiene locationIds
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
        lugarFecha: `${this.currentDestinationLocation()?.ciudad || mov.destinationLocation?.ciudad || 'Bogotá D.C.'}, ${this.formatFechaFormal(mov.createdAt)}`,
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
    // Si el usuario edita y borra la selección previa
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

  private extractSimFromActivo(activo: Activo | any): { operador: string; numero: string } {
    if (!activo) return { operador: '', numero: '' };

    if (activo.simCards && Array.isArray(activo.simCards) && activo.simCards.length > 0) {
      const first = activo.simCards[0];
      return {
        operador: first?.operador?.trim() || '',
        numero: first?.numero?.trim() || ''
      };
    }

    if (activo.simCard) {
      const sc = activo.simCard;
      if (typeof sc === 'object') {
        return {
          operador: sc.operador?.trim() || '',
          numero: sc.numero?.trim() || ''
        };
      }
      if (typeof sc === 'string' && sc.trim()) {
        const match = sc.match(/\((.*?)\)/);
        const operador = match ? match[1].trim() : '';
        const parts = sc.split(' ');
        const numero = parts.length > 0 ? parts[0].trim() : '';
        return { operador, numero };
      }
    }

    return { operador: '', numero: '' };
  }

  selectActivoComodato(activo: Activo) {
    this.selectedActivoComodato.set(activo);
    this.searchPlacaComodatoQuery.set(activo.placa || '');
    this.showPlacaComodatoDropdown.set(false);

    // 1. Bien Entregado se llena automáticamente con [Tipo] + [Modelo]
    const tipo = (activo as any).tipo || (activo as any).tipoActivo?.nombre || (activo as any).category?.nombre || 'Dispositivo';
    const tipoCap = tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase();
    const modelo = activo.modelo && activo.modelo !== 'N/A' ? activo.modelo.trim() : (activo.marca && activo.marca !== 'N/A' ? activo.marca.trim() : '');
    const bien = `${tipoCap} ${modelo}`.trim();
    this.bienEntregadoComodato.set(bien);

    // 2. Precio de Compra se llena automáticamente con el precioCompra del activo
    const precio = (activo as any).precioCompra ? Number((activo as any).precioCompra) : null;
    if (precio && precio > 0) {
      this.precioCompraInput.set(String(precio));
      this.valorReposicionComodato.set(this.formatMoneda(precio));
      this.valorReposicionLetrasComodato.set(this.numeroALetras(precio));
    } else {
      this.precioCompraInput.set('');
      this.valorReposicionComodato.set('$ 0');
      this.valorReposicionLetrasComodato.set('CERO PESOS');
    }

    // 3. SIM card vinculada: actualiza automáticamente desde el activo, o se elimina/limpia si no está
    const simInfo = this.extractSimFromActivo(activo);
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

  formatFechaFormal(fecha: Date | string | undefined): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return String(fecha);
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = meses[d.getMonth()];
    const anio = d.getFullYear();
    return `${mes} ${dia} del ${anio}`;
  }

  getPrimerActivo(doc: OfficialDocumentData): any {
    return doc.activos && doc.activos.length > 0 ? doc.activos[0] : null;
  }

  getOperadorSimComodato(doc?: OfficialDocumentData | null): string {
    if (this.selectedActivoComodato()) {
      return this.operadorSimComodato() || 'No asignada';
    }
    const act = this.getActivoComodato(doc);
    if (act) {
      const simInfo = this.extractSimFromActivo(act);
      return simInfo.operador || 'No asignada';
    }
    return this.operadorSimComodato() || 'No asignada';
  }

  getNumeroSimComodato(doc?: OfficialDocumentData | null): string {
    if (this.selectedActivoComodato()) {
      return this.numeroSimComodato() || 'No asignada';
    }
    const act = this.getActivoComodato(doc);
    if (act) {
      const simInfo = this.extractSimFromActivo(act);
      return simInfo.numero || 'No asignada';
    }
    return this.numeroSimComodato() || 'No asignada';
  }

  getOperadorSim(doc: OfficialDocumentData): string {
    return this.getOperadorSimComodato(doc);
  }

  getNumeroSim(doc: OfficialDocumentData): string {
    return this.getNumeroSimComodato(doc);
  }

  getFechaComodatoLetras(fecha: Date | string | undefined): {
    diaLetras: string;
    diaNumero: string;
    mesNombre: string;
    anioLetras: string;
    anioNumero: string;
  } {
    const d = fecha ? new Date(fecha) : new Date();
    const diasPalabras = [
      '', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
      'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte',
      'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve', 'treinta', 'treinta y uno'
    ];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const aniosPalabras: Record<number, string> = {
      2024: 'veinticuatro',
      2025: 'veinticinco',
      2026: 'veintiséis',
      2027: 'veintisiete',
      2028: 'veintiocho',
      2029: 'veintinueve',
      2030: 'treinta'
    };

    const diaNum = isNaN(d.getTime()) ? new Date().getDate() : d.getDate();
    const diaLetras = diasPalabras[diaNum] || String(diaNum);
    const mesNombre = meses[isNaN(d.getTime()) ? new Date().getMonth() : d.getMonth()] || 'octubre';
    const anioNum = isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
    const anioLetras = aniosPalabras[anioNum] || String(anioNum);

    return {
      diaLetras,
      diaNumero: String(diaNum).padStart(2, '0'),
      mesNombre,
      anioLetras,
      anioNumero: String(anioNum)
    };
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

  getModeloActivo(doc?: OfficialDocumentData | null): string {
    const act = this.getActivoComodato(doc);
    if (act?.modelo && act.modelo !== 'N/A') {
      return act.modelo.trim();
    }
    if (act?.marca && act.marca !== 'N/A') {
      return act.marca.trim();
    }
    const bien = this.bienEntregadoComodato().trim();
    if (bien) {
      const parts = bien.split(' ');
      if (parts.length > 1) return parts.slice(1).join(' ').trim();
      return parts[0].trim();
    }
    return 'Dispositivo';
  }

  getDenominacionDispositivo(doc?: OfficialDocumentData | null, variante: 'simple' | 'mayuscula' | 'articulo' | 'articulo_mayuscula' = 'simple'): string {
    const mod = this.getModeloActivo(doc);
    switch (variante) {
      case 'mayuscula':
        return `Dispositivo ${mod}`;
      case 'articulo':
        return `el dispositivo ${mod}`;
      case 'articulo_mayuscula':
        return `El Dispositivo ${mod}`;
      case 'simple':
      default:
        return `dispositivo ${mod}`;
    }
  }

  formatMoneda(num: number): string {
    if (isNaN(num)) return '$ 0';
    return '$ ' + Math.floor(Math.abs(num)).toLocaleString('es-CO');
  }

  onPrecioCompraChange(val: string | number) {
    const str = String(val).replace(/[^0-9]/g, '');
    this.precioCompraInput.set(str);
    const num = parseInt(str, 10);
    if (!isNaN(num) && num > 0) {
      this.valorReposicionComodato.set(this.formatMoneda(num));
      this.valorReposicionLetrasComodato.set(this.numeroALetras(num));
    } else {
      this.valorReposicionComodato.set('$ 0');
      this.valorReposicionLetrasComodato.set('CERO PESOS');
    }
  }

  numeroALetras(num: number): string {
    if (isNaN(num) || num === 0) return 'CERO PESOS';
    num = Math.floor(Math.abs(num));

    const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    const convertirMenorMil = (n: number): string => {
      if (n === 0) return '';
      if (n === 100) return 'CIEN';
      let res = '';
      if (n >= 100) {
        res += centenas[Math.floor(n / 100)] + ' ';
        n %= 100;
      }
      if (n >= 10 && n <= 19) {
        res += especiales[n - 10] + ' ';
        return res.trim();
      }
      if (n >= 21 && n <= 29) {
        res += 'VEINTI' + unidades[n - 20] + ' ';
        return res.trim();
      }
      if (n >= 10) {
        res += decenas[Math.floor(n / 10)];
        n %= 10;
        if (n > 0) res += ' Y ' + unidades[n];
        return res.trim();
      }
      if (n > 0) {
        res += unidades[n];
      }
      return res.trim();
    };

    const millones = Math.floor(num / 1000000);
    const miles = Math.floor((num % 1000000) / 1000);
    const resto = num % 1000;

    const partes: string[] = [];

    if (millones > 0) {
      if (millones === 1) {
        partes.push('UN MILLÓN');
      } else {
        partes.push(`${convertirMenorMil(millones)} MILLONES`);
      }
    }

    if (miles > 0) {
      if (miles === 1) {
        partes.push('MIL');
      } else {
        partes.push(`${convertirMenorMil(miles)} MIL`);
      }
    }

    if (resto > 0) {
      partes.push(convertirMenorMil(resto));
    }

    const conDe = (millones > 0 && miles === 0 && resto === 0) ? 'DE PESOS' : 'PESOS';
    return `${partes.join(' ').trim()} ${conDe}`.replace(/\s+/g, ' ');
  }

  getEstadoLabel(estado: string): string {
    const e = (estado || '').toUpperCase();
    if (e.includes('BUEN') || e === 'OPERACION' || e === 'DISPONIBLE') return '(B) Bueno';
    if (e.includes('REG') || e === 'MANTENIMIENTO') return '(R) Regular';
    if (e.includes('MAL') || e === 'BAJA') return '(M) Malo';
    return '(B) Bueno';
  }

  getActivoEstado(placa: string, fallbackEstado?: string): string {
    const custom = this.customEstados()[placa];
    if (custom) return custom;
    return this.getEstadoLabel(fallbackEstado || '');
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

        // Fusión segura: preservar todas las relaciones esenciales (responsables, cargos, documento, sedes)
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

    // 1. Cargar sedes del sistema para resolución de asignadas
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

    // 2. Cargar inventario completo para búsqueda en tiempo real de activos averiados y comodato
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

    // Sugerencia inteligente inicial del dominio según la sede
    const sugerido = this.policy.sugerirTipoDocumento(movement, destinationLocation);
    this.currentTipo.set(sugerido);
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

    // Inicializar metadatos de Comodato
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

    // Inicializar estados personalizados con los estados actuales de los activos
    const initialMap: Record<string, string> = {};
    if (movement.activos && movement.activos.length > 0) {
      for (const activo of movement.activos) {
        if (activo.placa) {
          initialMap[activo.placa] = this.getEstadoLabel(activo.estado);
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

    // 1. Obtener o crear un iframe limpio con dimensiones físicas reales para layout
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

    // 2. Extraer todas las hojas de estilo activas de la app para transferirlas al iframe
    const styleTags = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(node => node.outerHTML)
      .join('\n');

    const titulo = this.docData()?.config.titulo || 'Documento Oficial';
    const consecutivo = this.docData()?.consecutivo || '';

    // 3. Escribir el documento aislado con reglas de paginación explícitas
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

    // 4. Esperar carga de assets (ej: /Logo_FLM.png) y disparar impresión limpia
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 400);
  }
}
