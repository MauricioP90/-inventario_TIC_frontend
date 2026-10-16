import { OfficialDocumentConfig, TipoDocumentoOficial } from './document-template.model';

export const OFFICIAL_DOCUMENT_TEMPLATES: Record<TipoDocumentoOficial, OfficialDocumentConfig> = {
  ACTA_ENTREGA: {
    tipo: 'ACTA_ENTREGA',
    titulo: 'ACTA DE ENTREGA DE ACTIVOS',
    subtitulo: 'TIPO DE ACTIVO: EQUIPOS TECNOLÓGICOS Y COMUNICACIÓN',
    codigoCalidad: 'GF-FO-29',
    version: 'VERSIÓN: 07',
    descripcionCabecera: 'TIPO DE ACTIVO: EQUIPOS TECNOLÓGICOS Y COMUNICACIÓN',
    clausulas: [],
    compromisoReceptor: 'Como trabajador de FLOTA LA MACARENA S.A. declaro que los activos relacionados en el presente documento están bajo mi responsabilidad y que serán usados para el desempeño de las funciones asignadas por la organización y a la destinación institucional prevista para cada uno de ellos.\n\nAsí mismo, autorizo a FLOTA LA MACARENA S.A., deducir de mi salario, prestaciones sociales, indemnizaciones o cualquier otro concepto laboral, el dinero correspondiente a los daños o pérdidas ocasionados por el mal uso, negligencia o descuido de los bienes mencionados en el presente documento. El valor de los activos se calculará teniendo en cuenta el valor registrado en libros al momento de la asignación del activo menos la depreciación al momento de haber sido registrada la pérdida o el daño.'
  },



  GUIA_REMISION: {
    tipo: 'GUIA_REMISION',
    titulo: 'GUÍA DE REMISIÓN TÉCNICA A PROVEEDOR / TALLER EXTERNO',
    subtitulo: 'ORDEN DE SALIDA TEMPORAL POR MANTENIMIENTO O GARANTÍA',
    codigoCalidad: 'FOR-TIC-004',
    version: 'Versión 01',
    descripcionCabecera: 'Se autoriza la salida física temporal de las instalaciones de FLOTA LA MACARENA S.A. hacia el taller o proveedor de servicio técnico especializado para diagnóstico, mantenimiento preventivo, correctivo o trámite de garantía.',
    clausulas: [
      {
        num: 1,
        titulo: 'Control de Salida',
        texto: 'Los activos relacionados salen bajo responsabilidad de custodia técnica del proveedor o transportador acreditado, debiendo reingresar con informe de servicio y factura/orden de trabajo aprobada.'
      },
      {
        num: 2,
        titulo: 'Tiempos de Atención',
        texto: 'El proveedor se compromete a emitir diagnóstico formal y cotización en los tiempos concertados en el acuerdo de nivel de servicio (SLA).'
      }
    ],
    compromisoReceptor: 'El proveedor o transportador recibe los activos detallados con el propósito exclusivo de efectuar los servicios técnicos encomendados.'
  },

  PRESTAMO_DISPOSITIVO: {
    tipo: 'PRESTAMO_DISPOSITIVO',
    titulo: 'ENTREGA DE DISPOSITIVO EN CALIDAD DE PRÉSTAMO',
    subtitulo: 'CONTRATO DE COLABORACIÓN EN OPERACIONES CONJUNTAS',
    codigoCalidad: 'DP-PR-01',
    version: 'Versión 01',
    descripcionCabecera: 'En desarrollo del Contrato de Colaboración en Operaciones Conjuntas que nos une, y previa autorización de la Gerencia General, en atención a lo informado sobre las fallas técnicas del equipo móvil entregado previamente en comodato, solicitamos formalmente su devolución para proceder con la revisión técnica correspondiente.',
    clausulas: [],
    compromisoReceptor: 'Le recordamos que, conforme a lo estipulado en el contrato de colaboración en operaciones conjuntas, el Partícipe en Colaboración Empresarial asume la calidad de depositario de los elementos suministrados por la Empresa. En consecuencia, le solicitamos el uso adecuado, custodia y conservación de esta herramienta tecnológica, la cual está destinada exclusivamente al desarrollo del objeto del contrato.'
  },

  REINTEGRO_DISPOSITIVO: {
    tipo: 'REINTEGRO_DISPOSITIVO',
    titulo: 'REINTEGRO DE DISPOSITIVO Y/O DEVOLUCIÓN',
    subtitulo: 'CONTRATO DE COLABORACIÓN EMPRESARIAL',
    codigoCalidad: 'DP-RD-01',
    version: 'Versión 01',
    descripcionCabecera: 'En ejercicio de la facultad de supervisión y control derivada del Contrato de Colaboración Empresarial, y en atención al reporte de fallas técnicas del equipo móvil entregado en comodato, nos permitimos informarle que, tras la revisión técnica y reparación correspondiente, se procede al reintegro del dispositivo en óptimas condiciones de funcionamiento.',
    clausulas: [],
    compromisoReceptor: 'Le recordamos que, conforme a lo estipulado en el contrato de colaboración, el Partícipe asume la calidad de depositario de los elementos suministrados por la Empresa. En consecuencia, es su obligación velar por el uso adecuado, custodia y conservación de esta herramienta tecnológica, la cual está destinada exclusivamente al desarrollo del objeto contractual.'
  },

  MEMORANDO_REINTEGRO: {
    tipo: 'MEMORANDO_REINTEGRO',
    titulo: 'MEMORANDO: REINTEGRO DE DISPOSITIVO',
    subtitulo: 'DIRECCIÓN NACIONAL DE TRANSPORTE DE PASAJEROS',
    codigoCalidad: 'GR-MEM-26',
    version: '2026',
    descripcionCabecera: 'Reintegro de dispositivo móvil reparado en óptimas condiciones de funcionamiento a líder de oficina.',
    clausulas: [],
    compromisoReceptor: 'Como líder de oficina, es su responsabilidad velar por los bienes suministrados por la Empresa, garantizando así el uso correcto, la custodia y la conservación de esta herramienta tecnológica, la cual está destinada exclusivamente a la venta y expedición de tiquetes.'
  },

  MEMORANDO_PRESTAMO: {
    tipo: 'MEMORANDO_PRESTAMO',
    titulo: 'MEMORANDO: ENTREGA EN CALIDAD DE PRÉSTAMO',
    subtitulo: 'DIRECCIÓN NACIONAL DE TRANSPORTE DE PASAJEROS',
    codigoCalidad: 'GR-MEM-26',
    version: '2026',
    descripcionCabecera: 'Entrega de dispositivo móvil en calidad de préstamo temporal a líder de oficina en tanto se realiza el diagnóstico e identificación del daño del equipo titular.',
    clausulas: [],
    compromisoReceptor: 'Como líder de oficina, es su responsabilidad velar por los bienes suministrados por la Empresa, garantizando así el uso correcto, la custodia y la conservación de esta herramienta tecnológica, la cual está destinada exclusivamente a la venta y expedición de tiquetes.'
  },

  COMODATO: {
    tipo: 'COMODATO',
    titulo: 'CONTRATO DE COMODATO DE BIEN MUEBLE',
    subtitulo: 'CONTRATO DE COLABORACIÓN EN OPERACIONES CONJUNTAS',
    codigoCalidad: 'COM-01',
    version: '2026',
    descripcionCabecera: 'Contrato de comodato de bien mueble para entrega gratuita de equipo tecnológico y sim card para la plataforma de tiquetería a partícipes en colaboración empresarial.',
    clausulas: [],
    compromisoReceptor: 'El comodatario se obliga a emplear el mayor cuidado en la conservación del bien entregado y responderá hasta de la culpa levísima, destinándolo exclusiva y únicamente para la plataforma de tiquetería de Flota La Macarena S.A.'
  }
};


