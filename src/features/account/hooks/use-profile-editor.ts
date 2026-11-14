import { ACCOUNT_COPY } from '@/features/account/content/messages';
import { useEditProfile } from '@/features/account/hooks/use-edit-profile';
import { useEmailVerification } from '@/features/account/hooks/use-email-verification';

/**
 * Todo lo que el formulario de perfil (`EditProfileForm`) necesita: textos, campos, envío y la
 * sección de verificación del correo. Lo comparten "Editar perfil" y la pantalla obligatoria de
 * verificar el correo, que solo difieren en qué hacen al guardar (`onSubmit`).
 */
export function useProfileEditor() {
  const form = useEditProfile();
  const email = useEmailVerification();
  return {
    nameLabel: ACCOUNT_COPY.nameLabel,
    emailLabel: ACCOUNT_COPY.emailLabel,
    emailHint: ACCOUNT_COPY.emailHint,
    saveLabel: ACCOUNT_COPY.save,
    fullName: form.fullName,
    contactEmail: form.contactEmail,
    submitting: form.submitting,
    formError: form.formError,
    notice: form.notice,
    onSubmit: form.submit,
    verification: email.visible
      ? {
          title: ACCOUNT_COPY.verifyTitle,
          message: ACCOUNT_COPY.verifyMessage,
          codeSent: email.codeSent,
          codeLabel: ACCOUNT_COPY.codeLabel,
          code: email.code,
          sendLabel: email.codeSent ? ACCOUNT_COPY.resendCode : ACCOUNT_COPY.sendCode,
          verifyLabel: ACCOUNT_COPY.verify,
          busy: email.busy,
          error: email.error,
          notice: email.notice,
          onCode: email.setCode,
          onSend: email.sendCode,
          onVerify: email.verify,
        }
      : null,
  };
}
