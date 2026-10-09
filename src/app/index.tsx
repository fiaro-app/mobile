import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Avatar } from '@/components/atoms/Avatar';
import { IconButton } from '@/components/atoms/IconButton';
import { EmptyState } from '@/components/molecules/EmptyState';
import { TopBar } from '@/components/molecules/TopBar';
import { SyncBanner } from '@/components/molecules/SyncBanner';
import { ClientList } from '@/components/organisms/ClientList';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { ROUTE_COPY } from '@/features/route/content/messages';
import { useRouteScreen } from '@/features/route/hooks/use-route-screen';
import { syncBannerMessage } from '@/features/visit/content/sync-message';
import { useSyncStore } from '@/features/visit/queue/sync-store';

/** Ruta `/`: "Ruta de hoy", la pantalla principal del cobrador. */
export default function RouteScreen() {
  const router = useRouter();
  const openClient = (row: { id: string; clientId: string }) => {
    router.push({ pathname: '/client/[loanId]', params: { loanId: row.id, clientId: row.clientId } });
  };
  const screen = useRouteScreen();
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
        items={screen.rows.map((row) => ({ ...row, onPress: () => openClient(row) }))}
        loading={screen.loading}
        refreshing={screen.refreshing}
        onRefresh={screen.refresh}
        empty={<EmptyState {...screen.empty} onAction={screen.refresh} />}
      />
    </ScreenTemplate>
  );
}
