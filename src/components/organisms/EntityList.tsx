import type { ReactNode } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { ClientRowSkeleton } from '@/components/molecules/ClientRowSkeleton';
import { EntityRow, type EntityRowProps } from '@/components/molecules/EntityRow';

/** Una fila lista para dibujar, con su identificador estable. */
export interface EntityListItem extends EntityRowProps {
  readonly id: string;
}

export interface EntityListProps {
  readonly items: readonly EntityListItem[];
  readonly loading: boolean;
  readonly refreshing: boolean;
  readonly onRefresh: () => void;
  /** Lo que se muestra sin filas (vacío, sin resultados o error). Solo cuando no está cargando. */
  readonly empty: ReactNode;
  /** Contenido que se desplaza con la lista (búsqueda y filtros). */
  readonly header?: ReactNode;
  /** Espacio al final para que un botón flotante no tape la última fila. */
  readonly bottomSpace?: boolean;
}

const SKELETON_ROWS = [0, 1, 2, 3, 4, 5];

function Divider() {
  return <View className="h-px bg-surface-2" />;
}

/** Lista del administrador: `FlatList` con jalar-para-actualizar, esqueleto de carga y hueco para el estado vacío. Es la de cobradores, clientes, préstamos y cuadres. */
export function EntityList({ items, loading, refreshing, onRefresh, empty, header, bottomSpace }: Readonly<EntityListProps>) {
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
      renderItem={({ item }) => <EntityRow {...item} />}
      ItemSeparatorComponent={Divider}
      ListHeaderComponent={<>{header}</>}
      ListEmptyComponent={<>{empty}</>}
      ListFooterComponent={bottomSpace ? <View className="h-24" /> : null}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="grow"
    />
  );
}
