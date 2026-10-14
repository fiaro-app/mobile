import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { EmptyState } from '@/components/molecules/EmptyState';
import { TopBar } from '@/components/molecules/TopBar';
import { EntityList } from '@/components/organisms/EntityList';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { LOANS_COPY } from '@/features/loans/content/messages';
import { useLoanCalendar } from '@/features/loans/hooks/use-loan-calendar';
import { useGoBack } from '@/features/workspace/hooks/use-go-back';

/** Ruta `/admin/loans/[id]/calendar`: calendario de cuotas con lo pagado y el estado de cada una. */
export default function LoanCalendarScreen() {
  const goBack = useGoBack();
  const { id } = useLocalSearchParams<{ id: string }>();
  const calendar = useLoanCalendar(id);
  const copy = LOANS_COPY.calendar;
  const empty = calendar.loadFailed ? (
    <EmptyState icon="alert-circle-outline" title={LOANS_COPY.loadFailedTitle} message={LOANS_COPY.loadFailedMessage} actionLabel="Reintentar" onAction={calendar.refresh} />
  ) : (
    <EmptyState icon="calendar-outline" title={copy.empty} message="" />
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
        items={calendar.rows}
        loading={calendar.loading}
        refreshing={calendar.refreshing}
        onRefresh={calendar.refresh}
        empty={empty}
        header={
          <View className="bg-surface px-5 py-4">
            <AppText variant="small">{calendar.summary}</AppText>
          </View>
        }
      />
    </ScreenTemplate>
  );
}
