import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useController, useForm } from 'react-hook-form';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { inviteCollector } from '@/features/collectors/api/collectors-api';
import { COLLECTORS_COPY, collectorFailureMessage } from '@/features/collectors/content/messages';
import { usePortfolios } from '@/features/collectors/hooks/use-portfolios';
import { CollectorFormSchema, type CollectorFormValues } from '@/features/collectors/lib/collector-schemas';
import { formatPhoneInput } from '@/features/auth/lib/phone';
import { shareText } from '@/lib/share-text';
import type { FieldProps } from '@/lib/forms/field-props';

/** Resultado de registrar: a quién y con qué contraseña temporal (`null` si la persona ya tenía cuenta). */
export interface Registered {
  readonly name: string;
  readonly phone: string;
  readonly tempPassword: string | null;
}

/** Todo lo que el formulario "Registrar cobrador" dibuja y puede hacer. */
export interface CollectorForm {
  readonly fullName: FieldProps;
  readonly nationalId: FieldProps;
  readonly phone: FieldProps;
  readonly contactEmail: FieldProps;
  readonly portfolio: { readonly label: string; readonly value: string; readonly error: string | null; readonly options: readonly { value: string; label: string }[]; readonly select: (value: string) => void };
  readonly sheetOpen: boolean;
  readonly openSheet: () => void;
  readonly closeSheet: () => void;
  readonly submitting: boolean;
  readonly formError: string | null;
  readonly submit: () => void;
  readonly registered: Registered | null;
  readonly sharePassword: () => void;
}

/**
 * Lógica de "Registrar cobrador" (`POST /memberships` con rol COLLECTOR). La cartera se precarga con la de por
 * defecto. Al terminar se pasa a la vista "Cobrador registrado" con la contraseña temporal, que el API entrega
 * una sola vez: por eso se muestra en pantalla y se puede compartir de inmediato. Se refresca la lista de colaboradores.
 */
export function useCollectorForm(): CollectorForm {
  const queryClient = useQueryClient();
  const portfolios = usePortfolios();
  const defaultPortfolio = portfolios.data?.find((portfolio) => portfolio.isDefault)?.id ?? '';
  const { control, handleSubmit, setValue } = useForm<CollectorFormValues>({
    resolver: zodResolver(CollectorFormSchema),
    mode: 'onTouched',
    values: { fullName: '', nationalId: '', phone: '', contactEmail: '', portfolioId: defaultPortfolio },
    resetOptions: { keepDirtyValues: true },
  });
  const name = useController({ control, name: 'fullName' });
  const nationalId = useController({ control, name: 'nationalId' });
  const phone = useController({ control, name: 'phone' });
  const email = useController({ control, name: 'contactEmail' });
  const portfolioId = useController({ control, name: 'portfolioId' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [registered, setRegistered] = useState<Registered | null>(null);

  const bind = (controller: typeof name | typeof nationalId | typeof phone | typeof email, format?: (text: string) => string): FieldProps => ({
    value: controller.field.value,
    error: controller.fieldState.error?.message ?? null,
    onChangeText: (text) => {
      setFormError(null);
      controller.field.onChange(format ? format(text) : text);
    },
    onBlur: controller.field.onBlur,
  });

  const onValid = async (values: CollectorFormValues) => {
    setSubmitting(true);
    setFormError(null);
    const result = await inviteCollector(values);
    setSubmitting(false);
    if (!result.ok) {
      signOutIfSessionExpired(result.failure);
      setFormError(collectorFailureMessage(result.failure));
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ['members'] });
    setRegistered({ name: values.fullName, phone: values.phone, tempPassword: result.value.tempPassword });
  };

  const options = (portfolios.data ?? []).map((portfolio) => ({ value: portfolio.id, label: portfolio.name }));
  return {
    fullName: bind(name),
    nationalId: bind(nationalId),
    phone: bind(phone, formatPhoneInput),
    contactEmail: bind(email),
    portfolio: {
      label: options.find((option) => option.value === portfolioId.field.value)?.label ?? COLLECTORS_COPY.form.portfolioPlaceholder,
      value: portfolioId.field.value,
      error: portfolioId.fieldState.error?.message ?? null,
      options,
      select: (value) => {
        setValue('portfolioId', value, { shouldValidate: true, shouldDirty: true });
        setSheetOpen(false);
      },
    },
    sheetOpen,
    openSheet: () => {
      setSheetOpen(true);
    },
    closeSheet: () => {
      setSheetOpen(false);
    },
    submitting,
    formError,
    submit: () => {
      void handleSubmit(onValid)();
    },
    registered,
    sharePassword: () => {
      if (registered?.tempPassword) void shareText(COLLECTORS_COPY.registered.shareMessage(registered.name, registered.phone, registered.tempPassword));
    },
  };
}
