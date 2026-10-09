import { Linking } from 'react-native';
import { StatusCard } from '@/components/molecules/StatusCard';
import { CenteredTemplate } from '@/components/templates/CenteredTemplate';
import type { BlockedKind } from '@/lib/blocked';
import type { Ionicons } from '@expo/vector-icons';

interface BlockedCopy {
  readonly icon: keyof typeof Ionicons.glyphMap;
  readonly tone: 'primary' | 'destructive';
  readonly title: string;
  readonly message: string;
  readonly action: string;
}

const COPY: Record<BlockedKind, BlockedCopy> = {
  offline: {
    icon: 'close',
    tone: 'destructive',
    title: 'Sin conexión a internet',
    message: 'No pudimos conectarnos al servidor. Revisa tu conexión e intenta de nuevo.',
    action: 'Reintentar',
  },
  maintenance: {
    icon: 'settings-sharp',
    tone: 'primary',
    title: 'Estamos en mantenimiento',
    message: 'Estamos mejorando la app para ti. Vuelve a intentarlo en unos minutos.',
    action: 'Reintentar',
  },
  'update-required': {
    icon: 'cloud-download-outline',
    tone: 'primary',
    title: 'Actualiza la app',
    message: 'Hay una versión nueva de Fiaro y esta ya no se puede usar. Descárgala para seguir cobrando.',
    action: 'Descargar actualización',
  },
};

export interface BlockedViewProps {
  readonly kind: BlockedKind;
  readonly downloadUrl: string | null;
  readonly retrying: boolean;
  readonly onRetry: () => void;
}

/**
 * Pantallas que reemplazan a la app cuando no se puede usar (diseños "Login — Sin conexión", "En
 * mantenimiento" y la de actualización obligatoria). La acción de "update-required" abre el enlace
 * de descarga del APK; las otras reintentan. A diferencia del diseño de mantenimiento, no muestra
 * "Tiempo estimado": el API no entrega ese dato (D-90).
 */
export function BlockedView({ kind, downloadUrl, retrying, onRetry }: Readonly<BlockedViewProps>) {
  const copy = COPY[kind];
  const download = () => {
    if (downloadUrl) void Linking.openURL(downloadUrl);
  };
  return (
    <CenteredTemplate>
      <StatusCard
        icon={copy.icon}
        tone={copy.tone}
        title={copy.title}
        message={copy.message}
        actionLabel={copy.action}
        actionLoading={kind !== 'update-required' && retrying}
        onAction={kind === 'update-required' ? download : onRetry}
      />
    </CenteredTemplate>
  );
}
