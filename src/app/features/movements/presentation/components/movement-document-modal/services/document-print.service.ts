import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DocumentPrintService {
  /**
   * Motor de Impresión Aislado mediante IFrame:
   * Garantiza que el diálogo de impresión imprima ÚNICAMENTE la hoja oficial del documento
   * con sus estilos Tailwind, tipografía y logo, sin mezclar la pantalla de fondo.
   */
  printElement(elementId: string, titulo: string = 'Documento Oficial', consecutivo: string = ''): void {
    const printElement = document.getElementById(elementId);
    if (!printElement) return;

    let iframe = document.getElementById('isolated-print-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.remove();
    }
    iframe = document.createElement('iframe');
    iframe.id = 'isolated-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.left = '-10000px';
    iframe.style.top = '0';
    iframe.style.width = '215.9mm';
    iframe.style.height = '279.4mm';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) return;

    const styleTags = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(node => node.outerHTML)
      .join('\n');

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>${titulo}${consecutivo ? ' - ' + consecutivo : ''}</title>
        ${styleTags}
        <style>
          @page {
            size: letter;
            margin: 8mm 12mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            height: auto !important;
            min-height: 100% !important;
            max-height: none !important;
            overflow: visible !important;
            overflow-x: visible !important;
            overflow-y: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
          }
          .page-break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .comodato-page-1 {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
            min-height: auto !important;
            height: auto !important;
            margin-bottom: 0 !important;
          }
          .comodato-page-2 {
            page-break-before: always !important;
            break-before: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
            min-height: auto !important;
            height: auto !important;
            margin-top: 0 !important;
            padding-top: 0 !important;
            border-top: none !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: inline-block !important;
          }
        </style>
      </head>
      <body class="bg-white" style="margin: 0; padding: 0;">
        ${printElement.innerHTML}
      </body>
      </html>
    `);
    iframeDoc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 400);
  }
}
