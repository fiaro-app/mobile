import { useRouter } from 'expo-router';
import { TurnstileWidget } from '@/components/molecules/TurnstileWidget';
import { RecoveryView } from '@/components/organisms/RecoveryView';
import { AuthTemplate } from '@/components/templates/AuthTemplate';
import { ACCESS_COPY } from '@/features/auth/content/access-messages';
import { usePasswordRecovery } from '@/features/auth/hooks/use-password-recovery';

/** Ruta `/forgot-password`: recuperar la contraseña con un código que llega al correo de contacto de la cuenta. */
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const recovery = usePasswordRecovery();
  const toLogin = () => {
    router.replace('/login');
  };
  return (
    <AuthTemplate>
      <RecoveryView
        step={recovery.step}
        texts={ACCESS_COPY.recovery}
        values={recovery.values}
        errors={recovery.errors}
        formError={recovery.formError}
        notice={recovery.notice}
        busy={recovery.busy}
        onField={recovery.setField}
        onSendCode={recovery.sendCode}
        onResend={recovery.resend}
        onReset={recovery.submitReset}
        onToLogin={toLogin}
        verification={<TurnstileWidget action="password-reset" resetKey={recovery.turnstileResetKey} onToken={recovery.setTurnstileToken} onError={recovery.turnstileError} />}
        onBack={() => {
          router.back();
        }}
      />
    </AuthTemplate>
  );
}
