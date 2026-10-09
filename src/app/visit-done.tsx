import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusCard } from '@/components/molecules/StatusCard';
import { CenteredTemplate } from '@/components/templates/CenteredTemplate';
import { doneContentFor } from '@/features/visit/content/messages';

/**
 * Ruta `/visit-done?kind=sent|queued&paid=1|0`: confirmación tras registrar una visita. Distingue la visita
 * enviada de la que quedó guardada en el teléfono por falta de conexión.
 */
export default function VisitDoneScreen() {
  const router = useRouter();
  const { kind, paid } = useLocalSearchParams<{ kind: string; paid: string }>();
  const content = doneContentFor(kind === 'queued' ? 'queued' : 'sent', paid === '1');
  return (
    <CenteredTemplate>
      <StatusCard
        icon={content.icon}
        tone={content.icon === 'checkmark' ? 'success' : 'primary'}
        title={content.title}
        message={content.message}
        actionLabel="Volver a la ruta"
        onAction={() => {
          router.dismissAll();
          router.replace('/');
        }}
      />
    </CenteredTemplate>
  );
}
