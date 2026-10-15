import { useRouter } from 'expo-router';
import { Alert, Pressable, View } from 'react-native';
import { Avatar } from '@/components/atoms/Avatar';
import { Button } from '@/components/atoms/Button';
import { IconButton } from '@/components/atoms/IconButton';
import { BellButton } from '@/components/molecules/BellButton';
import { EmptyState } from '@/components/molecules/EmptyState';
import { TopBar } from '@/components/molecules/TopBar';
import { SyncBanner } from '@/components/molecules/SyncBanner';
import { ClientList } from '@/components/organisms/ClientList';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { bellLabel } from '@/features/notifications/content/messages';
import { useUnreadCount } from '@/features/notifications/hooks/use-notifications';
import { ROUTE_COPY } from '@/features/route/content/messages';
import { useRouteScreen } from '@/features/route/hooks/use-route-screen';
import { SETTLEMENT_COPY } from '@/features/settlement/content/messages';
import { syncBannerMessage } from '@/features/visit/content/sync-message';
import { useSyncStore } from '@/features/visit/queue/sync-store';

/** Ruta `/`: "Ruta de hoy", la pantalla principal del cobrador. */
export default function RouteScreen() {
  const router = useRouter();
  const openClient = (row: { id: string; clientId: string }) => {
    router.push({ pathname: '/client/[loanId]', params: { loanId: row.id, clientId: row.clientId } });
  };
  const pressRow = (row: { id: string; clientId: string; name: string; collectedLabel: string | null }) => {
    if (!row.collectedLabel) {
      openClient(row);
      return;
    }
    Alert.alert('Ya se le cobró hoy', `${row.name}: ${row.collectedLabel.toLowerCase()}. ¿Abrirlo de todos modos?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Abrir',
        onPress: () => {
          openClient(row);
        },
      },
    ]);
  };
  const screen = useRouteScreen();
  const unread = useUnreadCount().data ?? 0;
  const pending = useSyncStore((state) => state.pending);
  const rejected = useSyncStore((state) => state.rejected);
  const banner = syncBannerMessage(pending, rejected);
  return (
    <ScreenTemplate
      topBar={
        <TopBar
          title={ROUTE_COPY.routeTitle}
          right={
            <View className="flex-row items-center gap-1">
              <IconButton
                icon="search"
                label="Buscar clientes"
                onPress={() => {
                  router.push('/clients');
                }}
              />
              <BellButton
                label={bellLabel(unread)}
                unread={unread}
                onPress={() => {
                  router.push('/notifications');
                }}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Mi perfil"
                hitSlop={8}
                className="p-1 active:opacity-70"
                onPress={() => {
                  router.push('/profile');
                }}
              >
                <Avatar initials={screen.userInitials} size="sm" />
              </Pressable>
            </View>
          }
        />
      }
    >
      {banner ? <SyncBanner message={banner} /> : null}
      <ClientList
        items={screen.rows.map((row) => ({ ...row, onPress: () => {
            pressRow(row);
          } }))}
        loading={screen.loading}
        refreshing={screen.refreshing}
        onRefresh={screen.refresh}
        empty={<EmptyState {...screen.empty} onAction={screen.refresh} />}
      />
      <View className="border-t border-surface-2 bg-surface px-4 py-3">
        <Button
          label={SETTLEMENT_COPY.title}
          variant="outline"
          onPress={() => {
            router.push('/settlement');
          }}
        />
      </View>
    </ScreenTemplate>
  );
}
