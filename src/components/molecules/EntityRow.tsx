import { Pressable, View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { Avatar } from '@/components/atoms/Avatar';
import { Badge, type BadgeKind } from '@/components/atoms/Badge';

export interface EntityRowProps {
  /** Iniciales del avatar; sin ellas la fila no lleva avatar (préstamos, cuadres). */
  readonly initials?: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly detail?: string;
  /** Distintivo de estado arriba a la derecha. */
  readonly badge?: { readonly label: string; readonly kind: BadgeKind };
  /** Texto bajo el distintivo (una cifra, "2 préstamos"). */
  readonly trailing?: string;
  readonly onPress?: () => void;
}

/**
 * Fila de lista del administrador: avatar opcional, título con hasta dos líneas de apoyo y, a la derecha, un
 * distintivo de estado y un texto. Es la misma forma para cobradores, clientes, préstamos y cuadres: lo que cambia
 * es el contenido, no el diseño.
 */
export function EntityRow({ initials, title, subtitle, detail, badge, trailing, onPress }: Readonly<EntityRowProps>) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      className="min-h-[76px] flex-row items-center gap-3 bg-surface px-5 py-3 active:bg-surface-3"
    >
      {initials ? <Avatar initials={initials} size="md" /> : null}
      <View className="flex-1 gap-0.5">
        <AppText variant="label" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
        {detail ? (
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {detail}
          </AppText>
        ) : null}
      </View>
      {badge || trailing ? (
        <View className="items-end gap-1.5">
          {badge ? <Badge label={badge.label} kind={badge.kind} /> : null}
          {trailing ? (
            <AppText variant="caption" tone="muted">
              {trailing}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}
