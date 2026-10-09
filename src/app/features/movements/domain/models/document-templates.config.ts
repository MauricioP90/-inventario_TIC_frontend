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

  COMODATO: {
    tipo: 'COMODATO',
    titulo: 'CONTRATO DE COMODATO DE EQUIPOS TECNOLÓGICOS',
    subtitulo: 'PRÉSTAMO DE USO GRATUITO A TERCERO / AGENCIA CONTRATISTA',
    codigoCalidad: 'FOR-TIC-002',
    version: 'Versión 02',
    descripcionCabecera: 'Entre los suscritos, por una parte FLOTA LA MACARENA S.A. (EL COMODANTE) y por la otra la AGENCIA / CONTRATISTA identificada en este documento (EL COMODATARIO), se celebra el presente Contrato de Comodato Precario sobre los equipos tecnológicos que se relacionan a continuación, en los términos del Artículo 2200 y subsiguientes del Código Civil Colombiano.',
    clausulas: [
      {
        num: 1,
        titulo: 'Naturaleza del Préstamo',
        texto: 'EL COMODANTE entrega a título de comodato precario y gratuito los bienes tecnológicos descritos en la tabla anexa, sin que esto transfiera el dominio, posesión ni derecho patrimonial alguno sobre los mismos.'
      },
      {
        num: 2,
        titulo: 'Destinación y Ubicación',
        texto: 'EL COMODATARIO destinará los equipos únicamente para la operación, comercialización o prestación de servicios acordados en la sede o punto de atención convenido, absteniéndose de trasladarlos a otra ubicación sin autorización escrita de EL COMODANTE.'
      },
      {
        num: 3,
        titulo: 'Responsabilidad por Pérdida o Daño',
        texto: 'EL COMODATARIO responde hasta por culpa levísima en la conservación de los bienes y asume el costo de reposición o reparación en caso de pérdida, daño culposo, hurto o siniestro atribuible a su custodia.'
      },
      {
        num: 4,
        titulo: 'Restitución Inmediata',
        texto: 'EL COMODANTE podrá solicitar la restitución inmediata de los equipos en cualquier momento mediante simple requerimiento verbal o escrito, debiendo EL COMODATARIO hacer entrega formal en el Punto TI designado.'
      }
    ],
    compromisoReceptor: 'En calidad de Comodatario / Representante de la Agencia, certifico que recibo los activos relacionados en óptimas condiciones técnicas y me obligo a cumplir fielmente todas las estipulaciones del presente comodato.'
  },

  PAZ_Y_SALVO: {
    tipo: 'PAZ_Y_SALVO',
    titulo: 'ACTA DE DEVOLUCIÓN, REINTEGRO Y PAZ Y SALVO DE TI',
    subtitulo: 'CONSTANCIA DE RECEPCIÓN Y DESVINCULACIÓN DE CUSTODIA',
    codigoCalidad: 'FOR-TIC-003',
    version: 'Versión 02',
    descripcionCabecera: 'Por medio del presente documento, el Área de Tecnología de FLOTA LA MACARENA S.A. certifica la recepción física y técnica de los equipos y accesorios devueltos por el colaborador o agencia, procediendo al descargo y actualización de la custodia en el inventario institucional.',
    clausulas: [
      {
        num: 1,
        titulo: 'Recepción Técnica',
        texto: 'El Punto TI inspeccionó físicamente los activos entregados, verificando placa, seriales, componentes internos y ausencia de novedades críticas no reportadas.'
      },
      {
        num: 2,
        titulo: 'Paz y Salvo Tecnológico',
        texto: 'Habiéndose completado la entrega de los elementos a cargo, se declara al colaborador o sede a PAZ Y SALVO por concepto de herramientas tecnológicas, software y líneas corporativas correspondientes al presente lote.'
      }
    ],
    compromisoReceptor: 'El Punto TI de Flota La Macarena recibe a satisfacción los activos descritos y confirma el reintegro al stock disponible de la compañía.'
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
  }
};
