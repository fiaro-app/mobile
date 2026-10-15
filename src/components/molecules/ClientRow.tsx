import { Pressable, View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { Avatar } from '@/components/atoms/Avatar';
import { StatusChip, type ChipKind } from '@/components/atoms/StatusChip';

export interface ClientRowProps {
  readonly name: string;
  readonly initials: string;
  /** Saldo ya formateado (`$420.000`). */
  readonly balanceLabel: string;
  readonly status: ChipKind;
  /** Días de vencido ya formateados (`12 días`). */
  readonly daysLabel: string;
  /** `true` si el cliente está vencido: los días van en rojo. */
  readonly daysAlert: boolean;
  /** Si ya se le cobró hoy (`Cobrado hoy $X`): la fila se atenúa y lo dice en lugar de los días. */
  readonly collectedLabel?: string | null;
  readonly onPress?: () => void;
}

/**
 * Fila de cliente (69 px): avatar, nombre y saldo a la izquierda; chip de estado y días de vencido a
 * la derecha. El saldo y los días van en la fuente monoespaciada para que las cifras se alineen entre
 * filas. Recibe todo ya formateado: no sabe de pesos ni de reglas de mora.
 */
export function ClientRow({ name, initials, balanceLabel, status, daysLabel, daysAlert, collectedLabel, onPress }: Readonly<ClientRowProps>) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={`${name}. ${balanceLabel}. ${collectedLabel ?? daysLabel}`}
      disabled={!onPress}
      onPress={onPress}
      className={`h-[69px] flex-row items-center gap-3 bg-surface px-4 active:bg-surface-2${collectedLabel ? ' opacity-60' : ''}`}
    >
      <Avatar initials={initials} size="md" />
      <View className="flex-1 gap-0.5">
        <AppText variant="body" className="font-sans-medium" numberOfLines={1}>
          {name}
        </AppText>
        <AppText variant="mono">{`Saldo ${balanceLabel}`}</AppText>
      </View>
      <View className="items-end gap-1">
        <StatusChip kind={status} />
        <AppText variant="mono" tone={!collectedLabel && daysAlert ? 'destructive' : 'default'}>
          {collectedLabel ?? daysLabel}
        </AppText>
      </View>
    </Pressable>
  );
}
