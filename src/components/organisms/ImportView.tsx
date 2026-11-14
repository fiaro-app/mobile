import { ScrollView, View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';
import { Alert } from '@/components/molecules/Alert';
import { AlertBanner } from '@/components/molecules/AlertBanner';
import { LoadingDots } from '@/components/atoms/LoadingDots';

/** Lo que pasó con una fila de la hoja. */
export interface ImportViewItem {
  readonly sheetRow: number;
  readonly status: 'READY' | 'INVALID' | 'IMPORTED' | 'FAILED';
  readonly problems: readonly string[];
}

/** En qué paso va la importación. */
export type ImportViewState =
  | { readonly phase: 'idle'; readonly error: string | null }
  | { readonly phase: 'working'; readonly step: 'reading' | 'reviewing' | 'importing' }
  | { readonly phase: 'review'; readonly items: readonly ImportViewItem[] }
  | { readonly phase: 'done'; readonly items: readonly ImportViewItem[] };

/** Los textos de la pantalla; vienen de `IMPORTS_COPY` (los componentes de diseño no importan contenido, M-02). */
export interface ImportViewTexts {
  readonly intro: { readonly description: string; readonly steps: readonly string[]; readonly template: string; readonly pick: string };
  readonly working: Readonly<Record<'reading' | 'reviewing' | 'importing', string>>;
  readonly review: {
    readonly title: string;
    readonly ready: (count: number) => string;
    readonly invalid: (count: number) => string;
    readonly confirm: (count: number) => string;
    readonly cancel: string;
    readonly nothing: string;
  };
  readonly done: { readonly title: string; readonly summary: (imported: number, failed: number) => string; readonly again: string; readonly goToClients: string };
  readonly problems: { readonly title: string; readonly row: (sheetRow: number) => string };
}

export interface ImportViewProps {
  readonly texts: ImportViewTexts;
  readonly state: ImportViewState;
  readonly onPick: () => void;
  readonly onConfirm: () => void;
  readonly onReset: () => void;
  readonly onShareTemplate: () => void;
  readonly onGoToClients: () => void;
}

/** Las filas con errores o fallidas, con lo que pasa en cada una. */
function Problems({ items, texts }: Readonly<{ items: readonly ImportViewItem[]; texts: ImportViewTexts['problems'] }>) {
  const bad = items.filter((item) => item.status === 'INVALID' || item.status === 'FAILED');
  if (bad.length === 0) return null;
  return (
    <View className="gap-2">
      <AppText variant="title" accessibilityRole="header">
        {texts.title}
      </AppText>
      <View className="gap-px overflow-hidden rounded-md bg-surface">
        {bad.map((item) => (
          <View key={item.sheetRow} className="gap-1 px-4 py-3">
            <AppText variant="label">{texts.row(item.sheetRow)}</AppText>
            <AppText variant="small" tone="muted">
              {item.problems.join(' ')}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

/** «Importar desde Excel»: elegir el archivo, ver qué se importaría y confirmar. La lógica vive en `useImport`; aquí solo se pinta el estado en que va. */
export function ImportView({ texts: copy, state, onPick, onConfirm, onReset, onShareTemplate, onGoToClients }: Readonly<ImportViewProps>) {
  let body;
  if (state.phase === 'working') {
    body = (
      <View className="items-center gap-3 py-12">
        <LoadingDots />
        <AppText variant="body" tone="muted">
          {copy.working[state.step]}
        </AppText>
      </View>
    );
  } else if (state.phase === 'done') {
    const imported = state.items.filter((item) => item.status === 'IMPORTED').length;
    const failed = state.items.filter((item) => item.status === 'FAILED' || item.status === 'INVALID').length;
    body = (
      <>
        <AlertBanner message={`${copy.done.title}. ${copy.done.summary(imported, failed)}`} kind={failed > 0 ? 'warning' : undefined} />
        <Problems items={state.items} texts={copy.problems} />
        <Button label={copy.done.goToClients} onPress={onGoToClients} />
        <Button label={copy.done.again} variant="outline" onPress={onReset} />
      </>
    );
  } else if (state.phase === 'review') {
    const ready = state.items.filter((item) => item.status === 'READY').length;
    const invalid = state.items.length - ready;
    body = (
      <>
        <AppText variant="title" accessibilityRole="header">
          {copy.review.title}
        </AppText>
        <AlertBanner message={`${ready > 0 ? copy.review.ready(ready) : copy.review.nothing}${invalid > 0 ? ` · ${copy.review.invalid(invalid)}` : ''}`} />
        <Problems items={state.items} texts={copy.problems} />
        <Button label={copy.review.confirm(ready)} disabled={ready === 0} onPress={onConfirm} />
        <Button label={copy.review.cancel} variant="outline" onPress={onReset} />
      </>
    );
  } else {
    body = (
      <>
        {state.error ? <Alert message={state.error} /> : null}
        <AppText variant="body">{copy.intro.description}</AppText>
        <View className="gap-2">
          {copy.intro.steps.map((step) => (
            <AppText key={step} variant="small" tone="muted">
              {step}
            </AppText>
          ))}
        </View>
        <Button label={copy.intro.pick} onPress={onPick} />
        <Button label={copy.intro.template} variant="outline" onPress={onShareTemplate} />
      </>
    );
  }
  return (
    <ScrollView contentContainerClassName="gap-4 px-5 py-5 pb-10" keyboardShouldPersistTaps="handled">
      {body}
    </ScrollView>
  );
}
