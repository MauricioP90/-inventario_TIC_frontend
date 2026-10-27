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
import { GetAllActivosUseCase } from '../../../../inventory/application/use-cases/get-all-activos.use-case';
import { Activo } from '../../../../inventory/domain/models/activo.model';
import { 
  formatFechaFormal, 
  formatMoneda, 
  numeroALetras, 
  getEstadoLabel, 
  extractSimFromActivo 
} from './templates/document-template.utils';
import { DocumentPrestamoTemplateComponent } from './templates/document-prestamo-template.component';
import { DocumentReintegroTemplateComponent } from './templates/document-reintegro-template.component';
import { DocumentMemorandoTemplateComponent } from './templates/document-memorando-template.component';
import { DocumentComodatoTemplateComponent } from './templates/document-comodato-template.component';
import { DocumentActaGeneralTemplateComponent } from './templates/document-acta-general-template.component';
import { MovementDocumentHeaderComponent } from './components/movement-document-header.component';
import { MovementDocumentTopBarComponent } from './components/movement-document-top-bar.component';
import { DocumentPrestamoToolbarComponent } from './components/document-prestamo-toolbar.component';
import { DocumentReintegroToolbarComponent } from './components/document-reintegro-toolbar.component';
import { DocumentMemorandoToolbarComponent } from './components/document-memorando-toolbar.component';
import { DocumentComodatoToolbarComponent } from './components/document-comodato-toolbar.component';
import { DocumentPrintService } from './services/document-print.service';

@Component({
  selector: 'app-movement-document-modal',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    DocumentPrestamoTemplateComponent,
    DocumentReintegroTemplateComponent,
    DocumentMemorandoTemplateComponent,
    DocumentComodatoTemplateComponent,
    DocumentActaGeneralTemplateComponent,
    MovementDocumentHeaderComponent,
    MovementDocumentTopBarComponent,
    DocumentPrestamoToolbarComponent,
    DocumentReintegroToolbarComponent,
    DocumentMemorandoToolbarComponent,
    DocumentComodatoToolbarComponent
  ],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center p-2 sm:p-4 md:p-6 print:hidden">
        <div class="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[95vh]">
          
          <!-- BARRA SUPERIOR: ENCABEZADO Y ACCIONES -->
          <app-movement-document-header
            [consecutivo]="docData()?.consecutivo || ''"
            (print)="printDocument()"
            (close)="close()" />

          <!-- PANEL DE CONFIGURACIÓN DEL DOCUMENTO -->
          <div class="bg-slate-50/80 border-b border-slate-200 px-6 py-3.5 shrink-0">
            <!-- Barra Principal: Formato, Sedes, Observaciones y Multi-activo -->
            <app-movement-document-top-bar
              [currentTipo]="currentTipo()"
              [isIndividualFormat]="isIndividualFormat()"
              [movementActivos]="movementActivos()"
              [selectedMovementActivoIndex]="selectedMovementActivoIndex()"
              [selectedLocationId]="selectedLocationId()"
              [recipientAssignedLocations]="recipientAssignedLocations()"
              [otherLocations]="otherLocations()"
              [allLocations]="allLocations()"
              [customNotes]="customNotes"
              [saveStatus]="saveStatus()"
              [isSavingNotes]="isSavingNotes()"
              [hasNotesChanged]="hasNotesChanged()"
              (tipoChange)="onTipoChange($event)"
              (locationChange)="onLocationChange($event)"
              (customNotesChange)="customNotes = $event"
              (saveNotes)="saveNotesToDatabase()"
              (selectMovementActivoIndex)="onSelectMovementActivoIndex($event)" />

            <!-- Barras Específicas según Formato Oficial -->
            @if (currentTipo() === 'PRESTAMO_DISPOSITIVO') {
              <app-document-prestamo-toolbar
                [fechaContrato]="fechaContrato()"
                [modeloAveriado]="modeloAveriado()"
                [placaAveriada]="placaAveriada()"
                [serialAveriado]="serialAveriado()"
                [incluyeCargador]="incluyeCargador()"
                [incluyeForro]="incluyeForro()"
                [allActivos]="allActivos()"
                (fechaContratoChange)="fechaContrato.set($event)"
                (modeloAveriadoChange)="modeloAveriado.set($event)"
                (placaAveriadaChange)="placaAveriada.set($event)"
                (serialAveriadoChange)="serialAveriado.set($event)"
                (incluyeCargadorChange)="incluyeCargador.set($event)"
                (incluyeForroChange)="incluyeForro.set($event)" />
            }

            @if (currentTipo() === 'REINTEGRO_DISPOSITIVO') {
              <app-document-reintegro-toolbar
                [fechaContratoReintegro]="fechaContratoReintegro()"
                [incluyeCargadorReintegro]="incluyeCargadorReintegro()"
                [incluyeForroReintegro]="incluyeForroReintegro()"
                [incluyeDevolucionPrestamo]="incluyeDevolucionPrestamo()"
                [placaPrestada]="placaPrestada()"
                [modeloPrestado]="modeloPrestado()"
                [serialPrestado]="serialPrestado()"
                [fechaEntregaPrestamo]="fechaEntregaPrestamo()"
                [allActivos]="allActivos()"
                (fechaContratoReintegroChange)="fechaContratoReintegro.set($event)"
                (incluyeCargadorReintegroChange)="incluyeCargadorReintegro.set($event)"
                (incluyeForroReintegroChange)="incluyeForroReintegro.set($event)"
                (incluyeDevolucionPrestamoChange)="incluyeDevolucionPrestamo.set($event)"
                (placaPrestadaChange)="placaPrestada.set($event)"
                (modeloPrestadoChange)="modeloPrestado.set($event)"
                (serialPrestadoChange)="serialPrestado.set($event)"
                (fechaEntregaPrestamoChange)="fechaEntregaPrestamo.set($event)" />
            }

            @if (currentTipo() === 'MEMORANDO_REINTEGRO' || currentTipo() === 'MEMORANDO_PRESTAMO') {
              <app-document-memorando-toolbar
                [currentTipo]="currentTipo()"
                [modeloAveriado]="modeloAveriado()"
                [placaAveriada]="placaAveriada()"
                [serialAveriado]="serialAveriado()"
                [incluyeCargador]="incluyeCargador()"
                [allActivos]="allActivos()"
                (tipoChange)="onTipoChange($event)"
                (modeloAveriadoChange)="modeloAveriado.set($event)"
                (placaAveriadaChange)="placaAveriada.set($event)"
                (serialAveriadoChange)="serialAveriado.set($event)"
                (incluyeCargadorChange)="incluyeCargador.set($event)" />
            }

            @if (currentTipo() === 'COMODATO') {
              <app-document-comodato-toolbar
                [activoComodatoPlaca]="getActivoComodato(docData())?.placa || ''"
                [bienEntregado]="getBienEntregado(docData() || undefined)"
                [valorReposicion]="valorReposicionComodato()"
                [valorReposicionLetras]="valorReposicionLetrasComodato()"
                [estadoBienComodato]="estadoBienComodato()"
                [fechaContratoComodato]="fechaContratoComodato()"
                (estadoBienComodatoChange)="estadoBienComodato.set($event)"
                (fechaContratoComodatoChange)="fechaContratoComodato.set($event)" />
            }
          </div>

          <!-- HOJA OFICIAL CON DISEÑO CORPORATIVO (Área imprimible) -->
          <div class="flex-1 p-6 md:p-10 bg-slate-100/50 overflow-y-auto">
            <div class="bg-white shadow-md border border-slate-300 p-8 md:p-10 max-w-3xl mx-auto rounded-lg text-slate-900" id="official-document-sheet">
              @if (docData(); as doc) {
                @switch (doc.config.tipo) {
                  @case ('PRESTAMO_DISPOSITIVO') {
                    <app-document-prestamo-template
                      [doc]="doc"
                      [selectedActivo]="selectedMovementActivo()"
                      [fechaContrato]="fechaContrato()"
                      [modeloAveriado]="modeloAveriado()"
                      [placaAveriada]="placaAveriada()"
                      [incluyeCargador]="incluyeCargador()"
                      [incluyeForro]="incluyeForro()" />
                  }
                  @case ('REINTEGRO_DISPOSITIVO') {
                    <app-document-reintegro-template
                      [doc]="doc"
                      [selectedActivo]="selectedMovementActivo()"
                      [fechaContratoReintegro]="fechaContratoReintegro()"
                      [incluyeCargadorReintegro]="incluyeCargadorReintegro()"
                      [incluyeForroReintegro]="incluyeForroReintegro()"
                      [incluyeDevolucionPrestamo]="incluyeDevolucionPrestamo()"
                      [modeloPrestado]="modeloPrestado()"
                      [placaPrestada]="placaPrestada()"
                      [serialPrestado]="serialPrestado()"
                      [fechaEntregaPrestamo]="fechaEntregaPrestamo()" />
                  }
                  @case ('MEMORANDO_REINTEGRO') {
                    <app-document-memorando-template
                      [doc]="doc"
                      [selectedActivo]="selectedMovementActivo()"
                      [modeloAveriado]="modeloAveriado()"
                      [placaAveriada]="placaAveriada()"
                      [serialAveriado]="serialAveriado()"
                      [incluyeCargador]="incluyeCargador()"
                      [incluyeForro]="incluyeForro()" />
                  }
                  @case ('MEMORANDO_PRESTAMO') {
                    <app-document-memorando-template
                      [doc]="doc"
                      [selectedActivo]="selectedMovementActivo()"
                      [modeloAveriado]="modeloAveriado()"
                      [placaAveriada]="placaAveriada()"
                      [serialAveriado]="serialAveriado()"
                      [incluyeCargador]="incluyeCargador()"
                      [incluyeForro]="incluyeForro()" />
                  }
                  @case ('COMODATO') {
                    <app-document-comodato-template
                      [doc]="doc"
                      [estadoBienComodato]="estadoBienComodato()"
                      [direccionComodatario]="direccionComodatario()"
                      [ciudadComodatario]="ciudadComodatario()"
                      [expedicionDocumentoComodatario]="expedicionDocumentoComodatario()"
                      [emailComodatario]="emailComodatario()"
                      [fechaContratoComodato]="fechaContratoComodato()"
                      [valorReposicionLetrasComodato]="valorReposicionLetrasComodato()"
                      [valorReposicionComodato]="valorReposicionComodato()"
                      [selectedActivoComodato]="selectedActivoComodato()"
                      [bienEntregadoComodato]="bienEntregadoComodato()"
                      [operadorSimComodato]="operadorSimComodato()"
                      [numeroSimComodato]="numeroSimComodato()" />
                  }
                  @default {
                    <app-document-acta-general-template
                      [doc]="doc"
                      [customEstados]="customEstados()"
                      (estadoChange)="setActivoEstado($event.placa, $event.estado)"
                      (setTodosEstados)="setTodosEstados($event)" />
                  }
                }
              }
            </div>
          </div>

        </div>
      </div>
    }
  `
})
export class MovementDocumentModalComponent {
  private readonly buildDocUseCase = inject(BuildMovementDocumentUseCase);
  private readonly policy = inject(DocumentPolicyService);
  private readonly movementRepo = inject(MovementRepository);
  private readonly getAllLocationsUC = inject(GetAllLocationsUseCase);
  private readonly getAllActivosUC = inject(GetAllActivosUseCase);
  private readonly printService = inject(DocumentPrintService);

  @Output() onMovementUpdated = new EventEmitter<Movement>();

  readonly isOpen = signal(false);
  readonly currentMovement = signal<Movement | null>(null);
  readonly currentDestinationLocation = signal<Location | null>(null);
  readonly allLocations = signal<Location[]>([]);
  readonly selectedLocationId = signal<string>('');
  readonly currentTipo = signal<TipoDocumentoOficial>('ACTA_ENTREGA');

  readonly isIndividualFormat = computed(() => 
    ['COMODATO', 'PRESTAMO_DISPOSITIVO', 'REINTEGRO_DISPOSITIVO', 'MEMORANDO_REINTEGRO', 'MEMORANDO_PRESTAMO'].includes(this.currentTipo())
  );
  readonly movementActivos = computed<any[]>(() => this.currentMovement()?.activos || []);
  readonly selectedMovementActivoIndex = signal<number>(0);
  readonly selectedMovementActivo = computed<any>(() => {
    const list = this.movementActivos();
    const idx = this.selectedMovementActivoIndex();
    return list[idx] || list[0] || null;
  });

  readonly isSavingNotes = signal(false);
  readonly saveStatus = signal<'IDLE' | 'SAVED' | 'ERROR'>('IDLE');
  readonly initialNotes = signal('');
  readonly customEstados = signal<Record<string, string>>({});
  customNotes = '';

  // Metadatos de Préstamo / Memorando
  readonly fechaContrato = signal('………………');
  readonly placaAveriada = signal<string>('');
  readonly modeloAveriado = signal<string>('');
  readonly serialAveriado = signal<string>('');
  readonly incluyeCargador = signal('SÍ');
  readonly incluyeForro = signal('SÍ');
  
  readonly allActivos = signal<Activo[]>([]);

  // Metadatos de Reintegro
  readonly fechaContratoReintegro = signal<string>('14 de junio de 2013');
  readonly incluyeCargadorReintegro = signal<string>('No incluido');
  readonly incluyeForroReintegro = signal<string>('No incluido');
  readonly incluyeDevolucionPrestamo = signal<boolean>(true);
  readonly placaPrestada = signal<string>('');
  readonly modeloPrestado = signal<string>('');
  readonly serialPrestado = signal<string>('');
  readonly fechaEntregaPrestamo = signal<string>('');

  // Metadatos de Comodato
  readonly selectedActivoComodato = signal<Activo | null>(null);
  readonly bienEntregadoComodato = signal<string>('');
  readonly precioCompraInput = signal<string>('');
  readonly fechaContratoComodato = signal<string>('14 de junio de 2013');
  readonly direccionComodatario = signal<string>('');
  readonly ciudadComodatario = signal<string>('Bogotá D.C.');
  readonly expedicionDocumentoComodatario = signal<string>('Bogotá D.C.');
  readonly emailComodatario = signal<string>('');
  readonly operadorSimComodato = signal<string>('');
  readonly numeroSimComodato = signal<string>('');
  readonly valorReposicionComodato = signal<string>('$ 0');
  readonly valorReposicionLetrasComodato = signal<string>('CERO PESOS');
  readonly estadoBienComodato = signal<string>('BUENO');

  readonly recipientAssignedLocations = computed<Location[]>(() => {
    const mov = this.currentMovement();
    const all = this.allLocations();
    if (!mov) return [];
    const targetResp = mov.receiver || mov.responsible;

    const list: Location[] = [];
    const seen = new Set<string>();

    const currentDest = this.currentDestinationLocation() || mov.destinationLocation;
    if (currentDest?.id) {
      list.push(currentDest);
      seen.add(currentDest.id);
    }

    if (targetResp?.locations && Array.isArray(targetResp.locations)) {
      for (const loc of targetResp.locations) {
        if (loc?.id && !seen.has(loc.id)) {
          list.push(loc);
          seen.add(loc.id);
        }
      }
    }

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

  readonly otherLocations = computed<Location[]>(() => {
    const assignedIds = new Set(this.recipientAssignedLocations().map(l => l.id));
    return this.allLocations().filter(l => !assignedIds.has(l.id));
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
      },
      {
        fechaContrato: this.fechaContratoReintegro(),
        cargador: this.incluyeCargadorReintegro(),
        forro: this.incluyeForroReintegro(),
        incluyeDevolucionPrestamo: this.incluyeDevolucionPrestamo(),
        modeloPrestado: this.modeloPrestado(),
        serialPrestado: this.serialPrestado(),
        placaPrestada: this.placaPrestada(),
        fechaEntregaPrestamo: this.fechaEntregaPrestamo()
      },
      {
        modeloAveriado: this.modeloAveriado(),
        serialAveriado: this.serialAveriado(),
        placaAveriada: this.placaAveriada(),
        cargador: this.incluyeCargador(),
        forro: this.incluyeForro()
      },
      {
        fechaContratoColaboracion: this.fechaContratoComodato(),
        lugarFecha: `${this.currentDestinationLocation()?.ciudad || mov.destinationLocation?.ciudad || 'Bogotá D.C.'}, ${formatFechaFormal(mov.createdAt)}`,
        bienEntregado: this.bienEntregadoComodato(),
        precioCompra: parseInt(this.precioCompraInput(), 10) || undefined,
        direccionComodatario: this.direccionComodatario(),
        ciudadComodatario: this.ciudadComodatario(),
        emailComodatario: this.emailComodatario(),
        operadorSim: this.operadorSimComodato(),
        numeroSim: this.numeroSimComodato(),
        valorReposicion: this.valorReposicionComodato(),
        valorReposicionLetras: this.valorReposicionLetrasComodato(),
        estadoBien: this.estadoBienComodato()
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

  selectActivoComodato(activo: Activo) {
    this.selectedActivoComodato.set(activo);

    const tipo = (activo as any).tipo || (activo as any).tipoActivo?.nombre || (activo as any).category?.nombre || 'Dispositivo';
    const tipoCap = tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase();
    const modelo = activo.modelo && activo.modelo !== 'N/A' ? activo.modelo.trim() : (activo.marca && activo.marca !== 'N/A' ? activo.marca.trim() : '');
    const bien = `${tipoCap} ${modelo}`.trim();
    this.bienEntregadoComodato.set(bien);

    const precio = (activo as any).precioCompra ? Number((activo as any).precioCompra) : null;
    if (precio && precio > 0) {
      this.precioCompraInput.set(String(precio));
      this.valorReposicionComodato.set(formatMoneda(precio));
      this.valorReposicionLetrasComodato.set(numeroALetras(precio));
    } else {
      this.precioCompraInput.set('');
      this.valorReposicionComodato.set('$ 0');
      this.valorReposicionLetrasComodato.set('CERO PESOS');
    }

    const simInfo = extractSimFromActivo(activo);
    this.operadorSimComodato.set(simInfo.operador);
    this.numeroSimComodato.set(simInfo.numero);
  }

  clearPlacaComodatoSearch() {
    this.selectedActivoComodato.set(null);
    this.bienEntregadoComodato.set('');
    this.precioCompraInput.set('');
    this.valorReposicionComodato.set('$ 0');
    this.valorReposicionLetrasComodato.set('CERO PESOS');
    this.operadorSimComodato.set('');
    this.numeroSimComodato.set('');
  }

  getActivoComodato(doc?: OfficialDocumentData | null): any {
    const selected = this.selectedActivoComodato();
    if (selected) {
      return {
        id: selected.id,
        placa: selected.placa,
        tipo: (selected as any).tipo || (selected as any).tipoActivo?.nombre || 'Dispositivo',
        marca: selected.marca || 'N/A',
        modelo: selected.modelo || 'N/A',
        serial: selected.serial || 'S/N',
        estado: selected.estado || 'BUENO',
        precioCompra: selected.precioCompra ? Number(selected.precioCompra) : undefined,
        simCard: (selected as any).simCard,
        simCards: selected.simCards
      };
    }
    if (doc && doc.activos && doc.activos.length > 0) {
      return doc.activos[0];
    }
    const mov = this.currentMovement();
    if (mov && mov.activos && mov.activos.length > 0) {
      const a = mov.activos[0];
      return {
        id: a.id,
        placa: a.placa,
        tipo: a.tipo || a.tipoActivo?.nombre || 'Dispositivo',
        marca: a.marca || 'N/A',
        modelo: a.modelo || 'N/A',
        serial: a.serial || 'S/N',
        estado: a.estado || 'BUENO',
        precioCompra: a.precioCompra ? Number(a.precioCompra) : undefined,
        simCard: a.simCard,
        simCards: a.simCards
      };
    }
    return null;
  }

  getBienEntregado(doc?: OfficialDocumentData | null): string {
    const act = this.getActivoComodato(doc);
    if (act) {
      const tipo = (act as any).tipo || (act as any).tipoActivo?.nombre || 'Dispositivo';
      const tipoCap = tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase();
      const mod = act.modelo && act.modelo !== 'N/A' ? act.modelo.trim() : (act.marca && act.marca !== 'N/A' ? act.marca.trim() : '');
      return `${tipoCap} ${mod}`.trim();
    }
    if (this.bienEntregadoComodato() && this.bienEntregadoComodato().trim()) {
      return this.bienEntregadoComodato().trim();
    }
    return 'Dispositivo';
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

    this.getAllActivosUC.execute().subscribe({
      next: (activos) => {
        this.allActivos.set(activos);
        const primer = movement.activos && movement.activos.length > 0 ? movement.activos[0] : null;
        if (primer?.placa) {
          const full = activos.find(a => a.placa && a.placa.toLowerCase() === primer.placa.toLowerCase());
          if (full) {
            this.selectActivoComodato(full);
          }
        }
      },
      error: (err) => console.error('Error cargando activos para buscador:', err)
    });

    const sugerido = this.policy.sugerirTipoDocumento(movement, destinationLocation);
    this.currentTipo.set(sugerido);
    this.selectedMovementActivoIndex.set(0);
    this.customNotes = movement.notes || '';
    this.initialNotes.set(this.customNotes);
    this.fechaContrato.set('………………');
    this.placaAveriada.set('');
    this.modeloAveriado.set('');
    this.serialAveriado.set('');
    this.incluyeCargador.set('SÍ');
    this.incluyeForro.set('SÍ');

    this.fechaContratoComodato.set('14 de junio de 2013');
    const targetPerson = movement.receiver || movement.responsible;
    this.direccionComodatario.set(targetPerson?.direccion || targetPerson?.address || '');
    this.ciudadComodatario.set(targetPerson?.ciudad || initialLoc?.ciudad || 'Bogotá D.C.');
    this.expedicionDocumentoComodatario.set(targetPerson?.lugarExpedicion || targetPerson?.expedicion || targetPerson?.ciudadExpedicion || 'Bogotá D.C.');
    this.emailComodatario.set(targetPerson?.email || '');

    const primerActivo = movement.activos && movement.activos.length > 0 ? movement.activos[0] : null;
    if (primerActivo) {
      this.selectActivoComodato(primerActivo as any);
    } else {
      this.clearPlacaComodatoSearch();
    }
    this.estadoBienComodato.set('BUENO');

    const initialMap: Record<string, string> = {};
    if (movement.activos && movement.activos.length > 0) {
      for (const activo of movement.activos) {
        if (activo.placa) {
          initialMap[activo.placa] = getEstadoLabel(activo.estado);
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
    this.selectedMovementActivoIndex.set(0);
    this.placaAveriada.set('');
    this.modeloAveriado.set('');
    this.serialAveriado.set('');
    this.clearPlacaComodatoSearch();
    this.fechaContratoComodato.set('14 de junio de 2013');
    this.direccionComodatario.set('');
    this.ciudadComodatario.set('Bogotá D.C.');
    this.expedicionDocumentoComodatario.set('Bogotá D.C.');
    this.emailComodatario.set('');
    this.operadorSimComodato.set('');
    this.numeroSimComodato.set('');
    this.estadoBienComodato.set('BUENO');
  }

  onSelectMovementActivoIndex(index: number | string) {
    const idx = Number(index);
    this.selectedMovementActivoIndex.set(idx);
    const act = this.movementActivos()[idx];
    if (act) {
      const full = this.allActivos().find(a => a.placa && act.placa && a.placa.toLowerCase() === act.placa.toLowerCase());
      if (full) {
        this.selectActivoComodato(full);
      } else {
        this.selectActivoComodato(act as any);
      }
    }
  }

  onTipoChange(nuevoTipo: TipoDocumentoOficial) {
    this.currentTipo.set(nuevoTipo);
  }

  printDocument() {
    const titulo = this.docData()?.config.titulo || 'Documento Oficial';
    const consecutivo = this.docData()?.consecutivo || '';
    this.printService.printElement('official-document-sheet', titulo, consecutivo);
  }
}
