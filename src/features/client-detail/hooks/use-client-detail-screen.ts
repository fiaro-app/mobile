import { DETAIL_COPY, detailEmptyFor, type DetailEmpty } from '@/features/client-detail/content/messages';
import { useClientDetail, type ClientDetailState } from '@/features/client-detail/hooks/use-client-detail';
import { callClient } from '@/features/client-detail/lib/call';
import type { ClientDetailModel } from '@/features/client-detail/lib/detail-view-model';

/** Fila de datos lista para dibujar. */
export interface DetailRow {
  readonly label: string;
  readonly value: string;
  readonly alert?: boolean;
}

/** Todo lo que la pantalla del detalle dibuja y puede hacer. */
export interface ClientDetailScreen {
  readonly state: ClientDetailState;
  readonly title: string;
  readonly model: ClientDetailModel | null;
  readonly rows: DetailRow[];
  readonly empty: DetailEmpty;
  readonly refreshing: boolean;
  readonly refresh: () => void;
  readonly call: () => void;
}

/** Une los datos del cliente con los textos del diseño y la acción de llamar. */
export function useClientDetailScreen(clientId: string, loanId: string): ClientDetailScreen {
  const detail = useClientDetail(clientId, loanId);
  const model = detail.model;
  const rows: DetailRow[] = model
    ? [
        { label: DETAIL_COPY.labels.phone, value: model.phone },
        { label: DETAIL_COPY.labels.address, value: model.address },
        { label: DETAIL_COPY.labels.balance, value: model.balanceLabel },
        { label: model.installmentName, value: model.installmentLabel },
        { label: DETAIL_COPY.labels.overdue, value: model.overdueLabel, alert: model.overdueAlert },
        { label: DETAIL_COPY.labels.nextVisit, value: model.nextVisitLabel },
      ]
    : [];
  return {
    state: detail.state,
    title: model?.name ?? DETAIL_COPY.title,
    model,
    rows,
    empty: detailEmptyFor(detail.state),
    refreshing: detail.refreshing,
    refresh: detail.refresh,
    call: () => {
      if (model) void callClient(model.phoneDial);
    },
  };
}
