import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfficialDocumentData } from '../../../../domain/models/document-template.model';
import { formatFechaFormal, getPrimerActivo } from './document-template.utils';

@Component({
  selector: 'app-document-memorando-template',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- FORMATO OFICIAL: MEMORANDOS INTERNOS (GR-MEM-26) -->
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
          <span class="px-2.5 py-1 rounded-md bg-slate-100 text-slate-900 font-mono font-bold text-xs border border-slate-300">
            MEMORANDO No. {{ doc.consecutivo }}
          </span>
          <p class="text-[9px] text-slate-400 mt-1 uppercase font-semibold">Ref: GR-MEM-26</p>
        </div>
      </div>

      <!-- Encabezado Formal de Memorando (PARA / DE / ASUNTO / FECHA) -->
      <div class="border-y border-slate-300 py-3.5 space-y-2 text-xs sm:text-[13px]">
        <div class="grid grid-cols-12 gap-2">
          <span class="col-span-2 font-bold text-slate-900">PARA:</span>
          <div class="col-span-10">
            <p class="font-bold text-slate-900 uppercase">{{ doc.partes.entregadoA.nombre }}</p>
            <p class="font-semibold text-slate-700 uppercase">LÍDER DE OFICINA {{ doc.partes.entregadoA.sede }}</p>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-2">
          <span class="col-span-2 font-bold text-slate-900">DE:</span>
          <div class="col-span-10">
            <p class="font-bold text-slate-900 uppercase">JOHAN HERNANDO VASQUEZ GONZALEZ</p>
            <p class="text-slate-700 text-xs">Director Nacional de Transporte de Pasajeros</p>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-2">
          <span class="col-span-2 font-bold text-slate-900">ASUNTO:</span>
          <div class="col-span-10 font-bold text-slate-900">
            @if (doc.config.tipo === 'MEMORANDO_REINTEGRO') {
              Reintegro de dispositivo {{ activoImprimir?.modelo || 'móvil' }} (Placa de inventario: {{ activoImprimir?.placa || 'N/A' }}@if (activoImprimir?.serial) { - Serial: {{ activoImprimir?.serial }}})
            } @else {
              Entrega de dispositivo {{ activoImprimir?.modelo || 'móvil' }} en calidad de préstamo
            }
          </div>
        </div>

        <div class="grid grid-cols-12 gap-2">
          <span class="col-span-2 font-bold text-slate-900">FECHA:</span>
          <div class="col-span-10 font-semibold text-slate-800">
            {{ doc.ciudad }}, {{ formatFechaFormal(doc.fechaEmision) }}
          </div>
        </div>
      </div>

      <!-- Cuerpo / Párrafo Causal -->
      @if (doc.config.tipo === 'MEMORANDO_REINTEGRO') {
        <!-- Caso 1: Reintegro de Dispositivo a Oficina -->
        <div class="text-justify text-slate-800 mb-4 leading-relaxed">
          <p>
            Respetuosamente y en atención al reporte de fallas técnicas del equipo móvil modelo <strong>{{ modeloAveriado || 'xxxx' }}</strong> (Placa de inventario: <strong>{{ placaAveriada || 'xxxxxxx' }}</strong>@if (serialAveriado) { - Serial: <strong>{{ serialAveriado }}</strong>}) entregado a la oficina, nos permitimos informarle que, tras la revisión técnica y reparación correspondiente, se procede al reintegro del dispositivo en óptimas condiciones de funcionamiento bajo las siguientes especificaciones:
          </p>
        </div>
      } @else {
        <!-- Caso 2: Entrega en Calidad de Préstamo a Oficina -->
        <div class="text-justify text-slate-800 mb-4 leading-relaxed space-y-3">
          <p>
            Respetuosamente, y en atención a lo informado sobre las fallas técnicas del equipo móvil modelo <strong>{{ modeloAveriado || 'xxxx' }}</strong> (Placa de inventario: <strong>{{ placaAveriada || 'xxxxxxx' }}</strong>@if (serialAveriado) { - Serial: <strong>{{ serialAveriado }}</strong>}) entregado a la oficina, solicitamos formalmente su devolución para proceder con la revisión técnica correspondiente.
          </p>
          <p>
            Por lo anterior, en tanto se realiza el diagnóstico e identificación del daño, la Empresa hace entrega, en calidad de préstamo, del siguiente dispositivo:
          </p>
        </div>
      }

      <!-- Bloque de Características Técnicas del Dispositivo -->
      <div class="bg-slate-50/70 border-2 border-slate-900 rounded-lg p-4 space-y-2 text-slate-900 my-4">
        @if (activoImprimir) {
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            <p><strong class="font-bold text-slate-900">Modelo: </strong> <span class="font-semibold">{{ activoImprimir.modelo }} ({{ activoImprimir.marca }})</span></p>
            <p><strong class="font-bold text-slate-900">Placa de Inventario: </strong> <span class="font-mono font-bold">{{ activoImprimir.placa }}</span> <span class="text-slate-500 font-mono text-[11px]">(Serial: {{ activoImprimir.serial }})</span></p>
            <p><strong class="font-bold text-slate-900">Cargador: </strong> <span class="font-semibold">{{ incluyeCargador }}</span></p>
            <p><strong class="font-bold text-slate-900">Forro: </strong> <span class="font-semibold">{{ incluyeForro }}</span></p>
            <p class="sm:col-span-2">
              <strong class="font-bold text-slate-900">SIM Card: </strong> 
              <span class="font-semibold">{{ activoImprimir.simCard || (doc.simCards.length > 0 ? (doc.simCards[0].numero + ' - ' + doc.simCards[0].operador + ' [ICCID: ' + doc.simCards[0].iccid + ']') : 'No asignada') }}</span>
            </p>
          </div>
        } @else {
          <p class="italic text-slate-500 text-xs">No se encontraron activos asociados a este movimiento.</p>
        }
      </div>

      <!-- Párrafo de Custodia y Responsabilidad del Líder de Oficina -->
      <div class="text-justify text-slate-800 mb-6 leading-relaxed">
        <p>
          Es importante recordar que, como líder de oficina, es su responsabilidad velar por los bienes suministrados por la Empresa, garantizando así el uso correcto, la custodia y la conservación de esta herramienta tecnológica, la cual está destinada exclusivamente a la venta y expedición de tiquetes.
        </p>
      </div>

      @if (doc.observacionesGenerales) {
        <div class="border border-slate-300 bg-slate-50 p-3 rounded-lg text-xs mb-6">
          <strong class="text-slate-700 block mb-0.5">Observaciones Adicionales:</strong>
          <p class="text-slate-800 italic">{{ doc.observacionesGenerales }}</p>
        </div>
      }

      <!-- Firmas: Emisor Oficial Institucional y Recibido del Líder de Oficina -->
      <div class="pt-6 grid grid-cols-2 gap-8 page-break-inside-avoid text-xs sm:text-[13px]">
        
        <!-- Emisor Institucional -->
        <div class="space-y-1">
          <p class="text-slate-700 font-semibold mb-12">Atentamente,</p>
          <div class="border-t border-slate-900 pt-1">
            <p class="font-black text-slate-900 uppercase">JOHAN HERNANDO VÁSQUEZ GONZÁLEZ</p>
            <p class="text-slate-700 text-xs font-semibold">Director Nacional de Transporte de Pasajeros</p>
            <p class="text-slate-500 text-[11px] font-mono mt-0.5">26-28</p>
          </div>
        </div>

        <!-- Receptor: Líder de Oficina -->
        <div class="space-y-1">
          <p class="text-slate-700 font-semibold mb-12">Recibí a conformidad:</p>
          <div class="border-t border-slate-900 pt-1">
            <p class="font-bold text-slate-900 uppercase">{{ doc.partes.entregadoA.nombre }}</p>
            <p class="text-slate-700 text-xs font-semibold">C.C. {{ doc.partes.entregadoA.identificacion || '__________________________' }}</p>
            <p class="text-slate-500 text-[11px] mt-0.5 uppercase">Líder de Oficina {{ doc.partes.entregadoA.sede }}</p>
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
          Flota La Macarena S.A. • Nit: 860.007.607-1 • Ref: GR-MEM-26
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
export class DocumentMemorandoTemplateComponent {
  @Input({ required: true }) doc!: OfficialDocumentData;
  @Input() selectedActivo?: any = null;
  @Input() modeloAveriado = '';
  @Input() placaAveriada = '';
  @Input() serialAveriado = '';
  @Input() incluyeCargador = 'SÍ';
  @Input() incluyeForro = 'SÍ';

  readonly formatFechaFormal = formatFechaFormal;
  readonly getPrimerActivo = getPrimerActivo;

  get activoImprimir(): any {
    return this.selectedActivo || getPrimerActivo(this.doc);
  }
}
