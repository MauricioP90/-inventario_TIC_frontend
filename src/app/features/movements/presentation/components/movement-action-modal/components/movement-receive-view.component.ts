import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Movement } from '../../../../domain/models/movement.model';
import { Responsable } from '../../../../../responsables/domain/models/responsable.model';
import { Location } from '../../../../../locations/domain/models/location.model';

@Component({
  selector: 'app-movement-receive-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-4" *ngIf="movement">
      <!-- Selector de responsable receptor -->
      <div class="space-y-1.5">
        <label class="text-xs font-bold text-slate-500 uppercase">Responsable que recibe (ID):</label>
        <select [ngModel]="receiverId"
                (ngModelChange)="receiverIdChange.emit($event)"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm transition-all">
          <option value="">Seleccione el responsable...</option>
          @for (resp of responsables; track resp.id) {
            <option [value]="resp.id">{{ resp.nombre }}{{ resp.area?.nombre ? ' — ' + resp.area?.nombre : '' }}</option>
          }
        </select>
      </div>

      <!-- Sede de Recepción -->
      <div class="space-y-1.5">
        <label class="text-xs font-bold text-slate-500 uppercase">Sede de Recepción real:</label>
        <select [ngModel]="destinationId"
                (ngModelChange)="destinationIdChange.emit($event)"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm appearance-none transition-all">
          <option value="">Seleccione la sede...</option>
          @for (loc of locations; track loc.id) {
            <option [value]="loc.id">{{ loc.nombre }}</option>
          }
        </select>
      </div>

      <!-- Documentos previos del traslado -->
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

        @if (evidenceUrl) {
          <div class="flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl transition-all shadow-sm">
            <div class="flex items-center gap-2.5 overflow-hidden">
              <div class="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                📦
              </div>
              <div class="truncate">
                <p class="text-xs font-bold text-slate-800 truncate">{{ fileName || 'Soporte de recepción cargado' }}</p>
                <a [href]="evidenceUrl" target="_blank" class="text-[11px] text-emerald-700 hover:underline font-semibold flex items-center gap-1 mt-0.5">
                  Ver / Descargar archivo ↗
                </a>
              </div>
            </div>
            
            <div class="flex items-center gap-1.5 shrink-0">
              <label class="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg cursor-pointer transition-colors bg-white shadow-2xs">
                Reemplazar
                <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx" (change)="fileChange.emit($event)" />
              </label>
              <button type="button" (click)="removeFile.emit()" class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.562.621c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
              </button>
            </div>
          </div>
        } @else {
          <div class="space-y-2">
            <label class="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 h-[56px] px-4 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/40 transition-colors">
              @if (uploadingEvidence) {
                <div class="animate-spin h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
                <span class="text-xs text-slate-500 font-medium">Subiendo soporte...</span>
              } @else {
                <svg class="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 16v-8m0 0l-3 3m3-3l3 3M6.5 20h11A2.5 2.5 0 0020 17.5V7.914a2.5 2.5 0 00-.732-1.768l-3.414-3.414A2.5 2.5 0 0014.086 2H6.5A2.5 2.5 0 004 4.5v13A2.5 2.5 0 006.5 20z"/></svg>
                <span class="text-xs text-slate-700 font-semibold">Subir Soporte de Recepción (PDF, Imagen)</span>
              }
              <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx" (change)="fileChange.emit($event)" />
            </label>
            
            <div class="flex items-center gap-2 pt-0.5">
              <span class="text-[10px] text-slate-400 font-medium whitespace-nowrap">O pegar URL:</span>
              <input type="text" 
                     [ngModel]="evidenceUrl" 
                     (ngModelChange)="evidenceUrlChange.emit($event)"
                     placeholder="https://..."
                     class="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-400 transition-all">
            </div>
          </div>
        }
      </div>

      <!-- BOTÓN Y FORMULARIO DE RECHAZO / NOVEDADES -->
      @if (movement.type !== 'RETORNO_POR_RECHAZO') {
        <div class="border-t border-slate-100 pt-4 mt-2">
          @if (!showRejectionForm) {
            <button (click)="toggleRejectionForm.emit(true)"
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
                <textarea [ngModel]="rejectionReason"
                          (ngModelChange)="rejectionReasonChange.emit($event)"
                          rows="3"
                          placeholder="Describa la novedad detalladamente (ej: El dispositivo llegó con la pantalla rota, faltan componentes, etc.)..."
                          class="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none text-xs transition-all placeholder:text-slate-400"></textarea>
              </div>
              <div class="flex gap-2 pt-1">
                <button (click)="submitReject.emit()"
                        [disabled]="!rejectionReason.trim()"
                        class="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer">
                  ❌ Confirmar Rechazo
                </button>
                <button (click)="toggleRejectionForm.emit(false)"
                        class="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer">
                  Cancelar
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class MovementReceiveViewComponent {
  @Input() movement: Movement | null = null;
  @Input() responsables: Responsable[] = [];
  @Input() locations: Location[] = [];
  @Input() receiverId: string = '';
  @Input() destinationId: string = '';
  @Input() evidenceUrl: string = '';
  @Input() fileName: string = '';
  @Input() uploadingEvidence: boolean = false;
  @Input() showRejectionForm: boolean = false;
  @Input() rejectionReason: string = '';

  @Output() receiverIdChange = new EventEmitter<string>();
  @Output() destinationIdChange = new EventEmitter<string>();
  @Output() evidenceUrlChange = new EventEmitter<string>();
  @Output() fileChange = new EventEmitter<Event>();
  @Output() removeFile = new EventEmitter<void>();
  @Output() toggleRejectionForm = new EventEmitter<boolean>();
  @Output() rejectionReasonChange = new EventEmitter<string>();
  @Output() submitReject = new EventEmitter<void>();
}
