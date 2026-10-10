import { ScrollView, View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { Avatar } from '@/components/atoms/Avatar';
import { Badge, type BadgeKind } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { EntityRow, type EntityRowProps } from '@/components/molecules/EntityRow';
import { InfoRow } from '@/components/molecules/InfoRow';

export interface ClientProfileViewProps {
  readonly client: { readonly initials: string; readonly name: string; readonly nationalId: string; readonly badge: { readonly label: string; readonly kind: BadgeKind } };
  readonly info: readonly { readonly label: string; readonly value: string }[];
  readonly callLabel: string;
  readonly editLabel: string;
  readonly onCall: () => void;
  readonly onEdit: () => void;
  readonly notice: string | null;
  readonly loansTitle: string;
  readonly loansEmpty: string;
  readonly loans: readonly (EntityRowProps & { readonly id: string })[];
  readonly loansLoading: boolean;
  readonly newLoanLabel: string | null;
  readonly onNewLoan: () => void;
}

/** Ficha del cliente: cabecera con estado, datos de contacto, llamar/editar, sus préstamos y "Nuevo préstamo". Solo dibuja. */
export function ClientProfileView(props: Readonly<ClientProfileViewProps>) {
  return (
    <ScrollView contentContainerClassName="gap-5 px-5 pb-8 pt-5">
      <View className="gap-3 overflow-hidden rounded-lg bg-surface">
        <View className="flex-row items-center gap-4 px-5 pt-5">
          <Avatar initials={props.client.initials} size="xl" />
          <View className="flex-1 gap-1">
            <AppText variant="title" numberOfLines={2}>
              {props.client.name}
            </AppText>
            <Badge label={props.client.badge.label} kind={props.client.badge.kind} />
            <AppText variant="caption" tone="muted">
              {`CC ${props.client.nationalId}`}
            </AppText>
          </View>
        </View>
        <View className="mx-5 h-px bg-surface-2" />
        <View className="pb-2">
          {props.info.map((row) => (
            <InfoRow key={row.label} label={row.label} value={row.value} />
          ))}
        </View>
      </View>
      {props.notice ? <AppText variant="small">{props.notice}</AppText> : null}
      <View className="flex-row gap-3">
        <Button label={props.callLabel} variant="outline" className="flex-1" onPress={props.onCall} />
        <Button label={props.editLabel} variant="outline" className="flex-1" onPress={props.onEdit} />
      </View>
      <View className="gap-3">
        <AppText variant="title">{props.loansTitle}</AppText>
        {!props.loansLoading && props.loans.length === 0 ? <AppText variant="small">{props.loansEmpty}</AppText> : null}
        {props.loans.length > 0 ? (
          <View className="overflow-hidden rounded-lg">
            {props.loans.map((loan, index) => (
              <View key={loan.id}>
                {index > 0 ? <View className="h-px bg-surface-2" /> : null}
                <EntityRow {...loan} />
              </View>
            ))}
          </View>
        ) : null}
      </View>
      {props.newLoanLabel ? <Button label={props.newLoanLabel} onPress={props.onNewLoan} /> : null}
    </ScrollView>
  );
}
