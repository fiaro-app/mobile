import { METHOD_LABELS, OUTCOME_LABELS, formatPhone, installmentLabel } from '@/features/client-detail/lib/detail-labels';
import type { Balance, Client, Loan, Visit } from '@/features/client-detail/lib/detail-schemas';
import { businessDateOf, formatShortDate } from '@/lib/business-date';
import { formatCop } from '@/lib/format-cop';
import { classifyEntry, overdueDaysLabel, type EntryStatus } from '@/lib/loan-status';
import { initials } from '@/features/auth/lib/names';

/** Una fila del historial de visitas, ya formateada. */
export interface HistoryRowModel {
  readonly id: string;
  readonly dateLabel: string;
  readonly methodLabel: string | null;
  readonly amountLabel: string;
  readonly outcomeLabel: string;
  readonly outcomeTone: 'success' | 'neutral' | 'alert';
}

/** Todo lo que la pantalla de detalle dibuja, sin lógica pendiente. */
export interface ClientDetailModel {
  readonly name: string;
  readonly initials: string;
  readonly status: EntryStatus;
  readonly phone: string;
  readonly phoneDial: string;
  readonly address: string;
  readonly balance: number;
  readonly balanceLabel: string;
  readonly installmentName: string;
  readonly installmentLabel: string;
  readonly overdueLabel: string;
  readonly overdueAlert: boolean;
  readonly nextVisitLabel: string;
  readonly history: HistoryRowModel[];
  /** Cuota de hoy para precargar el monto al registrar la visita. */
  readonly installmentValue: number;
  readonly canRegisterVisit: boolean;
}

function historyRow(visit: Visit): HistoryRowModel {
  const reversed = visit.payment?.reversal != null;
  let tone: HistoryRowModel['outcomeTone'] = 'neutral';
  if (visit.outcome === 'PAID') tone = reversed ? 'alert' : 'success';
  else if (visit.outcome !== 'RESCHEDULED') tone = 'alert';
  return {
    id: visit.id,
    dateLabel: formatShortDate(visit.occurredAt),
    methodLabel: visit.payment ? METHOD_LABELS[visit.payment.method] : null,
    amountLabel: formatCop(visit.payment && !reversed ? visit.payment.amount : 0),
    outcomeLabel: reversed ? 'Anulado' : OUTCOME_LABELS[visit.outcome],
    outcomeTone: tone,
  };
}

/**
 * Arma el modelo del detalle de un cliente a partir de lo que entrega el API. Reglas que no son obvias:
 * - "Próxima visita" es `Hoy` si la fecha esperada es hoy o ya pasó (con mora el API devuelve la cuota
 *   impaga más antigua, y esa cobranza está pendiente ahora), comparando en HORA DE COLOMBIA, no la del teléfono.
 * - Un pago anulado por el administrador aparece como `Anulado` por `$0` en el historial: ya no cuenta.
 * - Registrar visita solo se ofrece con el préstamo `ACTIVE`.
 *
 * @param today - Fecha de negocio de hoy (inyectable para probar).
 */
export function buildClientDetail(
  input: { client: Client; loan: Loan; balance: Balance; visits: Visit[] },
  today: string = businessDateOf(),
): ClientDetailModel {
  const { client, loan, balance, visits } = input;
  let nextVisit = '—';
  if (balance.nextDueDate) nextVisit = balance.nextDueDate <= today ? 'Hoy' : formatShortDate(balance.nextDueDate);
  const ordered = [...visits].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  return {
    name: client.fullName,
    initials: initials(client.fullName),
    status: classifyEntry(balance),
    phone: formatPhone(client.phone),
    phoneDial: client.phone,
    address: client.address,
    balance: balance.balance,
    balanceLabel: formatCop(balance.balance),
    installmentName: installmentLabel(loan.frequency),
    installmentLabel: formatCop(loan.installmentValue),
    overdueLabel: overdueDaysLabel(balance.overdueDays),
    overdueAlert: balance.overdueDays > 0 && balance.balance > 0,
    nextVisitLabel: nextVisit,
    history: ordered.map(historyRow),
    installmentValue: loan.installmentValue,
    canRegisterVisit: loan.status === 'ACTIVE',
  };
}
