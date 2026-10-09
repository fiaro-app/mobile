import { ChangePasswordForm } from '@/components/organisms/ChangePasswordForm';
import { AuthTemplate } from '@/components/templates/AuthTemplate';
import { AUTH_COPY } from '@/features/auth/content/messages';
import { useChangePasswordForm } from '@/features/auth/hooks/use-change-password-form';

/** Ruta `/change-password`: obligatoria mientras la contraseña sea temporal (`mustChangePassword`). */
export default function ChangePasswordScreen() {
  const form = useChangePasswordForm();
  return (
    <AuthTemplate>
      <ChangePasswordForm
        texts={{ ...AUTH_COPY.changePassword, signOut: 'Cerrar sesión' }}
        currentPassword={form.currentPassword}
        newPassword={form.newPassword}
        confirmPassword={form.confirmPassword}
        submitting={form.submitting}
        formError={form.formError}
        onSubmit={form.submit}
        onSignOut={form.onSignOut}
      />
    </AuthTemplate>
  );
}
