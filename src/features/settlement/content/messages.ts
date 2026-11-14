import type { SettlementStatus } from '@/features/settlement/lib/settlement-schemas';
import type { SettlementError } from '@/features/settlement/lib/settlement-form';

/** Textos de "Cuadre del día". */
export const SETTLEMENT_COPY = {
  title: 'Cuadre del día',
  expected: 'Esperado hoy',
  collected: 'Cobrado',
  methodsTitle: 'Lo que cobraste por medio de pago',
  cash: 'Efectivo',
  nequi: 'Nequi',
  transfer: 'Transferencia',
  noteLabel: 'Nota para el prestamista',
  notePlaceholder: 'Explica la diferencia (obligatoria si no cuadra)',
  submit: 'Enviar cuadre',
  resubmit: 'Reenviar cuadre',
  confirmTitle: '¿Enviar el cuadre?',
  confirmWarning: 'Tu prestamista lo revisará y no podrás cambiarlo hasta que lo apruebe o lo rechace. Revisa que ya visitaste a todos tus clientes.',
  cancel: 'Cancelar cuadre',
  cancelTitle: '¿Cancelar el cuadre?',
  cancelMessage: 'Retiras el cuadre que enviaste para cambiarlo o seguir cobrando. Cuando termines tendrás que enviarlo de nuevo.',
  cancelKeep: 'Mantenerlo',
  cancelFailed: 'No pudimos cancelar el cuadre. Intenta de nuevo.',
  dayClosedTitle: 'Día cerrado',
  dayClosedInReview: 'Ya enviaste el cuadre de hoy y está en revisión: no puedes registrar más cobros. Si lo enviaste por error, cancélalo desde el cuadre.',
  dayClosedApproved: 'Tu cuadre de hoy ya fue aprobado: no puedes registrar más cobros hoy.',
  slide: 'Desliza para el cuadre del día',
  inReview: 'Cuadre enviado · en revisión',
  approved: 'Cuadre aprobado · día cerrado',
  confirmCancel: 'Revisar',
  confirmAccept: 'Enviar',
  loadFailedTitle: 'No pudimos cargar tu cuadre',
  loadFailedMessage: 'Revisa tu conexión e intenta de nuevo.',
  sessionExpired: 'Tu sesión venció. Inicia sesión de nuevo.',
  submitFailed: 'No pudimos enviar el cuadre. Intenta de nuevo.',
  offlineSubmit: 'Sin conexión: el cuadre solo se puede enviar con internet.',
  errors: {
    'note-required': 'Cuando no cuadra, explica la diferencia en la nota.',
    'note-too-long': 'La nota admite máximo 500 caracteres.',
  } satisfies Record<SettlementError, string>,
  status: {
    PENDING: { title: 'Enviado', message: 'Tu prestamista lo revisará pronto.' },
    APPROVED: { title: 'Aprobado', message: 'Tu prestamista aprobó este cuadre.' },
    REJECTED: { title: 'Rechazado', message: 'Corrige lo necesario y vuelve a enviarlo.' },
  } satisfies Record<SettlementStatus, { title: string; message: string }>,
} as const;

/** Texto de la diferencia entre lo cobrado y lo esperado ("Cuadra", "Faltan $X", "Sobran $X"). */
export function differenceLabel(difference: number, formatted: string): string {
  if (difference === 0) return 'Cuadra con lo esperado';
  return difference < 0 ? `Faltan ${formatted}` : `Sobran ${formatted}`;
}
