import type { Method } from '@/features/visit/lib/visit-request';

/** Textos de "Registrar visita", sus hojas y la pantalla de confirmación. */
export const VISIT_COPY = {
  installmentToday: 'Cuota de hoy',
  amountHint: 'Puedes editar el monto si el cliente paga distinto a la cuota',
  methodTitle: 'Medio de pago',
  slide: 'Desliza para confirmar el pago',
  otherOutcome: 'Otro resultado',
  methods: [
    { value: 'CASH', label: 'Efectivo' },
    { value: 'NEQUI', label: 'Nequi' },
    { value: 'TRANSFER', label: 'Transferencia' },
  ] satisfies readonly { value: Method; label: string }[],
  outcomeSheet: {
    title: 'Otro resultado',
    options: [
      { value: 'NOT_FOUND', label: 'No lo encontré', description: 'No había nadie en la dirección' },
      { value: 'REFUSED', label: 'Se negó a pagar', description: 'Cliente presente, no pagó' },
      { value: 'RESCHEDULED', label: 'Reprogramar', description: 'Pactar nueva fecha con el cliente' },
    ],
  },
  reschedule: {
    title: 'Reprogramar visita',
    dateLabel: 'Fecha de compromiso',
    hint: 'Ese día el cliente volverá a tu ruta.',
    cancel: 'Cancelar',
    save: 'Guardar visita',
  },
  confirm: { title: '¿Confirmar pago?', cancel: 'Cancelar', accept: 'Confirmar' },
  rejected: 'No pudimos registrar la visita. Revisa los datos e intenta de nuevo.',
  sessionExpired: 'Tu sesión venció. Inicia sesión de nuevo.',
} as const;

/** Texto del diálogo de confirmación; dice "completo" o "parcial" según el pago frente a la cuota. */
export function confirmMessage(amountLabel: string, methodLabel: string, kind: 'full' | 'partial', clientName: string): string {
  const kindText = kind === 'full' ? 'completo' : 'parcial';
  return `Vas a registrar ${amountLabel} en ${methodLabel.toLowerCase()} como pago ${kindText} de ${clientName}. Si te equivocas, solo el administrador podrá corregirlo.`;
}

/** Lo que muestra la pantalla de confirmación según cómo terminó el registro. */
export interface DoneContent {
  readonly title: string;
  readonly message: string;
  readonly icon: 'checkmark' | 'time-outline';
}

/**
 * Contenido de la confirmación: `queued` significa que la visita quedó en el teléfono por falta de
 * conexión; si no, se distingue una visita con pago de una sin pago.
 */
export function doneContentFor(kind: 'sent' | 'queued', paid: boolean): DoneContent {
  if (kind === 'queued') {
    return { title: '¡Visita guardada!', message: 'Sin conexión: quedó en tu teléfono y se enviará apenas vuelva internet.', icon: 'time-outline' };
  }
  return paid
    ? { title: '¡Visita registrada!', message: 'El pago quedó guardado y sincronizado.', icon: 'checkmark' }
    : { title: '¡Visita registrada!', message: 'El resultado de la visita quedó guardado y sincronizado.', icon: 'checkmark' };
}
