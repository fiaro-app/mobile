import { useCallback } from 'react';
import { Alert } from 'react-native';
import { IMPORTS_COPY } from '@/features/imports/content/messages';
import { templateCsv } from '@/features/imports/lib/parse-sheet';
import { shareFile } from '@/lib/files/share-file';

/** Comparte la plantilla `.csv` por la hoja del sistema (guardar en Archivos, WhatsApp, correo); si no se puede, avisa. */
export function useShareTemplate(): () => Promise<void> {
  return useCallback(async () => {
    const result = await shareFile(new TextEncoder().encode(templateCsv()), IMPORTS_COPY.intro.templateFile, 'text/csv');
    if (result !== 'shared') Alert.alert(IMPORTS_COPY.intro.templateFailed);
  }, []);
}
