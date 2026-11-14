import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';
import { Alert } from '@/components/molecules/Alert';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { EmptyState } from '@/components/molecules/EmptyState';
import { TopBar } from '@/components/molecules/TopBar';
import { EntityList } from '@/components/organisms/EntityList';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { useSessions } from '@/features/account/hooks/use-sessions';
import { useGoBack } from '@/features/workspace/hooks/use-go-back';

/** Ruta `/account-sessions`: sesiones abiertas de la cuenta; cerrar una o todas las demás. */
export default function AccountSessionsScreen() {
  const goBack = useGoBack();
  const sessions = useSessions();
  const one = sessions.dialog.kind === 'one' ? sessions.dialog : null;
  const empty = sessions.loadFailed ? (
    <EmptyState icon="alert-circle-outline" title="No pudimos cargar tus sesiones" message="Revisa tu conexión e intenta de nuevo." actionLabel="Reintentar" onAction={sessions.refresh} />
  ) : (
    <EmptyState icon="phone-portrait-outline" title="Sin sesiones" message="" />
  );
  return (
    <ScreenTemplate
      topBar={
        <TopBar
          title="Sesiones abiertas"
          onBack={() => {
            goBack();
          }}
        />
      }
    >
      <EntityList
        items={sessions.rows.map((row) => ({
          id: row.id,
          title: row.device,
          subtitle: row.detail,
          detail: row.isCurrent ? undefined : 'Cerrar esta sesión',
          badge: row.isCurrent ? { label: 'ESTE TELÉFONO', kind: 'good' } : undefined,
          onPress: row.isCurrent
            ? undefined
            : () => {
                sessions.askOne(row);
              },
        }))}
        loading={sessions.loading}
        refreshing={sessions.refreshing}
        onRefresh={sessions.refresh}
        empty={empty}
        header={
          sessions.error || sessions.notice ? (
            <View className="gap-2 bg-surface px-5 py-3">
              {sessions.error ? <Alert message={sessions.error} /> : null}
              {sessions.notice ? <AppText variant="small" tone="primary">{sessions.notice}</AppText> : null}
            </View>
          ) : undefined
        }
      />
      {sessions.hasOthers ? (
        <View className="bg-surface px-5 py-4">
          <Button label="Cerrar las demás sesiones" variant="danger-outline" onPress={sessions.askOthers} disabled={sessions.busy} />
        </View>
      ) : null}
      <ConfirmDialog
        visible={sessions.dialog.kind !== 'none'}
        title={one ? '¿Cerrar esta sesión?' : '¿Cerrar las demás sesiones?'}
        message={one ? `Se cerrará la sesión de ${one.device}.` : 'Se cerrarán todas las sesiones salvo la de este teléfono.'}
        cancelLabel="Cancelar"
        confirmLabel="Cerrar"
        onCancel={sessions.cancel}
        onConfirm={sessions.confirm}
        destructive
        busy={sessions.busy}
      />
    </ScreenTemplate>
  );
}
