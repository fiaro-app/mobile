import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { initials } from '@/features/auth/lib/names';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { changeCollectorPortfolio, deactivateCollector, fetchCollectorStats, resetCollectorPassword } from '@/features/collectors/api/collectors-api';
import { COLLECTORS_COPY, collectorFailureMessage } from '@/features/collectors/content/messages';
import { usePortfolios } from '@/features/collectors/hooks/use-portfolios';
import { toCollectorStatsView, type CollectorStatsView } from '@/features/collectors/lib/collector-stats-view';
import { displayPhone, portfolioName } from '@/features/collectors/lib/collector-view-model';
import { currentRange } from '@/features/stats/lib/period-range';
import { useMembers } from '@/features/team/hooks/use-members';
import { businessDateOf } from '@/lib/business-date';
import { unwrapOrThrow } from '@/lib/http/api-failure-error';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';
import { shareText } from '@/lib/share-text';

/** Diálogo abierto sobre la pantalla. */
export type ManageDialog = 'none' | 'reset' | 'deactivate' | 'portfolio';

/** Todo lo que la pantalla "Gestionar cobrador" dibuja y puede hacer. */
export interface CollectorManage {
  readonly loading: boolean;
  readonly notFound: boolean;
  readonly person: { readonly name: string; readonly phone: string; readonly active: boolean; readonly portfolio: string; readonly initials: string } | null;
  readonly stats: CollectorStatsView | null;
  readonly statsFailed: boolean;
  readonly portfolioOptions: readonly { value: string; label: string }[];
  readonly portfolioId: string;
  /** Nombre de la cartera elegida (o la actual si no ha elegido otra). */
  readonly portfolioLabel: string;
  /** `true` si eligió una cartera distinta de la actual: aparece el botón de guardar. */
  readonly portfolioChanged: boolean;
  readonly dialog: ManageDialog;
  readonly busy: boolean;
  readonly error: string | null;
  readonly notice: string | null;
  readonly tempPassword: string | null;
  readonly openDialog: (dialog: Exclude<ManageDialog, 'none'>) => void;
  readonly closeDialog: () => void;
  readonly choosePortfolio: (portfolioId: string) => void;
  readonly savePortfolio: () => void;
  readonly confirmReset: () => void;
  readonly confirmDeactivate: () => void;
  readonly shareTempPassword: () => void;
  readonly dismissTempPassword: () => void;
}

/**
 * Lógica de "Gestionar cobrador": desempeño del mes, cambio de cartera, contraseña temporal nueva y desactivación.
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
      void run(
        () => deactivateCollector(id),
        () => {
          setNotice(COLLECTORS_COPY.manage.deactivated);
        },
      );
    },
    shareTempPassword: () => {
      if (member && tempPassword) void shareText(COLLECTORS_COPY.registered.shareMessage(member.fullName, displayPhone(member.phone), tempPassword));
    },
    dismissTempPassword: () => {
      setTempPassword(null);
    },
  };
}
