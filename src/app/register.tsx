import { useRouter } from 'expo-router';
import { Linking } from 'react-native';
import { TurnstileWidget } from '@/components/molecules/TurnstileWidget';
import { RegisterView } from '@/components/organisms/RegisterView';
import { AuthTemplate } from '@/components/templates/AuthTemplate';
import { ACCESS_COPY } from '@/features/auth/content/access-messages';
import { useRegisterForm } from '@/features/auth/hooks/use-register-form';
import { SITE_URL } from '@/lib/config';

/** Dónde está cada texto legal en la web. */
const LEGAL_PATHS = { terms: 'terminos', privacy: 'privacidad', cookies: 'cookies' } as const;

/** Ruta `/register`: registrar un negocio nuevo (dueño y empresa) en dos pasos; después se inicia sesión. */
export default function RegisterScreen() {
  const router = useRouter();
  const form = useRegisterForm();
  const toLogin = () => {
    router.replace('/login');
  };
  return (
    <AuthTemplate>
      <RegisterView
        step={form.step}
        texts={ACCESS_COPY.register}
        values={form.values}
        errors={form.errors}
        formError={form.formError}
        busy={form.busy}
        consents={form.consents}
        consentErrors={form.consentErrors}
        onConsent={form.setConsent}
        onOpenLegal={(document) => {
          void Linking.openURL(`${SITE_URL}/${LEGAL_PATHS[document]}`);
        }}
        onField={form.setField}
        onNext={form.next}
        onBack={form.back}
        onSubmit={form.submit}
        onToLogin={toLogin}
        onCancel={toLogin}
        verification={<TurnstileWidget action="register" resetKey={form.turnstileResetKey} onToken={form.setTurnstileToken} onError={form.turnstileError} />}
      />
    </AuthTemplate>
  );
}
