import {
  Component, OnInit, inject, signal, computed, effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GetAllTiposUseCase } from '../../../application/use-cases/get-all-tipos.use-case';
import { CreateTipoUseCase } from '../../../application/use-cases/create-tipo.use-case';
import { UpdateTipoUseCase } from '../../../application/use-cases/update-tipo.use-case';
import { CatalogsRepository } from '../../../domain/repositories/catalogs.repository';
import { HttpCatalogsRepository } from '../../../infrastructure/adapters/http-catalogs.repository';
import { TipoActivo } from '../../../domain/models/tipo-activo.model';

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
  selector: 'app-catalogs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    { provide: CatalogsRepository, useClass: HttpCatalogsRepository },
    { provide: NotificationRecipientRepository, useClass: HttpNotificationRecipientRepository },
    GetAllTiposUseCase,
    CreateTipoUseCase,
    UpdateTipoUseCase,
    GetAllNotificationRecipientsUseCase,
    CreateNotificationRecipientUseCase,
    UpdateNotificationRecipientUseCase,
    DeleteNotificationRecipientUseCase,
    ToggleNotificationRecipientUseCase
  ],
  template: `
    <div class="min-h-screen bg-slate-50 p-6 space-y-6">

      <!-- Header & Tab Navigation -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Catálogos del Sistema</h1>
          <p class="text-sm text-slate-500 mt-0.5">Gestión de datos maestros, tipos de activo y matriz de notificaciones automáticas</p>
        </div>

        <div class="flex items-center gap-3">
          @if (activeTab() === 'tipos') {
            <button
              (click)="openNewForm()"
              [disabled]="showForm()"
              class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer"
              id="btn-nuevo-tipo"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nuevo Tipo
            </button>
          } @else {
            <button
              (click)="openRecipientModal()"
              class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer"
              id="btn-nuevo-destinatario"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nuevo Destinatario
            </button>
          }
        </div>
      </div>

      <!-- Tabs Navigation Selector -->
      <div class="flex border-b border-slate-200 gap-2">
        <button
          (click)="activeTab.set('tipos')"
          class="flex items-center gap-2.5 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer"
          [class.border-indigo-600]="activeTab() === 'tipos'"
          [class.text-indigo-600]="activeTab() === 'tipos'"
          [class.border-transparent]="activeTab() !== 'tipos'"
          [class.text-slate-500]="activeTab() !== 'tipos'"
          [class.hover:text-slate-800]="activeTab() !== 'tipos'"
          id="tab-tipos"
        >
          <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" />
          </svg>
          Tipos de Activo
          <span
            class="px-2 py-0.5 text-xs rounded-full"
            [class.bg-indigo-100]="activeTab() === 'tipos'"
            [class.text-indigo-700]="activeTab() === 'tipos'"
            [class.bg-slate-100]="activeTab() !== 'tipos'"
            [class.text-slate-600]="activeTab() !== 'tipos'"
          >{{ tipos().length }}</span>
        </button>

        <button
          (click)="activeTab.set('notificaciones')"
          class="flex items-center gap-2.5 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer"
          [class.border-indigo-600]="activeTab() === 'notificaciones'"
          [class.text-indigo-600]="activeTab() === 'notificaciones'"
          [class.border-transparent]="activeTab() !== 'notificaciones'"
          [class.text-slate-500]="activeTab() !== 'notificaciones'"
          [class.hover:text-slate-800]="activeTab() !== 'notificaciones'"
          id="tab-notificaciones"
        >
          <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
          Notificaciones Automáticas
          <span
            class="px-2 py-0.5 text-xs rounded-full"
            [class.bg-indigo-100]="activeTab() === 'notificaciones'"
            [class.text-indigo-700]="activeTab() === 'notificaciones'"
            [class.bg-slate-100]="activeTab() !== 'notificaciones'"
            [class.text-slate-600]="activeTab() !== 'notificaciones'"
          >{{ recipients().length }}</span>
        </button>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 1: TIPOS DE ACTIVO                                                   -->
      <!-- ========================================================================= -->
      @if (activeTab() === 'tipos') {
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">

          <!-- Card Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-50">
                <svg class="w-4.5 h-4.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" />
                </svg>
              </div>
              <div>
                <h2 class="text-sm font-bold text-slate-800">Tipos de Activo</h2>
                <p class="text-xs text-slate-400">{{ tipos().length }} tipo{{ tipos().length !== 1 ? 's' : '' }} registrado{{ tipos().length !== 1 ? 's' : '' }}</p>
              </div>
            </div>

            <!-- Search -->
            <div class="relative">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                [(ngModel)]="searchTiposTerm"
                placeholder="Buscar tipo..."
                class="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50 w-52"
                id="search-tipos"
              />
            </div>
          </div>

          <!-- Inline Form: Nuevo Tipo -->
          @if (showForm()) {
            <div class="px-6 py-4 bg-indigo-50/60 border-b border-indigo-100 animate-fade-in">
              <p class="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3">Nuevo Tipo de Activo</p>
              <div class="flex items-start gap-3">
                <div class="flex-1 space-y-1.5">
                  <input
                    type="text"
                    [(ngModel)]="newNombre"
                    placeholder="Ej: Monitor, Laptop, Tablet..."
                    class="w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    [class.border-red-300]="formError()"
                    [class.border-slate-300]="!formError()"
                    (keydown.enter)="saveNew()"
                    id="input-nombre-tipo"
                    autofocus
                  />
                  @if (formError()) {
                    <p class="text-xs text-red-600">{{ formError() }}</p>
                  }
                  <p class="text-[11px] text-slate-400">El nombre se normalizará automáticamente a formato Título (ej: "laptop" → "Laptop").</p>
                </div>
                <div class="flex gap-2 pt-0.5">
                  <button
                    (click)="saveNew()"
                    [disabled]="saving()"
                    class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    id="btn-guardar-tipo"
                  >
                    {{ saving() ? 'Guardando...' : 'Guardar' }}
                  </button>
                  <button
                    (click)="cancelNew()"
                    class="px-3 py-2.5 text-xs text-slate-600 hover:text-slate-900 font-medium hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          }

          <!-- Table Tipos -->
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead class="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th class="px-6 py-3 font-semibold">Nombre del Tipo</th>
                  <th class="px-6 py-3 font-semibold text-center w-36">Estado</th>
                  <th class="px-6 py-3 font-semibold text-right w-28">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @if (loadingTipos()) {
                  <tr>
                    <td colspan="3" class="px-6 py-12 text-center text-slate-400">
                      <div class="flex items-center justify-center gap-2">
                        <div class="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Cargando tipos de activo...</span>
                      </div>
                    </td>
                  </tr>
                } @else if (filteredTipos().length === 0) {
                  <tr>
                    <td colspan="3" class="px-6 py-12 text-center text-slate-400">
                      @if (searchTiposTerm) {
                        No se encontraron tipos que coincidan con "{{ searchTiposTerm }}".
                      } @else {
                        No hay tipos de activo registrados.
                      }
                    </td>
                  </tr>
                } @else {
                  @for (tipo of paginatedTipos(); track tipo.id) {
                    <tr
                      class="hover:bg-slate-50/80 transition-colors"
                      [class.bg-emerald-50]="newlyCreatedId() === tipo.id"
                      [id]="'row-tipo-' + tipo.id"
                    >
                      <td class="px-6 py-3.5">
                        @if (editingTipoId() === tipo.id) {
                          <div class="flex items-center gap-2">
                            <input
                              type="text"
                              [(ngModel)]="editNombre"
                              class="px-2.5 py-1 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                              [class.border-red-300]="editError()"
                              [class.border-slate-300]="!editError()"
                              (keydown.enter)="saveEdit(tipo)"
                              (keydown.escape)="cancelEdit()"
                              [id]="'input-edit-' + tipo.id"
                              autofocus
                            />
                            <button
                              (click)="saveEdit(tipo)"
                              [disabled]="updatingTipo()"
                              class="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                            >
                              ✓
                            </button>
                            <button
                              (click)="cancelEdit()"
                              class="px-2.5 py-1 text-slate-500 hover:text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              ✕
                            </button>
                            @if (editError()) {
                              <span class="text-xs text-red-500">{{ editError() }}</span>
                            }
                          </div>
                        } @else {
                          <div class="flex items-center gap-2.5">
                            <span class="font-medium text-slate-800">{{ tipo.nombre }}</span>
                            @if (newlyCreatedId() === tipo.id) {
                              <span class="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full animate-bounce">
                                ¡Nuevo!
                              </span>
                            }
                          </div>
                        }
                      </td>

                      <td class="px-6 py-3.5 text-center">
                        <button
                          (click)="toggleEstadoTipo(tipo)"
                          class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full transition-all cursor-pointer"
                          [class.bg-emerald-50]="tipo.estado === 'ACTIVO'"
                          [class.text-emerald-700]="tipo.estado === 'ACTIVO'"
                          [class.hover:bg-emerald-100]="tipo.estado === 'ACTIVO'"
                          [class.bg-slate-100]="tipo.estado === 'INACTIVO'"
                          [class.text-slate-500]="tipo.estado === 'INACTIVO'"
                          [class.hover:bg-slate-200]="tipo.estado === 'INACTIVO'"
                          [title]="'Click para ' + (tipo.estado === 'ACTIVO' ? 'desactivar' : 'activar')"
                          [id]="'btn-toggle-' + tipo.id"
                        >
                          <span
                            class="w-1.5 h-1.5 rounded-full"
                            [class.bg-emerald-500]="tipo.estado === 'ACTIVO'"
                            [class.bg-slate-400]="tipo.estado === 'INACTIVO'"
                          ></span>
                          {{ tipo.estado === 'ACTIVO' ? 'Activo' : 'Inactivo' }}
                        </button>
                      </td>

                      <td class="px-6 py-3.5 text-right">
                        @if (editingTipoId() !== tipo.id) {
                          <button
                            (click)="startEdit(tipo)"
                            class="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Editar nombre"
                            [id]="'btn-edit-' + tipo.id"
                          >
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                          </button>
                        }
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination Tipos -->
          @if (filteredTipos().length > 0) {
            <div class="flex items-center justify-between px-6 py-3.5 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500">
              <span>Mostrando {{ startTiposIndex() }}-{{ endTiposIndex() }} de {{ filteredTipos().length }} tipos</span>
              <div class="flex items-center gap-2">
                <button
                  (click)="prevTiposPage()"
                  [disabled]="currentTiposPage() === 1"
                  class="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Anterior
                </button>
                <span>Página {{ currentTiposPage() }} de {{ totalTiposPages() }}</span>
                <button
                  (click)="nextTiposPage()"
                  [disabled]="currentTiposPage() === totalTiposPages()"
                  class="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Siguiente
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- ========================================================================= -->
      <!-- TAB 2: NOTIFICACIONES AUTOMÁTICAS (MATRIZ DE EVENTOS)                    -->
      <!-- ========================================================================= -->
      @if (activeTab() === 'notificaciones') {
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
                                <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
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
        </div>
      }

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

              <!-- ============================================================= -->
              <!-- MATRIZ DE EVENTOS SUSCRITOS                                  -->
              <!-- ============================================================= -->
              <div class="pt-2">
                <div class="flex items-center justify-between mb-2">
                  <label class="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Eventos a Notificar <span class="text-red-500">*</span>
                  </label>
                  <span class="text-[11px] text-slate-400 font-medium">Selecciona al menos 1 evento</span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  @for (ev of availableEvents; track ev.id) {
                    <div
                      (click)="toggleEventSelection(ev.id)"
                      class="p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 select-none"
                      [class.border-indigo-600]="isEventSelected(ev.id)"
                      [class.bg-indigo-50/60]="isEventSelected(ev.id)"
                      [class.border-slate-200]="!isEventSelected(ev.id)"
                      [class.hover:border-slate-300]="!isEventSelected(ev.id)"
                    >
                      <input
                        type="checkbox"
                        [checked]="isEventSelected(ev.id)"
                        class="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer pointer-events-none"
                      />
                      <div class="flex-1 min-w-0">
                        <span class="text-xs font-bold text-slate-800 block leading-tight">{{ ev.label }}</span>
                        <span class="text-[11px] text-slate-500 block leading-tight mt-0.5">{{ ev.description }}</span>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Estado Activo -->
              <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span class="text-xs font-bold text-slate-800 block">Buzón Habilitado</span>
                  <span class="text-[11px] text-slate-400 block">Si está activo, recibirá las copias correspondientes</span>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    [(ngModel)]="recipientForm.isActive"
                    class="sr-only peer"
                  />
                  <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

            </div>

            <!-- Modal Footer -->
            <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                (click)="closeRecipientModal()"
                class="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                (click)="saveRecipient()"
                [disabled]="savingRecipient()"
                class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                id="btn-guardar-destinatario"
              >
                {{ savingRecipient() ? 'Guardando...' : (editingRecipientId() ? 'Actualizar Destinatario' : 'Guardar Destinatario') }}
              </button>
            </div>

          </div>
        </div>
      }

      <!-- Toast Notification -->
      @if (toast()) {
        <div
          class="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium animate-slide-up"
          [class.bg-emerald-600]="toast()?.type === 'success'"
          [class.text-white]="toast()?.type === 'success'"
          [class.border-emerald-500]="toast()?.type === 'success'"
          [class.bg-red-600]="toast()?.type === 'error'"
          [class.text-white]="toast()?.type === 'error'"
          [class.border-red-500]="toast()?.type === 'error'"
        >
          @if (toast()?.type === 'success') {
            <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          } @else {
            <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          }
          <span>{{ toast()?.message }}</span>
        </div>
      }

    </div>
  `
})
export class CatalogsComponent implements OnInit {
  // Use cases para Tipos de Activo
  private getAllTiposUC = inject(GetAllTiposUseCase);
  private createTipoUC = inject(CreateTipoUseCase);
  private updateTipoUC = inject(UpdateTipoUseCase);

  // Use cases para Notificaciones Automáticas
  private getAllRecipientsUC = inject(GetAllNotificationRecipientsUseCase);
  private createRecipientUC = inject(CreateNotificationRecipientUseCase);
  private updateRecipientUC = inject(UpdateNotificationRecipientUseCase);
  private deleteRecipientUC = inject(DeleteNotificationRecipientUseCase);
  private toggleRecipientUC = inject(ToggleNotificationRecipientUseCase);

  // Active Tab: 'tipos' | 'notificaciones'
  activeTab = signal<'tipos' | 'notificaciones'>('tipos');

  // Catálogo de Eventos Disponibles
  availableEvents: NotificationEventDefinition[] = NOTIFICATION_EVENTS_CATALOG;

  // ==========================================
  // ESTADO TAB 1: TIPOS DE ACTIVO
  // ==========================================
  tipos = signal<TipoActivo[]>([]);
  loadingTipos = signal(false);
  saving = signal(false);
  updatingTipo = signal(false);
  showForm = signal(false);
  newNombre = '';
  formError = signal<string | null>(null);
  editingTipoId = signal<string | null>(null);
  editNombre = '';
  editError = signal<string | null>(null);
  newlyCreatedId = signal<string | null>(null);
  searchTiposTerm = '';

  currentTiposPage = signal(1);
  pageSize = 10;

  filteredTipos = computed(() => {
    const term = this.searchTiposTerm.toLowerCase().trim();
    return this.tipos().filter(t =>
      !term || t.nombre.toLowerCase().includes(term)
    );
  });

  paginatedTipos = computed(() => {
    const list = this.filteredTipos();
    const start = (this.currentTiposPage() - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  startTiposIndex = computed(() => {
    if (this.filteredTipos().length === 0) return 0;
    return (this.currentTiposPage() - 1) * this.pageSize + 1;
  });

  endTiposIndex = computed(() => {
    const end = this.currentTiposPage() * this.pageSize;
    const total = this.filteredTipos().length;
    return end > total ? total : end;
  });

  totalTiposPages = computed(() => Math.max(1, Math.ceil(this.filteredTipos().length / this.pageSize)));

  // ==========================================
  // ESTADO TAB 2: NOTIFICACIONES AUTOMÁTICAS
  // ==========================================
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

  // Global Toast
  toast = signal<{ type: 'success' | 'error'; message: string } | null>(null);

  constructor() {
    // Reset página al filtrar tipos
    effect(() => {
      this.filteredTipos();
      setTimeout(() => this.currentTiposPage.set(1), 0);
    });
  }

  ngOnInit() {
    this.loadTipos();
    this.loadRecipients();
  }

  // ==========================================
  // MÉTODOS TAB 1: TIPOS DE ACTIVO
  // ==========================================
  private loadTipos() {
    this.loadingTipos.set(true);
    this.getAllTiposUC.execute().subscribe({
      next: (tipos) => { this.tipos.set(tipos); this.loadingTipos.set(false); },
      error: () => { this.loadingTipos.set(false); }
    });
  }

  openNewForm() {
    this.showForm.set(true);
    this.newNombre = '';
    this.formError.set(null);
  }

  cancelNew() {
    this.showForm.set(false);
    this.newNombre = '';
    this.formError.set(null);
  }

  saveNew() {
    const nombre = this.newNombre.trim();
    if (!nombre) { this.formError.set('El nombre es obligatorio.'); return; }
    if (nombre.length < 3) { this.formError.set('Mínimo 3 caracteres.'); return; }
    this.formError.set(null);
    this.saving.set(true);
    this.createTipoUC.execute({ nombre }).subscribe({
      next: (created) => {
        this.saving.set(false);
        this.showForm.set(false);
        this.newNombre = '';
        this.loadTipos();
        this.newlyCreatedId.set(created.id);
        this.showToast('success', `Tipo "${created.nombre}" creado exitosamente.`);
        setTimeout(() => this.newlyCreatedId.set(null), 3000);
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err.error?.message || 'Error al crear el tipo.');
      }
    });
  }

  startEdit(tipo: TipoActivo) {
    this.editingTipoId.set(tipo.id);
    this.editNombre = tipo.nombre;
    this.editError.set(null);
  }

  cancelEdit() {
    this.editingTipoId.set(null);
    this.editNombre = '';
    this.editError.set(null);
  }

  saveEdit(tipo: TipoActivo) {
    const nombre = this.editNombre.trim();
    if (!nombre) { this.editError.set('El nombre es obligatorio.'); return; }
    if (nombre.length < 3) { this.editError.set('Mínimo 3 caracteres.'); return; }
    this.editError.set(null);
    this.updatingTipo.set(true);
    this.updateTipoUC.execute(tipo.id, { nombre }).subscribe({
      next: (updated) => {
        this.updatingTipo.set(false);
        this.editingTipoId.set(null);
        this.loadTipos();
        this.showToast('success', `Tipo actualizado a "${updated.nombre}".`);
      },
      error: (err) => {
        this.updatingTipo.set(false);
        this.editError.set(err.error?.message || 'Error al actualizar.');
      }
    });
  }

  toggleEstadoTipo(tipo: TipoActivo) {
    const newEstado = tipo.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    this.updatingTipo.set(true);
    this.updateTipoUC.execute(tipo.id, { estado: newEstado }).subscribe({
      next: () => {
        this.updatingTipo.set(false);
        this.loadTipos();
        this.showToast('success', `"${tipo.nombre}" marcado como ${newEstado}.`);
      },
      error: (err) => {
        this.updatingTipo.set(false);
        this.showToast('error', err.error?.message || 'Error al cambiar estado.');
      }
    });
  }

  prevTiposPage() { if (this.currentTiposPage() > 1) this.currentTiposPage.update(p => p - 1); }
  nextTiposPage() { if (this.currentTiposPage() < this.totalTiposPages()) this.currentTiposPage.update(p => p + 1); }

  // ==========================================
  // MÉTODOS TAB 2: NOTIFICACIONES AUTOMÁTICAS
  // ==========================================
  private loadRecipients() {
    this.loadingRecipients.set(true);
    this.getAllRecipientsUC.execute().subscribe({
      next: (data) => {
        this.recipients.set(data);
        this.loadingRecipients.set(false);
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

    // Si hace click en un evento individual y tenía TODOS, quitamos TODOS
    let list = this.recipientForm.eventos.filter(e => e !== 'TODOS');

    if (list.includes(eventId)) {
      list = list.filter(e => e !== eventId);
    } else {
      list.push(eventId);
    }

    // Si deseleccionó todos, dejamos al menos el seleccionado
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
      // Actualizar
      this.updateRecipientUC.execute(editId, { nombre, email, area, tipoCopia, isActive, eventos }).subscribe({
        next: () => {
          this.savingRecipient.set(false);
          this.closeRecipientModal();
          this.loadRecipients();
          this.showToast('success', `Destinatario "${nombre}" actualizado correctamente.`);
        },
        error: (err) => {
          this.savingRecipient.set(false);
          this.recipientFormError.set(err.error?.error || 'Error al actualizar el destinatario.');
        }
      });
    } else {
      // Crear
      this.createRecipientUC.execute({ nombre, email, area, tipoCopia, isActive, eventos }).subscribe({
        next: () => {
          this.savingRecipient.set(false);
          this.closeRecipientModal();
          this.loadRecipients();
          this.showToast('success', `Destinatario "${nombre}" registrado en la matriz de notificaciones.`);
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
        this.showToast('success', `Destinatario "${rec.nombre}" marcado como ${updated.isActive ? 'Activo' : 'Inactivo'}.`);
      },
      error: (err) => {
        this.showToast('error', err.error?.error || 'Error al cambiar estado.');
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
        this.showToast('success', `Destinatario "${rec.nombre}" eliminado del catálogo.`);
      },
      error: (err) => {
        this.showToast('error', err.error?.error || 'Error al eliminar destinatario.');
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

  private showToast(type: 'success' | 'error', message: string) {
    this.toast.set({ type, message });
    setTimeout(() => this.toast.set(null), 3500);
  }
}
