import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment';
import { Movement } from '../../../domain/models/movement.model';
import { MovementRepository } from '../../../domain/repositories/movement.repository';

@Component({
  selector: 'app-movement-attach-doc-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen && movement) {
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
          <!-- Header -->
          <div class="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
            <div>
              <h3 class="font-bold text-slate-800 text-base flex items-center gap-2">
                <span>📎</span> Soportes y Documentos Oficiales
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">
                Traslado #{{ movement.id.slice(-8) }} &bull; {{ movement.originLocation?.nombre || 'Origen' }} &rarr; {{ movement.destinationLocation?.nombre || 'Destino' }}
              </p>
            </div>
            <button (click)="close()" class="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center cursor-pointer">
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
                      <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp" (change)="onFileSelected($event, 'document')" />
                    </label>
                    <button type="button" (click)="removeFile('document')" class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
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
                    <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp" (change)="onFileSelected($event, 'document')" />
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
                      <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp" (change)="onFileSelected($event, 'evidence')" />
                    </label>
                    <button type="button" (click)="removeFile('evidence')" class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
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
                    <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp" (change)="onFileSelected($event, 'evidence')" />
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
            <button type="button" (click)="close()" [disabled]="savingAttachDoc()"
                    class="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all cursor-pointer">
              Cancelar
            </button>
            <button type="button" (click)="confirmSave()" [disabled]="savingAttachDoc() || (!attachDocUrl() && !attachReceivedEvidenceUrl() && !attachDocNotes().trim())"
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
  `
})
export class MovementAttachDocModalComponent {
  private http = inject(HttpClient);
  private movementRepo = inject(MovementRepository);

  @Input() isOpen = false;
  private _movement: Movement | null = null;
  @Input() set movement(mov: Movement | null) {
    this._movement = mov;
    if (mov) {
      this.attachDocUrl.set(mov.documentUrl || '');
      this.attachDocFileName.set(mov.documentUrl ? mov.documentUrl.split('/').pop() || 'Comodato adjunto' : '');
      this.attachReceivedEvidenceUrl.set(mov.receivedEvidenceUrl || '');
      this.attachReceivedFileName.set(mov.receivedEvidenceUrl ? mov.receivedEvidenceUrl.split('/').pop() || 'Soporte de recepción' : '');
      this.attachDocNotes.set('');
      this.attachModalError.set(null);
    }
  }
  get movement(): Movement | null {
    return this._movement;
  }

  @Output() onClose = new EventEmitter<void>();
  @Output() onSaved = new EventEmitter<Movement>();
  @Output() onError = new EventEmitter<string>();

  attachDocUrl = signal('');
  attachDocFileName = signal('');
  attachReceivedEvidenceUrl = signal('');
  attachReceivedFileName = signal('');
  attachDocNotes = signal('');
  uploadingAttachDoc = signal(false);
  uploadingAttachEvidence = signal(false);
  savingAttachDoc = signal(false);
  attachModalError = signal<string | null>(null);

  close() {
    this.attachModalError.set(null);
    this.onClose.emit();
  }

  onFileSelected(event: Event, type: 'document' | 'evidence') {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      this.attachModalError.set('El archivo no puede superar los 5MB.');
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
          this.attachModalError.set('Error al subir el archivo soporte.');
        }
      });
    };
    reader.readAsDataURL(file);
  }

  removeFile(type: 'document' | 'evidence') {
    if (type === 'document') {
      this.attachDocUrl.set('');
      this.attachDocFileName.set('');
    } else {
      this.attachReceivedEvidenceUrl.set('');
      this.attachReceivedFileName.set('');
    }
  }

  confirmSave() {
    const mov = this.movement;
    if (!mov) return;
    this.attachModalError.set(null);
    this.savingAttachDoc.set(true);
    this.movementRepo.attachDocuments(mov.id, {
      documentUrl: this.attachDocUrl() || undefined,
      receivedEvidenceUrl: this.attachReceivedEvidenceUrl() || undefined,
      notes: this.attachDocNotes().trim() || undefined
    }).subscribe({
      next: (updatedMov) => {
        this.savingAttachDoc.set(false);
        this.onSaved.emit(updatedMov);
        this.close();
      },
      error: (err) => {
        this.savingAttachDoc.set(false);
        const msg = err.error?.message || err.message || 'Error al guardar los documentos de soporte.';
        this.attachModalError.set(msg);
      }
    });
  }
}
