import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { cn } from '@/lib/cn';

/** Cómo va una revisión: esperando, aprobada o rechazada. */
export type ReviewKind = 'pending' | 'approved' | 'rejected';

const KIND_STYLE: Record<ReviewKind, { box: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  pending: { box: 'bg-warning/15', icon: 'time-outline', color: '#7A5106' },
  approved: { box: 'bg-success/10', icon: 'checkmark-circle-outline', color: '#106B32' },
  rejected: { box: 'bg-destructive/10', icon: 'close-circle-outline', color: '#AE3730' },
};

export interface ReviewNoticeProps {
  readonly kind: ReviewKind;
  readonly title: string;
  readonly message: string;
  /** Comentario de quien revisó, si dejó uno. */
  readonly comment?: string | null;
}

/** Aviso con el estado de algo enviado a revisión (ícono, título, mensaje y el comentario del revisor). */
export function ReviewNotice({ kind, title, message, comment }: Readonly<ReviewNoticeProps>) {
  const style = KIND_STYLE[kind];
  return (
    <View accessibilityRole="summary" className={cn('flex-row gap-3 rounded-md px-4 py-3', style.box)}>
      <Ionicons name={style.icon} size={22} color={style.color} />
      <View className="flex-1 gap-0.5">
        <AppText variant="label">{title}</AppText>
        <AppText variant="small">{message}</AppText>
        {comment ? <AppText variant="small">{`"${comment}"`}</AppText> : null}
      </View>
    </View>
  );
}
