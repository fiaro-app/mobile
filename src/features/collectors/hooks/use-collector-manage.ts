import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { initials } from '@/features/auth/lib/names';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import {
  changeCollectorPortfolio,
  deactivateCollector,
  deleteCollector,
  fetchCollectorStats,
  reactivateCollector,
  resetCollectorPassword,
} from '@/features/collectors/api/collectors-api';
import { COLLECTORS_COPY, collectorFailureMessage } from '@/features/collectors/content/messages';
import { useCollectorHandover } from '@/features/collectors/hooks/use-collector-handover';
import { usePortfolios } from '@/features/collectors/hooks/use-portfolios';
import { toCollectorStatsView } from '@/features/collectors/lib/collector-stats-view';
import { displayPhone, portfolioName } from '@/features/collectors/lib/collector-view-model';
import { currentRange } from '@/features/stats/lib/period-range';
import { useMembers } from '@/features/team/hooks/use-members';
import { businessDateOf } from '@/lib/business-date';
import { unwrapOrThrow } from '@/lib/http/api-failure-error';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';
import { shareText } from '@/lib/share-text';

import type { CollectorManage, ManageDialog } from '@/features/collectors/hooks/collector-manage.types';

export type { CollectorManage, ManageDialog } from '@/features/collectors/hooks/collector-manage.types';

/**
 * Lógica de "Gestionar cobrador": desempeño del mes, cambio de cartera, contraseña temporal nueva, baja (pasando sus
 * préstamos activos a otro cobrador, D-97), reactivación y borrado de un registro por error (D-116).
 * Los datos de la persona salen de la lista de colaboradores (ya en caché). Tras cada cambio se refresca esa lista
 * para que el listado y esta pantalla coincidan.
 *
 * @param id - `membershipId` del cobrador.
 */
export function useCollectorManage(id: string): CollectorManage {
  const queryClient = useQueryClient();
  const members = useMembers();
  const portfolios = usePortfolios();
  const member = members.data?.find((item) => item.id === id) ?? null;
  const [dialog, setDialog] = useState<ManageDialog>('none');
  const [chosen, setChosen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);

  const { handover, destinations } = useCollectorHandover(id, member, members.data ?? []);

  const stats = useQuery({
    queryKey: ['admin', 'collector-stats', id],
    enabled: member !== null,
    staleTime: 30_000,
    queryFn: async () => {
      const result = await fetchCollectorStats(id, currentRange('month', businessDateOf()));
      if (!result.ok) signOutIfSessionExpired(result.failure);
      return unwrapOrThrow(result);
    },
  });

  const run = async (action: () => Promise<Result<unknown, ApiFailure>>, onOk: (value: unknown) => void) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    const result = await action();
    setBusy(false);
    setDialog('none');
    if (!result.ok) {
      signOutIfSessionExpired(result.failure);
      setError(collectorFailureMessage(result.failure));
      return;
    }
    onOk(result.value);
    void queryClient.invalidateQueries({ queryKey: ['members'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'collector-handover', id] });
  };

  const deactivateWith = (destinationId: string | null) => {
    const reassignments = destinationId === null ? [] : (handover.data ?? []).map((loanId) => ({ loanId, collectorMembershipId: destinationId }));
    void run(
      () => deactivateCollector(id, reassignments),
      () => {
        setNotice(COLLECTORS_COPY.manage.deactivated);
      },
    );
  };

  const portfolioId = chosen ?? member?.portfolioId ?? '';
  return {
    loading: members.isPending,
    notFound: members.data !== undefined && member === null,
    person: member
      ? {
          name: member.fullName,
          phone: displayPhone(member.phone),
          active: member.status === 'ACTIVE',
          portfolio: portfolioName(portfolios.data ?? [], member.portfolioId),
          initials: initials(member.fullName),
          isOwner: member.roles.includes('OWNER'),
        }
      : null,
    stats: stats.data ? toCollectorStatsView(stats.data) : null,
    statsFailed: stats.isError && stats.data === undefined,
    portfolioOptions: (portfolios.data ?? []).map((portfolio) => ({ value: portfolio.id, label: portfolio.name })),
    portfolioId,
    portfolioLabel: (portfolios.data ?? []).find((portfolio) => portfolio.id === portfolioId)?.name ?? portfolioName(portfolios.data ?? [], member?.portfolioId ?? null),
    portfolioChanged: member !== null && portfolioId !== '' && portfolioId !== member.portfolioId,
    dialog,
    busy,
    error,
    notice,
    tempPassword,
    openDialog: setDialog,
    closeDialog: () => {
      setDialog('none');
    },
    choosePortfolio: (value) => {
      setChosen(value);
      setDialog('none');
    },
    savePortfolio: () => {
      if (!member || portfolioId === '' || portfolioId === member.portfolioId) return;
      void run(
        () => changeCollectorPortfolio(member.id, member.roles, portfolioId),
        () => {
          setNotice(COLLECTORS_COPY.manage.portfolioSaved);
        },
      );
    },
    confirmReset: () => {
      void run(
        () => resetCollectorPassword(id),
        (value) => {
          setTempPassword(String(value));
        },
      );
    },
    confirmDeactivate: () => {
      const loans = handover.data;
      if (loans === undefined) {
        setDialog('none');
        setError(COLLECTORS_COPY.manage.handoverFailed);
      } else if (loans.length === 0) {
        deactivateWith(null);
      } else if (destinations.length === 0) {
        setDialog('none');
        setError(COLLECTORS_COPY.manage.noDestinations);
      } else {
        setDialog('destination');
      }
    },
    destinationOptions: destinations.map((item) => ({ value: item.id, label: item.fullName })),
    activeLoanCount: handover.data?.length ?? null,
    chooseDestination: (destinationId) => {
      deactivateWith(destinationId);
    },
    confirmReactivate: () => {
      void run(
        () => reactivateCollector(id),
        () => {
          setNotice(COLLECTORS_COPY.manage.reactivated);
        },
      );
    },
    confirmRemove: () => {
      void run(
        () => deleteCollector(id),
        () => {
          setRemoved(true);
        },
      );
    },
    removed,
    shareTempPassword: () => {
      if (member && tempPassword) void shareText(COLLECTORS_COPY.registered.shareMessage(member.fullName, displayPhone(member.phone), tempPassword));
    },
    dismissTempPassword: () => {
      setTempPassword(null);
    },
  };
}
