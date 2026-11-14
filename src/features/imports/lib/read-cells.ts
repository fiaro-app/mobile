import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { readSheet } from 'read-excel-file/universal';
import { parseCsv } from '@/features/imports/lib/parse-csv';
import type { Cell } from '@/features/imports/lib/parse-sheet';

/** Lo que salió de elegir y leer un archivo: sus celdas, `format` si no es .xlsx/.csv, o `cancelled` si la persona no eligió. */
export type PickedCells = { readonly kind: 'cells'; readonly cells: Cell[][] } | { readonly kind: 'format' } | { readonly kind: 'cancelled' };

/**
 * Abre el selector de archivos del sistema y lee la hoja elegida: `.csv` como texto y `.xlsx` con `read-excel-file`.
 * El tipo se valida por la extensión porque Android y iOS reportan tipos MIME distintos para los mismos archivos.
 * Lanza si el archivo no se puede leer (dañado, con contraseña).
 */
export async function pickAndReadCells(): Promise<PickedCells> {
  const picked = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true, multiple: false });
  const asset = picked.assets?.[0];
  if (picked.canceled || !asset) return { kind: 'cancelled' };
  const name = asset.name.toLowerCase();
  const file = new File(asset.uri);
  if (name.endsWith('.csv')) return { kind: 'cells', cells: parseCsv(await file.text()) };
  if (!name.endsWith('.xlsx')) return { kind: 'format' };
  return { kind: 'cells', cells: (await readSheet(await file.arrayBuffer())) as Cell[][] };
}
