import { ScrollView, View } from 'react-native';
import { TopBar } from '@/components/molecules/TopBar';
import { ChangePasswordForm } from '@/components/organisms/ChangePasswordForm';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { useAccountPassword } from '@/features/account/hooks/use-account-password';
import { useGoBack } from '@/features/workspace/hooks/use-go-back';

const TEXTS = {
  title: 'Cambia tu contraseña',
  subtitle: 'Escribe la actual y elige una nueva',
  currentLabel: 'Contraseña actual',
  newLabel: 'Nueva contraseña',
  confirmLabel: 'Confirmar contraseña',
  hint: 'Mínimo 15 caracteres. Sirve una frase fácil de recordar, como «la tienda abre a las seis».',
  submit: 'Cambiar contraseña',
} as const;

/** Ruta `/account-password`: cambiar la contraseña desde el Perfil; al terminar vuelve atrás. */
export default function AccountPasswordScreen() {
  const goBack = useGoBack();
  const form = useAccountPassword(() => {
    goBack();
  });
  return (
    <ScreenTemplate
      topBar={
        <TopBar
          title="Cambiar contraseña"
          onBack={() => {
            goBack();
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
