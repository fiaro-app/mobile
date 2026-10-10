import { useEffect } from 'react';
import { ActivityIndicator, BackHandler, FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/atoms/AppText';
import { SearchField } from '@/components/atoms/SearchField';

export interface ClientPickerSheetProps {
  readonly visible: boolean;
  readonly title: string;
  readonly placeholder: string;
  readonly emptyText: string;
  readonly search: string;
  readonly onSearch: (text: string) => void;
  readonly options: readonly { value: string; label: string; description: string }[];
  readonly loading: boolean;
  readonly onSelect: (value: string) => void;
  readonly onClose: () => void;
}

/** Hoja inferior para elegir un cliente buscándolo por nombre o cédula (hasta 70 % de la pantalla). Capa dentro de la pantalla, no `Modal`. */
export function ClientPickerSheet(props: Readonly<ClientPickerSheetProps>) {
  const insets = useSafeAreaInsets();
  const { visible, onClose } = props;
  useEffect(() => {
    if (!visible) return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => {
      subscription.remove();
    };
  }, [visible, onClose]);
  if (!visible) return null;
  return (
    <View className="absolute inset-0 justify-end">
      <Pressable accessibilityLabel="Cerrar" className="absolute inset-0 bg-foreground/40" onPress={onClose} />
      <View className="max-h-[70%] gap-3 rounded-t-lg bg-surface px-5 pt-5" style={{ paddingBottom: insets.bottom + 12 }}>
        <AppText variant="title" accessibilityRole="header">
          {props.title}
        </AppText>
        <SearchField value={props.search} onChangeText={props.onSearch} placeholder={props.placeholder} />
        {props.loading ? <ActivityIndicator color="#3B3382" className="py-4" /> : null}
        {!props.loading && props.options.length === 0 ? <AppText variant="small">{props.emptyText}</AppText> : null}
        <FlatList
          data={props.options}
          keyExtractor={(item) => item.value}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable accessibilityRole="button" onPress={() => { props.onSelect(item.value); }} className="min-h-[52px] justify-center active:opacity-70">
              <AppText variant="label">{item.label}</AppText>
              <AppText variant="caption" tone="muted">
                {item.description}
              </AppText>
            </Pressable>
          )}
        />
      </View>
    </View>
  );
}
