import { useMemo, useState } from 'react';
import { CLIENTS_COPY } from '@/features/clients/content/messages';
import { callClient } from '@/features/client-detail/lib/call';
import { useClientLoansQuery, useClientQuery } from '@/features/clients/hooks/use-client-query';
import { clientBadge } from '@/features/clients/lib/client-view-model';
import { displayPhone } from '@/features/collectors/lib/collector-view-model';
import { initials } from '@/features/auth/lib/names';
import { toLoanRow, type LoanRowModel } from '@/features/loans/lib/loan-view-model';
import { useClientsRisk } from '@/features/risk/hooks/use-clients-risk';
import type { RiskView } from '@/features/risk/lib/risk-view';
import { classifyEntry } from '@/lib/loan-status';
import { failureOf } from '@/lib/http/api-failure-error';
import type { BadgeKind } from '@/components/atoms/Badge';

/** Todo lo que la ficha del cliente dibuja. */
export interface ClientProfile {
  readonly loading: boolean;
  readonly notFound: boolean;
  readonly loadFailed: boolean;
  readonly client: {
    readonly initials: string;
    readonly name: string;
    readonly nationalId: string;
    readonly phone: string;
    readonly phoneE164: string;
    readonly address: string;
    readonly occupation: string;
    readonly badge: { readonly label: string; readonly kind: BadgeKind };
  } | null;
  readonly loans: LoanRowModel[];
  readonly loansLoading: boolean;
  /** Aviso bajo los datos (por ejemplo, que el dispositivo no puede llamar). */
  readonly notice: string | null;
  /** El riesgo del cliente en el negocio; `null` si no se pudo consultar. */
  readonly risk: RiskView | null;
  readonly call: () => void;
  readonly refresh: () => void;
}

/**
 * Lógica de la ficha de un cliente: sus datos y sus préstamos. El distintivo de estado sale de los préstamos VIGENTES:
 * se usa el peor (el de más días de mora) para que un cliente con un préstamo al día y otro en mora aparezca en mora.
 */
export function useClientProfile(id: string): ClientProfile {
  const client = useClientQuery(id);
  const loans = useClientLoansQuery(id);
  const rows = useMemo(() => (loans.data ?? []).map((loan) => toLoanRow(loan, null)), [loans.data]);
  const risk = useClientsRisk([id]).get(id) ?? null;
  const [notice, setNotice] = useState<string | null>(null);
  const failure = failureOf(client.error);
  const data = client.data;

  let badge = clientBadge({ balance: 0, overdueDays: 0, activeLoans: 0 });
  const active = (loans.data ?? []).filter((loan) => loan.status === 'ACTIVE' && classifyEntry(loan) !== 'paid');
  if (active.length > 0) {
    const worst = active.reduce((a, b) => (b.overdueDays > a.overdueDays ? b : a));
    badge = clientBadge({ balance: worst.balance, overdueDays: worst.overdueDays, activeLoans: active.length });
  }

  return {
    loading: client.isPending,
    notFound: failure?.kind === 'http' && failure.status === 404,
    loadFailed: client.data === undefined && failure !== null && !(failure.kind === 'http' && failure.status === 404),
    client: data
      ? { initials: initials(data.fullName), name: data.fullName, nationalId: data.nationalId, phone: displayPhone(data.phone), phoneE164: data.phone, address: data.address, occupation: data.occupation, badge }
      : null,
    loans: rows,
    loansLoading: loans.isPending,
    notice,
    risk,
    call: () => {
      if (!data) return;
      void callClient(data.phone).then((opened) => {
        setNotice(opened ? null : CLIENTS_COPY.profile.cannotCall);
      });
    },
    refresh: () => {
      void client.refetch();
      void loans.refetch();
    },
  };
}
