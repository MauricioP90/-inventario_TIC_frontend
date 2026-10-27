import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileUploadService } from '../../../../../core/services/file-upload.service';
import { Movement } from '../../../domain/models/movement.model';
import { Location } from '../../../../locations/domain/models/location.model';
import { Responsable } from '../../../../responsables/domain/models/responsable.model';
import { MovementRouteViewComponent } from './components/movement-route-view.component';
import { MovementSummaryCardComponent } from './components/movement-summary-card.component';
import { MovementDispatchViewComponent } from './components/movement-dispatch-view.component';
import { MovementReceiveViewComponent } from './components/movement-receive-view.component';

@Component({
  selector: 'app-movement-action-modal',
  standalone: true,
  imports: [
    CommonModule,
    MovementRouteViewComponent,
    MovementSummaryCardComponent,
    MovementDispatchViewComponent,
    MovementReceiveViewComponent
  ],
  template: `
    @if (movement && actionType) {
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
          <!-- Header -->
          <div class="p-5 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
            <h3 class="font-bold text-slate-800 text-lg flex items-center gap-3">
              @if (actionType === 'dispatch') { 🚛 Despachar Traslado }
              @if (actionType === 'receive') { ✅ Recibir Traslado }
              @if (actionType === 'route') { 📍 Ruta del Dispositivo }
            </h3>
            <button (click)="close()" class="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center cursor-pointer">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          
          <!-- Content Body -->
          <div class="p-6 space-y-5 flex-1 overflow-y-auto">
            @if (actionType === 'route') {
              <app-movement-route-view [movement]="movement" />
            } @else {
              <div class="space-y-5">
                <!-- Movement Details Summary Card -->
                <app-movement-summary-card [movement]="movement" />

                <!-- Dispatch View -->
                @if (actionType === 'dispatch') {
                  <app-movement-dispatch-view
                    [evidenceUrl]="modalEvidenceUrl"
                    (evidenceUrlChange)="modalEvidenceUrl = $event"
                    [fileName]="modalFileName"
                    [uploadingEvidence]="uploadingEvidence()"
                    [documentUrl]="modalDocumentUrl"
                    (documentUrlChange)="modalDocumentUrl = $event"
                    [docFileName]="modalDocFileName"
                    [uploadingDocument]="uploadingDocument()"
                    [notifyWhatsApp]="notifyWhatsApp()"
                    (notifyWhatsAppChange)="notifyWhatsApp.set($event)"
                    [recipientPhone]="recipientPhone()"
                    [recipientName]="recipientName()"
                    (fileChange)="onFileChange($event.event, $event.target)"
                    (removeFile)="removeFile($event)"
                  />
                }

                <!-- Receive View -->
                @if (actionType === 'receive') {
                  <app-movement-receive-view
                    [movement]="movement"
                    [responsables]="responsables"
                    [locations]="locations"
                    [receiverId]="modalReceiverId"
                    (receiverIdChange)="modalReceiverId = $event"
                    [destinationId]="modalDestinationId"
                    (destinationIdChange)="modalDestinationId = $event"
                    [evidenceUrl]="modalEvidenceUrl"
                    (evidenceUrlChange)="modalEvidenceUrl = $event"
                    [fileName]="modalFileName"
                    [uploadingEvidence]="uploadingEvidence()"
                    [showRejectionForm]="showRejectionForm()"
                    (toggleRejectionForm)="showRejectionForm.set($event)"
                    [rejectionReason]="rejectionReason()"
                    (rejectionReasonChange)="rejectionReason.set($event)"
                    (fileChange)="onFileChange($event, 'evidence')"
                    (removeFile)="removeFile('evidence')"
                    (submitReject)="submitReject()"
                  />
                }
                
                <!-- Main Action Submit Button -->
                <button (click)="submitAction()"
                        class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 transition-all mt-4 flex items-center justify-center gap-2 cursor-pointer">
                  {{ actionType === 'dispatch' ? 'Confirmar Despacho y Notificar' : 'Confirmar Recepción' }}
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `
})
export class MovementActionModalComponent {
  private fileUploadService = inject(FileUploadService);

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

    this.fileUploadService.upload(file, 'evidencias').subscribe({
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
}
