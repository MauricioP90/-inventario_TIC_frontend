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
              
              <!-- Selector de Formato Oficial -->
              <div class="md:col-span-5">
                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Tipo de Formato Oficial:
                </label>
                <div class="relative">
                  <select 
                    [ngModel]="currentTipo()"
                    (ngModelChange)="onTipoChange($event)"
                    class="w-full bg-white text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer shadow-2xs">
                    <option value="ACTA_ENTREGA">🏢 GF-FO-29 Acta de Entrega de Activos (V7 - Oficial)</option>
                    <option value="PRESTAMO_DISPOSITIVO">📱 Entrega de Dispositivo en Calidad de Préstamo (Partícipes)</option>
                    <option value="COMODATO">🤝 FOR-TIC-002 Comodato de Equipos (Terceros)</option>
                    <option value="PAZ_Y_SALVO">📄 FOR-TIC-003 Devolución / Paz y Salvo TI</option>
                    <option value="GUIA_REMISION">🛠️ FOR-TIC-004 Guía Remisión Técnica (Taller)</option>
                  </select>
                </div>
              </div>

              <!-- Observaciones Particulares que se Imprimen en el Documento -->
              <div class="md:col-span-7">
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

              <!-- BARRA DE CONFIGURACIÓN ESPECÍFICA PARA PRÉSTAMO DE DISPOSITIVO -->
              @if (currentTipo() === 'PRESTAMO_DISPOSITIVO') {
                <div class="md:col-span-12 pt-3 mt-1 border-t border-slate-200">
                  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2.5 items-end">
                    
                    <!-- 1. Sede / Oficina (Solo habilitada para Préstamo, sin otras sedes para evitar ruido) -->
                    <div>
                      <div class="flex items-center justify-between mb-1">
                        <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Sede / Oficina:
                        </label>
                        @if (recipientAssignedLocations().length > 1) {
                          <span class="text-[9px] text-indigo-600 font-bold">
                            {{ recipientAssignedLocations().length }} sedes
                          </span>
                        }
                      </div>
                      @if (recipientAssignedLocations().length > 1) {
                        <select 
                          [ngModel]="selectedLocationId()"
                          (ngModelChange)="onLocationChange($event)"
                          class="w-full bg-white text-slate-800 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs">
                          @for (loc of recipientAssignedLocations(); track loc.id) {
                            <option [value]="loc.id">🏢 {{ loc.nombre }} ({{ loc.ciudad || 'Sin ciudad' }})</option>
                          }
                        </select>
                      } @else {
                        <div class="w-full bg-slate-100 text-slate-800 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 truncate flex items-center gap-1.5" title="{{ recipientAssignedLocations()[0]?.nombre || currentDestinationLocation()?.nombre || 'Sede asignada' }}">
                          <span>🏢</span>
                          <span class="truncate">{{ recipientAssignedLocations()[0]?.nombre || currentDestinationLocation()?.nombre || 'Sede asignada' }}</span>
                        </div>
                      }
                    </div>

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
                      <span class="font-semibold text-slate-900 uppercase">{{ doc.partes.entregadoA.area || doc.partes.entregadoA.sede }}</span>
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

    // 2. Cargar inventario completo para búsqueda en tiempo real de activos averiados
    this.getAllActivosUC.execute().subscribe({
      next: (activos) => this.allActivos.set(activos),
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

    // 1. Obtener o crear un iframe oculto en el DOM
    let iframe = document.getElementById('isolated-print-iframe') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'isolated-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);
    }

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) return;

    // 2. Extraer todas las hojas de estilo activas de la app para transferirlas al iframe
    const styleTags = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(node => node.outerHTML)
      .join('\n');

    const titulo = this.docData()?.config.titulo || 'Documento Oficial';
    const consecutivo = this.docData()?.consecutivo || '';

    // 3. Escribir el documento aislado
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
            margin: 12mm 15mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
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
          .no-print {
            display: none !important;
          }
          .print-only {
            display: inline-block !important;
          }
        </style>
      </head>
      <body class="p-4 bg-white">
        ${printElement.innerHTML}
      </body>
      </html>
    `);
    iframeDoc.close();

    // 4. Esperar carga de assets (ej: /logo-bus.png) y disparar impresión limpia
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 300);
  }
}
