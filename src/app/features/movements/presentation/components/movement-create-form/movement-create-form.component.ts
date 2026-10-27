import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Location } from '../../../../locations/domain/models/location.model';
import { Responsable } from '../../../../responsables/domain/models/responsable.model';
import { Activo } from '../../../../inventory/domain/models/activo.model';
import { SimCard } from '../../../../sim-cards/domain/models/sim-card.model';
import { Movement } from '../../../domain/models/movement.model';
import { RegisterMovementUseCase } from '../../../application/use-cases/register-movement.use-case';
import { MovementActivoSectionComponent } from './components/movement-activo-section.component';
import { MovementSimSectionComponent } from './components/movement-sim-section.component';
import { MovementDocumentUploadComponent } from './components/movement-document-upload.component';
import { MovementRecipientsSectionComponent } from './components/movement-recipients-section.component';

@Component({
  selector: 'app-movement-create-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MovementActivoSectionComponent,
    MovementSimSectionComponent,
    MovementDocumentUploadComponent,
    MovementRecipientsSectionComponent
  ],
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
          <app-movement-activo-section
            [locations]="locations"
            [responsables]="responsables"
            [activos]="activos"
            [movements]="movements"
            [movementType]="movementType()"
            [selectedActivos]="selectedActivos()"
            [originId]="originId()"
            [destinationId]="destinationId()"
            [destinationAreaId]="destinationAreaId()"
            [responsibleId]="responsibleId()"
            (movementTypeChange)="onMovementTypeChange($event)"
            (selectedActivosChange)="onSelectedActivosChange($event)"
            (originIdChange)="originId.set($event)"
            (destinationIdChange)="destinationId.set($event)"
            (destinationAreaIdChange)="destinationAreaId.set($event)"
            (responsibleIdChange)="responsibleId.set($event)"
            (recipientAdded)="addRecipientEmail($event)" />
        } @else {
          <app-movement-sim-section
            [locations]="locations"
            [responsables]="responsables"
            [activos]="activos"
            [simCards]="simCards"
            [movements]="movements"
            [movementType]="movementType()"
            [originId]="originId()"
            [destinationId]="destinationId()"
            [destinationAreaId]="destinationAreaId()"
            [responsibleId]="responsibleId()"
            [selectedActivo]="selectedActivo()"
            [selectedSimForTransfer]="selectedSimForTransfer()"
            [selectedSimForAssign]="selectedSimForAssign()"
            [selectedSimToReplace]="selectedSimToReplace()"
            [selectedSimToRemove]="selectedSimToRemove()"
            [removedSimNewState]="removedSimNewState()"
            [simStates]="simStates()"
            (movementTypeChange)="onMovementTypeChange($event)"
            (originIdChange)="originId.set($event)"
            (destinationIdChange)="destinationId.set($event)"
            (destinationAreaIdChange)="destinationAreaId.set($event)"
            (responsibleIdChange)="responsibleId.set($event)"
            (selectedActivoChange)="onSimActivoChange($event)"
            (selectedSimForTransferChange)="selectedSimForTransfer.set($event)"
            (selectedSimForAssignChange)="selectedSimForAssign.set($event)"
            (selectedSimToReplaceChange)="selectedSimToReplace.set($event)"
            (selectedSimToRemoveChange)="selectedSimToRemove.set($event)"
            (removedSimNewStateChange)="removedSimNewState.set($event)"
            (simStatesChange)="simStates.set($event)"
            (recipientAdded)="addRecipientEmail($event)"
            (requestSimTransfer)="onRequestSimTransfer($event)" />
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
          
          <app-movement-document-upload
            [documentUrl]="documentUrl()"
            [documentFileName]="documentFileName()"
            [isTheftOrLoss]="movementType() === 'HURTO_PERDIDA'"
            (documentUrlChange)="documentUrl.set($event)"
            (documentFileNameChange)="documentFileName.set($event)"
            (uploadError)="showError.set($event)" />
        </div>

        <!-- Notificación de Despacho (Destinatarios de correo) -->
        @if (operationMode() === 'ACTIVO' && movementType() && movementType() !== 'BAJA_ACTIVO') {
          <app-movement-recipients-section
            [responsables]="responsables"
            [originLocationId]="originId()"
            [destinationLocationId]="destinationId()"
            [selectedActivo]="selectedActivo()"
            [receiverResponsibleId]="responsibleId()"
            [selectedEmails]="selectedEmails()"
            (selectedEmailsChange)="selectedEmails.set($event)" />
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

  @Input() locations: Location[] = [];
  @Input() responsables: Responsable[] = [];
  @Input() activos: Activo[] = [];
  @Input() simCards: SimCard[] = [];
  @Input() movements: Movement[] = [];

  @Output() onMovementCreated = new EventEmitter<void>();

  loading = signal(false);
  showSuccess = signal(false);
  showError = signal<string | null>(null);

  operationMode = signal<'ACTIVO' | 'SIM'>('ACTIVO');
  movementType = signal<string>('');
  originId = signal<string>('');
  destinationId = signal<string>('');
  destinationAreaId = signal<string>('');
  responsibleId = signal<string>('');

  selectedActivo = signal<Activo | null>(null);
  selectedActivos = signal<Activo[]>([]);

  notes = '';
  documentUrl = signal<string | null>(null);
  documentFileName = signal<string>('');
  selectedEmails = signal<string[]>([]);

  // SIM specific state
  selectedSimForTransfer = signal<SimCard | null>(null);
  selectedSimForAssign = signal<SimCard | null>(null);
  selectedSimToReplace = signal<SimCard | null>(null);
  selectedSimToRemove = signal<SimCard | null>(null);
  removedSimNewState = signal<'BODEGA' | 'BAJA'>('BODEGA');
  simStates = signal<('BODEGA' | 'BAJA')[]>(['BODEGA', 'BODEGA']);

  setOperationMode(mode: 'ACTIVO' | 'SIM') {
    this.operationMode.set(mode);
    this.showError.set(null);
    this.originId.set('');
    this.destinationId.set('');
    this.destinationAreaId.set('');
    this.responsibleId.set('');
    this.selectedActivo.set(null);
    this.selectedActivos.set([]);
    this.selectedSimForTransfer.set(null);
    this.selectedSimForAssign.set(null);
    this.selectedSimToReplace.set(null);
    this.selectedSimToRemove.set(null);

    if (mode === 'SIM') {
      this.movementType.set('SIM_TRASLADO');
    } else {
      this.movementType.set('');
    }
  }

  onMovementTypeChange(newType: string) {
    this.movementType.set(newType);
    this.showError.set(null);
  }

  onSelectedActivosChange(list: Activo[]) {
    this.selectedActivos.set(list);
    this.selectedActivo.set(list.length > 0 ? list[0] : null);
  }

  onSimActivoChange(activo: Activo | null) {
    this.selectedActivo.set(activo);
    if (activo) {
      this.selectedActivos.set([activo]);
    } else {
      this.selectedActivos.set([]);
    }
  }

  onRequestSimTransfer(targetLoc: Location) {
    this.setOperationMode('SIM');
    this.movementType.set('SIM_TRASLADO');
    this.destinationId.set(targetLoc.id);
  }

  addRecipientEmail(email: string) {
    if (!email) return;
    const current = this.selectedEmails();
    if (!current.includes(email)) {
      this.selectedEmails.set([...current, email]);
    }
  }

  canSubmit(): boolean {
    if (this.loading()) return false;
    const mType = this.movementType();

    if (this.operationMode() === 'ACTIVO') {
      if (!mType) return false;
      if (this.selectedActivos().length === 0) return false;
      if (!this.originId()) return false;
      if (!this.responsibleId()) return false;
      if (mType === 'HURTO_PERDIDA') {
        return !!this.documentUrl();
      }
      if (mType === 'TRASLADO_AREA') {
        return !!this.destinationAreaId();
      }
      return !!this.destinationId();
    }

    if (mType === 'SIM_TRASLADO') {
      return !!(
        this.selectedSimForTransfer() &&
        this.originId() &&
        this.destinationId() &&
        this.responsibleId()
      );
    }

    if (!this.selectedActivo() || !this.responsibleId()) return false;

    if (mType === 'SIM_ASIGNACION') {
      const simCount = this.selectedActivo()?.simCards?.length || 0;
      return simCount < 2 && !!this.selectedSimForAssign();
    }

    if (mType === 'SIM_CAMBIO') {
      return !!(this.selectedSimToReplace() && this.selectedSimForAssign());
    }

    if (mType === 'SIM_RETIRO') {
      return !!this.selectedSimToRemove();
    }

    if (mType === 'SIM_RETIRO_TOTAL') {
      return (this.selectedActivo()?.simCards?.length || 0) > 0;
    }

    return false;
  }

  saveMovement() {
    this.showError.set(null);
    const mType = this.movementType();
    const isLocalSIM = ['SIM_ASIGNACION', 'SIM_CAMBIO', 'SIM_RETIRO', 'SIM_RETIRO_TOTAL'].includes(mType);
    if (isLocalSIM && this.selectedActivo()) {
      this.destinationId.set(this.originId());
    }

    const isAreaTransfer = mType === 'TRASLADO_AREA';
    const isTheftOrLoss = mType === 'HURTO_PERDIDA';
    if ((isAreaTransfer || isTheftOrLoss) && this.selectedActivo()) {
      this.destinationId.set(this.originId());
      if (isTheftOrLoss && !this.responsibleId()) {
        this.responsibleId.set(this.selectedActivo()?.responsibleId || (this.selectedActivo() as any)?.responsible?.id || '');
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

    const needsActivo = mType !== 'SIM_TRASLADO';
    const hasEquipment = this.operationMode() === 'ACTIVO' ? this.selectedActivos().length > 0 : !!this.selectedActivo();
    if (!mType || !this.originId() || !this.destinationId() || !this.responsibleId() || (needsActivo && !hasEquipment) || (!needsActivo && !this.selectedSimForTransfer())) {
      alert('Completa los campos obligatorios');
      return;
    }

    const maxAllowed = mType === 'HURTO_PERDIDA' ? 1 : 10;
    if (this.operationMode() === 'ACTIVO' && this.selectedActivos().length > maxAllowed) {
      alert(`⚠️ No se puede registrar el movimiento: Se superó el límite de ${maxAllowed} activo(s) para este tipo de formato.`);
      return;
    }

    this.loading.set(true);

    const simCardIds: string[] = [];
    if (mType === 'SIM_TRASLADO' && this.selectedSimForTransfer()) {
      simCardIds.push(this.selectedSimForTransfer()!.id);
    } else if (mType === 'SIM_ASIGNACION' && this.selectedSimForAssign()) {
      simCardIds.push(this.selectedSimForAssign()!.id);
    } else if (mType === 'SIM_CAMBIO' && this.selectedSimForAssign()) {
      simCardIds.push(this.selectedSimForAssign()!.id);
    } else if (mType === 'SIM_RETIRO' && this.selectedSimToRemove()) {
      simCardIds.push(this.selectedSimToRemove()!.id);
    }

    const activoIds = mType === 'SIM_TRASLADO' 
      ? [] 
      : this.operationMode() === 'ACTIVO' 
        ? this.selectedActivos().map(a => a.id) 
        : [this.selectedActivo()!.id];

    const dto: any = {
      type: mType,
      originLocationId: this.originId(),
      destinationLocationId: this.destinationId(),
      responsibleId: this.responsibleId(),
      activoIds,
      simCardIds,
      notes: this.notes,
      documentUrl: this.documentUrl() || undefined,
      recipients: this.selectedEmails(),
      simCardIdToAssign: this.selectedSimForAssign()?.id,
      simCardIdToReplace: this.selectedSimToReplace()?.id,
      simCardIdToRemove: this.selectedSimToRemove()?.id,
      removedSimNewState: this.removedSimNewState(),
      simStates: this.simStates()
    };

    if (mType === 'TRASLADO_AREA' && this.destinationAreaId()) {
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
    this.selectedActivo.set(null);
    this.selectedActivos.set([]);
    this.originId.set('');
    this.destinationId.set('');
    this.destinationAreaId.set('');
    this.responsibleId.set('');
    this.notes = '';
    this.documentUrl.set(null);
    this.documentFileName.set('');
    this.selectedSimForAssign.set(null);
    this.selectedSimToReplace.set(null);
    this.selectedSimToRemove.set(null);
    this.simStates.set(['BODEGA', 'BODEGA']);
    this.removedSimNewState.set('BODEGA');
    this.selectedSimForTransfer.set(null);
    this.setOperationMode('ACTIVO');
    setTimeout(() => this.showSuccess.set(false), 8000);
  }
}
