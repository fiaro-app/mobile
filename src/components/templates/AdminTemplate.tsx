import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/atoms/AppText';
import { Avatar } from '@/components/atoms/Avatar';
import { IconButton } from '@/components/atoms/IconButton';
import { AdminDrawer, type AdminDrawerProps } from '@/components/organisms/AdminDrawer';

export interface AdminTemplateProps {
  readonly title: string;
  readonly initials: string;
  readonly drawer: AdminDrawerProps;
  readonly onMenu: () => void;
  readonly onAvatar: () => void;
  /** Contenido extra a la derecha de la barra, antes del avatar (campana, filtros). */
  readonly right?: ReactNode;
  readonly children: ReactNode;
}

/**
 * Esqueleto de las pantallas del administrador: barra superior con el botón del menú (☰) a la izquierda y el
 * avatar a la derecha, el contenido y el menú lateral encima. La barra mide 64 px más la zona segura, como
 * `TopBar`.
 */
export function AdminTemplate({ title, initials, drawer, onMenu, onAvatar, right, children }: Readonly<AdminTemplateProps>) {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center bg-surface px-3" style={{ paddingTop: insets.top, height: 64 + insets.top }}>
        <IconButton icon="menu" label="Abrir menú" onPress={onMenu} />
        <AppText variant="title" accessibilityRole="header" className="flex-1" numberOfLines={1}>
          {title}
        </AppText>
        {right}
        <Pressable accessibilityRole="button" accessibilityLabel="Mi cuenta" hitSlop={8} className="p-1 active:opacity-70" onPress={onAvatar}>
          <Avatar initials={initials} size="sm" />
        </Pressable>
      </View>
      <View className="flex-1">{children}</View>
      <AdminDrawer {...drawer} />
    </View>
  );
}
