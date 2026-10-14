import { useRouter } from 'expo-router';
import { LoginForm } from '@/components/organisms/LoginForm';
import { AuthTemplate } from '@/components/templates/AuthTemplate';
import { AUTH_COPY } from '@/features/auth/content/messages';
import { useLoginForm } from '@/features/auth/hooks/use-login-form';

/** Ruta `/login`: conecta la lógica (`useLoginForm`) con el diseño (`LoginForm`). */
export default function LoginScreen() {
  const router = useRouter();
  const form = useLoginForm();
  return (
    <AuthTemplate>
      <LoginForm
        texts={AUTH_COPY.login}
        phone={form.phone}
        password={form.password}
        submitting={form.submitting}
        formError={form.formError}
        onSubmit={form.submit}
        onForgotPassword={() => {
          router.push('/forgot-password');
        }}
        register={{
          label: '¿Tu negocio es nuevo? Crear cuenta',
          onPress: () => {
            router.push('/register');
          },
        }}
      />
    </AuthTemplate>
  );
}
