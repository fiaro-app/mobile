import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { useConfirmedSubmit } from '@/lib/hooks/use-confirmed-submit';
import { CONFIRM_COPY } from '@/lib/content/confirm-messages';
import { TopBar } from '@/components/molecules/TopBar';
import { EditProfileForm } from '@/components/organisms/EditProfileForm';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { ACCOUNT_COPY } from '@/features/account/content/messages';
import { useEditProfile } from '@/features/account/hooks/use-edit-profile';
import { useEmailVerification } from '@/features/account/hooks/use-email-verification';
import { useGoBack } from '@/features/workspace/hooks/use-go-back';

/** Ruta `/profile-edit`: cambiar el nombre y el correo de contacto, y verificar el correo. */
export default function EditProfileScreen() {
  const goBack = useGoBack();
  const form = useEditProfile();
  const confirm = useConfirmedSubmit(form.submit, CONFIRM_COPY.save);
  const email = useEmailVerification();
  return (
    <ScreenTemplate
      topBar={
        <TopBar
          title={ACCOUNT_COPY.editTitle}
          onBack={() => {
            goBack();
          }}
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
        onSubmit={confirm.ask}
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
      <ConfirmDialog {...confirm.dialog} />
    </ScreenTemplate>
  );
}
