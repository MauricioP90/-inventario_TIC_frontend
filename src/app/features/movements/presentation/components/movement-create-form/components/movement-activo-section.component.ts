import { Component, Input, Output, EventEmitter, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Location } from '../../../../../locations/domain/models/location.model';
import { Responsable } from '../../../../../responsables/domain/models/responsable.model';
import { Activo } from '../../../../../inventory/domain/models/activo.model';
import { Movement, MOVEMENT_TYPE_LABELS } from '../../../../domain/models/movement.model';
import { Area } from '../../../../../responsables/domain/models/area.model';
import { RoleService } from '../../../../../../core/auth/services/role.service';

@Component({
  selector: 'app-movement-activo-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- MODO ACTIVO: Flujo Lineal de Activos -->
    <div class="space-y-6">
      <!-- Tipo de Movimiento -->
      <div class="space-y-1.5">
        <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo de Movimiento *</label>
        <select [ngModel]="_movementType()"
                (ngModelChange)="onMovementTypeChange($event)"
                class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none text-sm transition-all font-medium text-slate-700">
          <option value="">Seleccione...</option>
          @for (type of filteredMovementTypes(); track type[0]) {
            <option [value]="type[0]">{{ type[1] }}</option>
          }
        </select>
      </div>

      <!-- Buscador de Activo -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between">
          <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Relación de Equipos del Traslado *
          </label>
          <div class="flex items-center gap-2">
            @if (_selectedActivos().length > 0) {
              <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full border transition-all"
                    [ngClass]="_selectedActivos().length >= maxAllowedActivos() 
                      ? 'bg-amber-50 text-amber-700 border-amber-200' 
                      : 'bg-indigo-50 text-indigo-700 border-indigo-100/60'">
                {{ _selectedActivos().length }} / {{ maxAllowedActivos() }} {{ _selectedActivos().length === 1 ? 'equipo' : 'equipos' }}
                @if (_selectedActivos().length >= maxAllowedActivos()) {
                  <span class="ml-1 text-[10px] font-extrabold uppercase">(Límite alcanzado)</span>
                }
              </span>
            }
            @if (isSingleAssetMode()) {
              <span class="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200" title="Requiere denuncio policial individual">
                🚨 Denuncio Individual (Máx 1)
              </span>
            } @else {
              <span class="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200" title="Garantiza 1 sola hoja de acta oficial (hasta 10 equipos por remesa)">
                📄 Máx 10 por Envío
              </span>
            }
          </div>
        </div>
        <div class="relative group">
          <input type="text" 
                 [ngModel]="searchQuery()" 
                 (input)="onSearchInput($any($event.target).value)" 
                 placeholder="Escriba Placa, Serie, Marca o Modelo para agregar a la relación..."
                 class="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm">
          
          @if (searchQuery()) {
            <button (click)="searchQuery.set('')" 
                    class="absolute right-3 top-3 text-slate-300 hover:text-slate-500 transition-colors cursor-pointer">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          }

          @if (searchQuery()) {
            <div class="absolute z-20 w-full bg-white border border-slate-200 rounded-xl mt-1 shadow-2xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
              @for (activo of filteredActivos(); track activo.id) {
                <div (click)="selectActivo(activo)" 
                     class="p-3.5 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-none flex flex-col gap-0.5 transition-colors">
                  <div class="flex items-center justify-between">
                    <p class="text-sm font-bold text-slate-800">{{ activo.placa }}</p>
                    <span class="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold uppercase">{{ activo.location?.nombre || 'Sede N/A' }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <p class="text-[10px] text-slate-500">{{ activo.marca }} {{ activo.modelo || '' }} - S/N: {{ activo.serial }}</p>
                    <span class="text-[11px] text-indigo-600 font-bold hover:underline">+ Agregar</span>
                  </div>
                </div>
              } @empty {
                <div class="p-4 text-center">
                  <p class="text-xs text-slate-400 italic">No se encontraron activos...</p>
                </div>
              }
            </div>
          }

          @if (isLoadingPlaca() && !searchQuery()) {
            <div class="absolute right-3 top-3.5"><div class="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
          }
        </div>
      </div>

      <!-- Relación de Equipos del Traslado -->
      @if (_selectedActivos().length > 0) {
        <div class="space-y-2.5 animate-in fade-in slide-in-from-top-1">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
              <span>Relación de Equipos del Traslado</span>
              <span class="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                {{ _selectedActivos().length }} de {{ maxAllowedActivos() }} máx
              </span>
            </span>
            @if (_selectedActivos().length > 1) {
              <button type="button" 
                      (click)="clearAllActivos()" 
                      class="text-[11px] font-medium text-slate-400 hover:text-red-500 transition-colors cursor-pointer">
                Limpiar lista
              </button>
            }
          </div>

          <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
            @for (activo of _selectedActivos(); track activo.id; let idx = $index) {
              <div class="p-3 bg-white border border-slate-200/90 hover:border-indigo-300 rounded-xl flex items-center justify-between shadow-xs transition-all">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                    #{{ idx + 1 }}
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <h5 class="font-bold text-slate-800 text-sm leading-none">{{ activo.placa }}</h5>
                      <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {{ activo.marca }}
                      </span>
                      <span class="text-[11px] font-medium text-slate-500 truncate">
                        {{ activo.modelo || '' }}
                      </span>
                    </div>
                    <p class="text-[11px] text-slate-400 mt-1 font-mono">
                      S/N: {{ activo.serial || 'N/A' }}
                      @if (activo.area?.nombre) {
                        <span class="text-slate-300 mx-1">·</span>
                        <span class="font-sans text-slate-500">Área: {{ activo.area?.nombre }}</span>
                      }
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                  @if (activo.simCards && activo.simCards.length) {
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100/60 hidden sm:inline-block">
                      📱 {{ activo.simCards.length }} SIM
                    </span>
                  }
                  <button type="button" 
                          (click)="removeActivoFromRelacion(activo.id)" 
                          title="Quitar equipo de la relación"
                          class="w-7 h-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            }
          </div>

          <!-- Resumen de Sede Origen Común -->
          <div class="p-2.5 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center justify-between text-xs text-slate-600">
            <span class="flex items-center gap-1.5">
              <span class="text-slate-400">📍 Sede de Origen común:</span>
              <strong class="text-slate-800">{{ originLocationName() }}</strong>
            </span>
            <span class="text-[11px] text-slate-400 hidden sm:inline">
              Todos los equipos saldrán de esta sede
            </span>
          </div>
        </div>
      }

      <!-- Banner Informativo para Equipo en Mantenimiento -->
      @if (hasEquipmentInMaintenance()) {
        <div class="p-4 bg-amber-50 border border-amber-200/90 rounded-2xl flex items-start gap-3 shadow-xs animate-in fade-in">
          <div class="p-2 bg-amber-100 text-amber-800 rounded-xl text-lg shrink-0">
            🔧
          </div>
          <div>
            <h4 class="text-sm font-bold text-amber-900 leading-tight">Equipo(s) en Estado de MANTENIMIENTO</h4>
            <p class="text-xs text-amber-800 mt-1 leading-relaxed">
              Uno o más equipos seleccionados cuentan con un proceso de mantenimiento activo. Por regla de control, <strong>solo se permite su traslado hacia Bodega TI / Soporte Técnico</strong> o a un Proveedor.
            </p>
            <p class="text-[11px] text-amber-700 mt-1 font-medium">
              ℹ️ Para asignar o cambiar SIM Card, el equipo debe ser liberado de mantenimiento y pasar a estado <strong>DISPONIBLE</strong>.
            </p>
          </div>
        </div>
      }

      <!-- Banner de Alerta para Hurto o Pérdida -->
      @if (_movementType() === 'HURTO_PERDIDA') {
        <div class="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 shadow-xs animate-in fade-in">
          <div class="p-2 bg-rose-100 text-rose-700 rounded-xl text-lg shrink-0">
            🚨
          </div>
          <div>
            <h4 class="text-sm font-bold text-rose-900 leading-tight">Reporte Oficial de Hurto / Pérdida de Activo</h4>
            <p class="text-xs text-rose-700 mt-1 leading-relaxed">
              Este movimiento dará de <strong>baja definitiva</strong> al activo en el sistema, lo desvinculará de su custodio actual y notificará de forma inmediata a los correos suscritos de <strong>Seguridad, Jurídica y Contabilidad</strong>.
            </p>
            <p class="text-[11px] font-bold text-rose-800 mt-1.5 flex items-center gap-1">
              ⚠️ Es OBLIGATORIO adjuntar el archivo del denuncio policial ante la Fiscalía / Policía Nacional en la sección de documentos abajo.
            </p>
          </div>
        </div>
      }

      <!-- Grid: Ubicaciones (Origen & Destino) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Ubicación Origen -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Ubicación Origen</label>
          <input type="text" [value]="originLocationName()" disabled
                 class="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm font-medium">
        </div>

        <!-- Ubicación Destino -->
        <div class="space-y-1.5 relative">
          <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Ubicación Destino *</label>
          <div class="relative group">
            <input type="text" 
                   [ngModel]="_movementType() === 'HURTO_PERDIDA' ? 'No aplica (Baja definitiva por hurto)' : destinationSearchQuery()" 
                   (focus)="(!_movementType() || _movementType() === 'TRASLADO_AREA' || _movementType() === 'HURTO_PERDIDA') ? null : showDestinationDropdown.set(true)"
                   (input)="destinationSearchQuery.set($any($event.target).value); showDestinationDropdown.set(true)"
                   [disabled]="!_movementType() || _movementType() === 'TRASLADO_AREA' || _movementType() === 'HURTO_PERDIDA'"
                   [placeholder]="!_movementType() ? 'Seleccione tipo de movimiento primero...' : (_movementType() === 'HURTO_PERDIDA' ? 'No aplica (Baja definitiva)' : 'Escriba Código o Nombre de la Sede...')"
                   class="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-700 disabled:bg-slate-100 disabled:text-slate-500">
            
            @if (destinationSearchQuery() && _movementType() && _movementType() !== 'TRASLADO_AREA' && _movementType() !== 'HURTO_PERDIDA') {
              <button (click)="clearDestinationSelection()" 
                      class="absolute right-3 top-3 text-slate-300 hover:text-slate-500 transition-colors">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            }

            @if (showDestinationDropdown() && filteredDestinations().length > 0 && _movementType() && _movementType() !== 'TRASLADO_AREA' && _movementType() !== 'HURTO_PERDIDA') {
              <div class="absolute z-20 w-full bg-white border border-slate-200 rounded-xl mt-1 shadow-2xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                @for (loc of filteredDestinations(); track loc.id) {
                  <div (click)="selectDestination(loc)" 
                       class="p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-none flex flex-col gap-0.5 transition-colors">
                    <p class="text-sm font-bold text-slate-800">{{ loc.nombre }}</p>
                    <p class="text-[10px] text-slate-500">Código: {{ loc.code }}</p>
                  </div>
                }
              </div>
            }
          </div>

          @if (selectedDestination() && _movementType() !== 'TRASLADO_AREA' && _movementType() !== 'HURTO_PERDIDA' && (!selectedDestination()!.responsibleIds || selectedDestination()!.responsibleIds.length === 0)) {
            <div class="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 animate-in fade-in duration-200">
              <span class="text-amber-500 text-sm">⚠️</span>
              <p class="text-[11px] font-bold text-amber-800 leading-normal">
                Advertencia: Esta sede no tiene responsables asignados. El traslado se registrará, pero te recomendamos asignarle uno en la sección de "Ubicaciones" para que alguien reciba el acta de entrega.
              </p>
            </div>
          }
        </div>
      </div>

      <!-- Área Destino -->
      @if (selectedDestination() && _movementType() && _movementType() !== 'HURTO_PERDIDA') {
        <div class="space-y-1.5 mt-4">
          <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Área Destino *</label>
          @if (getAvailableDestinationAreas().length > 0) {
            <select [ngModel]="_destinationAreaId()"
                    (ngModelChange)="onDestinationAreaChange($event)"
                    class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none text-sm transition-all bg-white font-medium text-slate-700">
              <option value="">Todas las áreas / Seleccione...</option>
              @for (area of getAvailableDestinationAreas(); track area.id) {
                <option [value]="area.id">{{ area.nombre }}</option>
              }
            </select>
          } @else {
            <select [disabled]="true"
                    class="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm font-medium">
              <option value="8b8b9c8c-1e2a-43cf-8a27-024848bb0000">NO APLICA</option>
            </select>
          }
        </div>
      }

      <!-- Responsables (Remitente Actual & Receptor Destino) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <!-- Responsable Remitente (Actual) -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Responsable Remitente (Actual)
          </label>
          <input type="text" [value]="originResponsibleName()" disabled
                 class="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm font-medium">
        </div>

        <!-- Responsable Receptor (Destino) -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Responsable Receptor *
            @if (_responsibleId()) {
              <span class="text-emerald-500 text-[10px] font-bold normal-case">✓ Seleccionado</span>
            }
          </label>
          <select [ngModel]="_responsibleId()"
                  (ngModelChange)="onResponsibleChange($event)"
                  class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm appearance-none font-medium text-slate-700">
            <option value="">Seleccione el responsable receptor...</option>
            @for (resp of filteredResponsiblesForDestination(); track resp.id) {
              <option [value]="resp.id">{{ resp.nombre }}{{ resp.area?.nombre ? ' — ' + resp.area?.nombre : '' }}</option>
            }
          </select>
          @if (filteredResponsiblesForDestination().length === 0) {
            <p class="text-[10px] text-amber-600 font-medium">⚠️ No hay responsables activos en el destino/área seleccionada.</p>
          }
        </div>
      </div>
    </div>
  `
})
export class MovementActivoSectionComponent {
  private roleService = inject(RoleService);

  @Input() set locations(val: Location[]) { this._locations.set(val || []); }
  @Input() set responsables(val: Responsable[]) { this._responsables.set(val || []); }
  @Input() set activos(val: Activo[]) { this._activos.set(val || []); }
  @Input() set movements(val: Movement[]) { this._movements.set(val || []); }

  @Input() set movementType(val: string) { this._movementType.set(val || ''); }
  @Input() set selectedActivos(val: Activo[]) { this._selectedActivos.set(val || []); }
  @Input() set originId(val: string) { this._originId.set(val || ''); }
  @Input() set destinationId(val: string) { 
    this._destinationId.set(val || '');
    if (val) {
      const loc = this._locations().find(l => l.id === val);
      if (loc) {
        this.selectedDestination.set(loc);
        this.destinationSearchQuery.set(loc.nombre);
      }
    } else {
      this.selectedDestination.set(null);
      this.destinationSearchQuery.set('');
    }
  }
  @Input() set destinationAreaId(val: string) { this._destinationAreaId.set(val || ''); }
  @Input() set responsibleId(val: string) { this._responsibleId.set(val || ''); }

  @Output() movementTypeChange = new EventEmitter<string>();
  @Output() selectedActivosChange = new EventEmitter<Activo[]>();
  @Output() originIdChange = new EventEmitter<string>();
  @Output() destinationIdChange = new EventEmitter<string>();
  @Output() destinationAreaIdChange = new EventEmitter<string>();
  @Output() responsibleIdChange = new EventEmitter<string>();
  @Output() recipientAdded = new EventEmitter<string>();

  _locations = signal<Location[]>([]);
  _responsables = signal<Responsable[]>([]);
  _activos = signal<Activo[]>([]);
  _movements = signal<Movement[]>([]);

  _movementType = signal('');
  _selectedActivos = signal<Activo[]>([]);
  _originId = signal('');
  _destinationId = signal('');
  _destinationAreaId = signal('');
  _responsibleId = signal('');

  searchQuery = signal('');
  destinationSearchQuery = signal('');
  showDestinationDropdown = signal(false);
  selectedDestination = signal<Location | null>(null);
  isLoadingPlaca = signal(false);

  readonly movementTypes = Object.entries(MOVEMENT_TYPE_LABELS);
  readonly singleAssetMovementTypes = ['HURTO_PERDIDA'];

  isSingleAssetMode = computed(() => {
    return this.singleAssetMovementTypes.includes(this._movementType());
  });

  maxAllowedActivos = computed(() => {
    return this.isSingleAssetMode() ? 1 : 10;
  });

  originLocationName = computed(() => {
    const list = this._selectedActivos();
    if (list.length > 0) {
      return list[0]?.location?.nombre || 'Sede N/A';
    }
    return 'Se cargará automáticamente...';
  });

  originResponsibleName = computed(() => {
    const list = this._selectedActivos();
    if (list.length > 0) {
      const names = Array.from(new Set(list.map(a => a.responsible?.nombre).filter(Boolean)));
      if (names.length === 0) return 'Sin custodio asignado';
      if (names.length === 1) return names[0] as string;
      return `${names[0]} (+${names.length - 1} más)`;
    }
    return 'Sin custodio asignado';
  });

  hasEquipmentInMaintenance = computed(() => {
    return this._selectedActivos().some(a => a.estado === 'MANTENIMIENTO');
  });

  filteredDestinations = computed(() => {
    const term = this.destinationSearchQuery().toLowerCase().trim();
    const origin = this._originId();
    const isMaintenance = this.hasEquipmentInMaintenance();
    const mType = this._movementType();

    let todos = this._locations().filter(loc => loc.estado === 'ACTIVO');
    const isBodegaType = (tipo?: string) => tipo === 'PUNTO_TI' || tipo === 'BODEGA';

    if (mType === 'ENVIO_PROVEEDOR') {
      todos = todos.filter(loc => loc.tipo === 'PROVEEDOR');
    } else if (mType === 'RETORNO_PROVEEDOR') {
      todos = todos.filter(loc => isBodegaType(loc.tipo));
    } else if (mType === 'TRASLADO_REGIONAL' && isMaintenance) {
      todos = todos.filter(loc => isBodegaType(loc.tipo));
    } else if (isMaintenance) {
      const originType = this._locations().find(loc => loc.id === origin)?.tipo;
      if (originType === 'PROVEEDOR') {
        todos = todos.filter(loc => isBodegaType(loc.tipo));
      } else {
        todos = todos.filter(loc => isBodegaType(loc.tipo) || loc.tipo === 'PROVEEDOR');
      }
    }

    if (!term) return todos;
    return todos.filter(loc =>
      loc.nombre.toLowerCase().includes(term) ||
      loc.code.toLowerCase().includes(term)
    );
  });

  filteredResponsiblesForDestination = computed(() => {
    const dest = this.selectedDestination();
    const all = this._responsables().filter(r => r.estado === 'ACTIVO');
    if (!dest) return [];

    let assigned = all.filter(r => r.locationIds?.includes(dest.id));
    const areaId = this._destinationAreaId();
    if (areaId && areaId !== '8b8b9c8c-1e2a-43cf-8a27-024848bb0000' && this._movementType() !== 'TRASLADO_AREA') {
      assigned = assigned.filter(r => r.area?.id === areaId);
    }
    return assigned;
  });

  filteredActivos = computed(() => {
    const term = this.searchQuery().toLowerCase().trim();
    const activeMovementActivoIds = new Set<string>();
    this._movements().forEach(m => {
      if (m.status === 'PENDING' || m.status === 'EN_TRANSIT') {
        m.activoIds.forEach((id: string) => activeMovementActivoIds.add(id));
      }
    });

    const selectedIds = new Set(this._selectedActivos().map(a => a.id));

    const todos = this._activos().filter(a =>
      a.estado !== 'BAJA' &&
      a.estado !== 'RECHAZADO' &&
      a.estado !== 'EN_TRANSITO' &&
      !activeMovementActivoIds.has(a.id) &&
      !selectedIds.has(a.id)
    );

    if (!term) return todos;
    return todos.filter(a =>
      a.placa.toLowerCase().includes(term) ||
      (a.serial && a.serial.toLowerCase().includes(term)) ||
      (a.marca && a.marca.toLowerCase().includes(term)) ||
      (a.modelo && a.modelo.toLowerCase().includes(term))
    );
  });

  filteredMovementTypes = computed(() => {
    const list = this._selectedActivos();
    const activo = list.length > 0 ? list[0] : null;
    const canHurto = this.roleService.canRegisterHurto();

    let types = this.movementTypes.filter(([key]) =>
      !['SIM_TRASLADO', 'SIM_ASIGNACION', 'SIM_CAMBIO', 'SIM_RETIRO', 'SIM_RETIRO_TOTAL', 'REINGRESO_SOPORTE', 'RETORNO_POR_RECHAZO'].includes(key)
    );

    if (!canHurto) {
      types = types.filter(([key]) => key !== 'HURTO_PERDIDA');
    }

    if (activo) {
      if (activo.estado === 'MANTENIMIENTO') {
        const loc = this._locations().find(l => l.id === activo.locationId);
        const originType = loc?.tipo;
        const isOriginBodega = originType === 'PUNTO_TI' || originType === 'BODEGA';

        if (originType === 'PROVEEDOR') {
          types = types.filter(([key]) => key === 'RETORNO_PROVEEDOR');
        } else if (isOriginBodega) {
          types = types.filter(([key]) => ['ENVIO_PROVEEDOR', 'TRASLADO_REGIONAL'].includes(key));
        } else {
          types = types.filter(([key]) => key === 'TRASLADO_REGIONAL');
        }
      } else {
        const loc = this._locations().find(l => l.id === activo.locationId);
        const originType = loc?.tipo;
        const isOriginBodega = originType === 'PUNTO_TI' || originType === 'BODEGA';
        if (isOriginBodega) {
          types = types.filter(([key]) => key !== 'RETORNO_PROVEEDOR');
        } else {
          types = types.filter(([key]) => key !== 'RETORNO_PROVEEDOR' && key !== 'ENVIO_PROVEEDOR');
        }
      }
    } else {
      types = types.filter(([key]) => !['RETORNO_PROVEEDOR', 'ENVIO_PROVEEDOR'].includes(key));
    }

    return types;
  });

  onMovementTypeChange(newType: string) {
    this._movementType.set(newType);
    this.movementTypeChange.emit(newType);

    this._destinationAreaId.set('');
    this.destinationAreaIdChange.emit('');

    if (newType === 'HURTO_PERDIDA' && this._selectedActivos().length > 1) {
      const firstOnly = this._selectedActivos().slice(0, 1);
      this._selectedActivos.set(firstOnly);
      this.selectedActivosChange.emit(firstOnly);
      alert('ℹ️ Se ajustó la lista al primer equipo: El reporte de Hurto o Pérdida requiere un denuncio policial individual por equipo.');
    }

    if (newType === 'TRASLADO_AREA' || newType === 'HURTO_PERDIDA') {
      const activo = this._selectedActivos()[0];
      if (activo) {
        const loc = activo.location || this._locations().find(l => l.id === (activo.locationId || (activo as any).location?.id));
        if (loc) {
          this.selectedDestination.set(loc);
          this.destinationSearchQuery.set(loc.nombre);
          this._destinationId.set(loc.id);
          this.destinationIdChange.emit(loc.id);
        }
        if (newType === 'HURTO_PERDIDA') {
          const currentRespId = activo.responsibleId || (activo as any).responsible?.id;
          if (currentRespId) {
            this._responsibleId.set(currentRespId);
            this.responsibleIdChange.emit(currentRespId);
          }
        }
      } else {
        this.clearDestinationSelection();
      }
    } else {
      this.clearDestinationSelection();
    }
  }

  onSearchInput(value: string) {
    this.searchQuery.set(value);
  }

  selectActivo(activo: Activo) {
    if (activo.estado === 'EN_TRANSITO' || (activo.estado as any) === 'EN_TRANSIT') {
      alert(`El equipo con placa "${activo.placa}" se encuentra actualmente EN TRÁNSITO y no puede ser seleccionado para un nuevo movimiento.`);
      return;
    }

    const newOriginId = activo.locationId || (activo as any).location?.id || '';
    const maxAllowed = this.maxAllowedActivos();

    if (this._selectedActivos().length >= maxAllowed) {
      if (maxAllowed === 1) {
        alert('⚠️ El reporte de Hurto o Pérdida solo permite 1 activo por denuncio policial.');
      } else {
        alert(`⚠️ Límite estricto de formato alcanzado:\n\nUn envío permite un máximo de ${maxAllowed} activos para garantizar que el Acta Oficial (GF-FO-29) quepa en una sola hoja carta.\n\nPara enviar más equipos, por favor genere una remesa adicional.`);
      }
      return;
    }

    if (this._selectedActivos().length > 0) {
      const currentOrigin = this._originId();
      if (currentOrigin && newOriginId && currentOrigin !== newOriginId) {
        const originLoc = this._locations().find(l => l.id === currentOrigin);
        const originName = originLoc?.nombre || 'la sede de origen seleccionada';
        const newName = activo.location?.nombre || (activo as any).location?.nombre || 'otra sede';
        alert(`⚠️ No se puede agregar este equipo:\n\nTodos los dispositivos del traslado deben pertenecer a la misma sede de origen ("${originName}").\n\nEl equipo con placa "${activo.placa}" está registrado en "${newName}".`);
        return;
      }

      if (this._selectedActivos().some(a => a.id === activo.id)) {
        return;
      }
    }

    const updatedList = [...this._selectedActivos(), activo];
    this._selectedActivos.set(updatedList);
    this.selectedActivosChange.emit(updatedList);
    this.searchQuery.set('');

    if (!this._originId()) {
      this._originId.set(newOriginId);
      this.originIdChange.emit(newOriginId);
    }

    const allowedKeys = this.filteredMovementTypes().map(([key]) => key);
    if (this._movementType() && !allowedKeys.includes(this._movementType())) {
      this._movementType.set('');
      this.movementTypeChange.emit('');
    }

    const mType = this._movementType();
    if ((mType === 'TRASLADO_AREA' || mType === 'HURTO_PERDIDA') && (activo.location || (activo as any).location || this._locations().find(l => l.id === newOriginId))) {
      const loc = activo.location || (activo as any).location || this._locations().find(l => l.id === newOriginId);
      if (loc) {
        this.selectedDestination.set(loc);
        this.destinationSearchQuery.set(loc.nombre);
        this._destinationId.set(loc.id);
        this.destinationIdChange.emit(loc.id);
      }
      if (mType === 'HURTO_PERDIDA') {
        const currentRespId = activo.responsibleId || (activo as any).responsible?.id || '';
        if (currentRespId) {
          this._responsibleId.set(currentRespId);
          this.responsibleIdChange.emit(currentRespId);
        }
      }
    } else {
      const dest = this.selectedDestination();
      if (dest) {
        const isSameAsOrigin = dest.id === newOriginId;
        const originType = this._locations().find(loc => loc.id === newOriginId)?.tipo;
        const isMaintenance = activo.estado === 'MANTENIMIENTO';
        let isInvalidForMaintenance = false;
        const isDestBodega = dest.tipo === 'PUNTO_TI' || dest.tipo === 'BODEGA';
        if (mType === 'ENVIO_PROVEEDOR') {
          isInvalidForMaintenance = dest.tipo !== 'PROVEEDOR';
        } else if (mType === 'RETORNO_PROVEEDOR') {
          isInvalidForMaintenance = !isDestBodega;
        } else if (mType === 'TRASLADO_REGIONAL' && isMaintenance) {
          isInvalidForMaintenance = !isDestBodega;
        } else if (isMaintenance) {
          isInvalidForMaintenance = (!isDestBodega && dest.tipo !== 'PROVEEDOR') ||
            (dest.tipo === 'PROVEEDOR' && originType === 'PROVEEDOR');
        }

        if (isSameAsOrigin || isInvalidForMaintenance) {
          this.clearDestinationSelection();
        }
      }
    }

    const currentRespEmail = activo.responsible?.email;
    if (currentRespEmail) {
      this.recipientAdded.emit(currentRespEmail);
    } else if (activo.responsibleId) {
      const resp = this._responsables().find(r => r.id === activo.responsibleId);
      if (resp && resp.email) {
        this.recipientAdded.emit(resp.email);
      }
    }
  }

  removeActivoFromRelacion(activoId: string) {
    const updated = this._selectedActivos().filter(a => a.id !== activoId);
    this._selectedActivos.set(updated);
    this.selectedActivosChange.emit(updated);

    if (updated.length === 0) {
      this._originId.set('');
      this.originIdChange.emit('');
      this.searchQuery.set('');
    } else {
      const newOrigin = updated[0].locationId || '';
      this._originId.set(newOrigin);
      this.originIdChange.emit(newOrigin);
    }
  }

  clearAllActivos() {
    this._selectedActivos.set([]);
    this.selectedActivosChange.emit([]);
    this._originId.set('');
    this.originIdChange.emit('');
    this.searchQuery.set('');
  }

  selectDestination(loc: Location) {
    this.selectedDestination.set(loc);
    this.destinationSearchQuery.set(loc.nombre);
    this.showDestinationDropdown.set(false);
    this._destinationId.set(loc.id);
    this.destinationIdChange.emit(loc.id);

    this._destinationAreaId.set('');
    this.destinationAreaIdChange.emit('');
    this._responsibleId.set('');
    this.responsibleIdChange.emit('');
  }

  clearDestinationSelection() {
    this.selectedDestination.set(null);
    this.destinationSearchQuery.set('');
    this.showDestinationDropdown.set(false);
    this._destinationId.set('');
    this.destinationIdChange.emit('');

    this._destinationAreaId.set('');
    this.destinationAreaIdChange.emit('');
    this._responsibleId.set('');
    this.responsibleIdChange.emit('');
  }

  getAvailableDestinationAreas(): Area[] {
    const dest = this.selectedDestination();
    return dest?.areas || [];
  }

  onDestinationAreaChange(areaId: string) {
    this._destinationAreaId.set(areaId);
    this.destinationAreaIdChange.emit(areaId);
    this._responsibleId.set('');
    this.responsibleIdChange.emit('');
  }

  onResponsibleChange(newId: string) {
    this._responsibleId.set(newId);
    this.responsibleIdChange.emit(newId);
    if (newId) {
      const resp = this._responsables().find(r => r.id === newId);
      if (resp && resp.email) {
        this.recipientAdded.emit(resp.email);
      }
    }
  }

  reset() {
    this._selectedActivos.set([]);
    this._originId.set('');
    this._destinationId.set('');
    this._destinationAreaId.set('');
    this._responsibleId.set('');
    this.searchQuery.set('');
    this.destinationSearchQuery.set('');
    this.showDestinationDropdown.set(false);
    this.selectedDestination.set(null);
  }
}
