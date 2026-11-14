import { planLimitMessage } from '@/features/settings/content/plan-limit';
import type { ApiFailure } from '@/lib/http/failure';
import type { LoanFilter } from '@/features/loans/lib/loan-list';

/** Textos de Préstamos (lista, detalle, calendario, historial). */
export const LOANS_COPY = {
  title: 'Préstamos',
  searchPlaceholder: 'Buscar por cliente',
  filters: [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'arrears', label: 'En mora' },
    { value: 'paid', label: 'Pagados' },
    { value: 'canceled', label: 'Anulados' },
  ] satisfies readonly { value: LoanFilter; label: string }[],
  newLoan: 'Nuevo préstamo',
  emptyTitle: 'Aún no hay préstamos',
  emptyMessage: 'Crea el primer préstamo desde la ficha de un cliente.',
  noResultsTitle: 'Sin resultados',
  noResultsMessage: 'No encontramos préstamos con ese filtro o búsqueda.',
  loadFailedTitle: 'No pudimos cargar los préstamos',
  loadFailedMessage: 'Revisa tu conexión e intenta de nuevo.',
  form: {
    clientField: 'Cliente',
    clientSheet: 'Elige el cliente',
    principal: 'Monto prestado',
    count: 'Número de cuotas',
    installment: 'Valor de cada cuota',
    total: 'Total a pagar',
    totalHint: 'Sugerido: cuotas × valor de la cuota. Puedes editarlo si hay intereses.',
    frequency: 'Frecuencia de cobro',
    startDate: 'Fecha de inicio',
    collector: 'Cobrador (opcional)',
    submit: 'Crear préstamo',
    cancel: 'Cancelar',
    seeLoan: 'Ver el préstamo',
  },
  detail: {
    title: 'Préstamo',
    balance: 'Saldo pendiente',
    installment: 'Cuota',
    start: 'Inicio',
    overdue: 'Vencido',
    collector: 'Cobrador',
    noCollector: 'Sin cobrador asignado',
    calendar: 'Calendario de cuotas',
    history: 'Historial de cobros',
    client: 'Ficha del cliente',
    assign: 'Asignar cobrador',
    assignTitle: 'Asignar cobrador',
    assigned: 'Cobrador asignado.',
    cancel: 'Anular préstamo',
    cancelNote: 'Anular un préstamo es definitivo y queda en el historial.',
    cancelTitle: '¿Anular este préstamo?',
    cancelMessage: (client: string, amount: string) => `Se anulará el préstamo de ${client} (${amount}). Esta acción es definitiva y queda en el historial.`,
    cancelConfirm: 'Anular',
    canceled: 'Préstamo anulado.',
    dismiss: 'Cancelar',
    notFoundTitle: 'Préstamo no encontrado',
    notFoundMessage: 'Ese préstamo ya no existe. Vuelve a la lista y actualiza.',
    loadFailedTitle: 'No pudimos cargar el préstamo',
  },
  calendar: { title: 'Calendario de cuotas', empty: 'Este préstamo no tiene cuotas.' },
  history: {
    title: 'Historial de cobros',
    empty: 'Todavía no hay cobros registrados.',
    reverse: 'Revertir pago',
    openPayment: 'Ver comprobante o revertir',
    paymentTitle: 'Pago',
    close: 'Cerrar',
    done: 'Listo',
    reverseTitle: '¿Revertir este pago?',
    reverseMessage: (amount: string) => `Se revertirá el pago de ${amount}. El saldo del préstamo volverá a subir.`,
    reasonLabel: 'Motivo (obligatorio)',
    reasonRequired: 'Escribe el motivo de la reversión.',
    reverseConfirm: 'Revertir',
    reversed: 'Pago revertido.',
    cancel: 'Cancelar',
  },
} as const;

/** Mensaje de un fallo al administrar préstamos, según el `code` estable del API. */
export function loanFailureMessage(failure: ApiFailure): string {
  if (failure.kind === 'offline') return 'Sin conexión. Intenta de nuevo cuando tengas internet.';
  if (failure.kind === 'maintenance') return 'Fiaro está en mantenimiento. Intenta más tarde.';
  switch (failure.code) {
    case 'LOAN_NOT_CANCELABLE':
      return 'Este préstamo ya no se puede anular porque dejó de estar activo.';
    case 'FORBIDDEN':
      return 'No tienes permiso para administrar préstamos.';
    case 'PLAN_LIMIT_REACHED':
      return planLimitMessage(failure, 'L004A');
    case 'SUBSCRIPTION_READ_ONLY':
      return 'Tu suscripción está en modo de solo lectura. Renuévala para hacer cambios.';
    case 'NOT_FOUND':
      return 'Ese préstamo, su cliente o el cobrador ya no existe. Actualiza la lista.';
    case 'CONFLICT':
      return 'Ese pago ya estaba revertido.';
    default:
      return failure.status === 429 ? 'Demasiados intentos. Espera un momento.' : 'No pudimos completar la acción. Intenta de nuevo.';
  }
}
