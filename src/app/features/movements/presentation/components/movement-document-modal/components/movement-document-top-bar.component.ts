import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TipoDocumentoOficial } from '../../../../domain/models/document-template.model';
import { Location } from '../../../../../locations/domain/models/location.model';

@Component({
  selector: 'app-movement-document-top-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- PANEL DE CONFIGURACIÓN DEL DOCUMENTO (Selector de Formato + Observaciones) -->
    <div class="space-y-3.5">
      <!-- Selector dinámico de activo para formatos individuales en traslados multi-activo -->
      @if (isIndividualFormat && movementActivos.length > 1) {
        <div class="p-2.5 bg-indigo-50/90 border border-indigo-200/80 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div class="flex items-center gap-2.5">
            <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-bold shadow-xs">
              📱
            </span>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-black text-indigo-950 uppercase tracking-tight">Envío Múltiple ({{ movementActivos.length }} Activos)</span>
                <span class="text-[10px] bg-indigo-100 text-indigo-800 font-extrabold px-1.5 py-0.5 rounded border border-indigo-200">
                  Dispositivo {{ selectedMovementActivoIndex + 1 }} de {{ movementActivos.length }}
                </span>
              </div>
              <p class="text-[11px] text-indigo-700">Este formato legal emite 1 acta individual por dispositivo. Selecciona la placa para visualizar e imprimir su documento:</p>
            </div>
          </div>

          <!-- Tabs de placas asociadas al envío -->
          <div class="flex items-center gap-1.5 flex-wrap">
            @for (act of movementActivos; track act.placa; let i = $index) {
              <button
                type="button"
                (click)="selectMovementActivoIndex.emit(i)"
                [class.bg-indigo-600]="selectedMovementActivoIndex === i"
                [class.text-white]="selectedMovementActivoIndex === i"
                [class.border-indigo-600]="selectedMovementActivoIndex === i"
                [class.shadow-xs]="selectedMovementActivoIndex === i"
                [class.bg-white]="selectedMovementActivoIndex !== i"
                [class.text-slate-700]="selectedMovementActivoIndex !== i"
                [class.border-slate-300]="selectedMovementActivoIndex !== i"
                [class.hover:bg-slate-50]="selectedMovementActivoIndex !== i"
                class="px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5">
                <span>🏷️ {{ act.placa }}</span>
                <span class="text-[10px] font-sans font-normal opacity-90 truncate max-w-[120px]">({{ act.modelo || act.marca }})</span>
              </button>
            }
          </div>
        </div>
      }

      <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <!-- 1. Selector de Formato Oficial -->
        <div [ngClass]="currentTipo === 'COMODATO' ? 'md:col-span-6' : 'md:col-span-4'">
          <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Tipo de Formato Oficial:
          </label>
          <div class="relative">
            <select 
              [ngModel]="currentTipo"
              (ngModelChange)="tipoChange.emit($event)"
              class="w-full bg-white text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer shadow-2xs">
              <option value="ACTA_ENTREGA">🏢 GF-FO-29 Acta de Entrega de Activos (V7 - Oficial)</option>
              <option value="COMODATO">🤝 Contrato de Comodato (Partícipes - COM-01)</option>
              <option value="PRESTAMO_DISPOSITIVO">📱 Entrega de Dispositivo en Calidad de Préstamo (Partícipes - DP-PR-01)</option>
              <option value="REINTEGRO_DISPOSITIVO">🔄 Reintegro de Dispositivo y/o Devolución (Partícipes - DP-RD-01)</option>
              <option value="MEMORANDO_REINTEGRO">📝 Memorando: Reintegro de Dispositivo (Oficina - GR-MEM-26)</option>
              <option value="MEMORANDO_PRESTAMO">📝 Memorando: Préstamo de Dispositivo (Oficina - GR-MEM-26)</option>
              <option value="GUIA_REMISION">🛠️ FOR-TIC-004 Guía Remisión Técnica (Taller)</option>
            </select>
          </div>
        </div>

        <!-- 2. Sede / Oficina -->
        <div [ngClass]="currentTipo === 'COMODATO' ? 'md:col-span-6' : 'md:col-span-3'">
          <div class="flex items-center justify-between mb-1">
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Sede / Oficina:
            </label>
            @if (recipientAssignedLocations.length > 0) {
              <span class="text-[9px] text-indigo-600 font-bold">
                {{ recipientAssignedLocations.length }} asignada(s)
              </span>
            }
          </div>
          <select 
            [ngModel]="selectedLocationId"
            (ngModelChange)="locationChange.emit($event)"
            class="w-full bg-white text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer shadow-2xs">
            @if (recipientAssignedLocations.length > 0) {
              <optgroup label="Sedes Asignadas al Colaborador">
                @for (loc of recipientAssignedLocations; track loc.id) {
                  <option [value]="loc.id">🏢 {{ loc.nombre }} ({{ loc.ciudad || 'Sin ciudad' }})</option>
                }
              </optgroup>
              @if (otherLocations.length > 0) {
                <optgroup label="Otras Sedes / Oficinas">
                  @for (loc of otherLocations; track loc.id) {
                    <option [value]="loc.id">🏢 {{ loc.nombre }} ({{ loc.ciudad || 'Sin ciudad' }})</option>
                  }
                </optgroup>
              }
            } @else {
              @for (loc of allLocations; track loc.id) {
                <option [value]="loc.id">🏢 {{ loc.nombre }} ({{ loc.ciudad || 'Sin ciudad' }})</option>
              }
            }
          </select>
        </div>

        <!-- 3. Observaciones en Documento (Oculto en COMODATO) -->
        @if (currentTipo !== 'COMODATO') {
          <div class="md:col-span-5">
            <div class="flex items-center justify-between mb-1">
              <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Observaciones en Documento:
              </label>
              @if (saveStatus === 'SAVED') {
                <span class="text-[10px] text-emerald-600 font-bold flex items-center gap-1 animate-fade-in">
                  ✓ Guardado en BD
                </span>
              }
              @if (saveStatus === 'ERROR') {
                <span class="text-[10px] text-rose-600 font-bold flex items-center gap-1 animate-fade-in">
                  ✕ Error al guardar
                </span>
              }
            </div>
            <div class="flex items-center gap-2">
              <input 
                type="text" 
                [ngModel]="customNotes" 
                (ngModelChange)="customNotesChange.emit($event)"
                placeholder="Ej: Se entrega con cargador, funda..."
                class="flex-1 bg-white text-slate-800 text-xs px-3 py-2 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs" />

              <button 
                (click)="saveNotes.emit()"
                [disabled]="isSavingNotes || !hasNotesChanged"
                [class.opacity-50]="isSavingNotes || !hasNotesChanged"
                [class.cursor-not-allowed]="isSavingNotes || !hasNotesChanged"
                title="Guardar observaciones en la base de datos para este traslado"
                class="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs">
                @if (isSavingNotes) {
                  <span class="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span>
                } @else {
                  <span>💾</span>
                }
                <span>Guardar</span>
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class MovementDocumentTopBarComponent {
  @Input() currentTipo: TipoDocumentoOficial = 'ACTA_ENTREGA';
  @Input() isIndividualFormat: boolean = false;
  @Input() movementActivos: any[] = [];
  @Input() selectedMovementActivoIndex: number = 0;
  @Input() selectedLocationId: string = '';
  @Input() recipientAssignedLocations: Location[] = [];
  @Input() otherLocations: Location[] = [];
  @Input() allLocations: Location[] = [];
  @Input() customNotes: string = '';
  @Input() saveStatus: 'IDLE' | 'SAVED' | 'ERROR' = 'IDLE';
  @Input() isSavingNotes: boolean = false;
  @Input() hasNotesChanged: boolean = false;

  @Output() tipoChange = new EventEmitter<TipoDocumentoOficial>();
  @Output() locationChange = new EventEmitter<string>();
  @Output() customNotesChange = new EventEmitter<string>();
  @Output() saveNotes = new EventEmitter<void>();
  @Output() selectMovementActivoIndex = new EventEmitter<number>();
}
