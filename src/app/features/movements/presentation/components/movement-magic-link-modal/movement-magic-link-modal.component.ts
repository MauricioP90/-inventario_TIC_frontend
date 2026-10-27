import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-movement-magic-link-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (url()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
            <h3 class="text-base font-black text-indigo-900 flex items-center gap-2">
              <span>✨</span> Autenticación única
            </h3>
            <button (click)="close()" class="text-slate-400 hover:text-slate-600 transition-colors p-2 bg-white rounded-full shadow-sm hover:shadow cursor-pointer">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <!-- Tabs Selector -->
          <div class="px-6 pt-3 flex border-b border-slate-100 bg-slate-50/50">
            <button (click)="tab.set('link')" 
                    [class]="'flex-1 pb-3 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ' + 
                             (tab() === 'link' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-500')">
              <span>🔗</span> Enviar Enlace
            </button>
            <button (click)="tab.set('qr')" 
                    [class]="'flex-1 pb-3 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ' + 
                             (tab() === 'qr' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-500')">
              <span>📱</span> Código QR
            </button>
          </div>

          <!-- Body -->
          <div class="p-6">
            @if (tab() === 'link') {
              <div class="space-y-4 animate-in fade-in-50 duration-150">
                <p class="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Copia este enlace de un solo uso y envíalo al responsable en destino para que confirme la recepción sin contraseñas.
                </p>
                <div class="relative">
                  <textarea readonly 
                         [value]="url()"
                         class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs focus:outline-none resize-none h-16 shadow-inner font-mono select-all"></textarea>
                </div>
                <p class="text-[10px] text-indigo-600 font-semibold bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-100 flex items-start gap-2">
                  <svg class="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  El enlace se desactivará inmediatamente tras completar la firma.
                </p>
              </div>
            }

            @if (tab() === 'qr') {
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
            @if (tab() === 'link') {
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
            <button (click)="close()" 
                    class="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all text-xs cursor-pointer">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class MovementMagicLinkModalComponent {
  url = signal<string | null>(null);
  qrCodeDataUrl = signal<string | null>(null);
  tab = signal<'link' | 'qr'>('link');

  @Input() set magicLinkUrl(value: string | null) {
    this.url.set(value);
    this.tab.set('link');
    if (value) {
      if (navigator?.clipboard) {
        navigator.clipboard.writeText(value).catch(() => {});
      }
      QRCode.toDataURL(value, { margin: 2, scale: 6 })
        .then(dataUrl => this.qrCodeDataUrl.set(dataUrl))
        .catch(err => {
          console.error('Error al generar QR:', err);
          this.qrCodeDataUrl.set(null);
        });
    } else {
      this.qrCodeDataUrl.set(null);
    }
  }

  @Output() onClose = new EventEmitter<void>();

  close() {
    this.url.set(null);
    this.qrCodeDataUrl.set(null);
    this.onClose.emit();
  }

  copyToClipboard() {
    const link = this.url();
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
}
