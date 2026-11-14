import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { approveLoanRequest, fetchLoanRequestById, rejectLoanRequest } from '@/features/loan-requests/api/requests-api';
import { REQUEST_COPY, requestFailureMessage } from '@/features/loan-requests/content/messages';
import { toRequestDetail, UNKNOWN_COLLECTOR, type RequestDetailModel } from '@/features/loan-requests/lib/request-view-model';
import { useMembers } from '@/features/team/hooks/use-members';
import { failureOf } from '@/lib/http/api-failure-error';
import { useApiQuery } from '@/lib/hooks/use-api-query';

/** Decisión en curso (abre su diálogo). */
export type RequestDecision = 'approve' | 'reject';

/** Todo lo que el detalle de una solicitud dibuja y puede hacer. */
export interface RequestDetail {
  readonly loading: boolean;
  readonly notFound: boolean;
  readonly loadFailed: boolean;
  readonly model: RequestDetailModel | null;
  readonly decision: RequestDecision | null;
  readonly note: string;
  readonly busy: boolean;
  readonly error: string | null;
  readonly notice: string | null;
  readonly startDecision: (decision: RequestDecision) => void;
  readonly cancelDecision: () => void;
  readonly setNote: (text: string) => void;
  readonly confirmDecision: () => void;
  readonly refresh: () => void;
}

/**
 * Lógica del detalle de una solicitud y su resolución (aceptar o rechazar, solo si está pendiente). El motivo del rechazo
 * es opcional pero el cobrador lo lee. Un `CONFLICT` significa que otro administrador ya la resolvió. Al decidir se
 * refrescan la lista de solicitudes y de préstamos.
 */
export function useRequestDetail(id: string): RequestDetail {
  const queryClient = useQueryClient();
  const query = useApiQuery(['admin', 'loan-request', id], () => fetchLoanRequestById(id));
  const members = useMembers();
  const [decision, setDecision] = useState<RequestDecision | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const failure = failureOf(query.error);

  const request = query.data;
  const name = request ? (members.data?.find((member) => member.id === request.requestedByMembershipId)?.fullName ?? UNKNOWN_COLLECTOR) : '';
  const close = () => {
    setDecision(null);
    setNote('');
  };

  return {
    loading: query.isPending,
    notFound: failure?.kind === 'http' && failure.status === 404,
    loadFailed: request === undefined && failure !== null && !(failure.kind === 'http' && failure.status === 404),
    model: request ? toRequestDetail(request, name) : null,
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
        const result = await (current === 'approve' ? approveLoanRequest(id) : rejectLoanRequest(id, note));
        setBusy(false);
        close();
        if (!result.ok) {
          signOutIfSessionExpired(result.failure);
          setError(requestFailureMessage(result.failure));
          return;
        }
        queryClient.setQueryData(['admin', 'loan-request', id], result.value);
        setNotice(current === 'approve' ? REQUEST_COPY.detail.approved : REQUEST_COPY.detail.rejected);
        void queryClient.invalidateQueries({ queryKey: ['admin', 'loan-requests'] });
        if (current === 'approve') {
          void queryClient.invalidateQueries({ queryKey: ['admin', 'loans'] });
          void queryClient.invalidateQueries({ queryKey: ['admin', 'clients'] });
        }
      })();
    },
    refresh: () => {
      void query.refetch();
    },
  };
}
