import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-movement-dispatch-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-4">
      <!-- 1. GUÍA DE ENVÍO / TRANSPORTE (evidenceUrl) -->
      <div class="p-4 bg-slate-50/80 border border-slate-200/90 rounded-2xl space-y-2.5">
        <div class="flex items-center justify-between">
          <label class="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
            <span>🚚</span> Guía de Envío / Transporte
          </label>
          <span class="text-[10px] text-slate-400 font-medium">(Transportadora, remesa o conductor)</span>
        </div>

        @if (evidenceUrl) {
          <div class="flex items-center justify-between p-3 bg-white border border-indigo-200 rounded-xl shadow-2xs">
            <div class="flex items-center gap-2.5 overflow-hidden">
              <div class="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                🚚
              </div>
              <div class="truncate">
                <p class="text-xs font-bold text-slate-800 truncate">{{ fileName || 'Guía de transporte adjunta' }}</p>
                <a [href]="evidenceUrl" target="_blank" class="text-[11px] text-indigo-600 hover:underline font-semibold flex items-center gap-1 mt-0.5">
                  Ver / Descargar guía ↗
                </a>
              </div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <label class="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg cursor-pointer transition-colors bg-white shadow-2xs">
                Reemplazar
                <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx" (change)="fileChange.emit({ event: $event, target: 'evidence' })" />
              </label>
              <button type="button" (click)="removeFile.emit('evidence')" class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.562.621c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
              </button>
            </div>
          </div>
        } @else {
          <div class="space-y-2">
            <label class="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-white h-[50px] px-4 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors">
              @if (uploadingEvidence) {
                <div class="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                <span class="text-xs text-slate-500 font-medium">Subiendo guía...</span>
              } @else {
                <svg class="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 16v-8m0 0l-3 3m3-3l3 3M6.5 20h11A2.5 2.5 0 0020 17.5V7.914a2.5 2.5 0 00-.732-1.768l-3.414-3.414A2.5 2.5 0 0014.086 2H6.5A2.5 2.5 0 004 4.5v13A2.5 2.5 0 006.5 20z"/></svg>
                <span class="text-xs text-slate-700 font-semibold">Subir Guía de Envío (PDF, PNG, JPG)</span>
              }
              <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx" (change)="fileChange.emit({ event: $event, target: 'evidence' })" />
            </label>
            <div class="flex items-center gap-2">
              <span class="text-[10px] text-slate-400 font-medium whitespace-nowrap">O pegar URL:</span>
              <input type="text" 
                     [ngModel]="evidenceUrl" 
                     (ngModelChange)="evidenceUrlChange.emit($event)"
                     placeholder="https://..."
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

        @if (documentUrl) {
          <div class="flex items-center justify-between p-3 bg-white border border-violet-200 rounded-xl shadow-2xs">
            <div class="flex items-center gap-2.5 overflow-hidden">
              <div class="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600 shrink-0">
                📋
              </div>
              <div class="truncate">
                <p class="text-xs font-bold text-slate-800 truncate">{{ docFileName || 'Comodato / Acta adjunta' }}</p>
                <a [href]="documentUrl" target="_blank" class="text-[11px] text-violet-600 hover:underline font-semibold flex items-center gap-1 mt-0.5">
                  Ver / Descargar documento ↗
                </a>
              </div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <label class="px-2.5 py-1 text-[11px] font-semibold text-violet-700 hover:bg-violet-50 border border-violet-200 rounded-lg cursor-pointer transition-colors bg-white shadow-2xs">
                Reemplazar
                <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx" (change)="fileChange.emit({ event: $event, target: 'document' })" />
              </label>
              <button type="button" (click)="removeFile.emit('document')" class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.562.621c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
              </button>
            </div>
          </div>
        } @else {
          <div class="space-y-2">
            <label class="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-white h-[50px] px-4 cursor-pointer hover:border-violet-400 hover:bg-violet-50/40 transition-colors">
              @if (uploadingDocument) {
                <div class="animate-spin h-4 w-4 border-2 border-violet-500 border-t-transparent rounded-full"></div>
                <span class="text-xs text-slate-500 font-medium">Subiendo documento...</span>
              } @else {
                <svg class="h-4 w-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                <span class="text-xs text-slate-700 font-semibold">Subir Comodato / Acta Firmada (PDF, PNG, JPG)</span>
              }
              <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx" (change)="fileChange.emit({ event: $event, target: 'document' })" />
            </label>
            <div class="flex items-center gap-2">
              <span class="text-[10px] text-slate-400 font-medium whitespace-nowrap">O pegar URL:</span>
              <input type="text" 
                     [ngModel]="documentUrl" 
                     (ngModelChange)="documentUrlChange.emit($event)"
                     placeholder="https://..."
                     class="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-violet-400 transition-all">
            </div>
          </div>
        }
      </div>

      <!-- 3. NOTIFICACIÓN POR WHATSAPP (Wasapi) -->
      <div class="p-4 rounded-2xl border transition-all"
           [class.bg-emerald-50/70]="notifyWhatsApp"
           [class.border-emerald-200]="notifyWhatsApp"
           [class.bg-slate-50/80]="!notifyWhatsApp"
           [class.border-slate-200/90]="!notifyWhatsApp">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-start gap-2.5">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-2xs"
                 [class.bg-emerald-500]="notifyWhatsApp"
                 [class.text-white]="notifyWhatsApp"
                 [class.bg-slate-200]="!notifyWhatsApp"
                 [class.text-slate-500]="!notifyWhatsApp">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
            </div>
            <div>
              <p class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                Notificación por WhatsApp
                @if (recipientPhone) {
                  <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                        [class.bg-emerald-100]="notifyWhatsApp"
                        [class.text-emerald-800]="notifyWhatsApp"
                        [class.bg-slate-200]="!notifyWhatsApp"
                        [class.text-slate-600]="!notifyWhatsApp">
                    {{ notifyWhatsApp ? 'Activada' : 'Omitida' }}
                  </span>
                }
              </p>
              @if (recipientPhone) {
                <p class="text-[11px] text-slate-500 mt-0.5">
                  Enviar enlace de recepción al receptor: <strong class="text-slate-700 font-mono">+{{ recipientPhone }}</strong>
                  @if (recipientName) {
                    <span class="text-slate-600">({{ recipientName }})</span>
                  }
                </p>
              } @else {
                <p class="text-[11px] text-amber-700 mt-0.5">
                  ⚠️ El receptor no tiene celular registrado. La notificación se enviará únicamente por correo corporativo.
                </p>
              }
            </div>
          </div>

          @if (recipientPhone) {
            <label class="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
              <input type="checkbox"
                     [checked]="notifyWhatsApp"
                     (change)="notifyWhatsAppChange.emit(!notifyWhatsApp)"
                     class="sr-only peer">
              <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          }
        </div>
      </div>
    </div>
  `
})
export class MovementDispatchViewComponent {
  @Input() evidenceUrl: string = '';
  @Input() fileName: string = '';
  @Input() uploadingEvidence: boolean = false;
  @Input() documentUrl: string = '';
  @Input() docFileName: string = '';
  @Input() uploadingDocument: boolean = false;
  @Input() notifyWhatsApp: boolean = true;
  @Input() recipientPhone: string | null = null;
  @Input() recipientName: string | null = null;

  @Output() fileChange = new EventEmitter<{ event: Event, target: 'evidence' | 'document' }>();
  @Output() removeFile = new EventEmitter<'evidence' | 'document'>();
  @Output() evidenceUrlChange = new EventEmitter<string>();
  @Output() documentUrlChange = new EventEmitter<string>();
  @Output() notifyWhatsAppChange = new EventEmitter<boolean>();
}
