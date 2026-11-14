import { TextLink } from '@/components/atoms/TextLink';
import { TopBar } from '@/components/molecules/TopBar';
import { EditProfileForm } from '@/components/organisms/EditProfileForm';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { ACCOUNT_COPY } from '@/features/account/content/messages';
import { useEditProfile } from '@/features/account/hooks/use-edit-profile';
import { useEmailVerification } from '@/features/account/hooks/use-email-verification';
import { completeSignOut } from '@/features/auth/store/session-actions';

/**
 * Ruta `/verify-email`: obligatoria para la dueña mientras no tenga un correo verificado. Reutiliza
 * el formulario de "Editar perfil" (agregar o corregir el correo y confirmarlo con el código); no
 * tiene flecha de volver, solo una salida: cerrar sesión.
 */
export default function VerifyEmailScreen() {
  const form = useEditProfile();
  const email = useEmailVerification();
  return (
    <ScreenTemplate
      topBar={
        <TopBar
          title={ACCOUNT_COPY.gateTitle}
          right={
            <TextLink
              label={ACCOUNT_COPY.gateSignOut}
              onPress={() => {
                void completeSignOut();
              }}
            />
          }
        />
      }
    >
      <EditProfileForm
        nameLabel={ACCOUNT_COPY.nameLabel}
        emailLabel={ACCOUNT_COPY.emailLabel}
        emailHint={ACCOUNT_COPY.emailHint}
        saveLabel={ACCOUNT_COPY.save}
        fullName={form.fullName}
        contactEmail={form.contactEmail}
        submitting={form.submitting}
        formError={form.formError}
        notice={form.notice}
        onSubmit={form.submit}
        verification={
          email.visible
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
            : null
        }
      />
    </ScreenTemplate>
  );
}
