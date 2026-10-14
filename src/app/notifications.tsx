import { useRouter } from 'expo-router';
import { TextLink } from '@/components/atoms/TextLink';
import { EmptyState } from '@/components/molecules/EmptyState';
import { TopBar } from '@/components/molecules/TopBar';
import { NotificationList } from '@/components/organisms/NotificationList';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { NOTIFICATIONS_COPY } from '@/features/notifications/content/messages';
import { useNotificationsScreen } from '@/features/notifications/hooks/use-notifications-screen';
import { useGoBack } from '@/features/workspace/hooks/use-go-back';

/** Ruta `/notifications`: la bandeja de avisos; tocar uno lo marca como leído y, si aplica, lleva a su pantalla. */
export default function NotificationsScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const screen = useNotificationsScreen();
  const empty = screen.loadFailed ? (
    <EmptyState
      icon="alert-circle-outline"
      title={NOTIFICATIONS_COPY.loadFailedTitle}
      message={NOTIFICATIONS_COPY.loadFailedMessage}
      actionLabel="Reintentar"
      onAction={screen.refresh}
    />
  ) : (
    <EmptyState icon="notifications-off-outline" title={NOTIFICATIONS_COPY.emptyTitle} message={NOTIFICATIONS_COPY.emptyMessage} />
  );
  return (
    <ScreenTemplate
      topBar={
        <TopBar
          title={NOTIFICATIONS_COPY.title}
          onBack={() => {
            goBack();
          }}
          right={screen.hasUnread ? <TextLink label={NOTIFICATIONS_COPY.markAll} onPress={screen.markAll} /> : undefined}
        />
      }
    >
      <NotificationList
        items={screen.rows.map((row) => ({
          ...row,
          onPress: () => {
            const target = screen.open(row);
            if (target) router.push(target);
          },
        }))}
        loading={screen.loading}
        refreshing={screen.refreshing}
        onRefresh={screen.refresh}
        empty={empty}
      />
    </ScreenTemplate>
  );
}
