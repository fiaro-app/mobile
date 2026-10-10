import { useRouter } from 'expo-router';
import { RegisterView } from '@/components/organisms/RegisterView';
import { AuthTemplate } from '@/components/templates/AuthTemplate';
import { ACCESS_COPY } from '@/features/auth/content/access-messages';
import { useRegisterForm } from '@/features/auth/hooks/use-register-form';

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
        onField={form.setField}
        onNext={form.next}
        onBack={form.back}
        onSubmit={form.submit}
        onToLogin={toLogin}
        onCancel={toLogin}
      />
    </AuthTemplate>
  );
}
