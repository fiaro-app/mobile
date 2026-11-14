import { ScrollView, View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';
import { ProgressBar } from '@/components/atoms/ProgressBar';
import { TextField } from '@/components/atoms/TextField';
import { TextLink } from '@/components/atoms/TextLink';
import { AlertBanner } from '@/components/molecules/AlertBanner';
import { ConfirmDialog, type ConfirmDialogProps } from '@/components/molecules/ConfirmDialog';
import { InfoRow } from '@/components/molecules/InfoRow';
import { SettingsSection } from '@/components/molecules/SettingsSection';
import { SwatchPicker } from '@/components/molecules/SwatchPicker';
import { ToggleRow } from '@/components/molecules/ToggleRow';
import { LogoSection, type LogoSectionProps } from '@/components/organisms/LogoSection';
import { PortfolioSection, type PortfolioSectionProps } from '@/components/organisms/PortfolioSection';

interface Status {
  readonly error: string | null;
  readonly notice: string | null;
  readonly busy: boolean;
  readonly dirty: boolean;
}

export interface SettingsViewProps {
  readonly business: Status & { readonly title: string; readonly label: string; readonly name: string; readonly save: string; readonly onName: (text: string) => void; readonly onSave: () => void };
  readonly brand: Status & { readonly title: string; readonly hint: string; readonly swatches: readonly { value: string; label: string }[]; readonly color: string; readonly save: string; readonly reset: string; readonly onChoose: (hex: string) => void; readonly onSave: () => void; readonly onReset: () => void };
  readonly days: Status & { readonly title: string; readonly hint: string; readonly weekdays: readonly { value: string; label: string; checked: boolean }[]; readonly holidaysLabel: string; readonly holidays: boolean; readonly save: string; readonly onToggle: (day: string, checked: boolean) => void; readonly onHolidays: (value: boolean) => void; readonly onSave: () => void };
  readonly logo: { readonly title: string; readonly hint: string; readonly error: string | null; readonly notice: string | null } & LogoSectionProps;
  readonly removeLogoDialog: Pick<ConfirmDialogProps, 'visible' | 'title' | 'message' | 'cancelLabel' | 'confirmLabel' | 'onCancel' | 'onConfirm' | 'destructive'>;
  readonly portfolios: { readonly title: string; readonly hint: string; readonly error: string | null; readonly notice: string | null } & PortfolioSectionProps;
  readonly plan: { readonly title: string; readonly renew: { readonly label: string; readonly onPress: () => void }; readonly rows: readonly { label: string; value: string }[]; readonly bars: readonly { label: string; value: string; percent: number }[]; readonly notice: { readonly kind: 'warning' | 'error'; readonly message: string } | null } | null;
  readonly deleteDialog: Pick<ConfirmDialogProps, 'visible' | 'title' | 'message' | 'cancelLabel' | 'confirmLabel' | 'onCancel' | 'onConfirm' | 'destructive'>;
}

/** Configuración del negocio: nombre, color de marca, días sin cobro, carteras y plan. Cada sección guarda por separado. Solo dibuja. */
export function SettingsView(props: Readonly<SettingsViewProps>) {
  const { business, brand, days, portfolios, plan, logo } = props;
  return (
    <View className="flex-1">
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-5 px-5 pb-8 pt-5">
        {plan?.notice ? <AlertBanner message={plan.notice.message} kind={plan.notice.kind} action={plan.renew} /> : null}
        <SettingsSection title={business.title} error={business.error} notice={business.notice}>
          <TextField accessibilityLabel={business.label} value={business.name} onChangeText={business.onName} invalid={business.error !== null} maxLength={120} editable={!business.busy} />
          <Button label={business.save} onPress={business.onSave} loading={business.busy} disabled={!business.dirty} />
        </SettingsSection>
        <SettingsSection title={logo.title} hint={logo.hint} error={logo.error} notice={logo.notice}>
          <LogoSection {...logo} />
        </SettingsSection>
        <SettingsSection title={brand.title} hint={brand.hint} error={brand.error} notice={brand.notice}>
          <SwatchPicker swatches={brand.swatches} selected={brand.color} onSelect={brand.onChoose} />
          <Button label={brand.save} onPress={brand.onSave} loading={brand.busy} disabled={!brand.dirty} />
          <View className="items-center">
            <TextLink label={brand.reset} onPress={brand.onReset} />
          </View>
        </SettingsSection>
        <SettingsSection title={days.title} hint={days.hint} error={days.error} notice={days.notice}>
          <View>
            {days.weekdays.map((day) => (
              <ToggleRow key={day.value} label={day.label} value={day.checked} onChange={(checked) => { days.onToggle(day.value, checked); }} disabled={days.busy} />
            ))}
            <ToggleRow label={days.holidaysLabel} value={days.holidays} onChange={days.onHolidays} disabled={days.busy} />
          </View>
          <Button label={days.save} onPress={days.onSave} loading={days.busy} disabled={!days.dirty} />
        </SettingsSection>
        <SettingsSection title={portfolios.title} hint={portfolios.hint} error={portfolios.error} notice={portfolios.notice}>
          <PortfolioSection {...portfolios} />
        </SettingsSection>
        {plan ? (
          <SettingsSection title={plan.title}>
            <View className="-mx-5">
              {plan.rows.map((row) => (
                <InfoRow key={row.label} label={row.label} value={row.value} />
              ))}
            </View>
            {plan.bars.map((bar) => (
              <View key={bar.label} className="gap-1">
                <ProgressBar percent={bar.percent} label={`${bar.label}: ${bar.value}`} />
                <AppText variant="caption" tone="muted">
                  {`${bar.label}: ${bar.value}`}
                </AppText>
              </View>
            ))}
            <Button label={plan.renew.label} variant="outline" onPress={plan.renew.onPress} />
          </SettingsSection>
        ) : null}
      </ScrollView>
      <ConfirmDialog {...props.deleteDialog} busy={portfolios.busy} />
      <ConfirmDialog {...props.removeLogoDialog} busy={logo.busy} />
    </View>
  );
}
