import { OfficialDocumentData } from '../../../../domain/models/document-template.model';

export function formatFechaFormal(fecha: Date | string | undefined): string {
  if (!fecha) return '';
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return String(fecha);
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = meses[d.getMonth()];
  const anio = d.getFullYear();
  return `${mes} ${dia} del ${anio}`;
}

export function getPrimerActivo(doc: OfficialDocumentData): any {
  return doc.activos && doc.activos.length > 0 ? doc.activos[0] : null;
}

export function formatMoneda(num: number): string {
  if (isNaN(num)) return '$ 0';
  return '$ ' + Math.floor(Math.abs(num)).toLocaleString('es-CO');
}

export function numeroALetras(num: number): string {
  if (isNaN(num) || num === 0) return 'CERO PESOS';
  num = Math.floor(Math.abs(num));

  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  const convertirMenorMil = (n: number): string => {
    if (n === 0) return '';
    if (n === 100) return 'CIEN';
    let res = '';
    if (n >= 100) {
      res += centenas[Math.floor(n / 100)] + ' ';
      n %= 100;
    }
    if (n >= 10 && n <= 19) {
      res += especiales[n - 10] + ' ';
      return res.trim();
    }
    if (n >= 21 && n <= 29) {
      res += 'VEINTI' + unidades[n - 20] + ' ';
      return res.trim();
    }
    if (n >= 10) {
      res += decenas[Math.floor(n / 10)];
      n %= 10;
      if (n > 0) res += ' Y ' + unidades[n];
      return res.trim();
    }
    if (n > 0) {
      res += unidades[n];
    }
    return res.trim();
  };

  const millones = Math.floor(num / 1000000);
  const miles = Math.floor((num % 1000000) / 1000);
  const resto = num % 1000;

  const partes: string[] = [];

  if (millones > 0) {
    if (millones === 1) {
      partes.push('UN MILLÓN');
    } else {
      partes.push(`${convertirMenorMil(millones)} MILLONES`);
    }
  }

  if (miles > 0) {
    if (miles === 1) {
      partes.push('MIL');
    } else {
      partes.push(`${convertirMenorMil(miles)} MIL`);
    }
  }

  if (resto > 0) {
    partes.push(convertirMenorMil(resto));
  }

  const conDe = (millones > 0 && miles === 0 && resto === 0) ? 'DE PESOS' : 'PESOS';
  return `${partes.join(' ').trim()} ${conDe}`.replace(/\s+/g, ' ');
}

export function getFechaComodatoLetras(fecha: Date | string | undefined): {
  diaLetras: string;
  diaNumero: string;
  mesNombre: string;
  anioLetras: string;
  anioNumero: string;
} {
  const d = fecha ? new Date(fecha) : new Date();
  const diasPalabras = [
    '', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
    'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte',
    'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve', 'treinta', 'treinta y uno'
  ];
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const aniosPalabras: Record<number, string> = {
    2024: 'veinticuatro',
    2025: 'veinticinco',
    2026: 'veintiséis',
    2027: 'veintisiete',
    2028: 'veintiocho',
    2029: 'veintinueve',
    2030: 'treinta'
  };

  const diaNum = isNaN(d.getTime()) ? new Date().getDate() : d.getDate();
  const diaLetras = diasPalabras[diaNum] || String(diaNum);
  const mesNombre = meses[isNaN(d.getTime()) ? new Date().getMonth() : d.getMonth()] || 'octubre';
  const anioNum = isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
  const anioLetras = aniosPalabras[anioNum] || String(anioNum);

  return {
    diaLetras,
    diaNumero: String(diaNum).padStart(2, '0'),
    mesNombre,
    anioLetras,
    anioNumero: String(anioNum)
  };
}

export function getEstadoLabel(estado: string): string {
  const e = (estado || '').toUpperCase();
  if (e.includes('BUEN') || e === 'OPERACION' || e === 'DISPONIBLE') return '(B) Bueno';
  if (e.includes('REG') || e === 'MANTENIMIENTO') return '(R) Regular';
  if (e.includes('MAL') || e === 'BAJA') return '(M) Malo';
  return '(B) Bueno';
}

export function extractSimFromActivo(activo: any): { operador: string; numero: string } {
  if (!activo) return { operador: '', numero: '' };

  if (activo.simCards && Array.isArray(activo.simCards) && activo.simCards.length > 0) {
    const first = activo.simCards[0];
    return {
      operador: first?.operador?.trim() || '',
      numero: first?.numero?.trim() || ''
    };
  }

  if (activo.simCard) {
    const sc = activo.simCard;
    if (typeof sc === 'object') {
      return {
        operador: sc.operador?.trim() || '',
        numero: sc.numero?.trim() || ''
      };
    }
    if (typeof sc === 'string' && sc.trim()) {
      const match = sc.match(/\((.*?)\)/);
      const operador = match ? match[1].trim() : '';
      const parts = sc.split(' ');
      const numero = parts.length > 0 ? parts[0].trim() : '';
      return { operador, numero };
    }
  }

  return { operador: '', numero: '' };
}
