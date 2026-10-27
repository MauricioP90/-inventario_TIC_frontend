import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OfficialDocumentData } from '../../../../domain/models/document-template.model';
import { getEstadoLabel } from './document-template.utils';

@Component({
  selector: 'app-document-acta-general-template',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- ENCABEZADO INSTITUCIONAL OFICIAL (GF-FO-29) -->
    <div class="border-2 border-slate-900 mb-5">
      <div class="grid grid-cols-12 divide-x-2 divide-slate-900 text-slate-900">
        
        <!-- Logo y Empresa -->
        <div class="col-span-3 p-2.5 flex flex-col items-center justify-center text-center">
          <img src="/Logo_FLM.png" alt="Flota La Macarena" class="h-12 w-auto object-contain mb-1" />
          <p class="text-[9px] font-extrabold uppercase tracking-tight">Flota La Macarena S.A.</p>
          <p class="text-[8px] text-slate-600">NIT 860.007.607-1</p>
        </div>

        <!-- Título Central y Tipo de Activo -->
        <div class="col-span-6 p-2.5 flex flex-col items-center justify-center text-center">
          <p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">SISTEMA INTEGRADO DE GESTIÓN</p>
          <h1 class="text-xs sm:text-sm font-black uppercase text-slate-900 tracking-tight leading-snug">
            {{ doc.config.titulo }}
          </h1>
          <p class="text-[9px] font-bold text-slate-700 uppercase mt-0.5">{{ doc.config.subtitulo }}</p>
        </div>

        <!-- Metadatos de Calidad -->
        <div class="col-span-3 p-2 text-[9px] flex flex-col justify-center divide-y divide-slate-300">
          <p class="pb-0.5"><span class="font-bold">Código:</span> <span class="font-mono font-bold">{{ doc.config.codigoCalidad }}</span></p>
          <p class="py-0.5"><span class="font-bold">Versión:</span> {{ doc.config.version }}</p>
          <p class="py-0.5"><span class="font-bold">Consecutivo:</span> <span class="font-mono font-bold text-indigo-950">{{ doc.consecutivo }}</span></p>
          <p class="pt-0.5"><span class="font-bold">Fecha:</span> {{ doc.fechaEmision | date:'dd/MM/yyyy' }}</p>
        </div>

      </div>
    </div>

    <!-- 1. INFORMACIÓN DEL TRABAJADOR / RECEPTOR (Estructura oficial GF-FO-29) -->
    <div class="border border-slate-900 rounded-xs overflow-hidden mb-4 text-[10px]">
      <div class="bg-slate-100 border-b border-slate-900 px-3 py-1 font-bold uppercase tracking-wider text-slate-900 text-[10px]">
        INFORMACIÓN DEL TRABAJADOR
      </div>
      
      <div class="grid grid-cols-12 divide-x divide-slate-900 border-b border-slate-900">
        <div class="col-span-7 p-2 flex items-center justify-between">
          <span class="font-bold text-slate-900">FECHA ENTREGA Y/O ASIGNACIÓN:</span>
          <span class="font-mono font-bold text-slate-900 text-xs">
            {{ doc.fechaEmision | date:'dd' }} / {{ doc.fechaEmision | date:'MM' }} / {{ doc.fechaEmision | date:'yyyy' }}
          </span>
        </div>
        <div class="col-span-5 p-2 flex items-center justify-between">
          <span class="font-bold text-slate-900">DEPENDENCIA:</span>
          <span class="font-semibold text-slate-900 uppercase">{{ doc.partes.entregadoA.sede }}</span>
        </div>
      </div>

      <div class="grid grid-cols-12 divide-x divide-slate-900">
        <div class="col-span-5 p-2 space-y-0.5">
          <span class="font-bold text-slate-900 block text-[9px]">NOMBRE:</span>
          <span class="font-bold text-slate-900 text-xs uppercase">{{ doc.partes.entregadoA.nombre }}</span>
        </div>
        <div class="col-span-4 p-2 space-y-0.5">
          <span class="font-bold text-slate-900 block text-[9px]">No. IDENTIFICACIÓN:</span>
          <span class="font-mono font-bold text-slate-900">{{ doc.partes.entregadoA.identificacion || '______________________' }}</span>
        </div>
        <div class="col-span-3 p-2 space-y-0.5">
          <span class="font-bold text-slate-900 block text-[9px]">CARGO:</span>
          <span class="font-semibold text-slate-900 uppercase">{{ doc.partes.entregadoA.cargo }}</span>
        </div>
      </div>
    </div>

    <!-- 2. INFORMACIÓN DEL ACTIVO (Tabla oficial GF-FO-29) -->
    @if (doc.activos.length > 0) {
      <div class="border border-slate-900 rounded-xs overflow-hidden mb-4">
        <div class="bg-slate-100 border-b border-slate-900 px-3 py-1 font-bold uppercase tracking-wider text-slate-900 text-[10px]">
          INFORMACIÓN DEL ACTIVO (Total: {{ doc.activos.length }})
        </div>
        <table class="w-full text-left text-[10px] divide-y divide-slate-300">
          <thead class="bg-slate-50 text-slate-900 font-bold uppercase tracking-wider text-[9px] border-b border-slate-900">
            <tr class="divide-x divide-slate-300">
              <th class="px-2 py-1.5 text-center w-8">Ítem</th>
              <th class="px-2.5 py-1.5">Descripción</th>
              <th class="px-2.5 py-1.5">Placa</th>
              <th class="px-2.5 py-1.5">Serie</th>
              <th class="px-2.5 py-1.5">Marca</th>
              <th class="px-2.5 py-1.5">Modelo</th>
              <th class="px-2.5 py-1.5 text-center w-24">*Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 text-slate-800">
            @for (activo of doc.activos; track activo.placa; let idx = $index) {
              <tr class="divide-x divide-slate-200 hover:bg-slate-50/50">
                <td class="px-2 py-1.5 text-center font-mono text-slate-500">{{ idx + 1 }}</td>
                <td class="px-2.5 py-1.5 font-medium text-slate-900">{{ activo.tipo }}</td>
                <td class="px-2.5 py-1.5 font-mono font-bold text-slate-900">{{ activo.placa }}</td>
                <td class="px-2.5 py-1.5 font-mono text-slate-700">{{ activo.serial }}</td>
                <td class="px-2.5 py-1.5">{{ activo.marca }}</td>
                <td class="px-2.5 py-1.5">{{ activo.modelo }}</td>
                <td class="px-2 py-1 text-center font-semibold text-slate-900">
                  <!-- Selector interactivo en pantalla -->
                  <div class="no-print flex items-center justify-center">
                    <select 
                      [ngModel]="getActivoEstado(activo.placa, activo.estado)"
                      (ngModelChange)="onSelectEstado(activo.placa, $event)"
                      class="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[9px] font-bold text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs hover:border-slate-400 transition-colors">
                      <option value="(B) Bueno">(B) Bueno</option>
                      <option value="(R) Regular">(R) Regular</option>
                      <option value="(M) Malo">(M) Malo</option>
                    </select>
                  </div>
                  <!-- Texto oficial para impresión física o PDF -->
                  <span class="print-only hidden font-semibold text-slate-900 text-[10px]">
                    {{ getActivoEstado(activo.placa, activo.estado) }}
                  </span>
                </td>
              </tr>
            }
          </tbody>
        </table>
        <div class="bg-slate-50 border-t border-slate-300 px-3 py-1 text-[9px] text-slate-600 font-medium flex items-center justify-between">
          <span>* Estado: (B) Bueno | (R) Regular | (M) Malo</span>
          @if (doc.activos.length > 1) {
            <div class="no-print flex items-center gap-1.5 text-[9px]">
              <span class="text-slate-400 font-semibold">Marcar todos:</span>
              <button 
                type="button" 
                (click)="setTodosEstados.emit('(B) Bueno')"
                class="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer">
                (B) Bueno
              </button>
              <span class="text-slate-300">|</span>
              <button 
                type="button" 
                (click)="setTodosEstados.emit('(R) Regular')"
                class="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer">
                (R) Regular
              </button>
              <span class="text-slate-300">|</span>
              <button 
                type="button" 
                (click)="setTodosEstados.emit('(M) Malo')"
                class="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer">
                (M) Malo
              </button>
            </div>
          }
        </div>
      </div>
    }

    <!-- TABLA COMPLEMENTARIA DE SIM CARDS (Si hay líneas asociadas) -->
    @if (doc.simCards && doc.simCards.length > 0) {
      <div class="border border-slate-900 rounded-xs overflow-hidden mb-4">
        <div class="bg-slate-100 border-b border-slate-900 px-3 py-1 font-bold uppercase tracking-wider text-slate-900 text-[10px]">
          INFORMACIÓN DE LÍNEAS CELULARES / SIM CARDS (Total: {{ doc.simCards.length }})
        </div>
        <table class="w-full text-left text-[10px] divide-y divide-slate-300">
          <thead class="bg-slate-50 text-slate-900 font-bold uppercase tracking-wider text-[9px] border-b border-slate-900">
            <tr class="divide-x divide-slate-300">
              <th class="px-2 py-1.5 text-center w-8">Ítem</th>
              <th class="px-2.5 py-1.5">Número Telefónico</th>
              <th class="px-2.5 py-1.5">ICCID (Serial SIM)</th>
              <th class="px-2.5 py-1.5">Operador</th>
              <th class="px-2.5 py-1.5 text-center w-24">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 text-slate-800">
            @for (sim of doc.simCards; track sim.iccid; let idx = $index) {
              <tr class="divide-x divide-slate-200 hover:bg-slate-50/50">
                <td class="px-2 py-1.5 text-center font-mono text-slate-500">{{ idx + 1 }}</td>
                <td class="px-2.5 py-1.5 font-mono font-bold text-slate-900">📱 {{ sim.numero }}</td>
                <td class="px-2.5 py-1.5 font-mono text-slate-700">{{ sim.iccid }}</td>
                <td class="px-2.5 py-1.5 font-bold uppercase">{{ sim.operador }}</td>
                <td class="px-2.5 py-1.5 text-center font-semibold text-slate-700">{{ sim.estado }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    <!-- OBSERVACIONES (Estructura oficial GF-FO-29) -->
    <div class="border border-slate-900 rounded-xs overflow-hidden mb-4 text-[10px]">
      <div class="bg-slate-100 border-b border-slate-900 px-3 py-1 font-bold uppercase tracking-wider text-slate-900 text-[10px]">
        OBSERVACIONES:
      </div>
      <div class="p-2.5 min-h-10 text-slate-800 text-[10px] leading-relaxed">
        {{ doc.observacionesGenerales || 'Se entrega en normal estado de funcionamiento y presentación.' }}
      </div>
    </div>

    <!-- CLÁUSULAS ADICIONALES (Para formatos contractuales como Comodato) -->
    @if (doc.config.clausulas && doc.config.clausulas.length > 0) {
      <div class="border border-slate-900 rounded-xs overflow-hidden mb-4">
        <div class="bg-slate-100 border-b border-slate-900 px-3 py-1 font-bold uppercase tracking-wider text-slate-900 text-[10px]">
          CLÁUSULAS Y CONDICIONES DEL DOCUMENTO
        </div>
        <div class="p-3 space-y-1.5 text-[10px] text-justify text-slate-800 leading-normal">
          @for (clausula of doc.config.clausulas; track clausula.num) {
            <p>
              <span class="font-bold text-slate-900">{{ clausula.num }}. {{ clausula.titulo }}:</span>
              {{ clausula.texto }}
            </p>
          }
        </div>
      </div>
    }

    <!-- CLÁUSULA DE COMPROMISO (Texto oficial literal de GF-FO-29) -->
    <div class="border border-slate-900 rounded-xs overflow-hidden mb-5">
      <div class="bg-slate-100 border-b border-slate-900 px-3 py-1 font-bold uppercase tracking-wider text-slate-900 text-[10px]">
        CLÁUSULA DE COMPROMISO
      </div>
      <div class="p-3 text-[10px] text-justify text-slate-800 leading-relaxed whitespace-pre-line">
        {{ doc.config.compromisoReceptor }}
      </div>
    </div>

    <!-- BLOQUE DE FIRMAS: ENTREGÓ / RECIBIÓ (Oficial GF-FO-29 Versión 07) -->
    <div class="grid grid-cols-2 divide-x divide-slate-900 border border-slate-900 rounded-xs mb-5 page-break-inside-avoid">
      
      <!-- ENTREGÓ -->
      <div class="p-3.5 space-y-2 text-[10px]">
        <div class="bg-slate-100 -mx-3.5 -mt-3.5 px-3.5 py-1 border-b border-slate-900 font-bold uppercase text-slate-900 mb-2.5">
          ENTREGÓ
        </div>
        <div class="h-14 border-b border-slate-400 mb-2 flex items-end">
          <span class="text-slate-300 text-[8px] italic">Firma del funcionario TIC</span>
        </div>
        <p class="flex items-baseline">
          <span class="font-bold text-slate-900 inline-block min-w-16 mr-3">FIRMA:</span>
          <span class="flex-1 border-b border-slate-300"></span>
        </p>
        <p class="flex items-baseline">
          <span class="font-bold text-slate-900 inline-block min-w-16 mr-3">NOMBRE:</span>
          <span class="uppercase font-semibold text-slate-800">{{ doc.partes.elaboradoPor.nombre }}</span>
        </p>
        <p class="flex items-baseline">
          <span class="font-bold text-slate-900 inline-block min-w-16 mr-3">CARGO:</span>
          <span class="font-semibold text-slate-700">{{ doc.partes.elaboradoPor.cargo }}</span>
        </p>
      </div>

      <!-- RECIBIÓ -->
      <div class="p-3.5 space-y-2 text-[10px]">
        <div class="bg-slate-100 -mx-3.5 -mt-3.5 px-3.5 py-1 border-b border-slate-900 font-bold uppercase text-slate-900 mb-2.5">
          RECIBIÓ
        </div>
        <div class="h-14 border-b border-slate-400 mb-2 flex items-end">
          <span class="text-slate-300 text-[8px] italic">Firma del trabajador receptor</span>
        </div>
        <p class="flex items-baseline">
          <span class="font-bold text-slate-900 inline-block min-w-28 mr-3">FIRMA:</span>
          <span class="flex-1 border-b border-slate-300"></span>
        </p>
        <p class="flex items-baseline">
          <span class="font-bold text-slate-900 inline-block min-w-28 mr-3">NOMBRE:</span>
          <span class="uppercase font-semibold text-slate-800">{{ doc.partes.entregadoA.nombre }}</span>
        </p>
        <p class="flex items-baseline">
          <span class="font-bold text-slate-900 inline-block min-w-28 mr-3">CARGO:</span>
          <span class="font-semibold text-slate-700">{{ doc.partes.entregadoA.cargo }}</span>
        </p>
        <p class="flex items-baseline">
          <span class="font-bold text-slate-900 inline-block min-w-28 mr-3">No. IDENTIFICACIÓN:</span>
          <span class="font-mono font-semibold text-slate-800">{{ doc.partes.entregadoA.identificacion || '______________________' }}</span>
        </p>
      </div>

    </div>

    <!-- Pie de Elaboración Oficial (Idéntico a Préstamo de Dispositivos) -->
    <div class="pt-2.5 pb-1 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-600">
      <div class="flex items-center gap-1.5">
        <span class="font-bold text-slate-800">Elaboró:</span>
        <span class="font-semibold text-slate-900 uppercase">{{ doc.partes.elaboradoPor.nombre }}</span>
        <span class="text-slate-400">—</span>
        <span class="italic text-slate-600">{{ doc.partes.elaboradoPor.cargo }}</span>
      </div>
      <div class="text-[9px] text-slate-400">
        Flota La Macarena S.A. • Nit: 860.007.607-1 • Ref: {{ doc.config.codigoCalidad || 'GF-FO-29' }}
      </div>
    </div>

    <!-- PIE DE PÁGINA INSTITUCIONAL SGI (GF-FO-29) -->
    <div class="text-[8px] text-justify text-slate-500 border border-slate-300 p-2 rounded-xs bg-slate-50 leading-tight">
      Si usted copia o imprime este documento, el proceso de Mejoramiento y Productividad de Flota la Macarena S.A., lo considerará <strong>NO CONTROLADO</strong> y no se hace responsable por su consulta o uso. Si usted desea consultar la versión actualizada y controlada de este documento, consulte siempre la intranet de la compañía.
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    .page-break-inside-avoid {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    @media print {
      .no-print {
        display: none !important;
      }
      .print-only {
        display: inline-block !important;
      }
    }
  `]
})
export class DocumentActaGeneralTemplateComponent {
  @Input({ required: true }) doc!: OfficialDocumentData;
  @Input() customEstados: Record<string, string> = {};

  @Output() estadoChange = new EventEmitter<{ placa: string, estado: string }>();
  @Output() setTodosEstados = new EventEmitter<string>();

  getActivoEstado(placa: string, fallbackEstado?: string): string {
    const custom = this.customEstados[placa];
    if (custom) return custom;
    return getEstadoLabel(fallbackEstado || '');
  }

  onSelectEstado(placa: string, nuevoEstado: string) {
    this.estadoChange.emit({ placa, estado: nuevoEstado });
  }
}
