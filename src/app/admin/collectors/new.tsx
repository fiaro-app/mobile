import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';
import { IconBadge } from '@/components/atoms/IconBadge';
import { SecretCard } from '@/components/molecules/SecretCard';
import { TopBar } from '@/components/molecules/TopBar';
import { CollectorFormView } from '@/components/organisms/CollectorFormView';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { COLLECTORS_COPY } from '@/features/collectors/content/messages';
import { useCollectorForm } from '@/features/collectors/hooks/use-collector-form';

/** Ruta `/admin/collectors/new`: registrar un cobrador; al terminar muestra su contraseña temporal para compartirla. */
export default function NewCollectorScreen() {
  const router = useRouter();
  const form = useCollectorForm();
  const copy = COLLECTORS_COPY;
  const back = () => {
    router.back();
  };

  if (form.registered) {
    const { registered } = form;
    return (
      <ScreenTemplate topBar={<TopBar title={copy.registered.title} onBack={back} />}>
        <View className="gap-5 px-5 pt-8">
          <View className="items-center gap-3">
            <IconBadge icon="checkmark-circle-outline" tone="success" />
            <AppText variant="body" className="text-center">
              {copy.registered.message(registered.name)}
            </AppText>
          </View>
          {registered.tempPassword ? (
            <SecretCard title={copy.registered.passwordTitle} secret={registered.tempPassword} hint={copy.registered.passwordHint} actionLabel={copy.registered.share} onAction={form.sharePassword} />
          ) : (
            <AppText variant="small" className="text-center">
              {copy.registered.existing}
            </AppText>
          )}
          <Button label={copy.registered.done} variant="outline" onPress={back} />
        </View>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate topBar={<TopBar title={copy.register} onBack={back} />}>
      <CollectorFormView
        texts={copy.form}
        fullName={form.fullName}
        nationalId={form.nationalId}
        phone={form.phone}
        contactEmail={form.contactEmail}
        portfolio={form.portfolio}
        sheetOpen={form.sheetOpen}
        onOpenSheet={form.openSheet}
        onCloseSheet={form.closeSheet}
        submitting={form.submitting}
        formError={form.formError}
        onSubmit={form.submit}
        onCancel={back}
      />
    </ScreenTemplate>
  );
}
