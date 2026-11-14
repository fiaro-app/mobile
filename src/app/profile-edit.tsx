import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { useConfirmedSubmit } from '@/lib/hooks/use-confirmed-submit';
import { CONFIRM_COPY } from '@/lib/content/confirm-messages';
import { TopBar } from '@/components/molecules/TopBar';
import { EditProfileForm } from '@/components/organisms/EditProfileForm';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { ACCOUNT_COPY } from '@/features/account/content/messages';
import { useProfileEditor } from '@/features/account/hooks/use-profile-editor';
import { useGoBack } from '@/features/workspace/hooks/use-go-back';

/** Ruta `/profile-edit`: cambiar el nombre y el correo de contacto, y verificar el correo. */
export default function EditProfileScreen() {
  const goBack = useGoBack();
  const editor = useProfileEditor();
  const confirm = useConfirmedSubmit(editor.onSubmit, CONFIRM_COPY.save);
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
      <EditProfileForm {...editor} onSubmit={confirm.ask} />
      <ConfirmDialog {...confirm.dialog} />
    </ScreenTemplate>
  );
}
