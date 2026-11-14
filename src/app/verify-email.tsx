import { TextLink } from '@/components/atoms/TextLink';
import { TopBar } from '@/components/molecules/TopBar';
import { EditProfileForm } from '@/components/organisms/EditProfileForm';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { ACCOUNT_COPY } from '@/features/account/content/messages';
import { useProfileEditor } from '@/features/account/hooks/use-profile-editor';
import { completeSignOut } from '@/features/auth/store/session-actions';

/**
 * Ruta `/verify-email`: obligatoria para la dueña mientras no tenga un correo verificado. Reutiliza
 * el formulario de "Editar perfil"; no tiene flecha de volver, solo una salida: cerrar sesión.
 */
export default function VerifyEmailScreen() {
  const editor = useProfileEditor();
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
      <EditProfileForm {...editor} />
    </ScreenTemplate>
  );
}
