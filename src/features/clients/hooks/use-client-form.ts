import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useController, useForm } from 'react-hook-form';
import { formatPhoneInput } from '@/features/auth/lib/phone';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { createClient, updateClient } from '@/features/clients/api/clients-api';
import { CLIENTS_COPY, clientFailureMessage } from '@/features/clients/content/messages';
import { useClientQuery } from '@/features/clients/hooks/use-client-query';
import { ClientFormSchema, toClientChanges, type Client, type ClientFormValues } from '@/features/clients/lib/client-schemas';
import { displayPhone } from '@/features/collectors/lib/collector-view-model';
import type { FieldProps } from '@/lib/forms/field-props';

/** Todo lo que el formulario de cliente dibuja y puede hacer. */
export interface ClientForm {
  readonly editing: boolean;
  readonly loading: boolean;
  readonly notFound: boolean;
  readonly fullName: FieldProps;
  readonly nationalId: FieldProps;
  readonly phone: FieldProps;
  readonly occupation: FieldProps;
  readonly address: FieldProps;
  readonly submitting: boolean;
  readonly formError: string | null;
  readonly notice: string | null;
  readonly submit: () => void;
}

const EMPTY: ClientFormValues = { fullName: '', nationalId: '', phone: '', occupation: '', address: '' };

function valuesOf(client: Client | undefined): ClientFormValues {
  if (!client) return EMPTY;
  return { fullName: client.fullName, nationalId: client.nationalId, phone: displayPhone(client.phone), occupation: client.occupation, address: client.address };
}

/**
 * Lógica de "Registrar cliente" y "Editar cliente" (el mismo formulario). Al registrar se llama `onCreated` con el
 * cliente nuevo para ir a su ficha; al editar solo se envía lo que cambió y se actualiza la caché de la ficha. Una cédula
 * repetida (`CLIENT_NATIONAL_ID_TAKEN`) se explica en el mensaje del formulario.
 *
 * @param clientId - `id` del cliente a editar, o `undefined` para registrar uno nuevo.
 * @param onCreated - Se llama al registrar bien, con el cliente creado.
 */
export function useClientForm(clientId: string | undefined, onCreated: (client: Client) => void): ClientForm {
  const queryClient = useQueryClient();
  const existing = useClientQuery(clientId);
  const { control, handleSubmit } = useForm<ClientFormValues>({
    resolver: zodResolver(ClientFormSchema),
    mode: 'onTouched',
    values: valuesOf(existing.data),
    resetOptions: { keepDirtyValues: true },
  });
  const name = useController({ control, name: 'fullName' });
  const nationalId = useController({ control, name: 'nationalId' });
  const phone = useController({ control, name: 'phone' });
  const occupation = useController({ control, name: 'occupation' });
  const address = useController({ control, name: 'address' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const bind = (controller: typeof name | typeof nationalId | typeof phone | typeof occupation | typeof address, format?: (text: string) => string): FieldProps => ({
    value: controller.field.value,
    error: controller.fieldState.error?.message ?? null,
    onChangeText: (text) => {
      setFormError(null);
      setNotice(null);
      controller.field.onChange(format ? format(text) : text);
    },
    onBlur: controller.field.onBlur,
  });

  const onValid = async (values: ClientFormValues) => {
    const current = existing.data;
    const changes = current ? toClientChanges(values, current) : null;
    if (current && !changes) {
      setNotice(CLIENTS_COPY.form.nothingToSave);
      return;
    }
    setSubmitting(true);
    setFormError(null);
    const result = current && changes && clientId ? await updateClient(clientId, changes) : await createClient(values);
    setSubmitting(false);
    if (!result.ok) {
      signOutIfSessionExpired(result.failure);
      setFormError(clientFailureMessage(result.failure));
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ['admin', 'clients'] });
    if (current) {
      queryClient.setQueryData(['admin', 'client', clientId], result.value);
      setNotice(CLIENTS_COPY.form.saved);
      return;
    }
    onCreated(result.value);
  };

  return {
    editing: clientId !== undefined,
    loading: clientId !== undefined && existing.isPending,
    notFound: clientId !== undefined && existing.isError,
    fullName: bind(name),
    nationalId: bind(nationalId),
    phone: bind(phone, formatPhoneInput),
    occupation: bind(occupation),
    address: bind(address),
    submitting,
    formError,
    notice,
    submit: () => {
      void handleSubmit(onValid)();
    },
  };
}
