import { useRouter } from 'expo-router';
import { EmptyState } from '@/components/molecules/EmptyState';
import { ImportView } from '@/components/organisms/ImportView';
import { AdminTemplate } from '@/components/templates/AdminTemplate';
import { IMPORTS_COPY } from '@/features/imports/content/messages';
import { useImport } from '@/features/imports/hooks/use-import';
import { useShareTemplate } from '@/features/imports/hooks/use-share-template';
import { usePlanFeatures } from '@/features/settings/hooks/use-plan-features';
import { useAdminMenu } from '@/features/workspace/hooks/use-admin-menu';

/** Ruta `/admin/import`: importar clientes y préstamos en curso desde un .xlsx o .csv (Pro, Team y la prueba; Individual ve la invitación a subir de plan). */
export default function ImportScreen() {
  const router = useRouter();
  const menu = useAdminMenu('import');
  const { excelImport } = usePlanFeatures();
  const flow = useImport();
  const shareTemplate = useShareTemplate();
  const copy = IMPORTS_COPY;

  const body = excelImport ? (
    <ImportView
      texts={copy}
      state={flow.state}
      onPick={() => void flow.choose()}
      onConfirm={() => void flow.confirm()}
      onReset={flow.reset}
      onShareTemplate={() => void shareTemplate()}
      onGoToClients={() => {
        router.replace('/admin/clients');
      }}
    />
  ) : (
    <EmptyState
      icon="lock-closed-outline"
      title={copy.upgrade.title}
      message={copy.upgrade.message}
      actionLabel={copy.upgrade.action}
      onAction={() => {
        router.replace('/admin/plan');
      }}
    />
  );
  return (
    <AdminTemplate title={copy.title} initials={menu.initials} drawer={menu.drawer} onMenu={menu.open} onAvatar={menu.goToAccount}>
      {body}
    </AdminTemplate>
  );
}
