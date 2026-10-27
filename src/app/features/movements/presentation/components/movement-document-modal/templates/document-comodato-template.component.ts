import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfficialDocumentData } from '../../../../domain/models/document-template.model';
import { formatFechaFormal, getFechaComodatoLetras, extractSimFromActivo } from './document-template.utils';

@Component({
  selector: 'app-document-comodato-template',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- FORMATO OFICIAL: CONTRATO DE COMODATO DE BIEN MUEBLE -->
    <div class="space-y-4 text-slate-900 font-sans text-xs sm:text-[11.5px] leading-snug">
      
      <!-- ==================== PÁGINA 1 DE 2 ==================== -->
      <div class="comodato-page-1 flex flex-col justify-between min-h-[880px]">
        <div class="space-y-2">

          <!-- Membrete Superior con Logo y Referencia (SIN DIRECCIÓN NACIONAL DE PASAJEROS) -->
          <div class="flex items-start justify-between border-b-2 border-slate-900 pb-1.5 mb-1.5">
            <div class="flex items-center gap-3">
              <img src="/Logo_FLM.png" alt="Flota La Macarena" class="h-10 sm:h-11 w-auto object-contain" />
              <div>
                <h2 class="text-xs sm:text-sm font-black uppercase text-slate-900 tracking-tight leading-tight">FLOTA LA MACARENA S.A.</h2>
                <p class="text-[10px] text-slate-600 font-semibold">NIT 860.007.607-1</p>
              </div>
            </div>
            <div class="text-right">
              <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono font-bold text-xs border border-slate-300">
                {{ doc.consecutivo }}
              </span>
              <p class="text-[9px] text-slate-400 mt-0.5 uppercase font-semibold">Ref: COM-01</p>
            </div>
          </div>

          <!-- Título Central del Contrato -->
          <div class="text-center py-0.5">
            <h1 class="text-xs sm:text-sm font-black uppercase text-slate-900 tracking-tight">
              CONTRATO DE COMODATO DE BIEN MUEBLE
            </h1>
          </div>

          <!-- Tabla Resumen (Table 0 de COMODATO) -->
          <div class="border border-slate-900 rounded-xs overflow-hidden text-[10.5px]">
            <table class="w-full border-collapse">
              <tbody class="divide-y divide-slate-300 text-slate-900">
                <tr class="divide-x divide-slate-300">
                  <td class="w-1/4 bg-slate-100 font-bold px-2.5 py-0.5 uppercase text-[10px]">LUGAR Y FECHA:</td>
                  <td class="px-2.5 py-0.5 font-semibold text-slate-900">{{ doc.ciudad }}, {{ formatFechaFormal(doc.fechaEmision) }}</td>
                </tr>
                <tr class="divide-x divide-slate-300">
                  <td class="w-1/4 bg-slate-100 font-bold px-2.5 py-0.5 uppercase text-[10px]">COMODANTE</td>
                  <td class="px-2.5 py-0.5 text-slate-800 leading-tight text-[10px]">
                      <strong>Flota la Macarena S.A.</strong> Nit 860.007.607-1 • R.L. <strong>Rafael Sarmiento Apolinar</strong> C.C. No 19.494.310 de Bogotá<br>
                      Calle 127 A # 53 A – 45 Sede principal • Tel. 425 49 00 • www.flotalamacarena.com
                  </td>
                </tr>
                <tr class="divide-x divide-slate-300">
                  <td class="w-1/4 bg-slate-100 font-bold px-2.5 py-0.5 uppercase text-[10px]">COMODATARIO</td>
                  <td class="px-2.5 py-0.5 font-bold text-slate-900 uppercase">
                    {{ doc.partes.entregadoA.nombre }} — C.C. No. {{ doc.partes.entregadoA.identificacion || '____________________' }}
                  </td>
                </tr>
                <tr class="divide-x divide-slate-300">
                  <td class="w-1/4 bg-slate-100 font-bold px-2.5 py-0.5 uppercase text-[10px]">BIEN ENTREGADO</td>
                  <td class="px-2.5 py-0.5 font-bold text-slate-900">{{ getBienEntregado(doc) }}</td>
                </tr>
                <tr class="divide-x divide-slate-300">
                  <td class="w-1/4 bg-slate-100 font-bold px-2.5 py-0.5 uppercase text-[10px]">ESTADO</td>
                  <td class="px-2.5 py-0.5 font-bold text-slate-900 uppercase">{{ estadoBienComodato || 'BUENO' }}</td>
                </tr>
                <tr class="divide-x divide-slate-300">
                  <td class="w-1/4 bg-slate-100 font-bold px-2.5 py-0.5 uppercase text-[10px]">OFICINA</td>
                  <td class="px-2.5 py-0.5 font-bold text-slate-900 uppercase">{{ doc.partes.entregadoA.sede }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Comparecencia e Introducción Legal -->
          <div class="text-justify text-slate-800 leading-snug text-xs sm:text-[11.5px] pt-0.5">
            <p>
              Entre los suscritos: <strong>RAFAEL SARMIENTO APOLINAR</strong>, mayor de edad, vecino de Bogotá, D.C., identificado con la cédula de ciudadanía No. 19.494.310 expedida en Bogotá D.C., quien en este acto obra en nombre y representación de la Empresa <strong>FLOTA LA MACARENA S.A.</strong>, en su calidad de Gerente, sociedad mercantil con domicilio en Bogotá D.C. en la Calle 127 A # 53 A – 45, Torre 2, Piso 2, Oficina 201, del Edificio Colpatria, poseedora del correo electrónico: <span class="text-slate-900 font-semibold">gerencia&#64;flotalamacarena.com</span>, quien en adelante y para todos los efectos previstos en este contrato se denominará como <strong>EL COMODANTE</strong> y de otra parte, el señor(a) <strong class="uppercase">{{ doc.partes.entregadoA.nombre }}</strong>, mayor de edad, domiciliado y residente en la <span class="font-semibold underline">{{ direccionComodatario || 'Calle ....................' }}</span>, de <span class="font-semibold underline">{{ ciudadComodatario || doc.ciudad || 'Bogotá D.C.' }}</span>, identificado con la cédula de ciudadanía No. <strong class="underline">{{ doc.partes.entregadoA.identificacion || '....................' }}</strong> expedida en <span class="font-semibold underline">{{ expedicionDocumentoComodatario || 'Bogotá D.C.' }}</span>, poseedor del correo electrónico: <span class="font-semibold underline">{{ emailComodatario || '....................' }}</span>, quien en adelante y para todos los efectos previstos en este contrato se denominará <strong>EL COMODATARIO</strong>, quien a su vez es Partícipe en colaboración empresarial de la oficina de <strong class="uppercase text-slate-900">{{ doc.partes.entregadoA.sede }}</strong>, de manera libre, espontánea, ausente de vicios, y en concordancia con lo estipulado en el Parágrafo Segundo de la Cláusula Décima Primera del Contrato de Colaboración en Operaciones Conjuntas hemos convenido celebrar el presente <strong>CONTRATO DE COMODATO</strong>, el cual se regirá por las cláusulas que siguen, en lo no previsto en ellas, por la Ley Mercantil y en los vacíos de las dos anteriores, por la Ley Civil y exponen: <strong>PRIMERA:. EL COMODANTE</strong> entrega a <strong>EL COMODATARIO</strong>, gratuitamente, un {{ getDenominacionDispositivo(doc, 'simple') }}, incluida la sim card para comunicaciones, con las siguientes características:
            </p>
          </div>

          <!-- Tabla de Características Técnicas (Table 1) -->
          <div class="border border-slate-900 rounded-xs overflow-hidden text-[10.5px] my-1">
            <table class="w-full border-collapse">
              <tbody class="divide-y divide-slate-300 text-slate-900">
                <tr class="divide-x divide-slate-300">
                  <td class="w-1/3 bg-slate-100 font-bold px-2.5 py-0.5 uppercase text-[10px]">Marca</td>
                  <td class="px-2.5 py-0.5 font-semibold">{{ getActivoComodato(doc)?.marca || getModeloActivo(doc) || 'N/A' }}</td>
                </tr>
                <tr class="divide-x divide-slate-300">
                  <td class="w-1/3 bg-slate-100 font-bold px-2.5 py-0.5 uppercase text-[10px]">Serial</td>
                  <td class="px-2.5 py-0.5 font-mono font-bold">{{ getActivoComodato(doc)?.serial || 'S/N' }}</td>
                </tr>
                <tr class="divide-x divide-slate-300">
                  <td class="w-1/3 bg-slate-100 font-bold px-2.5 py-0.5 uppercase text-[10px]">Placa de inventario</td>
                  <td class="px-2.5 py-0.5 font-mono font-bold">{{ getActivoComodato(doc)?.placa || 'S/P' }}</td>
                </tr>
                <tr class="divide-x divide-slate-300">
                  <td class="w-1/3 bg-slate-100 font-bold px-2.5 py-0.5 uppercase text-[10px]">Operador Sim Card</td>
                  <td class="px-2.5 py-0.5 font-semibold">{{ getOperadorSimComodato(doc) }}</td>
                </tr>
                <tr class="divide-x divide-slate-300">
                  <td class="w-1/3 bg-slate-100 font-bold px-2.5 py-0.5 uppercase text-[10px]">Numero Sim Card</td>
                  <td class="px-2.5 py-0.5 font-mono font-semibold">{{ getNumeroSimComodato(doc) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Cláusulas SEGUNDA, TERCERA y PARÁGRAFO PRIMERO (SIN CURSIVAS) -->
          <div class="space-y-1.5 text-justify text-slate-800 leading-snug text-xs sm:text-[11.5px]">
            <p>
              <strong>SEGUNDA: ENTREGA.</strong> A la firma del presente contrato EL COMODANTE entregará a EL COMODATARIO el bien del comodato.
            </p>

            <p>
              <strong>TERCERA. OBLIGACIONES DE EL COMODATARIO:</strong> EL COMODATARIO se obliga a: 
              <strong>a)</strong> Utilizar el bien entregado - {{ getDenominacionDispositivo(doc, 'mayuscula') }}, incluida la sim card - para comunicaciones, única y exclusivamente para la plataforma de tiquetería de FLOTA LA MACARENA S.A. 
              <strong>b)</strong> Emplear el mayor cuidado en la conservación del bien entregado - {{ getDenominacionDispositivo(doc, 'mayuscula') }}, incluida la sim card - para comunicaciones y responderá hasta de la culpa levísima, por lo tanto, responderá por cualquier deterioro que no provenga de la naturaleza o del uso legítimo del bien y si el deterioro es tal, que el bien no sea susceptible de emplearse en su uso ordinario, podrá EL COMODANTE exigir el precio del bien. 
              <strong>c)</strong> Pagar a EL COMODANTE en caso de pérdida del bien entregado - {{ getDenominacionDispositivo(doc, 'mayuscula') }}, la suma de <strong>{{ valorReposicionLetrasComodato }} ({{ valorReposicionComodato }})</strong> incluye IVA. 
              <strong>d)</strong> Pagar a EL COMODANTE en caso de daño producido del bien entregado - {{ getDenominacionDispositivo(doc, 'mayuscula') }}, el arreglo del equipo, dónde EL COMODANTE lo disponga. 
              <strong>e)</strong> Permitir a EL COMODANTE, la revisión previa y posterior del {{ getDenominacionDispositivo(doc, 'simple') }}, a fin de Verificar el estado del mismo al inicio de la ejecución del contrato y a su finalización. 
              <strong>f)</strong> Reportar inmediatamente a FLOTA LA MACARENA S.A. en caso de robo o pérdida del bien entregado - {{ getDenominacionDispositivo(doc, 'mayuscula') }}, a fin de proceder a bloquear el acceso a la plataforma por parte del área de Tecnología y reportar la pérdida de la sim card al proveedor de comunicaciones. 
              <strong>g)</strong> Mantener el bien entregado - {{ getDenominacionDispositivo(doc, 'mayuscula') }}, con la correspondiente carga de energía para poder atender el proceso de ventas y despachos en la oficina asignada, siendo responsable por el suministro de energía. 
              <strong>h)</strong> Reconocer a FLOTA LA MACARENA S.A., la suma de la totalidad de tiquetes emitidos y vendidos con el dispositivo conforme a las condiciones del CONTRATO DE COLABORACIÓN EN OPERACIONES CONJUNTAS.
            </p>

            <p class="pl-2 border-l-2 border-slate-300">
              <strong>PARÁGRAFO PRIMERO:</strong> Cuando se presenten hechos que constituyan un caso fortuito, EL COMODATARIO no será responsable por el deterioro o pérdida del bien dado en comodato, salvo que 1) Haya empleado el bien en uso indebido, o demore su restitución, excepto que se demuestre que el deterioro se hubiera producido por su uso. 2) El caso fortuito hubiere sobrevenido por culpa suya, aunque levísima; 3) Cuando expresamente haya aceptado la responsabilidad del caso fortuito.
            </p>
          </div>

        </div>

        <!-- Pie de Página 1 -->
        <div class="text-[9.5px] text-slate-400 text-center border-t border-slate-200 pt-1.5 mt-2 flex items-center justify-between">
          <span>FLOTA LA MACARENA S.A. • Nit: 860.007.607-1 • Ref: COM-01</span>
          <span class="font-bold text-slate-600">Página 1 de 2</span>
        </div>
      </div>

      <!-- ==================== PÁGINA 2 DE 2 ==================== -->
      <div class="comodato-page-2 flex flex-col justify-between min-h-[880px] pt-3 border-t-2 border-dashed border-slate-300 print:border-none print:pt-0">
        <div class="space-y-2">

          <!-- Cláusulas CUARTA a DÉCIMA (SIN CURSIVAS) -->
          <div class="space-y-1.5 text-justify text-slate-800 leading-snug text-xs sm:text-[11.5px]">
            <p>
              <strong>CUARTA. -DESTINACIÓN: -</strong> {{ getDenominacionDispositivo(doc, 'articulo_mayuscula') }}, que EL COMODANTE entrega a EL COMODATARIO en comodato, debe ser utilizado por éste única y exclusivamente para el manejo de la plataforma de tiquetería, atender el proceso de ventas y despachos en la oficina asignada y los fines esenciales que sirven de justificación al contrato, caso contrario, EL COMODANTE impartirá las sanciones a que haya lugar.
            </p>

            <p>
              <strong>QUINTA. TÉRMINO:</strong> El préstamo de uso acá acordado, tendrá el mismo término pactado en el CONTRATO DE COLABORACIÓN EN OPERACIONES CONJUNTAS, suscrito entre el (la) señor (a) <strong class="uppercase">{{ doc.partes.entregadoA.nombre }}</strong>, y la EMPRESA de fecha <span class="font-semibold underline">{{ fechaContratoComodato || '………………' }}</span>, empezando a surtir sus efectos a partir de la fecha de la entrega y firma del presente contrato.
            </p>

            <p>
              <strong>SEXTA. RESTITUCIÓN.</strong> EL COMODATARIO deberá restituir {{ getDenominacionDispositivo(doc, 'articulo') }} a EL COMODANTE, a la siguiente dirección: Calle 127 A # 53 A – 45, Torre 2, Piso 2, Oficina 201, del Edificio Colpatria en la ciudad de Bogotá D.C., o en su efecto a la persona que EL COMODANTE designe para su recepción, en los siguientes casos: 
              <strong>a)</strong> En el mismo momento que se dé por terminado el CONTRATO DE COLABORACIÓN EN OPERACIONES CONJUNTAS, suscrito entre el (la) señor (a) <strong class="uppercase">{{ doc.partes.entregadoA.nombre }}</strong>, y la EMPRESA de fecha <span class="font-semibold underline">{{ fechaContratoComodato || '………………' }}</span>, 
              <strong>b)</strong> Por el incumplimiento de las obligaciones en relación con la destinación, la utilización inadecuada, o el deterioro del equipo por su culpa. 
              <strong>c)</strong> Por muerte de EL COMODATARIO. 
              <strong>d)</strong> Por la terminación de los servicios a los que se destinó {{ getDenominacionDispositivo(doc, 'articulo') }}.
            </p>

            <p>
              <strong>SÉPTIMA. GRATUIDAD. -</strong> El presente contrato es gratuito; por ello EL COMODATARIO no contrae obligación dineraria alguna por el uso del bien, según lo convenido.
            </p>

            <p>
              <strong>OCTAVA. CESIÓN. -</strong> Queda prohibida la cesión del contrato, y del {{ getDenominacionDispositivo(doc, 'simple') }}, a cualquier persona natural o jurídica, sin autorización previa escrita de EL COMODANTE.
            </p>

            <p>
              <strong>NOVENA. DERECHOS DE EL COMODANTE. -</strong> EL COMODANTE conservará sobre el bien prestado, todos los derechos que antes tenía; pero no su ejercicio, en cuanto fuere incompatible con el uso concedido a EL COMODATARIO, igualmente vigilará que no se varíe la destinación del {{ getDenominacionDispositivo(doc, 'simple') }}, ni que se traslade a ubicación diferente de la oficina, sin autorización escrita.
            </p>

            <p>
              <strong>DÉCIMA. RÉGIMEN LEGAL. -</strong> Los vacíos en la estipulación se llenará, en el presente contrato, con las reglas contenidas en el Código Civil, libro IV, título XXIX.
            </p>
          </div>

          <!-- Cierre y Lugar / Fecha en Letras -->
          <div class="pt-0.5 text-justify text-slate-800 leading-snug text-xs sm:text-[11.5px]">
            <p>
              Para constancia de lo pactado se firma en {{ doc.ciudad }}, hoy <strong>{{ getFechaComodatoLetras(doc.fechaEmision).diaLetras }}</strong> ({{ getFechaComodatoLetras(doc.fechaEmision).diaNumero }}) de <strong>{{ getFechaComodatoLetras(doc.fechaEmision).mesNombre }}</strong> del Dos mil <strong>{{ getFechaComodatoLetras(doc.fechaEmision).anioLetras }}</strong> ({{ getFechaComodatoLetras(doc.fechaEmision).anioNumero }}), en dos (02) ejemplares idénticos.
            </p>
            <p class="text-center font-bold text-slate-700 text-[10.5px] my-1 uppercase tracking-wider">
              NO CAUSA IMPUESTO DE TIMBRE.
            </p>
          </div>

          <!-- Firmas: Comodante (Rafael Sarmiento) y Comodatario -->
          <div class="pt-2 grid grid-cols-2 gap-8 page-break-inside-avoid text-xs sm:text-[11.5px]">
            
            <!-- EL COMODANTE -->
            <div class="space-y-1">
              <p class="text-slate-900 font-extrabold uppercase mb-8">EL COMODANTE</p>
              <div class="border-t border-slate-900 pt-1">
                <p class="font-black text-slate-900 uppercase">FLOTA LA MACARENA S.A.</p>
                <p class="font-extrabold text-slate-900 uppercase">RAFAEL SARMIENTO APOLINAR</p>
                <p class="text-slate-700 text-xs font-semibold">C.C. 19.494.310 de Bogotá</p>
                <p class="text-slate-500 text-[10.5px] font-semibold">Gerente</p>
              </div>
            </div>

            <!-- EL COMODATARIO -->
            <div class="space-y-1">
              <p class="text-slate-900 font-extrabold uppercase mb-8">EL COMODATARIO</p>
              <div class="border-t border-slate-900 pt-1">
                <p class="font-extrabold text-slate-900 uppercase">{{ doc.partes.entregadoA.nombre }}</p>
                <p class="text-slate-700 text-xs font-semibold">C.C. No. {{ doc.partes.entregadoA.identificacion || '__________________________' }}</p>
                <p class="text-slate-700 text-xs font-semibold">Oficina <span class="uppercase font-bold">{{ doc.partes.entregadoA.sede }}</span></p>
                <p class="text-slate-500 text-[10.5px]">Partícipe en Colaboración Empresarial</p>
              </div>
            </div>

          </div>

          <!-- Pie Institucional de Elaboración, Revisión y Aprobación (SIN CURSIVA) -->
          <div class="pt-2 mt-2 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-700">
            <div class="flex items-center gap-1.5">
              <span class="font-bold text-slate-900">Elaboró:</span>
              <span class="font-semibold text-slate-900 uppercase">{{ doc.partes.elaboradoPor.nombre }}</span>
              <span class="text-slate-400">—</span>
              <span class="text-slate-600">{{ doc.partes.elaboradoPor.cargo }}</span>
            </div>
            <div class="flex items-center gap-3 text-[10px]">
              <div><span class="font-bold text-slate-900">Revisó:</span> <span class="text-slate-700">Dra. Daniela Calderon</span></div>
              <div><span class="font-bold text-slate-900">Aprobó:</span> <span class="text-slate-700">Ing. Johan Vasquez</span></div>
            </div>
          </div>

        </div>

        <!-- Pie de Página 2 -->
        <div class="text-[9.5px] text-slate-400 text-center border-t border-slate-200 pt-1.5 mt-2 flex items-center justify-between">
          <span>CONTRATO DE COMODATO ENTRE FLOTA LA MACARENA S.A. y {{ doc.partes.entregadoA.nombre }} • Ref: COM-01</span>
          <span class="font-bold text-slate-600">Página 2 de 2</span>
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
    .comodato-page-1 {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .comodato-page-2 {
      break-before: page !important;
      page-break-before: always !important;
    }
  `]
})
export class DocumentComodatoTemplateComponent {
  @Input({ required: true }) doc!: OfficialDocumentData;
  @Input() estadoBienComodato = 'BUENO';
  @Input() direccionComodatario = '';
  @Input() ciudadComodatario = 'Bogotá D.C.';
  @Input() expedicionDocumentoComodatario = 'Bogotá D.C.';
  @Input() emailComodatario = '';
  @Input() fechaContratoComodato = '14 de junio de 2013';
  @Input() valorReposicionLetrasComodato = 'CERO PESOS';
  @Input() valorReposicionComodato = '$ 0';
  @Input() selectedActivoComodato: any = null;
  @Input() bienEntregadoComodato = '';
  @Input() operadorSimComodato = '';
  @Input() numeroSimComodato = '';

  readonly formatFechaFormal = formatFechaFormal;
  readonly getFechaComodatoLetras = getFechaComodatoLetras;

  getActivoComodato(doc?: OfficialDocumentData | null): any {
    if (this.selectedActivoComodato) {
      return {
        id: this.selectedActivoComodato.id,
        placa: this.selectedActivoComodato.placa,
        tipo: this.selectedActivoComodato.tipo || this.selectedActivoComodato.tipoActivo?.nombre || 'Dispositivo',
        marca: this.selectedActivoComodato.marca || 'N/A',
        modelo: this.selectedActivoComodato.modelo || 'N/A',
        serial: this.selectedActivoComodato.serial || 'S/N',
        estado: this.selectedActivoComodato.estado || 'BUENO',
        precioCompra: this.selectedActivoComodato.precioCompra ? Number(this.selectedActivoComodato.precioCompra) : undefined,
        simCard: this.selectedActivoComodato.simCard,
        simCards: this.selectedActivoComodato.simCards
      };
    }
    if (doc && doc.activos && doc.activos.length > 0) {
      return doc.activos[0];
    }
    return null;
  }

  getBienEntregado(doc?: OfficialDocumentData | null): string {
    const act = this.getActivoComodato(doc);
    if (act) {
      const tipo = act.tipo || act.tipoActivo?.nombre || 'Dispositivo';
      const tipoCap = tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase();
      const mod = act.modelo && act.modelo !== 'N/A' ? act.modelo.trim() : (act.marca && act.marca !== 'N/A' ? act.marca.trim() : '');
      return `${tipoCap} ${mod}`.trim();
    }
    if (this.bienEntregadoComodato && this.bienEntregadoComodato.trim()) {
      return this.bienEntregadoComodato.trim();
    }
    return 'Dispositivo';
  }

  getModeloActivo(doc?: OfficialDocumentData | null): string {
    const act = this.getActivoComodato(doc);
    if (act?.modelo && act.modelo !== 'N/A') {
      return act.modelo.trim();
    }
    if (act?.marca && act.marca !== 'N/A') {
      return act.marca.trim();
    }
    const bien = this.bienEntregadoComodato.trim();
    if (bien) {
      const parts = bien.split(' ');
      if (parts.length > 1) return parts.slice(1).join(' ').trim();
      return parts[0].trim();
    }
    return 'Dispositivo';
  }

  getDenominacionDispositivo(doc?: OfficialDocumentData | null, variante: 'simple' | 'mayuscula' | 'articulo' | 'articulo_mayuscula' = 'simple'): string {
    const mod = this.getModeloActivo(doc);
    switch (variante) {
      case 'mayuscula':
        return `Dispositivo ${mod}`;
      case 'articulo':
        return `el dispositivo ${mod}`;
      case 'articulo_mayuscula':
        return `El Dispositivo ${mod}`;
      case 'simple':
      default:
        return `dispositivo ${mod}`;
    }
  }

  getOperadorSimComodato(doc?: OfficialDocumentData | null): string {
    if (this.selectedActivoComodato) {
      return this.operadorSimComodato || 'No asignada';
    }
    const act = this.getActivoComodato(doc);
    if (act) {
      const simInfo = extractSimFromActivo(act);
      return simInfo.operador || 'No asignada';
    }
    return this.operadorSimComodato || 'No asignada';
  }

  getNumeroSimComodato(doc?: OfficialDocumentData | null): string {
    if (this.selectedActivoComodato) {
      return this.numeroSimComodato || 'No asignada';
    }
    const act = this.getActivoComodato(doc);
    if (act) {
      const simInfo = extractSimFromActivo(act);
      return simInfo.numero || 'No asignada';
    }
    return this.numeroSimComodato || 'No asignada';
  }
}
