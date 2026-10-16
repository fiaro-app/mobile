import { EmptyState } from '@/components/molecules/EmptyState';
import { ClientDetailSkeleton } from '@/components/organisms/ClientDetailSkeleton';
import { SettingsView } from '@/components/organisms/SettingsView';
import { AdminTemplate } from '@/components/templates/AdminTemplate';
import { SETTINGS_COPY } from '@/features/settings/content/messages';
import { useSettingsScreen } from '@/features/settings/hooks/use-settings-screen';
import { WEEKDAYS, type Weekday } from '@/features/settings/lib/settings-schemas';
import { useAdminMenu } from '@/features/workspace/hooks/use-admin-menu';
import { MAX_PORTFOLIOS } from '@/features/settings/lib/portfolio-limit';

/** Ruta `/admin/settings`: configuración del negocio (nombre, color de marca, días sin cobro, carteras y plan). */
export default function SettingsScreen() {
  const menu = useAdminMenu('settings');
  const screen = useSettingsScreen();
  const copy = SETTINGS_COPY;

  let body = <ClientDetailSkeleton />;
  if (screen.loadFailed) {
    body = <EmptyState icon="alert-circle-outline" title={copy.loadFailedTitle} message={copy.loadFailedMessage} actionLabel="Reintentar" onAction={screen.refresh} />;
  } else if (!screen.loading) {
    const { business, brand, days, portfolios } = screen;
    const deleting = portfolios.deleting;
    body = (
      <SettingsView
        business={{ ...business, title: copy.business.title, label: copy.business.name, save: copy.business.save, onName: business.setName, onSave: business.save }}
        logo={{ title: copy.logo.title, hint: copy.logo.hint, error: screen.logo.error, notice: screen.logo.notice, logoUrl: screen.logo.logoUrl, emptyLabel: copy.logo.empty, chooseLabel: copy.logo.choose, removeLabel: copy.logo.remove, busy: screen.logo.busy, onChoose: screen.logo.choose, onRemove: screen.logo.askRemove }}
        removeLogoDialog={{ visible: screen.logo.confirmingRemove, title: copy.logo.removeTitle, message: copy.logo.removeMessage, cancelLabel: copy.logo.cancel, confirmLabel: copy.logo.removeConfirm, onCancel: screen.logo.cancelRemove, onConfirm: screen.logo.confirmRemove, destructive: true }}
        brand={{ ...brand, title: copy.brand.title, hint: copy.brand.hint, swatches: screen.swatches, save: copy.brand.save, reset: copy.brand.reset, onChoose: brand.choose, onSave: brand.save, onReset: brand.reset }}
        days={{
          ...days,
          title: copy.days.title,
          hint: copy.days.hint,
          weekdays: WEEKDAYS.map((day) => ({ ...day, checked: days.weekdays.includes(day.value) })),
          holidaysLabel: copy.days.holidays,
          holidays: days.skipHolidays,
          save: copy.days.save,
          onToggle: (day, checked) => {
            days.toggle(day as Weekday, checked);
          },
          onHolidays: days.setSkipHolidays,
          onSave: days.save,
        }}
        portfolios={{
          title: copy.portfolios.title,
          hint: copy.portfolios.hint,
          error: portfolios.error,
          notice: portfolios.notice,
          items: screen.portfolioItems,
          limitMessage: screen.portfolioItems.length >= MAX_PORTFOLIOS ? copy.portfolios.limit(MAX_PORTFOLIOS) : null,
          texts: { ...copy.portfolios, save: 'Guardar' },
          editing: portfolios.mode,
          name: portfolios.name,
          nameError: portfolios.nameError,
          busy: portfolios.busy,
          onName: portfolios.setName,
          onSubmit: portfolios.submitName,
          onCancel: portfolios.cancel,
          onCreate: portfolios.startCreate,
          onRename: (id) => {
            const target = screen.portfolioItems.find((item) => item.id === id);
            if (target) portfolios.startRename(target);
          },
          onDelete: (id) => {
            const target = screen.portfolioItems.find((item) => item.id === id);
            if (target) portfolios.startDelete(target);
          },
        }}
        plan={screen.plan ? { title: copy.plan.title, rows: screen.plan.rows, percent: screen.plan.collectorsPercent, notice: screen.plan.notice } : null}
        deleteDialog={{
          visible: deleting !== null,
          title: copy.portfolios.deleteTitle,
          message: copy.portfolios.deleteMessage(deleting?.name ?? ''),
          cancelLabel: copy.portfolios.cancel,
          confirmLabel: copy.portfolios.deleteConfirm,
          onCancel: portfolios.cancel,
          onConfirm: portfolios.confirmDelete,
          destructive: true,
        }}
      />
    );
  }
  return (
    <AdminTemplate title={copy.title} initials={menu.initials} drawer={menu.drawer} onMenu={menu.open} onAvatar={menu.goToAccount}>
      {body}
    </AdminTemplate>
  );
}
