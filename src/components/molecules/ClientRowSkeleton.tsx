import { View } from 'react-native';
import { Skeleton } from '@/components/atoms/Skeleton';

/** Fila de cliente "cargando": mismas medidas que `ClientRow`, para que nada salte al llegar los datos. */
export function ClientRowSkeleton() {
  return (
    <View className="h-[69px] flex-row items-center gap-3 bg-surface px-4">
      <Skeleton className="size-10 rounded-full" />
      <View className="flex-1 gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </View>
      <View className="items-end gap-2">
        <Skeleton className="h-[26px] w-[62px] rounded-full" />
        <Skeleton className="h-3 w-10" />
      </View>
    </View>
  );
}
