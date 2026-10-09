import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { Avatar } from '@/components/atoms/Avatar';
import { Button } from '@/components/atoms/Button';
import { TopBar } from '@/components/molecules/TopBar';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { useProfileScreen } from '@/features/auth/hooks/use-profile-screen';

/**
 * Ruta `/profile`: perfil mínimo (nombre, celular y cerrar sesión). El diseño "Perfil / Cierre de
 * ruta" suma cerrar la ruta del día y las estadísticas, que llegan con sus propias pantallas.
 */
export default function ProfileScreen() {
  const router = useRouter();
  const profile = useProfileScreen();
  return (
    <ScreenTemplate
      topBar={
        <TopBar
          title="Perfil"
          onBack={() => {
            router.back();
          }}
        />
      }
    >
      <View className="items-center gap-3 px-6 pt-10">
        <Avatar initials={profile.initials} size="lg" />
        <AppText variant="title" accessibilityRole="header">
          {profile.fullName}
        </AppText>
        <AppText variant="mono" tone="muted">
          {profile.phone}
        </AppText>
        <Button label="Cerrar sesión" variant="outline" className="mt-8 w-full" onPress={profile.signOut} />
      </View>
    </ScreenTemplate>
  );
}
