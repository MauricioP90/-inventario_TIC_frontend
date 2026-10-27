import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfficialDocumentData } from '../../../../domain/models/document-template.model';
import { formatFechaFormal, getPrimerActivo } from './document-template.utils';

@Component({
  selector: 'app-document-reintegro-template',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- FORMATO OFICIAL: REINTEGRO DE DISPOSITIVO Y/O DEVOLUCIÓN -->
    <div class="space-y-5 text-slate-900 font-sans text-xs sm:text-[13px] leading-relaxed">
      
      <!-- Membrete Superior con Logo y Referencia -->
      <div class="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-4">
        <div class="flex items-center gap-3">
          <img src="/Logo_FLM.png" alt="Flota La Macarena" class="h-14 w-auto object-contain" />
          <div>
            <h2 class="text-xs sm:text-sm font-black uppercase text-slate-900 tracking-tight leading-tight">FLOTA LA MACARENA S.A.</h2>
            <p class="text-[10px] text-slate-600 font-semibold">NIT 860.007.607-1</p>
            <p class="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Dirección Nacional de Transporte de Pasajeros</p>
          </div>
        </div>
        <div class="text-right">
          <span class="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-mono font-bold text-xs border border-slate-300">
            {{ doc.consecutivo }}
          </span>
          <p class="text-[9px] text-slate-400 mt-1 uppercase font-semibold">Ref: DP-RD-01</p>
        </div>
      </div>

      <!-- Ciudad y Fecha Formal -->
      <div class="text-right font-semibold text-slate-800 mb-6">
        {{ doc.ciudad }}, {{ formatFechaFormal(doc.fechaEmision) }}
      </div>

      <!-- Datos del Destinatario -->
      <div class="space-y-0.5 text-slate-900 mb-6 text-xs sm:text-[13px]">
        <p>Señor(a)</p>
        <p class="font-bold text-slate-900 uppercase text-sm tracking-tight">{{ doc.partes.entregadoA.nombre }}</p>
        <p class="font-bold text-slate-800">Participe en Colaboración Empresarial</p>
        <p class="font-bold text-slate-800">Oficina. <span class="font-semibold uppercase text-slate-900">{{ doc.partes.entregadoA.sede }}</span></p>
        <p class="font-bold text-slate-800 uppercase">{{ doc.ciudad }}</p>
      </div>

      <!-- Asunto -->
      <div class="mb-5">
        <p class="font-bold text-slate-900 text-xs sm:text-[13px]">
          Asunto: 
          <span class="font-normal">
            @if (incluyeDevolucionPrestamo && (placaPrestada || modeloPrestado)) {
              Reintegro de dispositivo {{ activoImprimir?.modelo || 'titular' }} (Serial: {{ activoImprimir?.serial || 'N/A' }}) y solicitud de devolución de equipo en préstamo {{ modeloPrestado || 'móvil' }} (Placa de inventario: {{ placaPrestada || 'N/A' }})
            } @else {
              Reintegro de dispositivo {{ activoImprimir?.modelo || 'titular' }} (Placa de inventario: {{ activoImprimir?.placa || 'N/A' }})
            }
          </span>
        </p>
      </div>

      <!-- Saludo -->
      <div class="space-y-1 mb-5 text-xs sm:text-[13px]">
        <p class="font-normal text-slate-900">Respetada Señor(a) {{ doc.partes.entregadoA.nombre }}:</p>
        <p class="font-normal text-slate-800">Reciba un cordial saludo de parte de Flota La Macarena S.A.</p>
      </div>

      <!-- Párrafo 1: Causal / Contrato / Reintegro del Dispositivo Reparado -->
      <div class="text-justify text-slate-800 mb-4 leading-relaxed">
        <p>
          En ejercicio de la facultad de supervisión y control derivada del Contrato de Colaboración Empresarial suscrito el <span class="font-semibold underline">{{ fechaContratoReintegro || '…………………….' }}</span>, y en atención al reporte de fallas técnicas del equipo móvil modelo <strong>{{ activoImprimir?.modelo || 'xxxx' }}</strong> (Placa de inventario: <strong>{{ activoImprimir?.placa || 'xxxxxxx' }}</strong>) entregado en comodato, nos permitimos informarle que, tras la revisión técnica y reparación correspondiente, se procede al reintegro del dispositivo en óptimas condiciones de funcionamiento bajo las siguientes especificaciones:
        </p>
      </div>

      <!-- Bloque de Características Técnicas del Dispositivo Reintegrado -->
      <div class="bg-slate-50/70 border-2 border-slate-900 rounded-lg p-4 space-y-2 text-slate-900 my-4">
        @if (activoImprimir) {
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            <p><strong class="font-bold text-slate-900">Modelo: </strong> <span class="font-semibold">{{ activoImprimir.modelo }} ({{ activoImprimir.marca }})</span></p>
            <p><strong class="font-bold text-slate-900">Placa de Inventario: </strong> <span class="font-mono font-bold">{{ activoImprimir.placa }}</span> <span class="text-slate-500 font-mono text-[11px]">(Serial: {{ activoImprimir.serial }})</span></p>
            <p><strong class="font-bold text-slate-900">Cargador: </strong> <span class="font-semibold">{{ incluyeCargadorReintegro }}</span></p>
            <p><strong class="font-bold text-slate-900">Forro: </strong> <span class="font-semibold">{{ incluyeForroReintegro }}</span></p>
            <p class="sm:col-span-2">
              <strong class="font-bold text-slate-900">SIM Card: </strong> 
              <span class="font-semibold">{{ activoImprimir.simCard || (doc.simCards.length > 0 ? (doc.simCards[0].numero + ' - ' + doc.simCards[0].operador + ' [ICCID: ' + doc.simCards[0].iccid + ']') : 'No incluida') }}</span>
            </p>
          </div>
        } @else {
          <p class="italic text-slate-500 text-xs">No se encontraron activos asociados a este movimiento.</p>
        }
      </div>

      <!-- Párrafo 2: Solicitud formal de devolución del equipo en préstamo (Condicional) -->
      @if (incluyeDevolucionPrestamo) {
        <div class="text-justify text-slate-800 mb-4 leading-relaxed bg-amber-50/60 border border-amber-200 p-3.5 rounded-lg">
          <p>
            Por otra parte, toda vez que el dispositivo relacionado en el comodato ha sido reparado y reintegrado, solicitamos formalmente la devolución del equipo <strong>{{ modeloPrestado || 'móvil' }}</strong> (Placa de inventario: <strong>{{ placaPrestada || 'xxxxxxx' }}</strong>@if (serialPrestado) { - Serial: <strong>{{ serialPrestado }}</strong>}), el cual le fue entregado en calidad de préstamo temporal el pasado <span class="font-semibold underline">{{ fechaEntregaPrestamo || 'xxxxxxxxxxxxxx' }}</span>, con el fin de garantizar la continuidad de su operación durante el servicio técnico de dispositivo {{ activoImprimir?.modelo || 'titular' }}.
          </p>
        </div>
      }

      <!-- Párrafo 3: Calidad de Depositario y Custodia -->
      <div class="text-justify text-slate-800 mb-6 leading-relaxed">
        <p>
          Le recordamos que, conforme a lo estipulado en el contrato de colaboración, el Partícipe asume la calidad de depositario de los elementos suministrados por la Empresa. En consecuencia, es su obligación velar por el uso adecuado, custodia y conservación de esta herramienta tecnológica, la cual está destinada exclusivamente al desarrollo del objeto contractual.
        </p>
      </div>

      @if (doc.observacionesGenerales) {
        <div class="border border-slate-300 bg-slate-50 p-3 rounded-lg text-xs mb-6">
          <strong class="text-slate-700 block mb-0.5">Observaciones Adicionales:</strong>
          <p class="text-slate-800 italic">{{ doc.observacionesGenerales }}</p>
        </div>
      }

      <!-- Firmas: Emisor Oficial Institucional y Constancia de Recibido -->
      <div class="pt-6 grid grid-cols-2 gap-8 page-break-inside-avoid text-xs sm:text-[13px]">
        
        <!-- Emisor Institucional (Word Oficial) -->
        <div class="space-y-1">
          <p class="text-slate-700 font-semibold mb-12">Atentamente,</p>
          <div class="border-t border-slate-900 pt-1">
            <p class="font-black text-slate-900 uppercase">JOHAN HERNANDO VÁSQUEZ GONZÁLEZ</p>
            <p class="text-slate-700 text-xs font-semibold">Director Nacional de Transporte de Pasajeros</p>
            <p class="text-slate-500 text-[11px] font-mono mt-0.5">26-28</p>
          </div>
        </div>

        <!-- Receptor / Partícipe (Constancia de Recibido) -->
        <div class="space-y-1">
          <p class="text-slate-700 font-semibold mb-12">Recibí a conformidad:</p>
          <div class="border-t border-slate-900 pt-1">
            <p class="font-bold text-slate-900 uppercase">{{ doc.partes.entregadoA.nombre }}</p>
            <p class="text-slate-700 text-xs font-semibold">C.C. {{ doc.partes.entregadoA.identificacion || '__________________________' }}</p>
            <p class="text-slate-500 text-[11px] mt-0.5">Partícipe / Receptor Autorizado</p>
          </div>
        </div>

      </div>

      <!-- Pie de Página Institucional y Elaboración -->
      <div class="pt-4 mt-6 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-600">
        <div class="flex items-center gap-1.5">
          <span class="font-bold text-slate-800">Elaboró:</span>
          <span class="font-semibold text-slate-900 uppercase">{{ doc.partes.elaboradoPor.nombre }}</span>
          <span class="text-slate-400">—</span>
          <span class="italic text-slate-600">{{ doc.partes.elaboradoPor.cargo }}</span>
        </div>
        <div class="text-[9px] text-slate-400">
          Flota La Macarena S.A. • Nit: 860.007.607-1 • Ref: DP-RD-01
        </div>
      </div>

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
  `]
})
export class DocumentReintegroTemplateComponent {
  @Input({ required: true }) doc!: OfficialDocumentData;
  @Input() selectedActivo?: any = null;
  @Input() fechaContratoReintegro = '…………………….';
  @Input() incluyeCargadorReintegro = 'No incluido';
  @Input() incluyeForroReintegro = 'No incluido';
  @Input() incluyeDevolucionPrestamo = true;
  @Input() modeloPrestado = '';
  @Input() placaPrestada = '';
  @Input() serialPrestado = '';
  @Input() fechaEntregaPrestamo = '';

  readonly formatFechaFormal = formatFechaFormal;
  readonly getPrimerActivo = getPrimerActivo;

  get activoImprimir(): any {
    return this.selectedActivo || getPrimerActivo(this.doc);
  }
}
