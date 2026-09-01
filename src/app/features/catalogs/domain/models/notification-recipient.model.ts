export interface NotificationRecipient {
  id?: string;
  email: string;
  nombre: string;
  area: string;
  tipoCopia: 'CC' | 'BCC';
  isActive: boolean;
  eventos: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface NotificationEventDefinition {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  colorClass: string;
  badgeClass: string;
}

export const NOTIFICATION_EVENTS_CATALOG: NotificationEventDefinition[] = [
  {
    id: 'DESPACHO_TRASLADO',
    label: 'Despacho de Traslados (Salida)',
    shortLabel: 'Despacho',
    description: 'Envío de equipos entre sedes o reasignación',
    colorClass: 'text-blue-700 bg-blue-50 border-blue-200',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  {
    id: 'RECEPCION_TRASLADO',
    label: 'Recepción de Traslados (Llegada con Firma)',
    shortLabel: 'Recepción',
    description: 'Confirmación física de entrega con soporte firmado',
    colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  {
    id: 'BAJA_ACTIVO',
    label: 'Bajas Definitivas de Activos',
    shortLabel: 'Bajas Contables',
    description: 'Retiro definitivo de equipos (Contabilidad y Activos Fijos)',
    colorClass: 'text-amber-700 bg-amber-50 border-amber-200',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200'
  },
  {
    id: 'HURTO_PERDIDA',
    label: 'Reporte de Hurto / Pérdida',
    shortLabel: 'Hurto/Pérdida',
    description: 'Pérdidas con denuncio legal obligatorio (Jurídica y Seguridad)',
    colorClass: 'text-rose-700 bg-rose-50 border-rose-200',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200'
  },
  {
    id: 'MANTENIMIENTO',
    label: 'Mantenimiento Técnico',
    shortLabel: 'Taller',
    description: 'Ingreso o salida de equipos en taller técnico',
    colorClass: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  },
  {
    id: 'TODOS',
    label: 'Todos los Eventos (Auditoría Global)',
    shortLabel: 'Todos los Eventos',
    description: 'Recepción de todas las notificaciones sin excepción',
    colorClass: 'text-purple-700 bg-purple-50 border-purple-200',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200'
  }
];
