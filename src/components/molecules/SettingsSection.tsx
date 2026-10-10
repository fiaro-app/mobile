import type { ReactNode } from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { Alert } from '@/components/molecules/Alert';

export interface SettingsSectionProps {
  readonly title: string;
  readonly hint?: string;
  readonly error?: string | null;
  readonly notice?: string | null;
  readonly children: ReactNode;
}

/** Bloque de Configuración: título, ayuda, el contenido, y debajo el error o el aviso de guardado de ESA sección. */
export function SettingsSection({ title, hint, error, notice, children }: Readonly<SettingsSectionProps>) {
  return (
    <View className="gap-3 rounded-lg bg-surface p-5">
      <View className="gap-1">
        <AppText variant="title" accessibilityRole="header">
          {title}
        </AppText>
        {hint ? (
          <AppText variant="caption" tone="muted">
            {hint}
          </AppText>
        ) : null}
      </View>
      {children}
      {error ? <Alert message={error} /> : null}
      {notice ? (
        <AppText variant="small" tone="primary" accessibilityLiveRegion="polite">
          {notice}
        </AppText>
      ) : null}
    </View>
  );
}
