import { useEffect } from 'react';
import { BackHandler, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/atoms/AppText';
import { Avatar } from '@/components/atoms/Avatar';

export interface DrawerItem {
  readonly key: string;
  readonly label: string;
  readonly active?: boolean;
  /** Pinta la etiqueta en rojo (cerrar sesión) o en el color de marca (cambiar de modo). */
  readonly tone?: 'default' | 'primary' | 'destructive';
  readonly onPress: () => void;
}

export interface AdminDrawerProps {
  readonly visible: boolean;
  readonly businessName: string;
  readonly subtitle: string;
  readonly userName: string;
  readonly userRole: string;
  readonly initials: string;
  readonly items: readonly DrawerItem[];
  readonly footerItems: readonly DrawerItem[];
  readonly onClose: () => void;
}

function Row({ item }: Readonly<{ item: DrawerItem }>) {
  let tone: 'default' | 'primary' | 'destructive' = 'default';
  if (item.tone === 'destructive') tone = 'destructive';
  else if (item.active || item.tone === 'primary') tone = 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: item.active === true }}
      onPress={item.onPress}
      className={`min-h-12 justify-center px-6 active:bg-surface-3 ${item.active ? 'bg-surface-2' : ''}`}
    >
      <AppText variant={item.active ? 'label' : 'body'} tone={tone}>
        {item.label}
      </AppText>
    </Pressable>
  );
}

/**
 * Menú lateral del modo administrador (300 px): nombre del negocio, la persona, las secciones y, abajo, el cambio
 * de modo, notificaciones y cerrar sesión. Es una capa DENTRO de la pantalla (no `Modal`, igual que las hojas) y
 * "atrás" de Android la cierra en vez de salir de la pantalla. Solo dibuja: lo que hace cada fila lo decide
 * `useAdminMenu`.
 */
export function AdminDrawer(props: Readonly<AdminDrawerProps>) {
  const insets = useSafeAreaInsets();
  const { visible, onClose } = props;

  useEffect(() => {
    if (!visible) return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => {
      subscription.remove();
    };
  }, [visible, onClose]);

  if (!visible) return null;
  return (
    <View className="absolute inset-0 flex-row">
      <View accessibilityViewIsModal className="w-[300px] bg-surface shadow-lg shadow-foreground/20" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <View className="gap-0.5 px-6 pb-4 pt-6">
          <AppText variant="title" tone="primary" accessibilityRole="header" numberOfLines={1}>
            {props.businessName}
          </AppText>
          <AppText variant="caption">{props.subtitle}</AppText>
        </View>
        <View className="flex-row items-center gap-3 border-y border-surface-2 px-6 py-4">
          <Avatar initials={props.initials} size="md" />
          <View className="flex-1">
            <AppText variant="label" numberOfLines={1}>
              {props.userName}
            </AppText>
            <AppText variant="caption" tone="muted">
              {props.userRole}
            </AppText>
          </View>
        </View>
        <ScrollView className="flex-1" contentContainerClassName="py-2">
          {props.items.map((item) => (
            <Row key={item.key} item={item} />
          ))}
          <View className="my-2 h-px bg-surface-2" />
          {props.footerItems.map((item) => (
            <Row key={item.key} item={item} />
          ))}
        </ScrollView>
      </View>
      <Pressable accessibilityLabel="Cerrar menú" className="flex-1 bg-foreground/40" onPress={onClose} />
    </View>
  );
}
