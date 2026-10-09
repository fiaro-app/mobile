import { Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import {
  IBMPlexMono_500Medium,
} from '@expo-google-fonts/ibm-plex-mono';
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans';

/**
 * Fuentes del diseño (`font.display` Fraunces, `font.body` IBM Plex Sans, `font.mono` IBM Plex
 * Mono) que `useFonts` registra al arrancar. Las claves deben coincidir con los `--font-*` de
 * `src/global.css`: si se cambia una, hay que cambiar la otra.
 */
export const FONT_SOURCES = {
  Fraunces_700Bold,
  Fraunces_600SemiBold,
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
  IBMPlexMono_500Medium,
} as const;
