import { ScrollView, View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';
import { TextField } from '@/components/atoms/TextField';
import { Alert } from '@/components/molecules/Alert';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { FormField } from '@/components/molecules/FormField';
import { TopBar } from '@/components/molecules/TopBar';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { useDeactivateAccount } from '@/features/account/hooks/use-deactivate-account';
import { useGoBack } from '@/features/workspace/hooks/use-go-back';

/** Ruta `/account-deactivate`: desactivar la cuenta propia con la contraseña, como en «Mi cuenta» de la web. */
export default function AccountDeactivateScreen() {
  const goBack = useGoBack();
  const form = useDeactivateAccount();
  return (
    <ScreenTemplate topBar={<TopBar title="Desactivar mi cuenta" onBack={goBack} />}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-5 px-6 pb-8 pt-6">
        <AppText variant="body">Pierdes el acceso a Fiaro de inmediato. Tu historial se conserva. Confirma con tu contraseña.</AppText>
        {form.formError ? <Alert message={form.formError} /> : null}
        <FormField label="Contraseña" error={form.passwordError}>
          {(a11y) => (
            <TextField
              {...a11y}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              editable={!form.submitting}
              value={form.password}
              onChangeText={form.changePassword}
              invalid={Boolean(form.passwordError)}
              returnKeyType="done"
              onSubmitEditing={form.submit}
            />
          )}
        </FormField>
        <View>
          <Button label="Desactivar mi cuenta" variant="danger-outline" loading={form.submitting} onPress={form.submit} />
        </View>
      </ScrollView>
      <ConfirmDialog
        visible={form.confirming}
        title="¿Desactivar tu cuenta?"
        message="Pierdes el acceso a Fiaro de inmediato. Tu historial se conserva."
        cancelLabel="Cancelar"
        confirmLabel="Desactivar"
        destructive
        onCancel={form.cancel}
        onConfirm={form.confirm}
      />
    </ScreenTemplate>
  );
}
