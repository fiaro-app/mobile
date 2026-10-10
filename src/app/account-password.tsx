import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { TopBar } from '@/components/molecules/TopBar';
import { ChangePasswordForm } from '@/components/organisms/ChangePasswordForm';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { useAccountPassword } from '@/features/account/hooks/use-account-password';

const TEXTS = {
  title: 'Cambia tu contraseña',
  subtitle: 'Escribe la actual y elige una nueva',
  currentLabel: 'Contraseña actual',
  newLabel: 'Nueva contraseña',
  confirmLabel: 'Confirmar contraseña',
  hint: 'Mínimo 8 caracteres.',
  submit: 'Cambiar contraseña',
} as const;

/** Ruta `/account-password`: cambiar la contraseña desde el Perfil; al terminar vuelve atrás. */
export default function AccountPasswordScreen() {
  const router = useRouter();
  const form = useAccountPassword(() => {
    router.back();
  });
  return (
    <ScreenTemplate
      topBar={
        <TopBar
          title="Cambiar contraseña"
          onBack={() => {
            router.back();
          }}
        />
      }
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-6 pb-8 pt-6">
        <View>
          <ChangePasswordForm
            texts={TEXTS}
            currentPassword={form.currentPassword}
            newPassword={form.newPassword}
            confirmPassword={form.confirmPassword}
            submitting={form.submitting}
            formError={form.formError}
            onSubmit={form.submit}
          />
        </View>
      </ScrollView>
    </ScreenTemplate>
  );
}
