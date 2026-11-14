import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { Avatar } from '@/components/atoms/Avatar';
import { Button } from '@/components/atoms/Button';
import { StatusChip, type ChipKind } from '@/components/atoms/StatusChip';
import { HistoryRow, type HistoryRowProps } from '@/components/molecules/HistoryRow';
import { InfoRow } from '@/components/molecules/InfoRow';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface ClientDetailViewProps {
  readonly name: string;
  readonly initials: string;
  readonly status: ChipKind;
  readonly rows: readonly { readonly label: string; readonly value: string; readonly alert?: boolean }[];
  readonly history: readonly (HistoryRowProps & { readonly id: string })[];
  readonly historyTitle: string;
  readonly historyEmpty: string;
  readonly refreshing: boolean;
  readonly onRefresh: () => void;
  readonly callLabel: string;
  readonly onCall: () => void;
  readonly registerLabel: string;
  /** Sin esta función el botón de registrar visita no se muestra (préstamo ya cerrado). */
  readonly onRegister?: () => void;
  /** Contenido extra bajo los datos (la foto del cliente). */
  readonly extra?: ReactNode;
}

function Divider() {
  return <View className="h-px bg-surface-2" />;
}

/**
 * Detalle de un cliente (diseño "Detalle de cliente"): cabecera con avatar, nombre y estado; tarjeta de
 * datos; historial de visitas y, fija abajo, la barra con "Llamar" y "Registrar visita". Solo dibuja:
 * la información llega ya formateada desde `useClientDetail`. La barra de acciones respeta la zona segura inferior.
 */
export function ClientDetailView(props: Readonly<ClientDetailViewProps>) {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1">
      <ScrollView
        refreshControl={<RefreshControl refreshing={props.refreshing} onRefresh={props.onRefresh} />}
        contentContainerClassName="px-6 pb-6"
      >
        <View className="items-center gap-3 pb-5 pt-6">
          <Avatar initials={props.initials} size="xl" />
          <AppText variant="title" accessibilityRole="header">
            {props.name}
          </AppText>
          <StatusChip kind={props.status} />
        </View>
        <View className="overflow-hidden rounded-md bg-surface">
          {props.rows.map((row, index) => (
            <View key={row.label}>
              {index > 0 ? <Divider /> : null}
              <InfoRow {...row} />
            </View>
          ))}
        </View>
        {props.extra ? <View className="mt-6">{props.extra}</View> : null}
        <AppText variant="body" className="mb-3 mt-6 font-sans-semibold">
          {props.historyTitle}
        </AppText>
        <View className="overflow-hidden rounded-md bg-surface">
          {props.history.length === 0 ? (
            <AppText variant="small" tone="muted" className="p-5 text-center">
              {props.historyEmpty}
            </AppText>
          ) : (
            props.history.map((row, index) => (
              <View key={row.id}>
                {index > 0 ? <Divider /> : null}
                <HistoryRow {...row} />
              </View>
            ))
          )}
        </View>
      </ScrollView>
      <View className="flex-row gap-3 border-t border-surface-2 bg-background px-6 pt-5" style={{ paddingBottom: insets.bottom + 12 }}>
        <Button label={props.callLabel} variant="outline" className="flex-1" onPress={props.onCall} />
        {props.onRegister ? <Button label={props.registerLabel} className="flex-1" onPress={props.onRegister} /> : null}
      </View>
    </View>
  );
}
