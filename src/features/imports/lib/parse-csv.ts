import type { Cell } from '@/features/imports/lib/parse-sheet';

/** Lo de un `.csv`: celdas separadas por coma o punto y coma, con comillas dobles para textos con separadores. */
export function parseCsv(text: string): Cell[][] {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/);
  const first = lines[0] ?? '';
  const separator = first.split(';').length > first.split(',').length ? ';' : ',';
  return lines
    .filter((line) => line.trim() !== '')
    .map((line) => {
      const cells: string[] = [];
      let current = '';
      let quoted = false;
      for (let i = 0; i < line.length; i += 1) {
        const char = line.charAt(i);
        if (char === '"' && quoted && line.charAt(i + 1) === '"') {
          current += '"';
          i += 1;
        } else if (char === '"') quoted = !quoted;
        else if (char === separator && !quoted) {
          cells.push(current);
          current = '';
        } else current += char;
      }
      cells.push(current);
      return cells;
    });
}
