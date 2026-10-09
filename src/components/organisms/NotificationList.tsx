import type { ReactNode } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { NotificationRow, type NotificationRowProps } from '@/components/molecules/NotificationRow';
import { ClientRowSkeleton } from '@/components/molecules/ClientRowSkeleton';

/** Una fila de la bandeja con su identificador estable. */
export interface NotificationListItem extends NotificationRowProps {
  readonly id: string;
}

export interface NotificationListProps {
  readonly items: readonly NotificationListItem[];
  readonly loading: boolean;
  readonly refreshing: boolean;
  readonly onRefresh: () => void;
  readonly empty: ReactNode;
}

const SKELETON_ROWS = [0, 1, 2, 3, 4];

function Divider() {
  return <View className="h-px bg-surface-2" />;
}

/** Bandeja de notificaciones: `FlatList` con jalar-para-actualizar, esqueleto de carga y un hueco para el estado vacío. */
export function NotificationList({ items, loading, refreshing, onRefresh, empty }: Readonly<NotificationListProps>) {
  if (loading) {
    return (
      <View className="flex-1">
        {SKELETON_ROWS.map((key) => (
          <View key={key}>
            <ClientRowSkeleton />
            <Divider />
          </View>
        ))}
      </View>
    );
  }
  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <NotificationRow {...item} />}
      ItemSeparatorComponent={Divider}
      ListEmptyComponent={<View className="flex-1">{empty}</View>}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerClassName={items.length === 0 ? 'flex-grow' : undefined}
    />
  );
}
