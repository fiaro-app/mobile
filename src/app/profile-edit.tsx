import { useRouter } from 'expo-router';
import { TopBar } from '@/components/molecules/TopBar';
import { EditProfileForm } from '@/components/organisms/EditProfileForm';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { ACCOUNT_COPY } from '@/features/account/content/messages';
import { useEditProfile } from '@/features/account/hooks/use-edit-profile';
import { useEmailVerification } from '@/features/account/hooks/use-email-verification';

/** Ruta `/profile-edit`: cambiar el nombre y el correo de contacto, y verificar el correo. */
export default function EditProfileScreen() {
  const router = useRouter();
  const form = useEditProfile();
  const email = useEmailVerification();
  return (
    <ScreenTemplate
      topBar={
        <TopBar
          title={ACCOUNT_COPY.editTitle}
          onBack={() => {
            router.back();
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
