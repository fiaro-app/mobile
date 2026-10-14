import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { TextField } from '@/components/atoms/TextField';
import { Alert } from '@/components/molecules/Alert';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { EmptyState } from '@/components/molecules/EmptyState';
import { TopBar } from '@/components/molecules/TopBar';
import { EntityList } from '@/components/organisms/EntityList';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { LOANS_COPY } from '@/features/loans/content/messages';
import { useLoanHistory } from '@/features/loans/hooks/use-loan-history';
import { useGoBack } from '@/features/workspace/hooks/use-go-back';

function detailOf(row: { reversiblePaymentId: string | null; detail: string }, reverseLabel: string): string | undefined {
  if (row.reversiblePaymentId) return reverseLabel;
  return row.detail === '' ? undefined : row.detail;
}

/** Ruta `/admin/loans/[id]/history`: historial de cobros del préstamo; tocar un pago permite revertirlo con un motivo. */
export default function LoanHistoryScreen() {
  const goBack = useGoBack();
  const { id } = useLocalSearchParams<{ id: string }>();
  const history = useLoanHistory(id);
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
          detail: detailOf(row, copy.reverse),
          badge: row.badge ?? undefined,
          trailing: row.trailing === '' ? undefined : row.trailing,
          onPress: row.reversiblePaymentId
            ? () => {
                history.startReverse(row);
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
