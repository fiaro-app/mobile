import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { Avatar } from '@/components/atoms/Avatar';
import { Button } from '@/components/atoms/Button';
import { MenuRow } from '@/components/molecules/MenuRow';
import { TopBar } from '@/components/molecules/TopBar';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { ACCOUNT_COPY } from '@/features/account/content/messages';
import { useProfileScreen } from '@/features/auth/hooks/use-profile-screen';

/** Ruta `/profile`: la persona, sus accesos (editar perfil, cuadre, estadísticas) y cerrar sesión. */
export default function ProfileScreen() {
  const router = useRouter();
  const profile = useProfileScreen();
  return (
    <ScreenTemplate
      topBar={
        <TopBar
          title={ACCOUNT_COPY.profileTitle}
          onBack={() => {
            router.back();
          }}
        />
      }
    >
      <ScrollView contentContainerClassName="pb-8">
        <View className="items-center gap-3 px-6 py-8">
          <Avatar initials={profile.initials} size="lg" />
          <AppText variant="title" accessibilityRole="header">
            {profile.fullName}
          </AppText>
          <AppText variant="mono" tone="muted">
            {profile.phone}
          </AppText>
        </View>
        <View className="gap-px bg-surface-2">
          <MenuRow
            icon="person-outline"
            label={ACCOUNT_COPY.editTitle}
            detail={profile.emailStatus}
            onPress={() => {
              router.push('/profile-edit');
            }}
          />
          <MenuRow
            icon="wallet-outline"
            label="Cuadre del día"
            onPress={() => {
              router.push('/settlement');
            }}
          />
          <MenuRow
            icon="stats-chart-outline"
            label="Estadísticas"
            onPress={() => {
              router.push('/stats');
            }}
          />
          <MenuRow
            icon="notifications-outline"
            label="Notificaciones"
            onPress={() => {
              router.push('/notifications');
            }}
          />
        </View>
        <View className="px-5 pt-8">
          <Button label="Cerrar sesión" variant="outline" onPress={profile.signOut} />
        </View>
      </ScrollView>
    </ScreenTemplate>
  );
}
