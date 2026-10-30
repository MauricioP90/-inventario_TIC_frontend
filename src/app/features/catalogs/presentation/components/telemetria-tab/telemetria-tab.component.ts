import { Component, OnInit, inject, signal, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TipoActivo } from '../../../domain/models/tipo-activo.model';
import { GetAllTiposUseCase } from '../../../application/use-cases/get-all-tipos.use-case';
import { UpdateTipoUseCase } from '../../../application/use-cases/update-tipo.use-case';
import { ActivoTelemetryLog } from '../../../../inventory/domain/models/telemetry.model';
import {
  GetTelemetryOverviewUseCase,
  UpdateTelemetrySettingsUseCase,
  SendTelemetryTestAlertUseCase
} from '../../../../inventory/application/use-cases/telemetry.use-cases';
import { Cargo } from '../../../../responsables/domain/models/cargo.model';
import { GetAllCargosUseCase } from '../../../../responsables/application/use-cases/get-all-cargos.use-case';

@Component({
  selector: 'app-telemetria-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- Banner Informativo Superior -->
      <div class="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-start sm:items-center gap-3.5">
          <div class="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 text-xl shrink-0">
            📡
          </div>
          <div>
            <h3 class="text-base font-bold text-white">Centro de Control de Telemetría y Geocercas (GPS)</h3>
            <p class="text-xs text-slate-300 mt-0.5">
              Define el radio permitido alrededor de cada sede, la ventana anti-spam de alertas por correo y qué tipos de dispositivos reportan ubicación al encender.
            </p>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2.5 text-xs shrink-0">
          <button
            type="button"
            (click)="showEmailPreview.set(true)"
            class="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-semibold transition-all cursor-pointer flex items-center gap-1.5">
            <span>👁️</span> Ver Plantilla de Correo
          </button>
          <button
            type="button"
            (click)="sendTestEmail()"
            [disabled]="sendingTestEmail()"
            class="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5">
            @if (sendingTestEmail()) {
              <div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Enviando...</span>
            } @else {
              <span>📨</span>
              <span>Enviar Correo de Prueba</span>
            }
          </button>
          <div class="text-right px-4 py-2 bg-white/5 rounded-xl border border-white/10">
            <span class="block text-indigo-300 font-semibold">Tipos Monitoreados</span>
            <span class="text-lg font-bold text-white">{{ monitoredTypesCount() }} / {{ tipos().length }}</span>
          </div>
          <div class="text-right px-4 py-2 bg-rose-500/15 rounded-xl border border-rose-400/30">
            <span class="block text-rose-200 font-semibold">Controversias Recientes</span>
            <span class="text-lg font-bold text-rose-300">{{ controversies().length }}</span>
          </div>
        </div>
      </div>

      <!-- Grid Principal: Columna Izquierda (Parámetros de Geocerca) + Columna Derecha (Tipos que admiten Telemetría) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

        <!-- 1. Parámetros Globales de Geocerca (5 cols) -->
        <div class="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5 flex flex-col justify-between">
          <div class="space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 class="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span>🎯</span> Parámetros de Geocerca
                </h4>
                <p class="text-xs text-slate-400 mt-0.5">Tolerancia de distancia Haversine y alertas automáticas</p>
              </div>
              <span
                class="text-[11px] font-bold px-2.5 py-1 rounded-full border"
                [class.bg-emerald-50]="alertsEnabled"
                [class.text-emerald-700]="alertsEnabled"
                [class.border-emerald-200]="alertsEnabled"
                [class.bg-slate-100]="!alertsEnabled"
                [class.text-slate-600]="!alertsEnabled"
                [class.border-slate-200]="!alertsEnabled">
                {{ alertsEnabled ? '🔔 Alertas Activas' : '🔕 Alertas Pausadas' }}
              </span>
            </div>

            <!-- Radio de Geocerca en KM -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Radio de Geocerca Permitido (km)
                </label>
                <span class="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                  {{ toleranceKm }} km ({{ (toleranceKm * 1000) | number:'1.0-0' }} m)
                </span>
              </div>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                [(ngModel)]="toleranceKm"
                class="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-semibold text-slate-800"
              />
              <!-- Presets rápidos -->
              <div class="flex flex-wrap items-center gap-1.5 pt-1">
                <span class="text-[10px] text-slate-400 font-semibold mr-1">Ajustes sugeridos:</span>
                <button
                  type="button"
                  (click)="toleranceKm = 0.5"
                  class="text-[10px] font-bold px-2 py-0.5 rounded-md border transition-colors cursor-pointer"
                  [class.bg-indigo-600]="toleranceKm === 0.5"
                  [class.text-white]="toleranceKm === 0.5"
                  [class.border-indigo-600]="toleranceKm === 0.5"
                  [class.bg-slate-50]="toleranceKm !== 0.5"
                  [class.text-slate-600]="toleranceKm !== 0.5"
                  [class.border-slate-200]="toleranceKm !== 0.5">
                  0.5 km (GPS Estricto)
                </button>
                <button
                  type="button"
                  (click)="toleranceKm = 1.5"
                  class="text-[10px] font-bold px-2 py-0.5 rounded-md border transition-colors cursor-pointer"
                  [class.bg-indigo-600]="toleranceKm === 1.5"
                  [class.text-white]="toleranceKm === 1.5"
                  [class.border-indigo-600]="toleranceKm === 1.5"
                  [class.bg-slate-50]="toleranceKm !== 1.5"
                  [class.text-slate-600]="toleranceKm !== 1.5"
                  [class.border-slate-200]="toleranceKm !== 1.5">
                  1.5 km (Recomendado Terminal)
                </button>
                <button
                  type="button"
                  (click)="toleranceKm = 3.0"
                  class="text-[10px] font-bold px-2 py-0.5 rounded-md border transition-colors cursor-pointer"
                  [class.bg-indigo-600]="toleranceKm === 3.0"
                  [class.text-white]="toleranceKm === 3.0"
                  [class.border-indigo-600]="toleranceKm === 3.0"
                  [class.bg-slate-50]="toleranceKm !== 3.0"
                  [class.text-slate-600]="toleranceKm !== 3.0"
                  [class.border-slate-200]="toleranceKm !== 3.0">
                  3.0 km (Red Wi-Fi / Amplio)
                </button>
              </div>
              <p class="text-[11px] text-slate-400 leading-relaxed">
                Si un dispositivo enciende a una distancia mayor de <strong>{{ toleranceKm }} km</strong> de su sede asignada (sin traslado ni mantenimiento activo), se marcará como controversia.
              </p>
            </div>

            <!-- Ventana Anti-Spam en Horas -->
            <div class="space-y-1.5 pt-2 border-t border-slate-100">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Ventana Anti-Spam de Correos (Horas)
                </label>
                <span class="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                  {{ cooldownHours }} h
                </span>
              </div>
              <input
                type="number"
                step="1"
                min="0"
                max="168"
                [(ngModel)]="cooldownHours"
                class="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-semibold text-slate-800"
              />
              <p class="text-[11px] text-slate-400">
                Evita enviar múltiples correos si el equipo se reinicia varias veces en la misma ubicación no autorizada. (Usa <code>0</code> para enviar correo en cada encendido).
              </p>
            </div>

            <!-- Switch de Envío Automático de Correos -->
            <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span class="text-xs font-bold text-slate-700 block">Notificación Automática por Correo</span>
                <span class="text-[11px] text-slate-400">Despachar alerta a los buzones suscritos a <em>Alerta GPS</em></span>
              </div>
              <button
                type="button"
                (click)="alertsEnabled = !alertsEnabled"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer"
                [class.bg-indigo-600]="alertsEnabled"
                [class.bg-slate-300]="!alertsEnabled">
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-xs"
                  [class.translate-x-6]="alertsEnabled"
                  [class.translate-x-1]="!alertsEnabled">
                </span>
              </button>
            </div>

            <!-- Canales de Alerta: WhatsApp (Wasapi / Meta) -->
            <div class="pt-3 border-t border-slate-100 space-y-2.5">
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span>💬</span> Notificación Automática por WhatsApp
                  </span>
                  <span class="text-[11px] text-slate-400">Despachar plantilla de utilidad oficial a celulares</span>
                </div>
                <button
                  type="button"
                  (click)="whatsappEnabled = !whatsappEnabled"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer"
                  [class.bg-emerald-600]="whatsappEnabled"
                  [class.bg-slate-300]="!whatsappEnabled">
                  <span
                    class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-xs"
                    [class.translate-x-6]="whatsappEnabled"
                    [class.translate-x-1]="!whatsappEnabled">
                  </span>
                </button>
              </div>

              @if (whatsappEnabled) {
                <div class="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5 animate-fade-in">
                  <!-- Checkbox notificar al custodio -->
                  <label class="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      [(ngModel)]="whatsappNotifyCustodian"
                      class="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div class="text-xs">
                      <span class="font-bold text-slate-800 block">Notificar al Custodio Titular</span>
                      <span class="text-[11px] text-slate-500">Enviar WhatsApp al celular del responsable asignado al activo</span>
                    </div>
                  </label>

                  <!-- Botón elegir cargos -->
                  <div class="pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                    <div>
                      <span class="text-[11px] font-bold text-emerald-950 block">Destinatarios por Cargo</span>
                      <span class="text-[10px] text-emerald-800">
                        {{ selectedCargosCount() }} cargo{{ selectedCargosCount() !== 1 ? 's' : '' }} seleccionado{{ selectedCargosCount() !== 1 ? 's' : '' }}
                      </span>
                    </div>
                    <button
                      type="button"
                      (click)="showCargoModal.set(true)"
                      class="px-2.5 py-1.5 bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs">
                      <span>👥</span>
                      <span>Elegir Cargos</span>
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="pt-4 border-t border-slate-100">
            <button
              type="button"
              (click)="saveSettings()"
              [disabled]="savingSettings()"
              class="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer">
              {{ savingSettings() ? 'Guardando configuración...' : '💾 Guardar Parámetros de Geocerca' }}
            </button>
          </div>
        </div>

        <!-- 2. Matriz de Dispositivos que Admiten Telemetría (7 cols) -->
        <div class="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 class="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>💻</span> Tipos de Dispositivo que Admiten Telemetría GPS
              </h4>
              <p class="text-xs text-slate-400 mt-0.5">
                Activa o desactiva qué categorías de hardware están autorizadas para enviar reportes automáticos de ubicación al encender (independiente de si admiten software).
              </p>
            </div>
          </div>

          @if (loading()) {
            <div class="py-12 text-center text-slate-400 text-xs">
              Cargando catálogo de tipos de dispositivo...
            </div>
          } @else {
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
              @for (tipo of tipos(); track tipo.id) {
                <div
                  class="p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3"
                  [class.bg-indigo-50/40]="tipo.admiteTelemetria"
                  [class.border-indigo-200]="tipo.admiteTelemetria"
                  [class.bg-slate-50/60]="!tipo.admiteTelemetria"
                  [class.border-slate-200]="!tipo.admiteTelemetria">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold text-slate-800 truncate">{{ tipo.nombre }}</span>
                      @if (tipo.admiteSoftware) {
                        <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-600" title="Este tipo también admite control de software">
                          &lt;/&gt; SW
                        </span>
                      }
                    </div>
                    <span
                      class="text-[10px] font-semibold mt-0.5 block"
                      [class.text-indigo-600]="tipo.admiteTelemetria"
                      [class.text-slate-400]="!tipo.admiteTelemetria">
                      {{ tipo.admiteTelemetria ? '📡 Monitoreo de arranque habilitado' : '⚪ Sin monitoreo GPS' }}
                    </span>
                  </div>

                  <button
                    type="button"
                    (click)="toggleTipoTelemetria(tipo)"
                    [disabled]="togglingTipoId() === tipo.id"
                    class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50"
                    [class.bg-indigo-600]="tipo.admiteTelemetria"
                    [class.bg-slate-300]="!tipo.admiteTelemetria"
                    [title]="tipo.admiteTelemetria ? 'Desactivar telemetría para ' + tipo.nombre : 'Activar telemetría para ' + tipo.nombre">
                    <span
                      class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-xs"
                      [class.translate-x-6]="tipo.admiteTelemetria"
                      [class.translate-x-1]="!tipo.admiteTelemetria">
                    </span>
                  </button>
                </div>
              }
            </div>
          }
        </div>

      </div>

      <!-- 3. Bandeja de Controversias de Ubicación Recientes -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-100 gap-3">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-base">
              🚨
            </div>
            <div>
              <h4 class="text-sm font-bold text-slate-800">Bandeja de Controversias de Ubicación Detectadas</h4>
              <p class="text-xs text-slate-400">
                Equipos que reportaron encendido fuera del radio de geocerca ({{ toleranceKm }} km) sin orden de traslado ni mantenimiento activo
              </p>
            </div>
          </div>
          <button
            type="button"
            (click)="loadData()"
            class="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer">
            ↻ Actualizar Bandeja
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th class="px-6 py-3 font-semibold">Placa</th>
                <th class="px-6 py-3 font-semibold">Sede Oficial (Inventario)</th>
                <th class="px-6 py-3 font-semibold">Ubicación Detectada al Encender</th>
                <th class="px-6 py-3 font-semibold text-center">Desviación</th>
                <th class="px-6 py-3 font-semibold text-center">Alerta Correo</th>
                <th class="px-6 py-3 font-semibold">Fecha / Hora</th>
                <th class="px-6 py-3 font-semibold text-right">Mapa</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @if (controversies().length === 0) {
                <tr>
                  <td colspan="7" class="px-6 py-10 text-center text-slate-400 text-xs">
                    ✅ No se registran controversias de ubicación no autorizada. Todos los equipos monitoreados están conformes o en traslados autorizados.
                  </td>
                </tr>
              } @else {
                @for (item of controversies(); track item.id) {
                  <tr class="hover:bg-rose-50/30 transition-colors">
                    <td class="px-6 py-3.5 font-mono font-bold text-xs text-slate-800">
                      {{ item.placa }}
                    </td>
                    <td class="px-6 py-3.5 text-xs text-slate-600 font-medium">
                      📍 {{ item.expectedLocationName || 'Sin sede' }}
                    </td>
                    <td class="px-6 py-3.5 text-xs text-rose-700 font-bold">
                      📡 {{ item.detectedLocationName || item.reportedCoords }}
                    </td>
                    <td class="px-6 py-3.5 text-center">
                      <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                        {{ item.distanceKm }} km
                      </span>
                    </td>
                    <td class="px-6 py-3.5 text-center">
                      @if (item.alertSent) {
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          📧 Enviada
                        </span>
                      } @else {
                        <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500" title="Omitida por ventana anti-spam o alertas pausadas">
                          ⏳ Cooldown
                        </span>
                      }
                    </td>
                    <td class="px-6 py-3.5 text-xs text-slate-500">
                      {{ item.reportedAt | date:'dd/MM/yyyy HH:mm' }}
                    </td>
                    <td class="px-6 py-3.5 text-right">
                      <a
                        [href]="'https://www.google.com/maps?q=' + item.reportedCoords"
                        target="_blank"
                        class="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline">
                        🗺️ Ver GPS ↗
                      </a>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal de Vista Previa del Correo de Alerta -->
      @if (showEmailPreview()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div class="bg-slate-100 rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden">
            <!-- Cabecera del Modal Simulador de Buzón -->
            <div class="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                  Vista Previa de Correo Automático
                </span>
                <h4 class="text-sm font-bold text-slate-900 mt-1">
                  🚨 [Alerta Telemetría] Posible Movimiento No Autorizado - Placa [1528-003000] (75.4 km fuera de sede)
                </h4>
                <p class="text-xs text-slate-500 mt-0.5">
                  Destinatarios: Todos los correos activos suscritos en la pestaña <strong>Notificaciones</strong>
                </p>
              </div>
              <button
                type="button"
                (click)="showEmailPreview.set(false)"
                class="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
                ✕
              </button>
            </div>

            <!-- Cuerpo Exacto del Correo HTML -->
            <div class="p-6 max-h-[75vh] overflow-y-auto">
              <div class="max-w-xl mx-auto bg-white rounded-2xl overflow-hidden border border-red-200 shadow-sm">
                <div class="bg-gradient-to-br from-red-800 to-red-600 px-7 py-6 text-white">
                  <div class="text-[11px] font-bold uppercase tracking-widest text-red-200 mb-1">
                    Flota La Macarena · Monitoreo Automático de Activos
                  </div>
                  <h2 class="text-lg font-extrabold m-0">
                    🚨 Controversia de Ubicación Detectada (Sin Traslado Autorizado)
                  </h2>
                </div>
                <div class="p-7 text-slate-800 space-y-4">
                  <p class="text-sm leading-relaxed text-slate-700">
                    El servicio de arranque automático del dispositivo ha reportado una ubicación física que
                    <strong>no coincide con su sede asignada en el inventario</strong> y no registra ninguna orden de traslado ni mantenimiento externo activo.
                  </p>

                  <!-- Comparativa de Sedes -->
                  <div class="bg-red-50/80 border border-red-200 rounded-xl p-4 grid grid-cols-11 items-center gap-2">
                    <div class="col-span-5">
                      <div class="text-[10px] font-bold uppercase text-slate-500">📍 Sede Oficial en Inventario</div>
                      <div class="text-sm font-extrabold text-slate-900 mt-1">Terminal del Sur - Bogotá</div>
                      <div class="text-[11px] text-slate-500 font-mono mt-0.5">Coords: 4.5964, -74.1628</div>
                    </div>
                    <div class="col-span-1 text-center text-red-600 font-bold text-lg">➔</div>
                    <div class="col-span-5">
                      <div class="text-[10px] font-bold uppercase text-red-600">📡 Ubicación Detectada al Encender</div>
                      <div class="text-sm font-extrabold text-red-700 mt-1">Terminal Villavicencio (Meta)</div>
                      <div class="text-[11px] text-red-900 font-mono mt-0.5">4.1420, -73.6266 (75.4 km de desviación)</div>
                    </div>
                  </div>

                  <!-- Ficha Técnica -->
                  <div class="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <div class="grid grid-cols-2 bg-slate-50 p-2.5 border-b border-slate-100">
                      <div><strong>Placa:</strong> 1528-003000</div>
                      <div><strong>Tipo:</strong> Dispositivo POS Móvil</div>
                    </div>
                    <div class="grid grid-cols-2 p-2.5 border-b border-slate-100">
                      <div><strong>Equipo:</strong> Ciontek Smart POS CS30</div>
                      <div><strong>Serial:</strong> SN-CS30-994812</div>
                    </div>
                    <div class="grid grid-cols-2 bg-slate-50 p-2.5">
                      <div><strong>Custodio Actual:</strong> Custodio de Prueba</div>
                      <div><strong>IP Reportada:</strong> 181.54.112.90</div>
                    </div>
                  </div>

                  <!-- Botón Google Maps -->
                  <div class="text-center py-2">
                    <a
                      href="https://www.google.com/maps?q=4.1420,-73.6266"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-block bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-xs">
                      🗺️ Ver Coordenada Exacta en Google Maps
                    </a>
                  </div>

                  <p class="text-[11px] text-slate-400 text-center pt-1">
                    Sistema de Inventario y Telemetría Flota La Macarena
                  </p>
                </div>
              </div>
            </div>

            <!-- Pie del Modal -->
            <div class="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between">
              <span class="text-xs text-slate-500">
                Puedes despachar este correo real a tu bandeja de entrada:
              </span>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  (click)="showEmailPreview.set(false)"
                  class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">
                  Cerrar
                </button>
                <button
                  type="button"
                  (click)="sendTestEmail()"
                  [disabled]="sendingTestEmail()"
                  class="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5">
                  <span>📨</span>
                  <span>{{ sendingTestEmail() ? 'Enviando al servidor de correo...' : 'Enviar Ahora a Mi Correo' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Modal: Selección de Cargos para Notificaciones WhatsApp -->
      @if (showCargoModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scale-in">
            <!-- Header Modal -->
            <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-lg">
                  💬
                </div>
                <div>
                  <h3 class="text-sm font-bold text-slate-900">Destinatarios de WhatsApp por Cargo</h3>
                  <p class="text-xs text-slate-400">Los colaboradores activos de estos cargos recibirán alerta GPS en su celular</p>
                </div>
              </div>
              <button
                type="button"
                (click)="showCargoModal.set(false)"
                class="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 cursor-pointer">
                ✕
              </button>
            </div>

            <!-- Body Modal -->
            <div class="p-6 space-y-4">
              <!-- Search & Fast Action Buttons -->
              <div class="flex items-center justify-between gap-3">
                <div class="relative flex-1">
                  <input
                    type="text"
                    [ngModel]="searchCargoTerm()"
                    (ngModelChange)="searchCargoTerm.set($event)"
                    placeholder="Buscar cargo (ej: Líder, Director, Auditor)..."
                    class="w-full pl-3 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                  />
                </div>
                <div class="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    (click)="selectAllCargos()"
                    class="text-emerald-700 hover:text-emerald-900 font-bold hover:underline cursor-pointer">
                    Marcar Todos
                  </button>
                  <span class="text-slate-300">|</span>
                  <button
                    type="button"
                    (click)="clearCargos()"
                    class="text-slate-500 hover:text-slate-700 font-medium hover:underline cursor-pointer">
                    Limpiar
                  </button>
                </div>
              </div>

              <!-- Lista de Cargos con Scroll -->
              <div class="max-h-64 overflow-y-auto space-y-1.5 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
                @if (filteredCargos().length === 0) {
                  <div class="text-center py-8 text-xs text-slate-400">
                    No se encontraron cargos coincidentes con la búsqueda.
                  </div>
                } @else {
                  @for (c of filteredCargos(); track c.id) {
                    <label
                      class="flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none"
                      [class.bg-emerald-50]="isCargoSelected(c.id)"
                      [class.border-emerald-300]="isCargoSelected(c.id)"
                      [class.bg-white]="!isCargoSelected(c.id)"
                      [class.border-slate-200]="!isCargoSelected(c.id)">
                      <div class="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          [checked]="isCargoSelected(c.id)"
                          (change)="toggleCargo(c.id)"
                          class="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span class="text-xs font-bold text-slate-800">{{ c.nombre }}</span>
                      </div>
                      <span class="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {{ c.estado }}
                      </span>
                    </label>
                  }
                }
              </div>

              <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                <span class="text-base shrink-0">💡</span>
                <span>
                  Solo los funcionarios activos que tengan asignado alguno de estos cargos <strong>y cuenten con número telefónico registrado</strong> recibirán el mensaje por WhatsApp.
                </span>
              </div>
            </div>

            <!-- Footer Modal -->
            <div class="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-600">
                {{ selectedCargosCount() }} cargo{{ selectedCargosCount() !== 1 ? 's' : '' }} seleccionado{{ selectedCargosCount() !== 1 ? 's' : '' }}
              </span>
              <button
                type="button"
                (click)="showCargoModal.set(false); saveSettings()"
                class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer">
                Listo y Guardar
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class TelemetriaTabComponent implements OnInit {
  private readonly getAllTiposUC = inject(GetAllTiposUseCase);
  private readonly updateTipoUC = inject(UpdateTipoUseCase);
  private readonly getTelemetryOverviewUC = inject(GetTelemetryOverviewUseCase);
  private readonly updateTelemetrySettingsUC = inject(UpdateTelemetrySettingsUseCase);
  private readonly sendTelemetryTestAlertUC = inject(SendTelemetryTestAlertUseCase);
  private readonly getAllCargosUC = inject(GetAllCargosUseCase);

  @Output() showToast = new EventEmitter<{ type: 'success' | 'error'; message: string }>();

  tipos = signal<TipoActivo[]>([]);
  cargos = signal<Cargo[]>([]);
  controversies = signal<ActivoTelemetryLog[]>([]);
  loading = signal(true);
  savingSettings = signal(false);
  togglingTipoId = signal<string | null>(null);
  showEmailPreview = signal(false);
  sendingTestEmail = signal(false);

  // Modal y Filtro de Cargos
  showCargoModal = signal(false);
  searchCargoTerm = signal('');

  toleranceKm = 1.5;
  cooldownHours = 12;
  alertsEnabled = true;
  whatsappEnabled = true;
  whatsappNotifyCustodian = true;
  whatsappCargoIds = signal<string[]>([]);

  monitoredTypesCount = computed(() => this.tipos().filter(t => t.admiteTelemetria).length);
  selectedCargosCount = computed(() => this.whatsappCargoIds().length);
  filteredCargos = computed(() => {
    const term = this.searchCargoTerm().toLowerCase().trim();
    return this.cargos().filter(c => !term || c.nombre.toLowerCase().includes(term));
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.getAllTiposUC.execute().subscribe({
      next: (tipos) => {
        this.tipos.set(tipos);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    this.getAllCargosUC.execute().subscribe({
      next: (cargos) => {
        this.cargos.set(cargos.filter(c => c.estado === 'ACTIVO'));
      },
      error: () => {}
    });

    this.getTelemetryOverviewUC.execute().subscribe({
      next: (overview) => {
        if (overview.settings) {
          this.toleranceKm = overview.settings.toleranceKm;
          this.cooldownHours = overview.settings.cooldownHours;
          this.alertsEnabled = overview.settings.alertsEnabled;
          this.whatsappEnabled = overview.settings.whatsappEnabled !== undefined ? overview.settings.whatsappEnabled : true;
          this.whatsappNotifyCustodian = overview.settings.whatsappNotifyCustodian !== undefined ? overview.settings.whatsappNotifyCustodian : true;
          this.whatsappCargoIds.set(overview.settings.whatsappCargoIds || []);
        }
        this.controversies.set(overview.recentControversies || []);
      }
    });
  }

  saveSettings(): void {
    this.savingSettings.set(true);
    this.updateTelemetrySettingsUC.execute({
      toleranceKm: Number(this.toleranceKm),
      cooldownHours: Number(this.cooldownHours),
      alertsEnabled: this.alertsEnabled,
      whatsappEnabled: this.whatsappEnabled,
      whatsappNotifyCustodian: this.whatsappNotifyCustodian,
      whatsappCargoIds: this.whatsappCargoIds()
    }).subscribe({
      next: (updated) => {
        this.toleranceKm = updated.toleranceKm;
        this.cooldownHours = updated.cooldownHours;
        this.alertsEnabled = updated.alertsEnabled;
        this.whatsappEnabled = updated.whatsappEnabled ?? true;
        this.whatsappNotifyCustodian = updated.whatsappNotifyCustodian ?? true;
        this.whatsappCargoIds.set(updated.whatsappCargoIds || []);
        this.savingSettings.set(false);
        this.showToast.emit({
          type: 'success',
          message: `Configuración de geocerca y notificaciones guardada con éxito.`
        });
      },
      error: (err) => {
        this.savingSettings.set(false);
        this.showToast.emit({
          type: 'error',
          message: err?.error?.message || 'Error al guardar los parámetros de geocerca'
        });
      }
    });
  }

  isCargoSelected(cargoId: string): boolean {
    return this.whatsappCargoIds().includes(cargoId);
  }

  toggleCargo(cargoId: string): void {
    this.whatsappCargoIds.update(current => {
      if (current.includes(cargoId)) {
        return current.filter(id => id !== cargoId);
      } else {
        return [...current, cargoId];
      }
    });
  }

  selectAllCargos(): void {
    this.whatsappCargoIds.set(this.cargos().map(c => c.id));
  }

  clearCargos(): void {
    this.whatsappCargoIds.set([]);
  }

  toggleTipoTelemetria(tipo: TipoActivo): void {
    const newValue = !tipo.admiteTelemetria;
    this.togglingTipoId.set(tipo.id);

    this.updateTipoUC.execute(tipo.id, { admiteTelemetria: newValue }).subscribe({
      next: (updated) => {
        this.tipos.update(list => list.map(t => (t.id === tipo.id ? updated : t)));
        this.togglingTipoId.set(null);
        this.showToast.emit({
          type: 'success',
          message: `Telemetría GPS ${newValue ? 'habilitada' : 'deshabilitada'} para "${tipo.nombre}"`
        });
      },
      error: (err) => {
        this.togglingTipoId.set(null);
        this.showToast.emit({
          type: 'error',
          message: err?.error?.message || 'Error al actualizar el soporte de telemetría'
        });
      }
    });
  }

  sendTestEmail(): void {
    this.sendingTestEmail.set(true);
    this.sendTelemetryTestAlertUC.execute().subscribe({
      next: (res) => {
        this.sendingTestEmail.set(false);
        this.showEmailPreview.set(true);
        this.showToast.emit({
          type: 'success',
          message: res.message || 'Correo de prueba enviado a los destinatarios activos'
        });
      },
      error: (err) => {
        this.sendingTestEmail.set(false);
        this.showToast.emit({
          type: 'error',
          message: err?.error?.message || 'Error al enviar el correo de prueba'
        });
      }
    });
  }
}

