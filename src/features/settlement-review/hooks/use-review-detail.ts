import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { approveSettlement, fetchSettlementById, rejectSettlement } from '@/features/settlement-review/api/review-api';
import { REVIEW_COPY, reviewFailureMessage } from '@/features/settlement-review/content/messages';
import { toReviewDetail, UNKNOWN_COLLECTOR, type ReviewDetailModel } from '@/features/settlement-review/lib/review-view-model';
import { useMembers } from '@/features/team/hooks/use-members';
import { failureOf } from '@/lib/http/api-failure-error';
import { useApiQuery } from '@/lib/hooks/use-api-query';

/** Decisión en curso (abre su diálogo). */
export type ReviewDecision = 'approve' | 'reject';

/** Todo lo que el detalle de un cuadre dibuja y puede hacer. */
export interface ReviewDetail {
  readonly loading: boolean;
  readonly notFound: boolean;
  readonly loadFailed: boolean;
  readonly model: ReviewDetailModel | null;
  readonly decision: ReviewDecision | null;
  readonly note: string;
  readonly busy: boolean;
  readonly error: string | null;
  readonly notice: string | null;
  readonly startDecision: (decision: ReviewDecision) => void;
  readonly cancelDecision: () => void;
  readonly setNote: (text: string) => void;
  readonly confirmDecision: () => void;
  readonly refresh: () => void;
}

/**
 * Lógica del detalle de un cuadre y su revisión (aprobar o rechazar, solo si está pendiente). El comentario es opcional
 * pero el cobrador lo lee al rechazar. Un `CONFLICT` significa que otra persona ya lo revisó. Al decidir se refrescan la
 * lista de cuadres y el Resumen (que muestra los pendientes).
 */
export function useReviewDetail(id: string): ReviewDetail {
  const queryClient = useQueryClient();
  const query = useApiQuery(['admin', 'settlement', id], () => fetchSettlementById(id));
  const members = useMembers();
  const [decision, setDecision] = useState<ReviewDecision | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const failure = failureOf(query.error);

  const settlement = query.data;
  const name = settlement ? (members.data?.find((member) => member.id === settlement.collectorMembershipId)?.fullName ?? UNKNOWN_COLLECTOR) : '';
  const close = () => {
    setDecision(null);
    setNote('');
  };

  return {
    loading: query.isPending,
    notFound: failure?.kind === 'http' && failure.status === 404,
    loadFailed: settlement === undefined && failure !== null && !(failure.kind === 'http' && failure.status === 404),
    model: settlement ? toReviewDetail(settlement, name) : null,
    decision,
    note,
    busy,
    error,
    notice,
    startDecision: (next) => {
      setError(null);
      setNotice(null);
      setDecision(next);
    },
    cancelDecision: close,
    setNote,
    confirmDecision: () => {
      if (!decision) return;
      const current = decision;
      void (async () => {
        setBusy(true);
        const result = await (current === 'approve' ? approveSettlement : rejectSettlement)(id, note);
        setBusy(false);
        close();
        if (!result.ok) {
          signOutIfSessionExpired(result.failure);
          setError(reviewFailureMessage(result.failure));
          return;
        }
        queryClient.setQueryData(['admin', 'settlement', id], result.value);
        setNotice(current === 'approve' ? REVIEW_COPY.detail.approved : REVIEW_COPY.detail.rejected);
        void queryClient.invalidateQueries({ queryKey: ['admin', 'settlements'] });
        void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      })();
    },
    refresh: () => {
      void query.refetch();
    },
  };
}
