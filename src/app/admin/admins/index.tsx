import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';
import { Fab } from '@/components/atoms/Fab';
import { Alert } from '@/components/molecules/Alert';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { EmptyState } from '@/components/molecules/EmptyState';
import { EntityList } from '@/components/organisms/EntityList';
import { OptionSheet } from '@/components/organisms/OptionSheet';
import { AdminTemplate } from '@/components/templates/AdminTemplate';
import { initials } from '@/features/auth/lib/names';
import { ADMINS_COPY } from '@/features/admins/content/messages';
import { useAdminsScreen } from '@/features/admins/hooks/use-admins-screen';
import { useAdminMenu } from '@/features/workspace/hooks/use-admin-menu';

/** Ruta `/admin/admins`: administradores del negocio; subir de rango a un colaborador, invitar a uno nuevo y quitar el rol o el acceso. */
export default function AdminsScreen() {
  const router = useRouter();
  const menu = useAdminMenu('admins');
  const screen = useAdminsScreen();
  const copy = ADMINS_COPY;
  const pending = screen.pending;

  let empty = <EmptyState icon="people-outline" title={copy.emptyTitle} message={copy.emptyMessage} />;
  if (screen.forbidden) {
    empty = <EmptyState icon="lock-closed-outline" title={copy.forbiddenTitle} message={copy.forbiddenMessage} />;
  } else if (screen.failed) {
    empty = <EmptyState icon="alert-circle-outline" title={copy.loadFailedTitle} message={copy.loadFailedMessage} actionLabel="Reintentar" onAction={screen.refresh} />;
  }

  return (
    <AdminTemplate title={copy.title} initials={menu.initials} drawer={menu.drawer} onMenu={menu.open} onAvatar={menu.goToAccount}>
      <EntityList
        items={screen.rows.map((row) => ({
          id: row.id,
          initials: initials(row.name),
          title: row.name,
          subtitle: row.phone,
          detail: row.roleLabel,
          badge: row.badge,
          onPress: row.action
            ? () => {
                screen.chooseAction(row);
              }
            : undefined,
        }))}
        loading={screen.loading}
        refreshing={screen.refreshing}
        onRefresh={screen.refresh}
        empty={empty}
        bottomSpace
        header={
          <View className="gap-3 bg-surface px-5 pb-4 pt-4">
            {screen.error ? <Alert message={screen.error} /> : null}
            {screen.notice ? (
              <AppText variant="small" tone="primary" accessibilityLiveRegion="polite">
                {screen.notice}
              </AppText>
            ) : null}
            {screen.promotable.length > 0 ? <Button label={copy.promote} variant="outline" onPress={screen.openSheet} /> : <AppText variant="caption" tone="muted">{copy.promoteNone}</AppText>}
          </View>
        }
      />
      {screen.forbidden ? null : (
        <Fab
          label={copy.invite}
          onPress={() => {
            router.push('/admin/admins/new');
          }}
        />
      )}
      <OptionSheet visible={screen.sheetOpen} title={copy.promoteSheet} options={screen.promotable} selected="" onSelect={screen.choosePromotion} onClose={screen.closeSheet} />
      <ConfirmDialog
        visible={pending !== null}
        title={pending ? copy.confirm[pending.kind].title : ''}
        message={pending ? copy.confirm[pending.kind].message(pending.name) : ''}
        cancelLabel={copy.confirm.cancel}
        confirmLabel={pending ? copy.confirm[pending.kind].confirm : ''}
        onCancel={screen.cancel}
        onConfirm={screen.confirm}
        destructive={pending?.kind === 'remove'}
        busy={screen.busy}
      />
    </AdminTemplate>
  );
}
