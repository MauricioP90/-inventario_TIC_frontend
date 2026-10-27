import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Location } from '../../../../locations/domain/models/location.model';
import { Responsable } from '../../../../responsables/domain/models/responsable.model';
import { GetAllLocationsUseCase } from '../../../../locations/application/use-cases/get-all-locations.use-case';
import { GetAllResponsablesUseCase } from '../../../../responsables/application/use-cases/get-all-responsables.use-case';
import { GetAllMovementsUseCase } from '../../../application/use-cases/get-all-movements.use-case';
import { DispatchMovementUseCase } from '../../../application/use-cases/dispatch-movement.use-case';
import { ReceiveMovementUseCase } from '../../../application/use-cases/receive-movement.use-case';
import { RejectMovementUseCase } from '../../../application/use-cases/reject-movement.use-case';
import { CancelMovementUseCase } from '../../../application/use-cases/cancel-movement.use-case';
import { Movement, MOVEMENT_TYPE_LABELS } from '../../../domain/models/movement.model';
import { MovementItemComponent } from '../../components/movement-item/movement-item.component';
import { MovementDocumentModalComponent } from '../../components/movement-document-modal/movement-document-modal.component';
import { MovementCancelModalComponent } from '../../components/movement-cancel-modal/movement-cancel-modal.component';
import { MovementMagicLinkModalComponent } from '../../components/movement-magic-link-modal/movement-magic-link-modal.component';
import { MovementAttachDocModalComponent } from '../../components/movement-attach-doc-modal/movement-attach-doc-modal.component';
import { MovementActionModalComponent } from '../../components/movement-action-modal/movement-action-modal.component';
import { MovementCreateFormComponent } from '../../components/movement-create-form/movement-create-form.component';
import { GetAllActivosUseCase } from '../../../../inventory/application/use-cases/get-all-activos.use-case';
import { Activo } from '../../../../inventory/domain/models/activo.model';
import { GetAllSimCardsUseCase } from '../../../../sim-cards/application/use-cases/get-all-sim-cards.use-case';
import { SimCard } from '../../../../sim-cards/domain/models/sim-card.model';
import { RoleService } from '../../../../../core/auth/services/role.service';

@Component({
  selector: 'app-movements-page',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MovementItemComponent, 
    MovementDocumentModalComponent,
    MovementCancelModalComponent,
    MovementMagicLinkModalComponent,
    MovementAttachDocModalComponent,
    MovementActionModalComponent,
    MovementCreateFormComponent
  ],
  template: `
    <div class="p-4 md:p-6 space-y-8 max-w-5xl mx-auto">
      
      <!-- FORM: Registrar Movimiento (Modularizado) -->
      @if (roleService.canRegisterMovement()) {
        <app-movement-create-form
          [locations]="locations()"
          [responsables]="responsables()"
          [activos]="activos()"
          [simCards]="simCards()"
          [movements]="movements()"
          (onMovementCreated)="handleMovementCreated()" />
      }

      <!-- LISTADO: Gestión de Envíos (Tabs + Búsqueda) -->
      <div class="space-y-6">
        
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 class="text-xl font-bold text-slate-800">Gestión de Envíos</h2>
          
          <!-- Buscador -->
          <div class="relative w-full md:w-72">
            <input type="text"
                   [ngModel]="searchMovementQuery()"
                   (input)="searchMovementQuery.set($any($event.target).value)"
                   placeholder="Buscar placa, sede, responsable..."
                   class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm">
            <svg class="w-5 h-5 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            @if (searchMovementQuery()) {
              <button (click)="searchMovementQuery.set('')" class="absolute right-3 top-2.5 text-slate-300 hover:text-slate-500 transition-colors cursor-pointer">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            }
          </div>
        </div>

        <!-- Pestañas (Tabs) -->
        <div class="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
          <button (click)="activeTab.set('PENDING')"
                  [class.bg-white]="activeTab() === 'PENDING'"
                  [class.shadow-sm]="activeTab() === 'PENDING'"
                  [class.text-indigo-700]="activeTab() === 'PENDING'"
                  [class.text-slate-500]="activeTab() !== 'PENDING'"
                  [class.hover:text-slate-700]="activeTab() !== 'PENDING'"
                  class="px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 cursor-pointer">
            <span class="w-2 h-2 rounded-full bg-amber-400"></span>
            En Curso
          </button>
          <button (click)="activeTab.set('HISTORY')"
                  [class.bg-white]="activeTab() === 'HISTORY'"
                  [class.shadow-sm]="activeTab() === 'HISTORY'"
                  [class.text-indigo-700]="activeTab() === 'HISTORY'"
                  [class.text-slate-500]="activeTab() !== 'HISTORY'"
                  [class.hover:text-slate-700]="activeTab() !== 'HISTORY'"
                  class="px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 cursor-pointer">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            Histórico
          </button>
        </div>

        <!-- Notificación de Anulación Exitosa -->
        @if (cancelToastMessage()) {
          <div class="mb-4 bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 shadow-xs">
            <div class="flex items-center gap-2.5">
              <span class="text-rose-600 text-base">🚫</span>
              <p class="text-xs font-bold text-rose-900">{{ cancelToastMessage() }}</p>
            </div>
            <button (click)="cancelToastMessage.set(null)" class="text-rose-700 text-xs font-bold hover:underline cursor-pointer">✕</button>
          </div>
        }

        <!-- Notificación de Soportes Guardados Exitosamente -->
        @if (attachSuccessMessage()) {
          <div class="mb-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 shadow-xs">
            <div class="flex items-center gap-2.5">
              <span class="text-emerald-600 text-base">📎</span>
              <p class="text-xs font-bold text-emerald-900">{{ attachSuccessMessage() }}</p>
            </div>
            <button (click)="attachSuccessMessage.set(null)" class="text-emerald-700 text-xs font-bold hover:underline cursor-pointer">✕</button>
          </div>
        }

        <!-- Resultados (Cards) -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (mov of filteredMovements(); track mov.id) {
            <app-movement-item  
              [movement]="mov"
              (onDispatch)="openDispatchModal(mov)"
              (onReceive)="openReceiveModal(mov)"
              (onViewRoute)="openRouteModal(mov)"
              (onCopyMagicLink)="copyMagicLink(mov)"
              (onGenerateDocument)="openDocumentModal(mov, documentModal)"
              (onCancel)="openCancelModal(mov)"
              (onAttachDocument)="openAttachDocumentModal(mov)">
            </app-movement-item>
          }
        </div>

        <!-- Empty States -->
        @if (filteredMovements().length === 0 && !loading()) {
          <div class="py-20 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
            @if (searchMovementQuery()) {
              <p class="text-slate-500 font-medium text-sm">No se encontraron resultados para "{{ searchMovementQuery() }}" en esta pestaña.</p>
            } @else if (activeTab() === 'PENDING') {
              <p class="text-slate-500 font-medium text-sm">✨ ¡Todo al día! No hay traslados en curso.</p>
            } @else {
              <p class="text-slate-500 font-medium text-sm">No hay registro histórico de movimientos.</p>
            }
          </div>
        }
      </div>  

      <!-- Modal Operativo: Despacho / Recepción / Ruta (Modularizado) -->
      <app-movement-action-modal
        [movement]="selectedMovementForAction"
        [actionType]="actionType"
        [locations]="locations()"
        [responsables]="responsables()"
        (onClose)="closeModal()"
        (onConfirmDispatch)="handleConfirmDispatch($event)"
        (onConfirmReceive)="handleConfirmReceive($event)"
        (onConfirmReject)="handleConfirmReject($event)" />
    </div>

    <!-- Magic Link Modal (Modularizado) -->
    <app-movement-magic-link-modal
      [magicLinkUrl]="magicLinkUrl()"
      (onClose)="closeMagicLinkModal()" />

    <!-- Modal de Anulación de Movimiento (Modularizado) -->
    <app-movement-cancel-modal
      [movement]="cancelMovementTarget()"
      [isCancelling]="isCancelling()"
      (onClose)="closeCancelModal()"
      (onConfirm)="confirmCancelMovementWithReason($event)" />

    <!-- Modal de Documentos Oficiales (Actas / Comodatos) -->
    <app-movement-document-modal 
      #documentModal 
      (onMovementUpdated)="handleMovementUpdated($event)" />

    <!-- Modal para Adjuntar / Actualizar Soportes Firmados (Modularizado) -->
    <app-movement-attach-doc-modal
      [isOpen]="showAttachDocModal()"
      [movement]="selectedMovementForDoc()"
      (onClose)="closeAttachDocModal()"
      (onSaved)="handleDocumentsAttached($event)" />
  `,
  styles: []
})
export class MovementsPageComponent implements OnInit {
  public roleService = inject(RoleService);
  private getAllLocations = inject(GetAllLocationsUseCase);
  private getAllResponsables = inject(GetAllResponsablesUseCase);
  private getAllMovements = inject(GetAllMovementsUseCase);
  private getAllActivos = inject(GetAllActivosUseCase);
  private getAllSimCards = inject(GetAllSimCardsUseCase);
  private dispatchMovement = inject(DispatchMovementUseCase);
  private receiveMovement = inject(ReceiveMovementUseCase);
  private rejectMovementUC = inject(RejectMovementUseCase);
  private cancelMovementUC = inject(CancelMovementUseCase);
  private route = inject(ActivatedRoute);

  locations = signal<Location[]>([]);
  responsables = signal<Responsable[]>([]);
  movements = signal<Movement[]>([]);
  activos = signal<Activo[]>([]);
  simCards = signal<SimCard[]>([]);
  loading = signal(false);

  // Señales para Tabs y Búsqueda de Movimientos
  activeTab = signal<'PENDING' | 'HISTORY'>('PENDING');
  searchMovementQuery = signal('');

  // Modal State
  selectedMovementForAction: Movement | null = null;
  actionType: 'dispatch' | 'receive' | 'route' | null = null;
  magicLinkUrl = signal<string | null>(null);

  // Cancel Movement Modal State (Auditoría)
  cancelMovementTarget = signal<Movement | null>(null);
  cancelReason = signal<string>('');
  isCancelling = signal<boolean>(false);
  cancelToastMessage = signal<string | null>(null);

  showAttachDocModal = signal(false);
  selectedMovementForDoc = signal<Movement | null>(null);
  attachSuccessMessage = signal<string | null>(null);

  // Filtro principal para los Movimientos (Tabs + Búsqueda)
  filteredMovements = computed(() => {
    const tab = this.activeTab();
    const query = this.searchMovementQuery().toLowerCase().trim();
    const allMovs = this.movements();

    let filtered = allMovs.filter(m => {
      if (tab === 'PENDING') {
        return m.status === 'PENDING' || m.status === 'EN_TRANSIT';
      } else {
        return m.status === 'RECEIVED' || m.status === 'CANCELLED';
      }
    });

    if (query) {
      filtered = filtered.filter(m => {
        const idMatch = m.id.toLowerCase().includes(query);
        const typeMatch = (MOVEMENT_TYPE_LABELS[m.type] || m.type).toLowerCase().includes(query);
        const originMatch = m.originLocation?.nombre?.toLowerCase().includes(query);
        const destMatch = m.destinationLocation?.nombre?.toLowerCase().includes(query);
        const respMatch = m.responsible?.nombre?.toLowerCase().includes(query);
        const receiverMatch = m.receiver?.nombre?.toLowerCase().includes(query) || m.physicalReceiverName?.toLowerCase().includes(query);
        const activeMatch = m.activos?.some((a: any) =>
          a.placa?.toLowerCase().includes(query) ||
          (a.serial && a.serial.toLowerCase().includes(query))
        );

        return idMatch || typeMatch || originMatch || destMatch || respMatch || receiverMatch || activeMatch;
      });
    }

    return filtered;
  });

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        const tab = (params['tab'] as string).toUpperCase();
        if (tab === 'PENDING' || tab === 'HISTORY') {
          this.activeTab.set(tab as 'PENDING' | 'HISTORY');
        }
      }
      if (params['search']) {
        this.searchMovementQuery.set(params['search']);
      }
    });
    this.fetchData();
  }

  fetchData() {
    this.loading.set(true);
    this.getAllLocations.execute().subscribe(locs => this.locations.set(locs));
    this.getAllResponsables.execute().subscribe(resps => this.responsables.set(resps));
    this.getAllActivos.execute().subscribe(acts => this.activos.set(acts));
    this.getAllSimCards.execute().subscribe(sims => this.simCards.set(sims));
    this.loadMovements();
  }

  loadMovements() {
    this.getAllMovements.execute().subscribe({
      next: (movs) => {
        this.movements.set(movs);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar movimientos:', err);
        this.loading.set(false);
      }
    });
  }

  handleMovementCreated() {
    this.fetchData();
  }

  getMovementTypeLabel(type: string): string {
    return MOVEMENT_TYPE_LABELS[type] || type;
  }

  getSimCardsNumbers(simCards: any[]): string {
    if (!simCards || simCards.length === 0) return '';
    return simCards.map((s: any) => s.numero).join(' - ');
  }

  openDocumentModal(mov: Movement, modal: MovementDocumentModalComponent) {
    const dest = this.locations().find(l => l.id === mov.destinationLocationId) || mov.destinationLocation;
    modal.open(mov, dest);
  }

  handleMovementUpdated(updated: Movement) {
    this.movements.update(list => list.map(m => m.id === updated.id ? { ...m, notes: updated.notes } : m));
  }

  // Modal Operativo (Despacho / Recepción / Ruta)
  openDispatchModal(movement: Movement) {
    this.selectedMovementForAction = movement;
    this.actionType = 'dispatch';
  }

  openReceiveModal(movement: Movement) {
    this.selectedMovementForAction = movement;
    this.actionType = 'receive';
  }

  openRouteModal(movement: Movement) {
    this.selectedMovementForAction = movement;
    this.actionType = 'route';
  }

  closeModal() {
    this.selectedMovementForAction = null;
    this.actionType = null;
  }

  handleConfirmDispatch(event: { evidenceUrl?: string; documentUrl?: string; notifyWhatsApp: boolean }) {
    if (!this.selectedMovementForAction) return;
    const id = this.selectedMovementForAction.id;

    this.dispatchMovement.execute(
      id, 
      event.evidenceUrl, 
      event.documentUrl, 
      undefined,
      event.notifyWhatsApp
    ).subscribe({
      next: () => { this.loadMovements(); this.closeModal(); },
      error: (err) => alert(err.error?.message || err.message || 'Error al procesar el despacho')
    });
  }

  handleConfirmReceive(event: { receiverId: string; destinationId: string; evidenceUrl: string }) {
    if (!this.selectedMovementForAction) return;
    const id = this.selectedMovementForAction.id;
    this.receiveMovement.execute(id, event.receiverId, event.evidenceUrl, event.destinationId).subscribe({
      next: () => { this.loadMovements(); this.closeModal(); },
      error: (err) => alert(err.error?.message || err.message || 'Error al procesar la recepción')
    });
  }

  handleConfirmReject(event: { reason: string }) {
    if (!this.selectedMovementForAction) return;
    this.rejectMovementUC.execute(this.selectedMovementForAction.id, event.reason).subscribe({
      next: () => {
        this.fetchData();
        this.closeModal();
      },
      error: (err) => alert(err.error?.message || err.message || 'Error al rechazar el traslado')
    });
  }

  // Cancel Movement Modal Logic (Auditoría e Integridad)
  openCancelModal(movement: Movement) {
    this.cancelMovementTarget.set(movement);
    this.cancelReason.set('');
  }

  closeCancelModal() {
    this.cancelMovementTarget.set(null);
    this.cancelReason.set('');
    this.isCancelling.set(false);
  }

  confirmCancelMovementWithReason(reason: string) {
    this.cancelReason.set(reason);
    this.confirmCancelMovement();
  }

  confirmCancelMovement() {
    const target = this.cancelMovementTarget();
    if (!target) return;
    const reason = this.cancelReason().trim();
    if (!reason) {
      alert('Por favor, ingresa el motivo de la anulación.');
      return;
    }

    this.isCancelling.set(true);
    this.cancelMovementUC.execute(target.id, reason).subscribe({
      next: () => {
        this.isCancelling.set(false);
        this.closeCancelModal();
        this.cancelToastMessage.set(`El traslado #${target.id.slice(-6).toUpperCase()} ha sido ANULADO correctamente y los equipos han sido liberados.`);
        setTimeout(() => this.cancelToastMessage.set(null), 6000);
        this.loadMovements();
      },
      error: (err) => {
        this.isCancelling.set(false);
        alert(err.error?.message || err.message || 'Error al anular el traslado');
      }
    });
  }

  copyMagicLink(movement: any) {
    if (!movement.magicLinkToken) {
      alert('Este movimiento no tiene un enlace de autenticación única.');
      return;
    }
    const link = `${window.location.origin}/public/receive/${movement.magicLinkToken}`;
    this.magicLinkUrl.set(link);
  }

  closeMagicLinkModal() {
    this.magicLinkUrl.set(null);
  }

  openAttachDocumentModal(mov: Movement) {
    this.selectedMovementForDoc.set(mov);
    this.showAttachDocModal.set(true);
  }

  closeAttachDocModal() {
    this.showAttachDocModal.set(false);
    this.selectedMovementForDoc.set(null);
  }

  handleDocumentsAttached(updatedMov: Movement) {
    this.movements.update(list => list.map(m => m.id === updatedMov.id ? {
      ...m,
      documentUrl: updatedMov.documentUrl ?? m.documentUrl,
      receivedEvidenceUrl: updatedMov.receivedEvidenceUrl ?? m.receivedEvidenceUrl,
      notes: updatedMov.notes ?? m.notes
    } : m));
    this.loadMovements();
    this.showAttachDocModal.set(false);
    this.selectedMovementForDoc.set(null);
    this.attachSuccessMessage.set('Soportes actualizados correctamente con registro de auditoría.');
    setTimeout(() => this.attachSuccessMessage.set(null), 4000);
  }
}