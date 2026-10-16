import type { BadgeKind } from '@/components/atoms/Badge';
import type { LoanRequest, RequestStatus } from '@/features/loan-requests/lib/request-schemas';
import { FREQUENCY_OPTIONS } from '@/features/loans/lib/frequency-options';
import { formatShortDate } from '@/lib/business-date';
import { formatCop } from '@/lib/format-cop';

/** Nombre mostrado cuando la solicitud es de alguien que ya no aparece entre los colaboradores. */
export const UNKNOWN_COLLECTOR = 'Cobrador sin nombre';

/** Nombre mostrado cuando no se pudo traer el del cliente. */
export const UNKNOWN_CLIENT = 'Cliente del negocio';

const STATUS: Record<RequestStatus, { label: string; kind: BadgeKind }> = {
  PENDING: { label: 'PENDIENTE', kind: 'warning' },
  APPROVED: { label: 'ACEPTADA', kind: 'good' },
  REJECTED: { label: 'RECHAZADA', kind: 'bad' },
};

const frequencyLabel = (request: LoanRequest) => FREQUENCY_OPTIONS.find((option) => option.value === request.frequency)?.label ?? request.frequency;

/** «$500.000 en 20 cuotas de $30.000». */
function summaryOf(request: LoanRequest): string {
  return `${formatCop(request.principalAmount)} en ${String(request.installmentCount)} cuotas de ${formatCop(request.installmentValue)}`;
}

/** Una fila de la lista de solicitudes. */
export interface RequestRowModel {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly amount: string;
  readonly badge: { readonly label: string; readonly kind: BadgeKind };
}

/** Fila de solicitud: el cliente, quién la sugirió, el monto y el estado. */
export function toRequestRow(request: LoanRequest, names: ReadonlyMap<string, string>): RequestRowModel {
  const collector = names.get(request.requestedByMembershipId) ?? UNKNOWN_COLLECTOR;
  return {
    id: request.id,
    title: request.newClient?.fullName ?? `${UNKNOWN_CLIENT} · ${request.nationalId}`,
    subtitle: `${collector} · ${formatShortDate(request.createdAt)}`,
    amount: formatCop(request.principalAmount),
    badge: STATUS[request.status],
  };
}

/** Detalle de una solicitud listo para dibujar. */
export interface RequestDetailModel {
  readonly collectorName: string;
  readonly badge: { readonly label: string; readonly kind: BadgeKind };
  readonly summary: string;
  readonly rows: readonly { readonly label: string; readonly value: string }[];
  readonly rejectionNote: string | null;
  readonly reviewable: boolean;
}

/** Detalle: cliente (nuevo o del negocio), condiciones del préstamo y si todavía se puede resolver (solo `PENDING`). */
export function toRequestDetail(request: LoanRequest, collectorName: string): RequestDetailModel {
  const client = request.newClient;
  return {
    collectorName,
    badge: STATUS[request.status],
    summary: summaryOf(request),
    rows: [
      { label: 'Cliente', value: client ? `${client.fullName} (nuevo)` : UNKNOWN_CLIENT },
      { label: 'Cédula', value: request.nationalId },
      ...(client ? [{ label: 'Celular', value: client.phone }, { label: 'Oficio', value: client.occupation }, { label: 'Dirección', value: client.address }] : []),
      { label: 'Monto', value: formatCop(request.principalAmount) },
      { label: 'Cuotas', value: `${String(request.installmentCount)} de ${formatCop(request.installmentValue)}` },
      { label: 'Total a pagar', value: formatCop(request.totalPayable) },
      { label: 'Frecuencia', value: frequencyLabel(request) },
      { label: 'Empieza', value: formatShortDate(request.startDate) },
      { label: 'Enviada', value: formatShortDate(request.createdAt) },
    ],
    rejectionNote: request.rejectionReason,
    reviewable: request.status === 'PENDING',
  };
}
