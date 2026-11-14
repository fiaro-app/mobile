import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { useSessionStore } from '@/features/auth/store/session-store';
import { cancelSettlement } from '@/features/settlement/api/settlement-api';
import { SETTLEMENT_COPY } from '@/features/settlement/content/messages';
import { settlementKey, useDailySummary, useSentSettlement } from '@/features/settlement/hooks/use-settlement-data';
import { forgetSettlement } from '@/features/settlement/store/settlement-memory';

/** Lo que la pantalla del cuadre necesita para «Cancelar cuadre». */
export interface CancelSettlement {
  /** Solo mientras el cuadre enviado sigue en revisión. */
  readonly canCancel: boolean;
  readonly dialogOpen: boolean;
  readonly busy: boolean;
  readonly error: string | null;
  readonly request: () => void;
  readonly dismiss: () => void;
  readonly confirm: () => void;
}

/**
 * Retira el cuadre que el cobrador envió y sigue en revisión, para cambiarlo, seguir cobrando o corregir un envío
 * por error. Pide confirmación. Al cancelarlo se olvida el cuadre de este teléfono y el día queda abierto otra vez.
 */
export function useCancelSettlement(): CancelSettlement {
  const queryClient = useQueryClient();
  const userId = useSessionStore((state) => state.user?.id ?? '');
  const date = useDailySummary().data?.date;
  const sent = useSentSettlement(userId, date);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const settlement = sent.data ?? null;

  const confirm = () => {
    if (!settlement || !date || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    void (async () => {
      const result = await cancelSettlement(settlement.id);
      inFlight.current = false;
      setBusy(false);
      setDialogOpen(false);
      if (!result.ok) {
        signOutIfSessionExpired(result.failure);
        setError(SETTLEMENT_COPY.cancelFailed);
        return;
      }
      setError(null);
      await forgetSettlement(userId, date);
      queryClient.setQueryData(settlementKey(userId, date), null);
      void queryClient.invalidateQueries({ queryKey: ['collector', 'daily-summary'] });
    })();
  };

  return {
    canCancel: settlement?.status === 'PENDING',
    dialogOpen,
    busy,
    error,
    request: () => {
      setError(null);
      setDialogOpen(true);
    },
    dismiss: () => {
      setDialogOpen(false);
    },
    confirm,
  };
}
