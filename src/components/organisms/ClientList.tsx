import type { ReactNode } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { ClientRow, type ClientRowProps } from '@/components/molecules/ClientRow';
import { ClientRowSkeleton } from '@/components/molecules/ClientRowSkeleton';

/** Una fila lista para dibujar: sus datos más un identificador estable. */
export interface ClientListItem extends ClientRowProps {
  readonly id: string;
}

export interface ClientListProps {
  readonly items: readonly ClientListItem[];
  readonly loading: boolean;
  readonly refreshing: boolean;
  readonly onRefresh: () => void;
  /** Lo que se muestra cuando no hay filas (estado vacío o error). Solo se usa si `loading` es falso. */
  readonly empty: ReactNode;
  /** Contenido fijo sobre la lista que se va con ella al desplazar (por ejemplo, la barra de filtros). */
  readonly header?: ReactNode;
}

const SKELETON_ROWS = [0, 1, 2, 3, 4, 5];

function Divider() {
  return <View className="h-px bg-surface-2" />;
}

/**
 * Lista de clientes con jalar-para-actualizar, esqueleto de carga y un hueco para el estado vacío.
 * Usa `FlatList` (no un `map` dentro de `ScrollView`): dibuja solo las filas visibles, así una ruta
 * de cientos de clientes no pesa. La lista es la misma en "Ruta de hoy" y "Mis clientes".
 */
export function ClientList({ items, loading, refreshing, onRefresh, empty, header }: Readonly<ClientListProps>) {
  if (loading) {
    return (
      <View className="flex-1">
        {header}
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
      renderItem={({ item }) => <ClientRow {...item} />}
      ItemSeparatorComponent={Divider}
      ListHeaderComponent={<View>{header}</View>}
      ListEmptyComponent={<View className="flex-1">{empty}</View>}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="grow"
    />
  );
}
