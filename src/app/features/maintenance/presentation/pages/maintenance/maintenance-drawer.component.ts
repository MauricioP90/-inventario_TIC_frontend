import { Component, Input, Output, EventEmitter, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MaintenanceReport, ModalidadMantenimiento, TipoMantenimiento, EstadoFicha, ResultadoFinal, ESTADO_FICHA_LABELS } from '../../../domain/models/maintenance.model';
import { MaintenanceUseCases } from '../../../application/use-cases/maintenance.use-cases';
import { Activo } from '../../../../inventory/domain/models/activo.model';
import { HttpActivoRepository } from '../../../../inventory/infrastructure/adapters/http-activo.repository';
import { environment } from '../../../../../../environments/environment';
import Keycloak from 'keycloak-js';

@Component({
  selector: 'app-maintenance-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Backdrop -->
    @if (open) {
      <div class="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" (click)="close()"></div>
    }

    <!-- Drawer Panel -->
    <div
      class="fixed top-0 right-0 z-50 h-full w-full max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col transition-transform duration-300"
      [class.translate-x-0]="open"
      [class.translate-x-full]="!open"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-5 border-b border-slate-200 shrink-0">
        <div>
          <h3 class="text-base font-bold text-slate-800">
            {{ report ? 'Ficha de Mantenimiento #' + report.id.substring(0, 8) : 'Nueva Ficha de Mantenimiento' }}
          </h3>
          <p class="text-xs text-slate-500 mt-0.5">
            {{ report ? 'Ver y actualizar proceso de reparación' : 'Registrar ingreso a mantenimiento' }}
          </p>
        </div>
        <button (click)="close()" class="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        @if (toast()) {
          <div [class]="toast()!.type === 'error'
            ? 'bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 leading-relaxed'
            : 'bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-3 leading-relaxed'">
            {{ toast()!.message }}
          </div>
        }

        <!-- Modo Lectura vs Modo Edición -->
        @if (!report) {
          <!-- CREACIÓN DE FICHA -->
          <div class="space-y-4">
            <!-- Activo Selection -->
            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-slate-700">Activo (En Mantenimiento) <span class="text-red-500">*</span></label>
              <select [(ngModel)]="activoId" class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
                <option value="" disabled>Seleccione un equipo</option>
                @for (a of disponibles(); track a.id) {
                  <option [value]="a.id">{{ a.placa }} - {{ a.marca }} {{ a.modelo }} ({{ a.serial }})</option>
                }
              </select>
              <p class="text-xs text-slate-400">Sólo se listan equipos en estado de inventario "MANTENIMIENTO" o "DISPONIBLE" que no tengan fichas activas.</p>
            </div>

            <!-- Modalidad -->
            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-slate-700">Modalidad <span class="text-red-500">*</span></label>
              <select [(ngModel)]="modalidad" class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
                <option value="INTERNO">Interno (En Bodega / Taller)</option>
                <option value="EXTERNO">Externo (Proveedor Directo)</option>
              </select>
            </div>

            <!-- Tipo Mantenimiento -->
            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-slate-700">Tipo de Mantenimiento <span class="text-red-500">*</span></label>
              <select [(ngModel)]="tipoMantenimiento" class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
                <option value="CORRECTIVO">Correctivo</option>
                <option value="PREVENTIVO">Preventivo</option>
              </select>
            </div>

            <!-- Tecnico Responsable (Interno) -->
            @if (modalidad === 'INTERNO') {
              <div class="space-y-1.5">
                <label class="block text-sm font-medium text-slate-700">Técnico Responsable <span class="text-red-500">*</span></label>
                <input type="text" [(ngModel)]="tecnicoResponsable" placeholder="Ej: Ing. Carlos Pérez"
                  class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400" />
              </div>
            }

            <!-- Proveedor de Servicio (Externo) -->
            @if (modalidad === 'EXTERNO') {
              <div class="space-y-1.5">
                <label class="block text-sm font-medium text-slate-700">Proveedor de Servicio <span class="text-red-500">*</span></label>
                <input type="text" [(ngModel)]="proveedorServicio" placeholder="Ej: Soporte Asus"
                  class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400" />
              </div>
            }

            <!-- Costo Estimado -->
            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-slate-700">Costo Estimado ($)</label>
              <input type="number" [(ngModel)]="costoEstimado" placeholder="Ej: 150000"
                class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400" />
            </div>
          </div>
        } @else {
          <!-- DETALLE / FLUJO DE FICHA EXISTENTE -->
          <div class="space-y-5">
            <!-- Info Card -->
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
              <div class="flex justify-between">
                <span class="text-slate-400 font-semibold">Estado Actual:</span>
                <span class="font-bold px-2 py-0.5 rounded text-white" [style.background-color]="estadoColor(report.estado)">
                  {{ getEstadoLabel(report.estado) }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400 font-semibold">Modalidad:</span>
                <span class="font-bold text-slate-700">{{ report.modalidad }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400 font-semibold">Tipo:</span>
                <span class="font-bold text-slate-700">{{ report.tipoMantenimiento }}</span>
              </div>
              @if (activoAsociado) {
                <div class="border-t border-slate-200/60 pt-2 mt-2 space-y-1">
                  <div class="flex justify-between">
                    <span class="text-slate-400">Equipo Placa:</span>
                    <span class="font-bold text-slate-800">{{ activoAsociado.placa }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">Marca/Modelo:</span>
                    <span class="text-slate-700">{{ activoAsociado.marca }} / {{ activoAsociado.modelo }}</span>
                  </div>
                  @if (isAdmin() && activoAsociado.precioCompra) {
                    <div class="flex justify-between text-indigo-600 font-semibold">
                      <span>Precio de Compra:</span>
                      <span>$ {{ activoAsociado.precioCompra | number:'1.2-2' }}</span>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- PASO A PASO DEL FLUJO -->
            @if (puedeEditar()) {
              <!-- 1. DIAGNÓSTICO E INICIO (Si está PENDIENTE_DIAGNOSTICO) -->
              @if (report.estado === 'PENDIENTE_DIAGNOSTICO') {
                <div class="border border-indigo-100 bg-indigo-50/20 p-4 rounded-xl space-y-3">
                  <h4 class="text-sm font-bold text-indigo-900">Iniciar Diagnóstico y Reparación</h4>
                  
                  <div class="space-y-1.5">
                    <label class="block text-xs font-semibold text-slate-600">Diagnóstico Inicial <span class="text-red-500">*</span></label>
                    <textarea [(ngModel)]="diagnostico" rows="3" placeholder="Describa el problema detectado..."
                      class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"></textarea>
                  </div>

                  <div class="grid grid-cols-2 gap-3">
                    <div class="space-y-1.5">
                      <label class="block text-xs font-semibold text-slate-600">Técnico Asignado</label>
                      <input type="text" [(ngModel)]="tecnicoResponsable"
                        class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white" />
                    </div>
                    <div class="space-y-1.5">
                      <label class="block text-xs font-semibold text-slate-600">Costo Estimado ($)</label>
                      <input type="number" [(ngModel)]="costoEstimado"
                        class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white" />
                    </div>
                  </div>

                  <!-- Botones de Acción -->
                  <div class="grid grid-cols-2 gap-2 pt-2">
                    <button (click)="iniciarReparacion()" [disabled]="saving()"
                      class="py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors">
                      Iniciar Reparación
                    </button>
                    <button (click)="descartarSinFallas()" [disabled]="saving()"
                      class="py-2 bg-slate-600 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition-colors">
                      Descartar / Sin Fallas
                    </button>
                  </div>
                </div>
              }

              <!-- 2. REGISTRAR ACCIONES, ESCALAR O SOLICITAR AUTORIZACIÓN (Si está EN_PROCESO) -->
              @if (report.estado === 'EN_PROCESO') {
                <!-- Viabilidad Financiera Warning -->
                @if (mostrarAlertaViabilidad()) {
                  <div class="bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl p-3 flex gap-2">
                    <span class="text-base">⚠️</span>
                    <div>
                      <p class="font-bold">Alerta de Viabilidad Financiera</p>
                      <p class="mt-0.5">El costo de reparación supera el 40% del precio de compra de este equipo. Evalúe si vale la pena proceder.</p>
                    </div>
                  </div>
                }

                <!-- Reparación Interna -->
                <div class="border border-slate-200 p-4 rounded-xl space-y-3">
                  <h4 class="text-sm font-bold text-slate-800">Cierre de Reparación Interna</h4>
                  
                  <div class="space-y-1.5">
                    <label class="block text-xs font-semibold text-slate-600">Acciones Realizadas <span class="text-red-500">*</span></label>
                    <textarea [(ngModel)]="accionesRealizadas" rows="2" placeholder="Qué se le hizo al dispositivo..."
                      class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"></textarea>
                  </div>

                  <div class="space-y-1.5">
                    <label class="block text-xs font-semibold text-slate-600">Repuestos Usados</label>
                    <input type="text" [(ngModel)]="repuestosUsados" placeholder="Ej: Pantalla LCD, Batería"
                      class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white" />
                  </div>

                  <div class="grid grid-cols-2 gap-3">
                    <div class="space-y-1.5">
                      <label class="block text-xs font-semibold text-slate-600">Costo Final ($) <span class="text-red-500">*</span></label>
                      <input type="number" [(ngModel)]="costoFinal" (ngModelChange)="checkCostoViabilidad($event)"
                        class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white" />
                    </div>
                    <div class="space-y-1.5">
                      <label class="block text-xs font-semibold text-slate-600">Resultado Final</label>
                      <select [(ngModel)]="resultadoFinal" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white">
                        <option value="REPARADO">Reparado</option>
                        <option value="SIN_FALLAS">Sin Fallas (Operativo)</option>
                        <option value="IRREPARABLE">Irreparable</option>
                      </select>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 pt-1">
                    <input type="checkbox" [(ngModel)]="cubiertoPorGarantia" id="warranty" class="rounded text-indigo-600" />
                    <label for="warranty" class="text-xs text-slate-600 font-medium">Cubierto por garantía</label>
                  </div>

                  <!-- Botones de Acción -->
                  <div class="grid grid-cols-2 gap-2 pt-2">
                    <button (click)="cerrarMantenimiento()" [disabled]="saving()"
                      class="py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors">
                      Finalizar y Cerrar
                    </button>
                    @if (requiereAutorizacionPorCosto) {
                      <button (click)="solicitarAutorizacion()" [disabled]="saving()"
                        class="py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-colors">
                        Solicitar Autorización
                      </button>
                    }
                  </div>
                </div>

                <!-- Escalación a Proveedor -->
                <div class="border border-purple-100 bg-purple-50/10 p-4 rounded-xl space-y-3">
                  <h4 class="text-sm font-bold text-purple-900">Escalar a Proveedor Externo</h4>
                  
                  <div class="space-y-1.5">
                    <label class="block text-xs font-semibold text-slate-600">Motivo de Escalación <span class="text-red-500">*</span></label>
                    <input type="text" [(ngModel)]="motivoEscalacion" placeholder="Ej: Requiere micro-soldadura compleja"
                      class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white" />
                  </div>

                  <div class="grid grid-cols-2 gap-3">
                    <div class="space-y-1.5">
                      <label class="block text-xs font-semibold text-slate-600">Proveedor de Servicio <span class="text-red-500">*</span></label>
                      <input type="text" [(ngModel)]="proveedorServicio" placeholder="Ej: Soporte Asus"
                        class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white" />
                    </div>
                    <div class="space-y-1.5">
                      <label class="block text-xs font-semibold text-slate-600">N° Orden Servicio</label>
                      <input type="text" [(ngModel)]="referenciaOrdenServicio" placeholder="Ej: OS-98122"
                        class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white" />
                    </div>
                  </div>

                  <!-- File Upload (Soporte Proveedor) -->
                  <div class="space-y-1.5">
                    <label class="block text-xs font-semibold text-slate-600">Soporte/Cotización del Proveedor</label>
                    <label class="flex flex-col items-center justify-center border border-dashed border-slate-300 rounded-lg p-3 bg-white cursor-pointer hover:bg-slate-50">
                      @if (subiendoSoporte()) {
                        <span class="text-xs text-slate-400">Subiendo cotización...</span>
                      } @else {
                        <span class="text-xs text-slate-500">{{ soporteProveedorUrl ? '✓ Soporte cargado' : 'Subir Cotización (PDF/Imagen)' }}</span>
                      }
                      <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg" (change)="subirSoporteArchivo($event, 'proveedor')" />
                    </label>
                  </div>

                  <button (click)="escalarAProveedor()" [disabled]="saving()"
                    class="w-full mt-1 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition-colors">
                    Confirmar Envío a Proveedor
                  </button>
                </div>
              }

              <!-- 3. REQUIERE AUTORIZACIÓN (Si está REQUIERE_AUTORIZACION) -->
              @if (report.estado === 'REQUIERE_AUTORIZACION') {
                <div class="border border-red-100 bg-red-50/20 p-4 rounded-xl space-y-3">
                  <h4 class="text-sm font-bold text-red-900">Adjuntar Soporte de Autorización</h4>
                  <p class="text-xs text-slate-500">Este mantenimiento supera el umbral financiero y requiere la firma/soporte de un superior para continuar.</p>

                  <div class="space-y-2">
                    <label class="block text-xs font-semibold text-slate-600">Documento de Autorización <span class="text-red-500">*</span></label>
                    <label class="flex flex-col items-center justify-center border border-dashed border-red-300 rounded-lg p-4 bg-white cursor-pointer hover:bg-red-50">
                      @if (subiendoSoporte()) {
                        <span class="text-xs text-slate-400">Subiendo soporte...</span>
                      } @else {
                        <span class="text-xs text-slate-500 font-bold text-red-700">
                          {{ soporteAutorizacionUrl ? '✓ Autorización cargada' : 'Subir Firma / Correo Soporte (PDF/Imagen)' }}
                        </span>
                      }
                      <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg" (change)="subirSoporteArchivo($event, 'autorizacion')" />
                    </label>
                  </div>

                  <button (click)="aprobarAutorizacion()" [disabled]="saving() || !soporteAutorizacionUrl"
                    class="w-full py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors">
                    Aprobar y Retomar Mantenimiento
                  </button>
                </div>
              }

              <!-- 4. ENVIADO A PROVEEDOR (Si está ENVIADO_PROVEEDOR) -->
              @if (report.estado === 'ENVIADO_PROVEEDOR') {
                <div class="border border-violet-100 bg-violet-50/20 p-4 rounded-xl space-y-3">
                  <h4 class="text-sm font-bold text-violet-900">Registrar Retorno de Proveedor</h4>

                  <div class="grid grid-cols-2 gap-3">
                    <div class="space-y-1.5">
                      <label class="block text-xs font-semibold text-slate-600">Costo Final Proveedor ($) <span class="text-red-500">*</span></label>
                      <input type="number" [(ngModel)]="costoFinal"
                        class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white" />
                    </div>
                    <div class="space-y-1.5">
                      <label class="block text-xs font-semibold text-slate-600">Resultado Técnico</label>
                      <select [(ngModel)]="resultadoFinal" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white">
                        <option value="REPARADO">Reparado</option>
                        <option value="SIN_FALLAS">Sin Fallas (Operativo)</option>
                        <option value="IRREPARABLE">Irreparable</option>
                      </select>
                    </div>
                  </div>

                  <div class="space-y-1.5">
                    <label class="block text-xs font-semibold text-slate-600">Detalles de la Reparación del Proveedor <span class="text-red-500">*</span></label>
                    <textarea [(ngModel)]="accionesRealizadas" rows="2" placeholder="Qué repuestos cambió el proveedor..."
                      class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"></textarea>
                  </div>

                  <button (click)="registrarRetornoProveedor()" [disabled]="saving()"
                    class="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-lg transition-colors">
                    Registrar Retorno y Cerrar Ficha
                  </button>
                </div>
              }
            } @else {
              <!-- Mensaje sin permisos para editar -->
              <div class="bg-slate-50 text-slate-500 p-3 rounded-lg text-xs italic text-center border border-slate-100">
                Usted tiene permisos de modo lectura. Las acciones de técnico y administración están restringidas.
              </div>
            }

            <!-- HISTORIAL DE NOTAS / TIEMPOS -->
            <div class="border-t border-slate-100 pt-4 space-y-3">
              <h4 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Línea de Tiempo del Mantenimiento</h4>
              
              <div class="relative pl-6 space-y-4 border-l border-slate-200">
                <!-- Apertura -->
                <div class="relative">
                  <div class="absolute -left-[30px] top-1.5 bg-indigo-500 rounded-full h-3 w-3 border-2 border-white"></div>
                  <p class="text-xs font-bold text-slate-700">Ficha Creada</p>
                  <p class="text-[10px] text-slate-400">
                    {{ report.fechaApertura ? (report.fechaApertura | date:'short') : '—' }}
                  </p>
                </div>

                <!-- Diagnóstico / Inicio -->
                @if (report.fechaInicioInterno) {
                  <div class="relative">
                    <div class="absolute -left-[30px] top-1.5 bg-blue-500 rounded-full h-3 w-3 border-2 border-white"></div>
                    <p class="text-xs font-bold text-slate-700">Diagnóstico Realizado</p>
                    <p class="text-[10px] text-slate-500 mt-0.5">Diagnóstico: {{ report.diagnostico }}</p>
                    <p class="text-[10px] text-slate-400">
                      {{ report.fechaInicioInterno | date:'short' }}
                    </p>
                  </div>
                }

                <!-- Escalación -->
                @if (report.escalaAProveedor) {
                  <div class="relative">
                    <div class="absolute -left-[30px] top-1.5 bg-purple-500 rounded-full h-3 w-3 border-2 border-white"></div>
                    <p class="text-xs font-bold text-purple-700">Escalado a Proveedor</p>
                    <p class="text-[10px] text-slate-500 mt-0.5">Motivo: {{ report.motivoEscalacion }}</p>
                    @if (report.soporteProveedorUrl) {
                      <a [href]="report.soporteProveedorUrl" target="_blank" class="text-[10px] text-indigo-600 font-bold block hover:underline">Ver cotización proveedor 📄</a>
                    }
                    <p class="text-[10px] text-slate-400">
                      {{ report.fechaEscalacion | date:'short' }}
                    </p>
                  </div>
                }

                <!-- Soporte de Autorización -->
                @if (report.soporteAutorizacionUrl) {
                  <div class="relative">
                    <div class="absolute -left-[30px] top-1.5 bg-red-500 rounded-full h-3 w-3 border-2 border-white"></div>
                    <p class="text-xs font-bold text-red-700">Autorización Adjuntada</p>
                    <a [href]="report.soporteAutorizacionUrl" target="_blank" class="text-[10px] text-indigo-600 font-bold block hover:underline">Ver soporte de autorización 📄</a>
                  </div>
                }

                <!-- Cierre -->
                @if (report.fechaCierre) {
                  <div class="relative">
                    <div class="absolute -left-[30px] top-1.5 bg-emerald-500 rounded-full h-3 w-3 border-2 border-white"></div>
                    <p class="text-xs font-bold text-emerald-700">Ficha Cerrada</p>
                    <p class="text-[10px] text-slate-500 mt-0.5">Resultado: <span class="font-bold">{{ report.resultadoFinal }}</span></p>
                    <p class="text-[10px] text-slate-500">Acciones: {{ report.accionesRealizadas }}</p>
                    @if (report.costoFinal) {
                      <p class="text-[10px] text-indigo-600 font-bold">Costo Final: $ {{ report.costoFinal | number:'1.2-2' }}</p>
                    }
                    <p class="text-[10px] text-slate-400">
                      {{ report.fechaCierre | date:'short' }}
                    </p>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Footer (Para Creación únicamente) -->
      @if (!report) {
        <div class="px-6 py-4 border-t border-slate-200 shrink-0">
          <button (click)="guardarNuevaFicha()" [disabled]="saving() || !activoId"
            class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2">
            @if (saving()) {
              <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              Guardando...
            } @else {
              Abrir Ficha de Mantenimiento
            }
          </button>
        </div>
      }
    </div>
  `,
  styles: []
})
export class MaintenanceDrawerComponent implements OnInit {
  private usecases = inject(MaintenanceUseCases);
  private activoRepo = inject(HttpActivoRepository);
  private http = inject(HttpClient);
  private keycloak = inject(Keycloak);

  @Input() open = false;
  @Input() set report(val: MaintenanceReport | null) {
    this._report = val;
    if (val) {
      this.cargarDetallesReporte(val);
    } else {
      this.resetForm();
    }
  }
  get report() { return this._report; }
  private _report: MaintenanceReport | null = null;

  @Output() openChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  // Permisos basados en Roles
  isAdmin = computed(() => this.keycloak.hasRealmRole('admin') || this.keycloak.hasRealmRole('ADMIN'));
  isTecnico = computed(() => this.keycloak.hasRealmRole('tecnico') || this.keycloak.hasRealmRole('TECNICO') || this.isAdmin());

  // Form Fields
  disponibles = signal<Activo[]>([]);
  activoId = '';
  modalidad: ModalidadMantenimiento = ModalidadMantenimiento.INTERNO;
  tipoMantenimiento: TipoMantenimiento = TipoMantenimiento.CORRECTIVO;
  tecnicoResponsable = '';
  costoEstimado: number | undefined;

  // Form Fields Edición
  diagnostico = '';
  accionesRealizadas = '';
  repuestosUsados = '';
  costoFinal: number | undefined;
  cubiertoPorGarantia = false;
  resultadoFinal = ResultadoFinal.REPARADO;
  motivoEscalacion = '';
  proveedorServicio = '';
  referenciaOrdenServicio = '';
  soporteProveedorUrl = '';
  soporteAutorizacionUrl = '';

  // Auxiliares
  activoAsociado: Activo | null = null;
  saving = signal(false);
  subiendoSoporte = signal(false);
  requiereAutorizacionPorCosto = false;
  toast = signal<{ type: 'success' | 'error', message: string } | null>(null);

  ngOnInit() {
    this.cargarActivosDisponibles();
  }

  cargarActivosDisponibles() {
    this.activoRepo.getAll().subscribe((activos: Activo[]) => {
      // Activos en estado MANTENIMIENTO o DISPONIBLE
      const candidatos = activos.filter((a: Activo) => a.estado === 'MANTENIMIENTO' || a.estado === 'DISPONIBLE');
      this.usecases.getActive().subscribe((reports: MaintenanceReport[]) => {
        const idsConReporteActivo = new Set(reports.map((r: MaintenanceReport) => r.activoId));
        this.disponibles.set(candidatos.filter((a: Activo) => !idsConReporteActivo.has(a.id)));
      });
    });
  }

  puedeEditar(): boolean {
    return this.isTecnico();
  }

  cargarDetallesReporte(rep: MaintenanceReport) {
    this.diagnostico = rep.diagnostico || '';
    this.accionesRealizadas = rep.accionesRealizadas || '';
    this.repuestosUsados = rep.repuestosUsados || '';
    this.costoEstimado = rep.costoEstimado;
    this.costoFinal = rep.costoFinal;
    this.tecnicoResponsable = rep.tecnicoResponsable || '';
    this.cubiertoPorGarantia = rep.cubiertoPorGarantia || false;
    this.resultadoFinal = rep.resultadoFinal || ResultadoFinal.REPARADO;
    this.motivoEscalacion = rep.motivoEscalacion || '';
    this.proveedorServicio = rep.proveedorServicio || '';
    this.referenciaOrdenServicio = rep.referenciaOrdenServicio || '';
    this.soporteProveedorUrl = rep.soporteProveedorUrl || '';
    this.soporteAutorizacionUrl = rep.soporteAutorizacionUrl || '';
    this.requiereAutorizacionPorCosto = false;

    // Buscar info del Activo
    this.activoRepo.getAll().subscribe((activos: Activo[]) => {
      this.activoAsociado = activos.find((a: Activo) => a.id === rep.activoId) || null;
      if (this.activoAsociado && this.costoFinal) {
        this.checkCostoViabilidad(this.costoFinal);
      }
    });
  }

  checkCostoViabilidad(costo: number | undefined) {
    if (costo === undefined || costo === null || !this.activoAsociado || !this.activoAsociado.precioCompra) {
      this.requiereAutorizacionPorCosto = false;
      return;
    }
    const precioCompra = this.activoAsociado.precioCompra;
    // Si supera el 40% del precio de compra
    this.requiereAutorizacionPorCosto = (costo > precioCompra * 0.40);
  }

  mostrarAlertaViabilidad(): boolean {
    if (!this.activoAsociado || !this.activoAsociado.precioCompra) return false;
    const costo = (this.costoFinal !== undefined && this.costoFinal !== null) ? this.costoFinal : this.costoEstimado;
    if (costo === undefined || costo === null) return false;
    return (costo > this.activoAsociado.precioCompra * 0.40);
  }

  close() {
    this.openChange.emit(false);
  }

  resetForm() {
    this.activoId = '';
    this.modalidad = ModalidadMantenimiento.INTERNO;
    this.tipoMantenimiento = TipoMantenimiento.CORRECTIVO;
    this.tecnicoResponsable = '';
    this.costoEstimado = undefined;
    this.diagnostico = '';
    this.accionesRealizadas = '';
    this.repuestosUsados = '';
    this.costoFinal = undefined;
    this.cubiertoPorGarantia = false;
    this.resultadoFinal = ResultadoFinal.REPARADO;
    this.motivoEscalacion = '';
    this.proveedorServicio = '';
    this.referenciaOrdenServicio = '';
    this.soporteProveedorUrl = '';
    this.soporteAutorizacionUrl = '';
    this.activoAsociado = null;
    this.requiereAutorizacionPorCosto = false;
    this.toast.set(null);
  }

  guardarNuevaFicha() {
    this.toast.set(null);
    if (!this.isTecnico()) {
      this.toast.set({ type: 'error', message: 'No cuenta con el rol requerido (Tecnico/Admin) para abrir una ficha de mantenimiento.' });
      return;
    }

    // Validaciones de obligatoriedad
    if (this.modalidad === ModalidadMantenimiento.INTERNO && !this.tecnicoResponsable.trim()) {
      this.toast.set({ type: 'error', message: 'El Técnico Responsable es obligatorio para mantenimientos internos.' });
      return;
    }
    if (this.modalidad === ModalidadMantenimiento.EXTERNO && !this.proveedorServicio.trim()) {
      this.toast.set({ type: 'error', message: 'El Proveedor de Servicio es obligatorio para mantenimientos externos.' });
      return;
    }

    this.saving.set(true);
    this.usecases.create({
      activoId: this.activoId,
      modalidad: this.modalidad,
      tipoMantenimiento: this.tipoMantenimiento,
      tecnicoResponsable: this.modalidad === ModalidadMantenimiento.INTERNO ? this.tecnicoResponsable.trim() : undefined,
      proveedorServicio: this.modalidad === ModalidadMantenimiento.EXTERNO ? this.proveedorServicio.trim() : undefined,
      costoEstimado: this.costoEstimado
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.set({ type: 'success', message: 'Ficha de mantenimiento abierta con éxito.' });
        this.saved.emit();
        this.cargarActivosDisponibles();
        setTimeout(() => { this.close(); this.resetForm(); }, 1500);
      },
      error: (err: any) => {
        this.saving.set(false);
        this.toast.set({ type: 'error', message: err.error?.message || 'Error al abrir la ficha de mantenimiento.' });
      }
    });
  }

  iniciarReparacion() {
    this.toast.set(null);
    if (!this.diagnostico) {
      this.toast.set({ type: 'error', message: 'El diagnóstico inicial es requerido.' });
      return;
    }
    if (this.report?.modalidad === 'INTERNO' && !this.tecnicoResponsable.trim()) {
      this.toast.set({ type: 'error', message: 'El Técnico Responsable es obligatorio para iniciar mantenimiento interno.' });
      return;
    }
    this.saving.set(true);
    this.usecases.update(this.report!.id, {
      accion: 'iniciar',
      diagnostico: this.diagnostico,
      tecnicoResponsable: this.tecnicoResponsable || undefined,
      costoEstimado: this.costoEstimado
    }).subscribe({
      next: (updated: MaintenanceReport) => {
        this.saving.set(false);
        this.report = updated;
        this.toast.set({ type: 'success', message: 'Reparación iniciada exitosamente.' });
        this.saved.emit();
      },
      error: (err: any) => {
        this.saving.set(false);
        this.toast.set({ type: 'error', message: err.error?.message || 'Error al iniciar la reparación.' });
      }
    });
  }

  descartarSinFallas() {
    this.toast.set(null);
    if (!this.diagnostico) {
      this.toast.set({ type: 'error', message: 'Por favor, ingrese un diagnóstico o motivo de descarte.' });
      return;
    }
    this.saving.set(true);
    this.usecases.update(this.report!.id, {
      accion: 'cerrar',
      accionesRealizadas: `Descartado en diagnóstico inicial. Motivo: ${this.diagnostico}`,
      costoFinal: 0,
      resultadoFinal: ResultadoFinal.SIN_FALLAS
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.set({ type: 'success', message: 'Mantenimiento descartado y cerrado exitosamente.' });
        this.saved.emit();
        setTimeout(() => this.close(), 1500);
      },
      error: (err: any) => {
        this.saving.set(false);
        this.toast.set({ type: 'error', message: err.error?.message || 'Error al descartar la ficha.' });
      }
    });
  }

  cerrarMantenimiento() {
    this.toast.set(null);
    if (!this.accionesRealizadas || this.costoFinal === undefined || this.costoFinal === null || this.costoFinal < 0) {
      this.toast.set({ type: 'error', message: 'Las acciones realizadas son obligatorias y el costo final debe ser mayor o igual a 0.' });
      return;
    }
    this.saving.set(true);
    this.usecases.update(this.report!.id, {
      accion: 'cerrar',
      accionesRealizadas: this.accionesRealizadas,
      repuestosUsados: this.repuestosUsados || undefined,
      costoFinal: this.costoFinal,
      resultadoFinal: this.resultadoFinal,
      cubiertoPorGarantia: this.cubiertoPorGarantia
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.set({ type: 'success', message: 'Ficha de mantenimiento cerrada con éxito.' });
        this.saved.emit();
        setTimeout(() => this.close(), 1500);
      },
      error: (err: any) => {
        this.saving.set(false);
        this.toast.set({ type: 'error', message: err.error?.message || 'Error al cerrar la ficha.' });
      }
    });
  }

  solicitarAutorizacion() {
    this.toast.set(null);
    this.saving.set(true);
    this.usecases.update(this.report!.id, {
      accion: 'solicitar_autorizacion'
    }).subscribe({
      next: (updated: MaintenanceReport) => {
        this.saving.set(false);
        this.report = updated;
        this.toast.set({ type: 'success', message: 'Autorización solicitada con éxito.' });
        this.saved.emit();
      },
      error: (err: any) => {
        this.saving.set(false);
        this.toast.set({ type: 'error', message: err.error?.message || 'Error al solicitar autorización.' });
      }
    });
  }

  aprobarAutorizacion() {
    this.toast.set(null);
    if (!this.soporteAutorizacionUrl) {
      this.toast.set({ type: 'error', message: 'Por favor cargue el soporte de autorización primero.' });
      return;
    }
    this.saving.set(true);
    this.usecases.update(this.report!.id, {
      accion: 'aprobar',
      soporteAutorizacionUrl: this.soporteAutorizacionUrl
    }).subscribe({
      next: (updated: MaintenanceReport) => {
        this.saving.set(false);
        this.report = updated;
        this.toast.set({ type: 'success', message: 'Autorización aprobada. Puede reanudar el mantenimiento.' });
        this.saved.emit();
      },
      error: (err: any) => {
        this.saving.set(false);
        this.toast.set({ type: 'error', message: err.error?.message || 'Error al aprobar.' });
      }
    });
  }

  escalarAProveedor() {
    this.toast.set(null);
    if (!this.motivoEscalacion || !this.proveedorServicio) {
      this.toast.set({ type: 'error', message: 'El motivo y el proveedor son obligatorios.' });
      return;
    }
    this.saving.set(true);
    this.usecases.update(this.report!.id, {
      accion: 'escalar',
      motivoEscalacion: this.motivoEscalacion,
      proveedorServicio: this.proveedorServicio,
      referenciaOrdenServicio: this.referenciaOrdenServicio || undefined,
      soporteProveedorUrl: this.soporteProveedorUrl || undefined
    }).subscribe({
      next: (updated: MaintenanceReport) => {
        this.saving.set(false);
        this.report = updated;
        this.toast.set({ type: 'success', message: 'Mantenimiento escalado a proveedor externo.' });
        this.saved.emit();
      },
      error: (err: any) => {
        this.saving.set(false);
        this.toast.set({ type: 'error', message: err.error?.message || 'Error al escalar.' });
      }
    });
  }

  registrarRetornoProveedor() {
    this.toast.set(null);
    if (!this.accionesRealizadas || this.costoFinal === undefined || this.costoFinal === null || this.costoFinal < 0) {
      this.toast.set({ type: 'error', message: 'Debe especificar las acciones realizadas y un costo final mayor o igual a 0.' });
      return;
    }
    this.saving.set(true);
    this.usecases.update(this.report!.id, {
      accion: 'retorno_proveedor',
      accionesRealizadas: this.accionesRealizadas,
      costoFinal: this.costoFinal,
      resultadoFinal: this.resultadoFinal
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.set({ type: 'success', message: 'Retorno registrado y ficha cerrada con éxito.' });
        this.saved.emit();
        setTimeout(() => this.close(), 1500);
      },
      error: (err: any) => {
        this.saving.set(false);
        this.toast.set({ type: 'error', message: err.error?.message || 'Error al registrar retorno.' });
      }
    });
  }

  subirSoporteArchivo(event: Event, tipo: 'proveedor' | 'autorizacion') {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.subiendoSoporte.set(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.http.post<{ url: string }>(`${environment.apiUrl}/files/upload`, {
        base64,
        fileName: file.name,
        folder: 'mantenimiento'
      }).subscribe({
        next: (res) => {
          this.subiendoSoporte.set(false);
          if (tipo === 'proveedor') {
            this.soporteProveedorUrl = res.url;
          } else {
            this.soporteAutorizacionUrl = res.url;
          }
        },
        error: () => {
          this.subiendoSoporte.set(false);
          this.toast.set({ type: 'error', message: 'Error al subir el soporte.' });
        }
      });
    };
    reader.readAsDataURL(file);
  }

  getEstadoLabel(state: EstadoFicha): string {
    return ESTADO_FICHA_LABELS[state] || state;
  }

  estadoColor(state: EstadoFicha): string {
    const map: Record<EstadoFicha, string> = {
      [EstadoFicha.PENDIENTE_DIAGNOSTICO]: '#f59e0b',
      [EstadoFicha.EN_PROCESO]: '#3b82f6',
      [EstadoFicha.REQUIERE_AUTORIZACION]: '#ef4444',
      [EstadoFicha.ENVIADO_PROVEEDOR]: '#8b5cf6',
      [EstadoFicha.CERRADO]: '#10b981'
    };
    return map[state] || '#64748b';
  }
}
