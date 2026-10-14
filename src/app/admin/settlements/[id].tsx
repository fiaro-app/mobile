import { useLocalSearchParams } from 'expo-router';
import { EmptyState } from '@/components/molecules/EmptyState';
import { TopBar } from '@/components/molecules/TopBar';
import { ClientDetailSkeleton } from '@/components/organisms/ClientDetailSkeleton';
import { ReviewDetailView } from '@/components/organisms/ReviewDetailView';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { REVIEW_COPY } from '@/features/settlement-review/content/messages';
import { useReviewDetail } from '@/features/settlement-review/hooks/use-review-detail';
import { useGoBack } from '@/features/workspace/hooks/use-go-back';

/** Ruta `/admin/settlements/[id]`: detalle del cuadre y su revisión (aprobar o rechazar con comentario). */
export default function ReviewDetailScreen() {
  const goBack = useGoBack();
  const { id } = useLocalSearchParams<{ id: string }>();
  const detail = useReviewDetail(id);
  const copy = REVIEW_COPY.detail;

  let body = <ClientDetailSkeleton />;
  if (detail.notFound) {
    body = <EmptyState icon="document-outline" title={copy.notFoundTitle} message={copy.notFoundMessage} />;
  } else if (detail.loadFailed) {
    body = <EmptyState icon="alert-circle-outline" title={copy.loadFailedTitle} message={REVIEW_COPY.loadFailedMessage} actionLabel="Reintentar" onAction={detail.refresh} />;
  } else if (detail.model) {
    const model = detail.model;
    const rejecting = detail.decision === 'reject';
    body = (
      <ReviewDetailView
        collectorName={model.collectorName}
        badge={model.badge}
        summary={model.summary}
        rows={model.rows}
        collectorNote={model.collectorNote ? { title: copy.collectorNote, text: model.collectorNote } : null}
        reviewNote={model.reviewNote ? { title: copy.reviewNote, text: model.reviewNote } : null}
        error={detail.error}
        notice={detail.notice}
        actions={
          model.reviewable
            ? {
                approve: copy.approve,
                reject: copy.reject,
                onApprove: () => {
                  detail.startDecision('approve');
                },
                onReject: () => {
                  detail.startDecision('reject');
                },
              }
            : null
        }
        busy={detail.busy}
        dialog={{
          visible: detail.decision !== null,
          title: rejecting ? copy.rejectTitle : copy.approveTitle,
          message: rejecting ? copy.rejectMessage : `${model.collectorName} · ${model.summary}.`,
          cancelLabel: copy.cancel,
          confirmLabel: rejecting ? copy.rejectConfirm : copy.approveConfirm,
          onCancel: detail.cancelDecision,
          onConfirm: detail.confirmDecision,
          destructive: rejecting,
        }}
        comment={{ label: copy.commentLabel, value: detail.note, onChange: detail.setNote }}
      />
    );
  }
  return (
    <ScreenTemplate
      topBar={
        <TopBar
          title={copy.title}
          onBack={() => {
            goBack();
          }}
        />
      }
    >
      {body}
    </ScreenTemplate>
  );
}
