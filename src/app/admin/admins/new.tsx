import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';
import { IconBadge } from '@/components/atoms/IconBadge';
import { SecretCard } from '@/components/molecules/SecretCard';
import { TopBar } from '@/components/molecules/TopBar';
import { AdminFormView } from '@/components/organisms/AdminFormView';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { ADMINS_COPY } from '@/features/admins/content/messages';
import { useAdminForm } from '@/features/admins/hooks/use-admin-form';
import { useGoBack } from '@/features/workspace/hooks/use-go-back';

/** Ruta `/admin/admins/new`: invitar a un administrador; al terminar muestra su contraseña temporal para compartirla. */
export default function NewAdminScreen() {
  const goBack = useGoBack();
  const form = useAdminForm();
  const copy = ADMINS_COPY;
  const back = () => {
    goBack();
  };

  if (form.invited) {
    const { invited } = form;
    return (
      <ScreenTemplate topBar={<TopBar title={copy.invited.title} onBack={back} />}>
        <View className="gap-5 px-5 pt-8">
          <View className="items-center gap-3">
            <IconBadge icon="checkmark-circle-outline" tone="success" />
            <AppText variant="body" className="text-center">
              {copy.invited.message(invited.name)}
            </AppText>
          </View>
          {invited.tempPassword ? (
            <SecretCard title={copy.invited.passwordTitle} secret={invited.tempPassword} hint={copy.invited.passwordHint} actionLabel={copy.invited.share} onAction={form.sharePassword} />
          ) : (
            <AppText variant="small" className="text-center">
              {copy.invited.existing}
            </AppText>
          )}
          <Button label={copy.invited.done} variant="outline" onPress={back} />
        </View>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate topBar={<TopBar title={copy.form.title} onBack={back} />}>
      <AdminFormView
        texts={copy.form}
        fullName={form.fullName}
        nationalId={form.nationalId}
        phone={form.phone}
        contactEmail={form.contactEmail}
        submitting={form.submitting}
        formError={form.formError}
        onSubmit={form.submit}
        onCancel={back}
      />
    </ScreenTemplate>
  );
}
