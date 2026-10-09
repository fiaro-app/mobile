import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';
import { CenteredTemplate } from '@/components/templates/CenteredTemplate';
import { firstName } from '@/features/auth/lib/names';
import { completeSignOut } from '@/features/auth/store/session-actions';
import { useSessionStore } from '@/features/auth/store/session-store';

/**
 * Ruta `/`: la "Ruta del día". Es un marcador: la pantalla real (lista de clientes de la ruta) es
 * el siguiente paso del diseño "3 · Mobile · Cobrador". Existe para poder probar el ciclo completo
 * de acceso (entrar, bloquear, salir).
 */
export default function HomeScreen() {
  const user = useSessionStore((state) => state.user);
  return (
    <CenteredTemplate>
      <View className="w-full gap-6">
        <AppText variant="title" className="text-center" accessibilityRole="header">
          {`Hola, ${firstName(user?.fullName ?? '')}`}
        </AppText>
        <AppText className="text-center">Tu ruta del día aparecerá aquí.</AppText>
        <Button
          label="Cerrar sesión"
          variant="outline"
          onPress={() => {
            void completeSignOut();
          }}
        />
      </View>
    </CenteredTemplate>
  );
}
