import { AppText } from '@/components/atoms/AppText';

/** Etiqueta de un campo (12 px, peso medio), encima del input. */
export function FieldLabel({ children, nativeID }: Readonly<{ children: string; nativeID?: string }>) {
  return (
    <AppText variant="caption" nativeID={nativeID}>
      {children}
    </AppText>
  );
}
