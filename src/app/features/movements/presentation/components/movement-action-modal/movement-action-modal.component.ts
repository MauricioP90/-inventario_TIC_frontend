import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment';
import { Movement, MOVEMENT_TYPE_LABELS } from '../../../domain/models/movement.model';
import { Location } from '../../../../locations/domain/models/location.model';
import { Responsable } from '../../../../responsables/domain/models/responsable.model';

@Component({
  selector: 'app-movement-action-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (movement && actionType) {
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
          <div class="p-5 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
            <h3 class="font-bold text-slate-800 text-lg flex items-center gap-3">
              @if (actionType === 'dispatch') { 🚛 Despachar Traslado }
              @if (actionType === 'receive') { ✅ Recibir Traslado }
              @if (actionType === 'route') { 📍 Ruta del Dispositivo }
            </h3>
            <button (click)="close()" class="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:text-slate-100 transition-colors flex items-center justify-center cursor-pointer">
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
                  <span class="font-bold text-slate-800">{{ movement.id.slice(-8) }}</span>
                </p>
                <p class="flex justify-between">
                  <span class="text-slate-500">Origen:</span> 
                  <span class="font-bold text-slate-800">{{ movement.originLocation?.nombre || 'N/A' }}</span>
                </p>
                <p class="flex justify-between">
                  <span class="text-slate-500">Destino:</span> 
                  <span class="font-bold text-slate-800">{{ movement.destinationLocation?.nombre || 'N/A' }}</span>
                </p>
                <p class="flex justify-between">
                  <span class="text-slate-500">Responsable:</span> 
                  <span class="font-bold text-slate-800">{{ movement.responsible?.nombre || 'N/A' }}</span>
                </p>
                <div class="border-t border-indigo-100/50 pt-2 space-y-1.5">
                  @if (movement.type === 'SIM_TRASLADO') {
                    <p class="text-slate-500 font-bold uppercase tracking-wider text-[10px]">SIM Cards Trasladadas:</p>
                    @for (sim of movement.simCards; track sim.id) {
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
                    @for (act of movement.activos; track act.id) {
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
                          [class.text-rose-600]="movement.type === 'BAJA_ACTIVO'">
                      {{ getMovementTypeLabel(movement.type) }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-500 font-medium">Origen:</span>
                    <span class="font-bold text-slate-800">{{ movement.originLocation?.nombre || 'N/A' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-500 font-medium">Destino:</span>
                    <span class="font-bold text-slate-800">{{ movement.destinationLocation?.nombre || 'N/A' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-500 font-medium">Responsable:</span>
                    <span class="font-bold text-slate-800">{{ movement.responsible?.nombre || 'N/A' }}</span>
                  </div>
                  @if (movement.notes) {
                    <div class="pt-1.5 border-t border-slate-200/60 mt-1">
                      <span class="text-slate-500 font-medium block mb-0.5 text-xs">Notas / Motivo de Rechazo:</span>
                      <span class="font-semibold text-rose-600 block leading-relaxed bg-rose-50/50 p-2 rounded-lg border border-rose-100/50 text-xs max-h-24 overflow-y-auto">{{ movement.notes }}</span>
                    </div>
                  }
                  <div class="pt-1.5 border-t border-slate-200/60 mt-1">
                    <span class="text-slate-500 font-medium block mb-1">Equipos en traslado:</span>
                    <div class="space-y-1">
                      @for (act of movement.activos; track act.id) {
                        <div class="flex justify-between items-center bg-white px-2.5 py-1 rounded border border-slate-100 font-mono text-[10px]">
                          <span class="text-slate-800 font-bold">{{ act.placa }}</span>
                          <span class="text-slate-500">{{ act.marca }} (S/N: {{ act.serial || 'N/A' }})</span>
                        </div>
                      }
                      @for (sim of movement.simCards; track sim.id) {
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
                    @for (resp of responsables; track resp.id) {
                      <option [value]="resp.id">{{ resp.nombre }}{{ resp.area?.nombre ? ' — ' + resp.area?.nombre : '' }}</option>
                    }
                    </select>
                  </div>
                  <div class="space-y-1.5">
                    <label class="text-xs font-bold text-slate-500 uppercase">Sede de Recepción real:</label>
                    <select [(ngModel)]="modalDestinationId"
                            class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm appearance-none transition-all">
                      <option value="">Seleccione la sede...</option>
                      @for (loc of locations; track loc.id) {
                        <option [value]="loc.id">{{ loc.nombre }}</option>
                      }
                    </select>
                  </div>
                }

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
                              <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx" (change)="onFileChange($event, 'evidence')" />
                            </label>
                            <button type="button" (click)="removeFile('evidence')" class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.562.621c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                            </button>
                          </div>
                        </div>
                      } @else {
                        <div class="space-y-2">
                          <label class="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-white h-[50px] px-4 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors">
                            @if (uploadingEvidence()) {
                              <div class="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                              <span class="text-xs text-slate-500 font-medium">Subiendo guía...</span>
                            } @else {
                              <svg class="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 16v-8m0 0l-3 3m3-3l3 3M6.5 20h11A2.5 2.5 0 0020 17.5V7.914a2.5 2.5 0 00-.732-1.768l-3.414-3.414A2.5 2.5 0 0014.086 2H6.5A2.5 2.5 0 004 4.5v13A2.5 2.5 0 006.5 20z"/></svg>
                              <span class="text-xs text-slate-700 font-semibold">Subir Guía de Envío (PDF, PNG, JPG)</span>
                            }
                            <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx" (change)="onFileChange($event, 'evidence')" />
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
                              <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx" (change)="onFileChange($event, 'document')" />
                            </label>
                            <button type="button" (click)="removeFile('document')" class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.562.621c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                            </button>
                          </div>
                        </div>
                      } @else {
                        <div class="space-y-2">
                          <label class="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-white h-[50px] px-4 cursor-pointer hover:border-violet-400 hover:bg-violet-50/40 transition-colors">
                            @if (uploadingDocument()) {
                              <div class="animate-spin h-4 w-4 border-2 border-violet-500 border-t-transparent rounded-full"></div>
                              <span class="text-xs text-slate-500 font-medium">Subiendo documento...</span>
                            } @else {
                              <svg class="h-4 w-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                              <span class="text-xs text-slate-700 font-semibold">Subir Comodato / Acta Firmada (PDF, PNG, JPG)</span>
                            }
                            <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx" (change)="onFileChange($event, 'document')" />
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
                         [class.bg-emerald-50/70]="notifyWhatsApp()"
                         [class.border-emerald-200]="notifyWhatsApp()"
                         [class.bg-slate-50/80]="!notifyWhatsApp()"
                         [class.border-slate-200/90]="!notifyWhatsApp()">
                      <div class="flex items-start justify-between gap-3">
                        <div class="flex items-start gap-2.5">
                          <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-2xs"
                               [class.bg-emerald-500]="notifyWhatsApp()"
                               [class.text-white]="notifyWhatsApp()"
                               [class.bg-slate-200]="!notifyWhatsApp()"
                               [class.text-slate-500]="!notifyWhatsApp()">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                          </div>
                          <div>
                            <p class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              Notificación por WhatsApp
                              @if (recipientPhone()) {
                                <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                                      [class.bg-emerald-100]="notifyWhatsApp()"
                                      [class.text-emerald-800]="notifyWhatsApp()"
                                      [class.bg-slate-200]="!notifyWhatsApp()"
                                      [class.text-slate-600]="!notifyWhatsApp()">
                                  {{ notifyWhatsApp() ? 'Activada' : 'Omitida' }}
                                </span>
                              }
                            </p>
                            @if (recipientPhone()) {
                              <p class="text-[11px] text-slate-500 mt-0.5">
                                Enviar enlace de recepción al receptor: <strong class="text-slate-700 font-mono">+{{ recipientPhone() }}</strong>
                                @if (recipientName()) {
                                  <span class="text-slate-600">({{ recipientName() }})</span>
                                }
                              </p>
                            } @else {
                              <p class="text-[11px] text-amber-700 mt-0.5">
                                ⚠️ El receptor no tiene celular registrado. La notificación se enviará únicamente por correo corporativo.
                              </p>
                            }
                          </div>
                        </div>

                        @if (recipientPhone()) {
                          <label class="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                            <input type="checkbox"
                                   [checked]="notifyWhatsApp()"
                                   (change)="notifyWhatsApp.set(!notifyWhatsApp())"
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
                  @if (movement.documentUrl || movement.evidenceUrl) {
                    <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                      <p class="text-[10px] text-slate-500 uppercase font-bold">Documentos del Traslado:</p>
                      <div class="flex flex-wrap gap-2">
                        @if (movement.documentUrl) {
                          <a [href]="movement.documentUrl" target="_blank"
                             class="text-xs font-semibold text-violet-700 hover:text-violet-900 bg-white border border-violet-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-2xs">
                            📋 Ver Comodato / Acta ↗
                          </a>
                        }
                        @if (movement.evidenceUrl) {
                          <a [href]="movement.evidenceUrl" target="_blank"
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
                            <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx" (change)="onFileChange($event, 'evidence')" />
                          </label>
                          <button type="button" (click)="removeFile('evidence')" class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.562.621c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                          </button>
                        </div>
                      </div>
                    } @else {
                      <div class="space-y-2">
                        <label class="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 h-[56px] px-4 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/40 transition-colors">
                          @if (uploadingEvidence()) {
                            <div class="animate-spin h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
                            <span class="text-xs text-slate-500 font-medium">Subiendo soporte...</span>
                          } @else {
                            <svg class="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 16v-8m0 0l-3 3m3-3l3 3M6.5 20h11A2.5 2.5 0 0020 17.5V7.914a2.5 2.5 0 00-.732-1.768l-3.414-3.414A2.5 2.5 0 0014.086 2H6.5A2.5 2.5 0 004 4.5v13A2.5 2.5 0 006.5 20z"/></svg>
                            <span class="text-xs text-slate-700 font-semibold">Subir Soporte de Recepción (PDF, Imagen)</span>
                          }
                          <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx" (change)="onFileChange($event, 'evidence')" />
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
                
                <button (click)="submitAction()"
                        class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 transition-all mt-4 flex items-center justify-center gap-2 cursor-pointer">
                  {{ actionType === 'dispatch' ? 'Confirmar Despacho y Notificar' : 'Confirmar Recepción' }}
                </button>

                <!-- BOTÓN Y FORMULARIO DE RECHAZO / NOVEDADES -->
                @if (actionType === 'receive' && movement.type !== 'RETORNO_POR_RECHAZO') {
                  <div class="border-t border-slate-100 pt-4 mt-2">
                    @if (!showRejectionForm()) {
                      <button (click)="showRejectionForm.set(true)"
                              class="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer">
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
                          <button (click)="submitReject()"
                                  [disabled]="!rejectionReason().trim()"
                                  class="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer">
                            ❌ Confirmar Rechazo
                          </button>
                          <button (click)="showRejectionForm.set(false)"
                                  class="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer">
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
  `
})
export class MovementActionModalComponent {
  private http = inject(HttpClient);

  @Input() movement: Movement | null = null;
  @Input() actionType: 'dispatch' | 'receive' | 'route' | null = null;
  @Input() locations: Location[] = [];
  @Input() responsables: Responsable[] = [];

  @Output() onClose = new EventEmitter<void>();
  @Output() onConfirmDispatch = new EventEmitter<{ evidenceUrl?: string; documentUrl?: string; notifyWhatsApp: boolean }>();
  @Output() onConfirmReceive = new EventEmitter<{ receiverId: string; destinationId: string; evidenceUrl: string }>();
  @Output() onConfirmReject = new EventEmitter<{ reason: string }>();

  modalReceiverId = '';
  modalDestinationId = '';
  modalEvidenceUrl = '';
  modalFileName = '';
  modalDocumentUrl = '';
  modalDocFileName = '';
  uploadingEvidence = signal(false);
  uploadingDocument = signal(false);

  notifyWhatsApp = signal(true);
  recipientPhone = signal<string | null>(null);
  recipientName = signal<string | null>(null);

  showRejectionForm = signal(false);
  rejectionReason = signal('');

  ngOnChanges() {
    if (this.movement && this.actionType) {
      if (this.actionType === 'dispatch') {
        this.modalEvidenceUrl = this.movement.evidenceUrl || '';
        this.modalFileName = this.movement.evidenceUrl ? '🚚 Guía de envío existente' : '';
        this.modalDocumentUrl = this.movement.documentUrl || '';
        this.modalDocFileName = this.movement.documentUrl ? '📋 Comodato / Acta existente' : '';

        const resp = this.responsables.find(r => r.id === this.movement!.responsibleId) || this.movement.responsible;
        const phone = resp?.telefono?.trim();
        if (phone) {
          this.recipientPhone.set(phone);
          this.recipientName.set(resp?.nombre || 'Receptor');
          this.notifyWhatsApp.set(true);
        } else {
          this.recipientPhone.set(null);
          this.recipientName.set(resp?.nombre || null);
          this.notifyWhatsApp.set(false);
        }
      } else if (this.actionType === 'receive') {
        this.modalReceiverId = '';
        this.modalEvidenceUrl = this.movement.receivedEvidenceUrl || '';
        this.modalFileName = this.movement.receivedEvidenceUrl ? '📄 Soporte de recepción existente' : '';
        this.modalDestinationId = this.movement.destinationLocationId || '';
      }
    }
  }

  close() {
    this.showRejectionForm.set(false);
    this.rejectionReason.set('');
    this.onClose.emit();
  }

  submitAction() {
    if (!this.movement || !this.actionType) return;

    if (this.actionType === 'dispatch') {
      if (!this.modalEvidenceUrl && !this.modalDocumentUrl) {
        alert('Por favor, adjunta al menos la Guía de Envío o el Comodato/Acta firmado para despachar.');
        return;
      }
      this.onConfirmDispatch.emit({
        evidenceUrl: this.modalEvidenceUrl || undefined,
        documentUrl: this.modalDocumentUrl || undefined,
        notifyWhatsApp: this.recipientPhone() ? this.notifyWhatsApp() : false
      });
    } else if (this.actionType === 'receive') {
      if (!this.modalReceiverId || !this.modalEvidenceUrl) {
        alert('Completa datos de recepción y soporte.');
        return;
      }
      this.onConfirmReceive.emit({
        receiverId: this.modalReceiverId,
        destinationId: this.modalDestinationId,
        evidenceUrl: this.modalEvidenceUrl
      });
    }
  }

  submitReject() {
    const reason = this.rejectionReason().trim();
    if (!reason) {
      alert('Por favor, ingresa el motivo del rechazo / novedad.');
      return;
    }
    this.onConfirmReject.emit({ reason });
  }

  onFileChange(event: Event, target: 'evidence' | 'document') {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (target === 'evidence') {
      this.uploadingEvidence.set(true);
      this.modalFileName = file.name;
    } else {
      this.uploadingDocument.set(true);
      this.modalDocFileName = file.name;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.http.post<{ url: string }>(`${environment.apiUrl}/files/upload`, {
        base64,
        fileName: file.name,
        folder: 'evidencias'
      }).subscribe({
        next: (res) => {
          if (target === 'evidence') {
            this.modalEvidenceUrl = res.url;
            this.uploadingEvidence.set(false);
          } else {
            this.modalDocumentUrl = res.url;
            this.uploadingDocument.set(false);
          }
        },
        error: () => {
          if (target === 'evidence') this.uploadingEvidence.set(false);
          else this.uploadingDocument.set(false);
          alert('Error al subir el archivo');
        }
      });
    };
    reader.readAsDataURL(file);
  }

  removeFile(target: 'evidence' | 'document') {
    if (target === 'evidence') {
      this.modalEvidenceUrl = '';
      this.modalFileName = '';
    } else {
      this.modalDocumentUrl = '';
      this.modalDocFileName = '';
    }
  }

  getRouteProgress(): string {
    if (!this.movement) return '0%';
    const status = this.movement.status;
    return status === 'RECEIVED' ? '100%' : (status === 'EN_TRANSIT' ? '50%' : '0%');
  }

  isEnTransitOrReceived(): boolean {
    return !!this.movement && ['EN_TRANSIT', 'RECEIVED'].includes(this.movement.status);
  }

  isReceived(): boolean {
    return this.movement?.status === 'RECEIVED';
  }

  getMovementTypeLabel(type: string): string {
    return (MOVEMENT_TYPE_LABELS as Record<string, string>)[type] || type;
  }

  getSimCardsNumbers(simCards: any[]): string {
    if (!simCards || simCards.length === 0) return '';
    return simCards.map((s: any) => s.numero).join(' - ');
  }
}
