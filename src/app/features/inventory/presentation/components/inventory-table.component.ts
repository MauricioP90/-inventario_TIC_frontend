import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Activo } from '../../domain/models/activo.model';
import { InstalledSoftwareEvaluation } from '../../../catalogs/domain/models/software.model';
import { GetActivoInstalledSoftwareUseCase } from '../../../catalogs/application/use-cases/software.use-cases';
import { ActivoTelemetryLog } from '../../domain/models/telemetry.model';
import {
  GetActivoTelemetryHistoryUseCase,
  RegisterDeviceHeartbeatUseCase
} from '../../application/use-cases/telemetry.use-cases';

@Component({
  selector: 'app-inventory-table',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-slate-50/50 border-b border-slate-200">
          <tr>
            <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Placa</th>
            <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Tipo</th>
            <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Marca</th>
            <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Modelo</th>
            <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Serial</th>
            <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Ubicación</th>
            <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Estado</th>
            @if (isAdmin) {
              <th class="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Precio Compra</th>
            }
            @if (canEditActivo) {
              <th class="text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider px-6 py-4">Acciones</th>
            }
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          @for (activo of activos; track activo.id) {
            <tr 
              [class.bg-emerald-50/70]="newlyCreatedPlaca === activo.placa"
              [class.hover:bg-emerald-100/50]="newlyCreatedPlaca === activo.placa"
              [class.bg-slate-50]="expandedActivoId() === activo.id"
              class="hover:bg-slate-50/50 transition-all duration-300">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <!-- Botón Desplegable -->
                  <button 
                    type="button"
                    (click)="toggleExpand(activo)"
                    class="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/80 transition-colors"
                    [title]="expandedActivoId() === activo.id ? 'Ocultar detalles' : 'Ver aplicativos y detalles'">
                    <span class="text-[10px] font-bold select-none">{{ expandedActivoId() === activo.id ? '▲' : '▼' }}</span>
                  </button>

                  <div class="flex flex-col items-start gap-1">
                    <span 
                      (click)="toggleExpand(activo)"
                      class="font-bold text-slate-700 underline decoration-indigo-200 underline-offset-4 font-mono text-xs cursor-pointer hover:text-indigo-600 transition-colors"
                      title="Clic para desplegar ficha rápida">
                      {{ activo.placa }}
                    </span>
                    @if (activo.facturaUrl) {
                      <a 
                        [href]="activo.facturaUrl" 
                        target="_blank" 
                        title="Ver Factura Adjunta"
                        class="inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900 border border-indigo-200/80 px-2 py-0.5 rounded-md transition-all">
                        📄 Factura
                      </a>
                    }
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-50 text-slate-600 border-slate-200">
                  {{ typeMap[activo.tipoActivoId]?.label || activo.tipoActivoId }}
                </span>
              </td>
              <td class="px-6 py-4 font-medium text-slate-600">{{ activo.marca }}</td>
              <td class="px-6 py-4 font-medium text-slate-600">{{ activo.modelo }}</td>
              <td class="px-6 py-4 text-[11px] font-mono text-slate-400 tracking-tighter">{{ activo.serial }}</td>
              <td class="px-6 py-4 text-slate-500 font-medium">
                <div>{{ locationMap[activo.locationId]?.nombre || activo.locationId }}</div>
                <div class="text-[11px] text-slate-400 font-normal mt-0.5">
                  {{ activo.area?.nombre || 'NO APLICA' }}
                </div>
              </td>
              <td class="px-6 py-4">
                @if (activo.estado === 'EN_TRANSITO') {
                  <a [routerLink]="['/movements']"
                     [queryParams]="{ search: activo.placa, tab: 'PENDING' }"
                     title="Ver traslado de este equipo en Movimientos →"
                     class="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-lg text-white shadow-sm bg-indigo-600 hover:bg-indigo-700 hover:ring-2 hover:ring-indigo-300 hover:scale-105 transition-all cursor-pointer">
                    {{ getStatusLabel(activo.estado) }}
                  </a>
                } @else if (activo.estado === 'RECHAZADO') {
                  <a [routerLink]="['/movements']"
                     [queryParams]="{ search: activo.placa, tab: 'HISTORY' }"
                     title="Ver novedad o motivo de rechazo en Movimientos →"
                     class="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-lg text-white shadow-sm bg-red-600 hover:bg-red-700 hover:ring-2 hover:ring-red-300 hover:scale-105 transition-all cursor-pointer">
                    {{ getStatusLabel(activo.estado) }}
                  </a>
                } @else if (activo.estado === 'MANTENIMIENTO') {
                  <a [routerLink]="['/maintenance']"
                     [queryParams]="{ search: activo.placa }"
                     title="Ver orden de mantenimiento →"
                     class="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-lg text-white shadow-sm bg-amber-500 hover:bg-amber-600 hover:ring-2 hover:ring-amber-300 hover:scale-105 transition-all cursor-pointer">
                    {{ getStatusLabel(activo.estado) }}
                  </a>
                } @else {
                  <span 
                    [style.backgroundColor]="getStatusColor(activo.estado)"
                    class="text-[10px] font-bold px-2.5 py-1 rounded-lg text-white shadow-sm inline-block">
                    {{ getStatusLabel(activo.estado) }}
                  </span>
                }
              </td>
              @if (isAdmin) {
                <td class="px-6 py-4 font-medium text-indigo-600">
                  {{ activo.precioCompra ? '$ ' + (activo.precioCompra | number:'1.2-2') : '—' }}
                </td>
              }
              @if (canEditActivo) {
                <td class="px-6 py-4 text-right">
                  @if (activo.estado !== 'BAJA') {
                    <button 
                      (click)="edit.emit(activo)"
                      class="text-indigo-600 hover:text-indigo-900 font-medium transition-all">
                      Editar
                    </button>
                  } @else {
                    <span class="text-slate-300 font-medium cursor-not-allowed" title="Equipo inactivo, no modificable">
                      Editar
                    </span>
                  }
                </td>
              }
            </tr>

            <!-- Fila Desplegable Grande (Acordeón de Software y Detalles) -->
            @if (expandedActivoId() === activo.id) {
              <tr class="bg-slate-50/80 border-b border-slate-200 transition-all">
                <td [attr.colspan]="(isAdmin ? 8 : 7) + (canEditActivo ? 1 : 0)" class="px-8 py-5">
                  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    <!-- Columna 1 y 2: Aplicativos y Homologación de Software -->
                    <div class="lg:col-span-2 space-y-3">
                      <div class="flex items-center justify-between">
                        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                          <span class="text-indigo-600 font-mono font-bold">&lt;/&gt;</span> Aplicativos Corporativos y Versiones
                        </h4>
                        @if (canEditActivo && admitsSoftware(activo)) {
                          <button
                            type="button"
                            (click)="edit.emit(activo)"
                            class="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-1">
                            <span>Gestionar Software en Ficha</span>
                            <span>→</span>
                          </button>
                        }
                      </div>

                      @if (!admitsSoftware(activo)) {
                        <div class="p-3.5 bg-white border border-slate-200/90 rounded-xl text-xs text-slate-400 italic flex items-center gap-2">
                          <span class="text-base">ℹ️</span>
                          <span>Este tipo de activo ({{ typeMap[activo.tipoActivoId]?.label || 'General' }}) no está parametrizado para admitir software corporativo.</span>
                        </div>
                      } @else if (softwareMap()[activo.id]?.loading) {
                        <div class="p-4 bg-white border border-slate-200 rounded-xl flex items-center gap-2.5 text-xs text-slate-500">
                          <div class="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                          <span>Consultando aplicativos y versiones homologadas...</span>
                        </div>
                      } @else if (softwareMap()[activo.id]?.items?.length) {
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                          @for (app of softwareMap()[activo.id]?.items; track app.historyId) {
                            <div class="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between gap-2.5 hover:border-indigo-200 transition-all">
                              <div class="flex items-start justify-between gap-2">
                                <div>
                                  <span class="font-bold text-slate-800 text-xs block">{{ app.appName }}</span>
                                  <span class="text-[10px] text-slate-400 font-mono">v{{ app.installedVersion }}</span>
                                </div>

                                <!-- Semáforo de Versión -->
                                @if (app.semaforo === 'AL_DIA') {
                                  <span class="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    Al día
                                  </span>
                                } @else if (app.semaforo === 'DESACTUALIZADO') {
                                  <span class="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 animate-pulse" [title]="'Requiere actualizar a versión vigente oficial ' + app.vigenteVersion">
                                    <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                    Requiere v{{ app.vigenteVersion }}
                                  </span>
                                } @else if (app.semaforo === 'BETA') {
                                  <span class="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                    <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    Versión Beta
                                  </span>
                                } @else {
                                  <span class="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                    v{{ app.installedVersion }}
                                  </span>
                                }
                              </div>

                              <div class="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-100">
                                <span>Instalado: {{ app.fechaInstalacion | date:'dd/MM/yyyy' }}</span>
                                @if (app.licencia) {
                                  <span class="font-mono text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 truncate max-w-[130px]" [title]="'Licencia: ' + app.licencia">🔑 {{ app.licencia }}</span>
                                }
                              </div>
                            </div>
                          }
                        </div>
                      } @else {
                        <div class="p-4 bg-white border border-slate-200 rounded-xl text-xs text-slate-400 italic flex items-center justify-between">
                          <span>No registra aplicativos instalados actualmente.</span>
                          @if (canEditActivo) {
                            <button 
                              type="button" 
                              (click)="edit.emit(activo)" 
                              class="text-indigo-600 font-bold hover:underline ml-2">
                              + Instalar aplicativo
                            </button>
                          }
                        </div>
                      }

                      <!-- Bloque de Telemetría y Geocerca (Solo para tipos que admiten telemetría) -->
                      @if (admitsTelemetry(activo)) {
                        <div class="pt-3 border-t border-slate-200/70 space-y-2.5">
                          <div class="flex flex-wrap items-center justify-between gap-2">
                            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                              <span>📡</span> Telemetría de Arranque y Geocerca (GPS)
                            </h4>
                            @if (isAdmin && activo.estado !== 'BAJA') {
                              <div class="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  [disabled]="telemetryMap()[activo.id]?.simulating"
                                  (click)="simulateHeartbeat(activo, false)"
                                  title="Simular reporte de encendido dentro de su sede asignada"
                                  class="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer disabled:opacity-50">
                                  ✅ Simular en Sede
                                </button>
                                <button
                                  type="button"
                                  [disabled]="telemetryMap()[activo.id]?.simulating"
                                  (click)="simulateHeartbeat(activo, true)"
                                  title="Simular reporte de encendido fuera de la sede (dispara controversia y alerta de correo)"
                                  class="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer disabled:opacity-50">
                                  🚨 Simular Controversia GPS
                                </button>
                              </div>
                            }
                          </div>

                          @if (telemetryMap()[activo.id]?.loading) {
                            <div class="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-2 text-xs text-slate-500">
                              <div class="animate-spin h-3.5 w-3.5 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                              <span>Consultando último reporte de ubicación...</span>
                            </div>
                          } @else if (telemetryMap()[activo.id]?.latest; as latestLog) {
                            <div
                              class="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                              [ngClass]="{
                                'bg-emerald-50/50 border-emerald-200': latestLog.status === 'CONFORME',
                                'bg-blue-50/50 border-blue-200': latestLog.status === 'EN_TRANSITO_AUTORIZADO',
                                'bg-rose-50/70 border-rose-300': latestLog.status === 'CONTROVERSIA_UBICACION',
                                'bg-white border-slate-200': latestLog.status === 'SIN_COORDENADAS_SEDE'
                              }">
                              <div class="space-y-1">
                                <div class="flex flex-wrap items-center gap-2">
                                  @if (latestLog.status === 'CONFORME') {
                                    <span class="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      🟢 En Sede Autorizada ({{ latestLog.distanceKm ?? 0 }} km)
                                    </span>
                                  } @else if (latestLog.status === 'EN_TRANSITO_AUTORIZADO') {
                                    <span class="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                      🔵 En Tránsito / Taller Autorizado ({{ latestLog.distanceKm ?? 0 }} km)
                                    </span>
                                  } @else if (latestLog.status === 'CONTROVERSIA_UBICACION') {
                                    <span class="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                                      🚨 Controversia de Ubicación · Desviación de {{ latestLog.distanceKm }} km
                                    </span>
                                  } @else {
                                    <span class="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                      ⚪ Sede sin coordenadas GPS
                                    </span>
                                  }
                                  <span class="text-[10px] text-slate-400">
                                    Último arranque: {{ latestLog.reportedAt | date:'dd/MM/yyyy HH:mm' }}
                                  </span>
                                </div>
                                <p class="text-xs text-slate-700 font-medium">
                                  {{ latestLog.observaciones }}
                                </p>
                              </div>

                              <div class="flex items-center gap-2 shrink-0">
                                <a
                                  [href]="'https://www.google.com/maps?q=' + latestLog.reportedCoords"
                                  target="_blank"
                                  class="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-all">
                                  🗺️ Mapa ({{ latestLog.reportedCoords }})
                                </a>
                              </div>
                            </div>
                          } @else {
                            <div class="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-400 italic">
                              Este dispositivo aún no registra reportes automáticos de arranque.
                            </div>
                          }
                        </div>
                      }
                    </div>

                    <!-- Columna 3: Custodio y Conectividad SIM -->
                    <div class="space-y-3">
                      <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <span>📶</span> Custodia y SIM Cards
                      </h4>
                      
                      <div class="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
                        <!-- Responsable / Custodio -->
                        <div>
                          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Responsable Asignado</span>
                          @if (activo.responsible) {
                            <div class="flex items-center gap-2.5 mt-1.5">
                              <div class="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[11px] font-bold text-indigo-600 shrink-0">
                                {{ activo.responsible.nombre.charAt(0) }}
                              </div>
                              <div class="truncate">
                                <span class="text-xs font-bold text-slate-800 block truncate leading-tight">{{ activo.responsible.nombre }}</span>
                                <span class="text-[10px] text-slate-400 block truncate mt-0.5">
                                  {{ activo.responsible.cargo?.nombre || activo.responsible.area?.nombre || 'Custodio' }}
                                </span>
                              </div>
                            </div>
                          } @else {
                            <span class="text-xs text-slate-400 italic mt-1 block">Sin responsable asignado (Disponible en sede)</span>
                          }
                        </div>

                        <!-- SIM Cards Vinculadas -->
                        <div class="pt-2.5 border-t border-slate-100">
                          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SIM Cards Vinculadas</span>
                          @if (activo.simCards && activo.simCards.length > 0) {
                            <div class="space-y-1.5 mt-1.5">
                              @for (sim of activo.simCards; track sim.id) {
                                <div class="flex items-center justify-between text-xs bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                                  <span class="font-bold text-slate-700 font-mono text-[11px]">📱 {{ sim.numero }}</span>
                                  <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">{{ sim.operador }}</span>
                                </div>
                              }
                            </div>
                          } @else {
                            <span class="text-xs text-slate-400 italic mt-1 block">Sin SIM Cards asignadas</span>
                          }
                        </div>

                        <!-- Botón de apertura a Ficha Completa -->
                        @if (canEditActivo) {
                          <div class="pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              (click)="edit.emit(activo)"
                              class="w-full text-center py-2 px-3 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg text-xs font-bold border border-slate-200 transition-all cursor-pointer">
                              Abrir Ficha Técnica Completa ➜
                            </button>
                          </div>
                        }
                      </div>
                    </div>

                  </div>
                </td>
              </tr>
            }
          } @empty {
            <tr><td [attr.colspan]="(isAdmin ? 8 : 7) + (canEditActivo ? 1 : 0)" class="px-6 py-12 text-center text-slate-400 text-sm">Sin activos registrados</td></tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class InventoryTableComponent {
  private readonly getInstalledSoftwareUC = inject(GetActivoInstalledSoftwareUseCase);
  private readonly getTelemetryHistoryUC = inject(GetActivoTelemetryHistoryUseCase);
  private readonly registerHeartbeatUC = inject(RegisterDeviceHeartbeatUseCase);

  @Input() activos: Activo[] = [];
  @Input() typeMap: Record<string, any> = {};
  @Input() locationMap: Record<string, any> = {};
  @Input() isAdmin: boolean = false;
  @Input() canEditActivo: boolean = false;
  @Input() newlyCreatedPlaca: string | null = null;

  @Output() edit = new EventEmitter<Activo>();

  expandedActivoId = signal<string | null>(null);
  softwareMap = signal<Record<string, { loading: boolean; error: string | null; items: InstalledSoftwareEvaluation[] }>>({});
  telemetryMap = signal<Record<string, { loading: boolean; simulating: boolean; latest: ActivoTelemetryLog | null }>>({});

  toggleExpand(activo: Activo): void {
    if (this.expandedActivoId() === activo.id) {
      this.expandedActivoId.set(null);
      return;
    }

    this.expandedActivoId.set(activo.id);

    if (this.admitsSoftware(activo) && !this.softwareMap()[activo.id]) {
      this.loadSoftware(activo.id);
    }
    if (this.admitsTelemetry(activo) && !this.telemetryMap()[activo.id]) {
      this.loadTelemetry(activo.id);
    }
  }

  loadTelemetry(activoId: string): void {
    this.telemetryMap.update(map => ({
      ...map,
      [activoId]: { loading: true, simulating: false, latest: map[activoId]?.latest ?? null }
    }));

    this.getTelemetryHistoryUC.execute(activoId).subscribe({
      next: (logs) => {
        this.telemetryMap.update(map => ({
          ...map,
          [activoId]: { loading: false, simulating: false, latest: logs.length > 0 ? logs[0] : null }
        }));
      },
      error: () => {
        this.telemetryMap.update(map => ({
          ...map,
          [activoId]: { loading: false, simulating: false, latest: null }
        }));
      }
    });
  }

  simulateHeartbeat(activo: Activo, simulateControversy: boolean): void {
    const assignedLoc = this.locationMap[activo.locationId] || activo.location;
    let baseLat = 4.6534;
    let baseLon = -74.1135;

    if (assignedLoc?.coordenadas) {
      const parts = String(assignedLoc.coordenadas).split(',');
      if (parts.length === 2) {
        const parsedLat = parseFloat(parts[0].trim());
        const parsedLon = parseFloat(parts[1].trim());
        if (!isNaN(parsedLat) && !isNaN(parsedLon)) {
          baseLat = parsedLat;
          baseLon = parsedLon;
        }
      }
    }

    // Si es simulación en sede: variación mínima (~50 metros). Si es controversia: ~75 km de distancia (ej. otra ciudad/terminal)
    const latitud = simulateControversy ? +(baseLat - 0.5114).toFixed(5) : +(baseLat + 0.0004).toFixed(5);
    const longitud = simulateControversy ? +(baseLon + 0.4869).toFixed(5) : +(baseLon + 0.0004).toFixed(5);

    this.telemetryMap.update(map => ({
      ...map,
      [activo.id]: {
        loading: false,
        simulating: true,
        latest: map[activo.id]?.latest ?? null
      }
    }));

    this.registerHeartbeatUC.execute({
      placa: activo.placa,
      latitud,
      longitud,
      forceAlert: simulateControversy
    }).subscribe({
      next: (newLog) => {
        this.telemetryMap.update(map => ({
          ...map,
          [activo.id]: { loading: false, simulating: false, latest: newLog }
        }));
      },
      error: () => {
        this.telemetryMap.update(map => ({
          ...map,
          [activo.id]: {
            loading: false,
            simulating: false,
            latest: map[activo.id]?.latest ?? null
          }
        }));
      }
    });
  }

  admitsSoftware(activo: Activo): boolean {
    if (activo.tipoActivo?.admiteSoftware !== undefined) {
      return activo.tipoActivo.admiteSoftware;
    }
    return this.typeMap[activo.tipoActivoId]?.admiteSoftware === true;
  }

  admitsTelemetry(activo: Activo): boolean {
    if (activo.tipoActivo?.admiteTelemetria !== undefined) {
      return activo.tipoActivo.admiteTelemetria;
    }
    if (this.typeMap[activo.tipoActivoId]?.admiteTelemetria !== undefined) {
      return this.typeMap[activo.tipoActivoId]?.admiteTelemetria === true;
    }
    return this.admitsSoftware(activo);
  }

  loadSoftware(activoId: string): void {
    this.softwareMap.update(map => ({
      ...map,
      [activoId]: { loading: true, error: null, items: [] }
    }));

    this.getInstalledSoftwareUC.execute(activoId).subscribe({
      next: (items) => {
        this.softwareMap.update(map => ({
          ...map,
          [activoId]: { loading: false, error: null, items }
        }));
      },
      error: () => {
        this.softwareMap.update(map => ({
          ...map,
          [activoId]: { loading: false, error: 'Error al consultar aplicativos', items: [] }
        }));
      }
    });
  }

  getStatusColor(estado: string): string {
    const colors: Record<string, string> = {
      'DISPONIBLE': '#10b981',
      'BODEGA': '#10b981',
      'OPERACION': '#2563eb',
      'MANTENIMIENTO': '#f59e0b',
      'BAJA': '#dc2626',
      'RECHAZADO': '#ef4444',
      'EN_TRANSITO': '#6366f1',
      'EN_TRANSIT': '#6366f1'
    };
    return colors[estado?.toUpperCase()] || '#64748b';
  }

  getStatusLabel(estado: string): string {
    const labels: Record<string, string> = {
      'DISPONIBLE': 'DISPONIBLE',
      'BODEGA': 'DISPONIBLE',
      'OPERACION': 'OPERACIÓN',
      'MANTENIMIENTO': 'MANTENIMIENTO',
      'BAJA': 'INACTIVO',
      'RECHAZADO': 'RECHAZADO / NOVEDAD',
      'EN_TRANSITO': 'EN TRÁNSITO',
      'EN_TRANSIT': 'EN TRÁNSITO'
    };
    return labels[estado?.toUpperCase()] || estado;
  }
}

