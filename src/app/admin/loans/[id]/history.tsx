import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { TextField } from '@/components/atoms/TextField';
import { Alert } from '@/components/molecules/Alert';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { EmptyState } from '@/components/molecules/EmptyState';
import { TopBar } from '@/components/molecules/TopBar';
import { EntityList } from '@/components/organisms/EntityList';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { AttachmentPanel } from '@/features/attachments/components/AttachmentPanel';
import { ATTACHMENT_COPY } from '@/features/attachments/content/messages';
import { LOANS_COPY } from '@/features/loans/content/messages';
import { useLoanHistory } from '@/features/loans/hooks/use-loan-history';
import type { VisitRowModel } from '@/features/loans/lib/visit-history-view-model';
import { useGoBack } from '@/features/workspace/hooks/use-go-back';

function detailOf(row: { reversiblePaymentId: string | null; paymentId: string | null; detail: string }, openLabel: string): string | undefined {
  if (row.reversiblePaymentId) return openLabel;
  if (row.detail !== '') return row.detail;
  return row.paymentId ? openLabel : undefined;
}

/** Ruta `/admin/loans/[id]/history`: historial de cobros del préstamo; tocar un pago permite revertirlo con un motivo. */
export default function LoanHistoryScreen() {
  const goBack = useGoBack();
  const { id } = useLocalSearchParams<{ id: string }>();
  const history = useLoanHistory(id);
  const [sheet, setSheet] = useState<VisitRowModel | null>(null);
  const copy = LOANS_COPY.history;
  const empty = history.loadFailed ? (
    <EmptyState icon="alert-circle-outline" title={LOANS_COPY.loadFailedTitle} message={LOANS_COPY.loadFailedMessage} actionLabel="Reintentar" onAction={history.refresh} />
  ) : (
    <EmptyState icon="receipt-outline" title={copy.empty} message="" />
  );
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
      <EntityList
        items={history.rows.map((row) => ({
          id: row.id,
          title: row.title,
          subtitle: row.subtitle,
          detail: detailOf(row, copy.openPayment),
          badge: row.badge ?? undefined,
          trailing: row.trailing === '' ? undefined : row.trailing,
          onPress: row.paymentId
            ? () => {
                setSheet(row);
              }
            : undefined,
        }))}
        loading={history.loading}
        refreshing={history.refreshing}
        onRefresh={history.refresh}
        empty={empty}
        header={
          history.error || history.notice ? (
            <View className="gap-2 bg-surface px-5 py-3">
              {history.error ? <Alert message={history.error} /> : null}
              {history.notice ? <AppText variant="small" tone="primary">{history.notice}</AppText> : null}
            </View>
          ) : undefined
        }
      />
      <ConfirmDialog
        visible={sheet !== null}
        title={copy.paymentTitle}
        message={sheet ? `${sheet.title} · ${sheet.trailing}` : ''}
        cancelLabel={copy.close}
        confirmLabel={sheet?.reversiblePaymentId ? copy.reverse : copy.done}
        onCancel={() => {
          setSheet(null);
        }}
        onConfirm={() => {
          const row = sheet;
          setSheet(null);
          if (row?.reversiblePaymentId) history.startReverse(row);
        }}
        destructive={Boolean(sheet?.reversiblePaymentId)}
      >
        {sheet?.paymentId ? (
          <AttachmentPanel
            target="payment"
            id={sheet.paymentId}
            canEdit
            title={ATTACHMENT_COPY.paymentProof.title}
            description={ATTACHMENT_COPY.paymentProof.description}
            alt={ATTACHMENT_COPY.paymentProof.alt}
            none={ATTACHMENT_COPY.paymentProof.none}
          />
        ) : null}
      </ConfirmDialog>
      <ConfirmDialog
        visible={history.reversing !== null}
        title={copy.reverseTitle}
        message={copy.reverseMessage(history.reversing?.amount ?? '')}
        cancelLabel={copy.cancel}
        confirmLabel={copy.reverseConfirm}
        onCancel={history.cancelReverse}
        onConfirm={history.confirmReverse}
        destructive
        busy={history.busy}
      >
        <View className="gap-1">
          <TextField accessibilityLabel={copy.reasonLabel} placeholder={copy.reasonLabel} value={history.reason} onChangeText={history.setReason} invalid={history.reasonError !== null} multiline className="h-20 py-2" textAlignVertical="top" />
          {history.reasonError ? (
            <AppText variant="caption" tone="destructive" accessibilityRole="alert">
              {history.reasonError}
            </AppText>
          ) : null}
        </View>
      </ConfirmDialog>
    </ScreenTemplate>
  );
}
