import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Responsable } from '../../../../../responsables/domain/models/responsable.model';
import { Activo } from '../../../../../inventory/domain/models/activo.model';

@Component({
  selector: 'app-movement-recipients-section',
  standalone: true,
  imports: [CommonModule],
  template: `
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
                   [class.border-indigo-300]="selectedEmails.includes(resp.email)"
                   [class.bg-indigo-50/40]="selectedEmails.includes(resp.email)"
                   [class.border-slate-200]="!selectedEmails.includes(resp.email)">
              <input type="checkbox" 
                     [checked]="selectedEmails.includes(resp.email)"
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

      @if (selectedEmails.length > 0) {
        <div class="text-[11px] text-slate-500 font-medium pt-1">
          ℹ️ Se notificará formalmente a <strong class="text-slate-800 font-bold">{{ selectedEmails.length }}</strong> destinatario(s) al confirmar el despacho con los soportes adjuntos.
        </div>
      }
    </div>
  `
})
export class MovementRecipientsSectionComponent {
  @Input() responsables: Responsable[] = [];
  @Input() originLocationId: string = '';
  @Input() destinationLocationId: string = '';
  @Input() selectedActivo: Activo | null = null;
  @Input() receiverResponsibleId: string = '';
  @Input() selectedEmails: string[] = [];

  @Output() selectedEmailsChange = new EventEmitter<string[]>();

  showAllRecipients = signal<boolean>(false);

  relevantResponsibles = computed<Responsable[]>(() => {
    const all = this.responsables.filter(r => r.estado === 'ACTIVO' && !!r.email);
    if (this.showAllRecipients()) {
      return all;
    }

    const originLocId = this.originLocationId;
    const destLocId = this.destinationLocationId;
    const currentRespId = this.selectedActivo?.responsibleId || (this.selectedActivo as any)?.responsible?.id;
    const receiverRespId = this.receiverResponsibleId;

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

  toggleShowAllRecipients() {
    this.showAllRecipients.set(!this.showAllRecipients());
  }

  toggleEmail(email: string) {
    const current = [...this.selectedEmails];
    if (current.includes(email)) {
      this.selectedEmailsChange.emit(current.filter(e => e !== email));
    } else {
      this.selectedEmailsChange.emit([...current, email]);
    }
  }

  selectAllRelevantEmails() {
    const emails = this.relevantResponsibles()
      .map(r => r.email)
      .filter((email): email is string => !!email);
    this.selectedEmailsChange.emit(emails);
  }

  clearAllEmails() {
    this.selectedEmailsChange.emit([]);
  }

  isReceiver(email: string): boolean {
    if (!this.receiverResponsibleId) return false;
    const resp = this.responsables.find(r => r.id === this.receiverResponsibleId);
    return resp?.email === email;
  }

  isCurrentCustodian(email: string): boolean {
    const activo = this.selectedActivo;
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
}
