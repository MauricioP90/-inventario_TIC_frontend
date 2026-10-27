import {
  Component, OnInit, inject, signal, computed, Output, EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  NotificationRecipient,
  NOTIFICATION_EVENTS_CATALOG,
  NotificationEventDefinition
} from '../../../domain/models/notification-recipient.model';
import { NotificationRecipientRepository } from '../../../domain/repositories/notification-recipient.repository';
import { HttpNotificationRecipientRepository } from '../../../infrastructure/adapters/http-notification-recipient.repository';
import { GetAllNotificationRecipientsUseCase } from '../../../application/use-cases/get-all-notification-recipients.use-case';
import { CreateNotificationRecipientUseCase } from '../../../application/use-cases/create-notification-recipient.use-case';
import { UpdateNotificationRecipientUseCase } from '../../../application/use-cases/update-notification-recipient.use-case';
import { DeleteNotificationRecipientUseCase } from '../../../application/use-cases/delete-notification-recipient.use-case';
import { ToggleNotificationRecipientUseCase } from '../../../application/use-cases/toggle-notification-recipient.use-case';

@Component({
  selector: 'app-notificaciones-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    { provide: NotificationRecipientRepository, useClass: HttpNotificationRecipientRepository },
    GetAllNotificationRecipientsUseCase,
    CreateNotificationRecipientUseCase,
    UpdateNotificationRecipientUseCase,
    DeleteNotificationRecipientUseCase,
    ToggleNotificationRecipientUseCase
  ],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- Tarjeta Informativa Superior -->
      <div class="p-5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-start sm:items-center gap-3.5">
          <div class="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-indigo-300 shrink-0">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </div>
          <div>
            <h3 class="text-base font-bold text-white">Matriz de Suscripción a Notificaciones Automáticas</h3>
            <p class="text-xs text-indigo-200 mt-0.5">
              Cada área o buzón (Contabilidad, Almacén, Jurídica, TI) recibe solo los eventos suscritos (Despacho, Recepción con Firma, Bajas, Hurto o Taller).
            </p>
          </div>
        </div>
        <div class="flex items-center gap-4 text-xs shrink-0">
          <div class="text-right px-4 py-2 bg-white/5 rounded-xl border border-white/10">
            <span class="block text-indigo-300 font-semibold">Destinatarios Activos</span>
            <span class="text-lg font-bold text-white">{{ activeRecipientsCount() }} / {{ recipients().length }}</span>
          </div>
        </div>
      </div>

      <!-- Card Tabla Notificaciones -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        <!-- Header Tabla -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-100 gap-3">
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center w-9 h-9 rounded-xl bg-purple-50 text-purple-600">
              <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.199l-.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <div>
              <h2 class="text-sm font-bold text-slate-800">Destinatarios y Eventos Asignados</h2>
              <p class="text-xs text-slate-400">{{ recipients().length }} buzones o contactos registrados</p>
            </div>
          </div>

          <!-- Search -->
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              [(ngModel)]="searchRecipientsTerm"
              placeholder="Buscar por nombre, correo, área o evento..."
              class="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50 w-72"
              id="search-destinatarios"
            />
          </div>
        </div>

        <!-- Table Notificaciones -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th class="px-6 py-3 font-semibold">Destinatario</th>
                <th class="px-6 py-3 font-semibold">Área / Departamento</th>
                <th class="px-6 py-3 font-semibold">Eventos Suscritos</th>
                <th class="px-6 py-3 font-semibold text-center">Modo</th>
                <th class="px-6 py-3 font-semibold text-center">Estado</th>
                <th class="px-6 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @if (loadingRecipients()) {
                <tr>
                  <td colspan="6" class="px-6 py-12 text-center text-slate-400">
                    <div class="flex items-center justify-center gap-2">
                      <div class="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Cargando matriz de notificaciones...</span>
                    </div>
                  </td>
                </tr>
              } @else if (filteredRecipients().length === 0) {
                <tr>
                  <td colspan="6" class="px-6 py-12 text-center text-slate-400">
                    @if (searchRecipientsTerm) {
                      No se encontraron destinatarios que coincidan con "{{ searchRecipientsTerm }}".
                    } @else {
                      No hay destinatarios registrados aún. Haz clic en <strong>+ Nuevo Destinatario</strong> para asociar correos por evento.
                    }
                  </td>
                </tr>
              } @else {
                @for (rec of filteredRecipients(); track rec.id) {
                  <tr class="hover:bg-slate-50/80 transition-colors" [id]="'row-recipient-' + rec.id">
                    <!-- Nombre con Avatar y Correo -->
                    <td class="px-6 py-3.5">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {{ getInitials(rec.nombre) }}
                        </div>
                        <div>
                          <span class="font-semibold text-slate-800 block leading-tight">{{ rec.nombre }}</span>
                          <span class="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                            <svg class="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                            </svg>
                            {{ rec.email }}
                          </span>
                        </div>
                      </div>
                    </td>

                    <!-- Área / Departamento -->
                    <td class="px-6 py-3.5">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {{ rec.area }}
                      </span>
                    </td>

                    <!-- Eventos Suscritos (Badges) -->
                    <td class="px-6 py-3.5">
                      <div class="flex flex-wrap items-center gap-1.5 max-w-xs">
                        @if (rec.eventos.includes('TODOS')) {
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            🌟 Todos los Eventos
                          </span>
                        } @else {
                          @for (evId of rec.eventos; track evId) {
                            <span
                              class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border"
                              [ngClass]="getEventBadgeClass(evId)"
                            >
                              {{ getEventShortLabel(evId) }}
                            </span>
                          }
                        }
                      </div>
                    </td>

                    <!-- Tipo de Copia (CC / BCC) -->
                    <td class="px-6 py-3.5 text-center">
                      <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase"
                        [class.bg-blue-50]="rec.tipoCopia === 'CC'"
                        [class.text-blue-700]="rec.tipoCopia === 'CC'"
                        [class.border]="true"
                        [class.border-blue-200]="rec.tipoCopia === 'CC'"
                        [class.bg-purple-50]="rec.tipoCopia === 'BCC'"
                        [class.text-purple-700]="rec.tipoCopia === 'BCC'"
                        [class.border-purple-200]="rec.tipoCopia === 'BCC'"
                      >
                        {{ rec.tipoCopia === 'BCC' ? 'BCC (Oculta)' : 'CC (Visible)' }}
                      </span>
                    </td>

                    <!-- Switch Estado Activo/Inactivo -->
                    <td class="px-6 py-3.5 text-center">
                      <button
                        (click)="toggleRecipientStatus(rec)"
                        class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full transition-all cursor-pointer"
                        [class.bg-emerald-50]="rec.isActive"
                        [class.text-emerald-700]="rec.isActive"
                        [class.hover:bg-emerald-100]="rec.isActive"
                        [class.bg-slate-100]="!rec.isActive"
                        [class.text-slate-500]="!rec.isActive"
                        [class.hover:bg-slate-200]="!rec.isActive"
                        [title]="'Click para ' + (rec.isActive ? 'desactivar' : 'activar')"
                        [id]="'btn-toggle-rec-' + rec.id"
                      >
                        <span
                          class="w-1.5 h-1.5 rounded-full"
                          [class.bg-emerald-500]="rec.isActive"
                          [class.bg-slate-400]="!rec.isActive"
                        ></span>
                        {{ rec.isActive ? 'Activo' : 'Inactivo' }}
                      </button>
                    </td>

                    <!-- Acciones -->
                    <td class="px-6 py-3.5 text-right">
                      <div class="flex items-center justify-end gap-1">
                        <button
                          (click)="openRecipientModal(rec)"
                          class="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="Editar destinatario"
                          [id]="'btn-edit-rec-' + rec.id"
                        >
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                          </svg>
                        </button>
                        <button
                          (click)="deleteRecipient(rec)"
                          class="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="Eliminar destinatario"
                          [id]="'btn-del-rec-' + rec.id"
                        >
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- MODAL: CREAR / EDITAR DESTINATARIO (CON MATRIZ DE EVENTOS)                -->
      <!-- ========================================================================= -->
      @if (showRecipientModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div class="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-xl overflow-hidden animate-scale-in">
            
            <!-- Modal Header -->
            <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                  ✉
                </div>
                <div>
                  <h3 class="text-sm font-bold text-slate-900">
                    {{ editingRecipientId() ? 'Editar Destinatario Automático' : 'Nuevo Destinatario Automático' }}
                  </h3>
                  <p class="text-xs text-slate-400">Configura los datos del contacto y a qué eventos se suscribe</p>
                </div>
              </div>
              <button
                (click)="closeRecipientModal()"
                class="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <!-- Modal Body Form -->
            <div class="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              @if (recipientFormError()) {
                <div class="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <svg class="w-4 h-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <span>{{ recipientFormError() }}</span>
                </div>
              }

              <!-- Nombre y Correo en 2 Columnas -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <!-- Nombre Completo -->
                <div>
                  <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nombre Completo <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="recipientForm.nombre"
                    placeholder="Ej: Clara Rodríguez"
                    class="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    id="modal-recipient-nombre"
                  />
                </div>

                <!-- Correo Electrónico -->
                <div>
                  <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Correo Electrónico <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    [(ngModel)]="recipientForm.email"
                    placeholder="contabilidad@flotalamacarena.com"
                    class="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-mono"
                    id="modal-recipient-email"
                  />
                </div>
              </div>

              <!-- Área / Departamento y Modo de Envío -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <!-- Área / Departamento -->
                <div>
                  <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Área / Departamento <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="recipientForm.area"
                    placeholder="Ej: Contabilidad, Almacén, Jurídica..."
                    class="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    id="modal-recipient-area"
                  />
                </div>

                <!-- Modo de Envío (CC / BCC) -->
                <div>
                  <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Modo de Copia
                  </label>
                  <div class="grid grid-cols-2 gap-2">
                    <label
                      class="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all text-center"
                      [class.border-indigo-600]="recipientForm.tipoCopia === 'CC'"
                      [class.bg-indigo-50]="recipientForm.tipoCopia === 'CC'"
                      [class.text-indigo-700]="recipientForm.tipoCopia === 'CC'"
                      [class.border-slate-200]="recipientForm.tipoCopia !== 'CC'"
                    >
                      <input
                        type="radio"
                        name="tipoCopia"
                        value="CC"
                        [(ngModel)]="recipientForm.tipoCopia"
                        class="sr-only"
                      />
                      CC (Visible)
                    </label>

                    <label
                      class="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all text-center"
                      [class.border-purple-600]="recipientForm.tipoCopia === 'BCC'"
                      [class.bg-purple-50]="recipientForm.tipoCopia === 'BCC'"
                      [class.text-purple-700]="recipientForm.tipoCopia === 'BCC'"
                      [class.border-slate-200]="recipientForm.tipoCopia !== 'BCC'"
                    >
                      <input
                        type="radio"
                        name="tipoCopia"
                        value="BCC"
                        [(ngModel)]="recipientForm.tipoCopia"
                        class="sr-only"
                      />
                      BCC (Oculta)
                    </label>
                  </div>
                </div>
              </div>

              <!-- Matriz de Eventos Suscritos -->
              <div class="space-y-2 pt-2 border-t border-slate-100">
                <div class="flex items-center justify-between">
                  <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Eventos para Notificar <span class="text-red-500">*</span>
                  </label>
                  <div class="flex gap-2 text-xs">
                    <button
                      type="button"
                      (click)="toggleEventSelection('TODOS')"
                      class="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                    >
                      {{ recipientForm.eventos.includes('TODOS') ? 'Desmarcar Todos' : 'Seleccionar Todos' }}
                    </button>
                  </div>
                </div>
                <p class="text-xs text-slate-400">Selecciona uno o más eventos del ciclo de vida del inventario:</p>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  @for (ev of availableEvents; track ev.id) {
                    <div
                      (click)="toggleEventSelection(ev.id)"
                      class="p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 select-none"
                      [class.border-indigo-600]="isEventSelected(ev.id)"
                      [class.bg-indigo-50/70]="isEventSelected(ev.id)"
                      [class.border-slate-200]="!isEventSelected(ev.id)"
                      [class.hover:border-slate-300]="!isEventSelected(ev.id)"
                    >
                      <input
                        type="checkbox"
                        [checked]="isEventSelected(ev.id)"
                        class="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                      />
                      <div class="flex-1 min-w-0">
                        <span class="text-xs font-bold text-slate-800 block leading-tight">{{ ev.label }}</span>
                        <span class="text-[11px] text-slate-500 block truncate mt-0.5">{{ ev.description }}</span>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Switch Activo / Inactivo -->
              <div class="flex items-center justify-between pt-3 border-t border-slate-100">
                <div>
                  <span class="text-xs font-bold text-slate-700 block">Estado del Destinatario</span>
                  <span class="text-[11px] text-slate-400">Si está inactivo, el motor de correos omitirá este buzón temporalmente</span>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    [(ngModel)]="recipientForm.isActive"
                    class="sr-only peer"
                  />
                  <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

            </div>

            <!-- Modal Footer -->
            <div class="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                (click)="closeRecipientModal()"
                class="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                (click)="saveRecipient()"
                [disabled]="savingRecipient()"
                class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all shadow-sm hover:shadow cursor-pointer flex items-center gap-1.5"
                id="modal-btn-guardar-destinatario"
              >
                @if (savingRecipient()) {
                  <div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                }
                {{ savingRecipient() ? 'Guardando...' : (editingRecipientId() ? 'Actualizar Destinatario' : 'Guardar Destinatario') }}
              </button>
            </div>

          </div>
        </div>
      }

    </div>
  `
})
export class NotificacionesTabComponent implements OnInit {
  private getAllRecipientsUC = inject(GetAllNotificationRecipientsUseCase);
  private createRecipientUC = inject(CreateNotificationRecipientUseCase);
  private updateRecipientUC = inject(UpdateNotificationRecipientUseCase);
  private deleteRecipientUC = inject(DeleteNotificationRecipientUseCase);
  private toggleRecipientUC = inject(ToggleNotificationRecipientUseCase);

  @Output() countChanged = new EventEmitter<number>();
  @Output() showToast = new EventEmitter<{ type: 'success' | 'error'; message: string }>();

  availableEvents: NotificationEventDefinition[] = NOTIFICATION_EVENTS_CATALOG;

  recipients = signal<NotificationRecipient[]>([]);
  loadingRecipients = signal(false);
  savingRecipient = signal(false);
  searchRecipientsTerm = '';
  showRecipientModal = signal(false);
  editingRecipientId = signal<string | null>(null);
  recipientFormError = signal<string | null>(null);

  recipientForm = {
    nombre: '',
    email: '',
    area: '',
    tipoCopia: 'CC' as 'CC' | 'BCC',
    isActive: true,
    eventos: ['DESPACHO_TRASLADO', 'RECEPCION_TRASLADO'] as string[]
  };

  filteredRecipients = computed(() => {
    const term = this.searchRecipientsTerm.toLowerCase().trim();
    return this.recipients().filter(r =>
      !term ||
      r.nombre.toLowerCase().includes(term) ||
      r.email.toLowerCase().includes(term) ||
      r.area.toLowerCase().includes(term) ||
      (r.eventos && r.eventos.some(e => e.toLowerCase().includes(term)))
    );
  });

  activeRecipientsCount = computed(() => {
    return this.recipients().filter(r => r.isActive).length;
  });

  ngOnInit() {
    this.loadRecipients();
  }

  loadRecipients() {
    this.loadingRecipients.set(true);
    this.getAllRecipientsUC.execute().subscribe({
      next: (data) => {
        this.recipients.set(data);
        this.loadingRecipients.set(false);
        this.countChanged.emit(data.length);
      },
      error: () => {
        this.loadingRecipients.set(false);
      }
    });
  }

  openRecipientModal(recipient?: NotificationRecipient) {
    this.recipientFormError.set(null);
    if (recipient) {
      this.editingRecipientId.set(recipient.id || null);
      this.recipientForm = {
        nombre: recipient.nombre,
        email: recipient.email,
        area: recipient.area,
        tipoCopia: recipient.tipoCopia || 'CC',
        isActive: recipient.isActive !== false,
        eventos: recipient.eventos && recipient.eventos.length > 0
          ? [...recipient.eventos]
          : ['DESPACHO_TRASLADO', 'RECEPCION_TRASLADO']
      };
    } else {
      this.editingRecipientId.set(null);
      this.recipientForm = {
        nombre: '',
        email: '',
        area: '',
        tipoCopia: 'CC',
        isActive: true,
        eventos: ['DESPACHO_TRASLADO', 'RECEPCION_TRASLADO']
      };
    }
    this.showRecipientModal.set(true);
  }

  closeRecipientModal() {
    this.showRecipientModal.set(false);
    this.editingRecipientId.set(null);
    this.recipientFormError.set(null);
  }

  isEventSelected(eventId: string): boolean {
    return this.recipientForm.eventos.includes(eventId);
  }

  toggleEventSelection(eventId: string) {
    if (eventId === 'TODOS') {
      if (this.recipientForm.eventos.includes('TODOS')) {
        this.recipientForm.eventos = ['DESPACHO_TRASLADO', 'RECEPCION_TRASLADO'];
      } else {
        this.recipientForm.eventos = ['TODOS'];
      }
      return;
    }

    let list = this.recipientForm.eventos.filter(e => e !== 'TODOS');

    if (list.includes(eventId)) {
      list = list.filter(e => e !== eventId);
    } else {
      list.push(eventId);
    }

    if (list.length === 0) {
      list = [eventId];
    }

    this.recipientForm.eventos = list;
  }

  getEventShortLabel(eventId: string): string {
    const found = this.availableEvents.find(e => e.id === eventId);
    return found ? found.shortLabel : eventId;
  }

  getEventBadgeClass(eventId: string): string {
    const found = this.availableEvents.find(e => e.id === eventId);
    return found ? found.badgeClass : 'bg-slate-100 text-slate-700 border-slate-200';
  }

  saveRecipient() {
    const { nombre, email, area, tipoCopia, isActive, eventos } = this.recipientForm;

    if (!nombre.trim()) {
      this.recipientFormError.set('El nombre del destinatario es obligatorio.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      this.recipientFormError.set('Ingresa un correo electrónico válido.');
      return;
    }
    if (!area.trim()) {
      this.recipientFormError.set('El área o departamento es obligatorio.');
      return;
    }
    if (!eventos || eventos.length === 0) {
      this.recipientFormError.set('Debes seleccionar al menos un evento para notificar.');
      return;
    }

    this.recipientFormError.set(null);
    this.savingRecipient.set(true);

    const editId = this.editingRecipientId();

    if (editId) {
      this.updateRecipientUC.execute(editId, { nombre, email, area, tipoCopia, isActive, eventos }).subscribe({
        next: () => {
          this.savingRecipient.set(false);
          this.closeRecipientModal();
          this.loadRecipients();
          this.showToast.emit({ type: 'success', message: `Destinatario "${nombre}" actualizado correctamente.` });
        },
        error: (err) => {
          this.savingRecipient.set(false);
          this.recipientFormError.set(err.error?.error || 'Error al actualizar el destinatario.');
        }
      });
    } else {
      this.createRecipientUC.execute({ nombre, email, area, tipoCopia, isActive, eventos }).subscribe({
        next: () => {
          this.savingRecipient.set(false);
          this.closeRecipientModal();
          this.loadRecipients();
          this.showToast.emit({ type: 'success', message: `Destinatario "${nombre}" registrado en la matriz de notificaciones.` });
        },
        error: (err) => {
          this.savingRecipient.set(false);
          this.recipientFormError.set(err.error?.error || 'Error al registrar el destinatario.');
        }
      });
    }
  }

  toggleRecipientStatus(rec: NotificationRecipient) {
    if (!rec.id) return;
    this.toggleRecipientUC.execute(rec.id).subscribe({
      next: (updated) => {
        this.loadRecipients();
        this.showToast.emit({ type: 'success', message: `Destinatario "${rec.nombre}" marcado como ${updated.isActive ? 'Activo' : 'Inactivo'}.` });
      },
      error: (err) => {
        this.showToast.emit({ type: 'error', message: err.error?.error || 'Error al cambiar estado.' });
      }
    });
  }

  deleteRecipient(rec: NotificationRecipient) {
    if (!rec.id) return;
    const confirm = window.confirm(`¿Estás seguro de eliminar a "${rec.nombre}" (${rec.email}) de las notificaciones automáticas?`);
    if (!confirm) return;

    this.deleteRecipientUC.execute(rec.id).subscribe({
      next: () => {
        this.loadRecipients();
        this.showToast.emit({ type: 'success', message: `Destinatario "${rec.nombre}" eliminado del catálogo.` });
      },
      error: (err) => {
        this.showToast.emit({ type: 'error', message: err.error?.error || 'Error al eliminar destinatario.' });
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return 'DN';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
}
