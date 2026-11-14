import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useController, useForm } from 'react-hook-form';
import { formatPhoneInput } from '@/features/auth/lib/phone';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { inviteAdmin } from '@/features/admins/api/admins-api';
import { ADMINS_COPY, adminFailureMessage } from '@/features/admins/content/messages';
import { AdminFormSchema, type AdminFormValues } from '@/features/admins/lib/admin-schemas';
import { shareText } from '@/lib/share-text';
import type { FieldProps } from '@/lib/forms/field-props';

/** Resultado de invitar: a quién y con qué contraseña temporal (`null` si la persona ya tenía cuenta). */
export interface Invited {
  readonly name: string;
  readonly phone: string;
  readonly tempPassword: string | null;
}

/** Todo lo que el formulario "Invitar administrador" dibuja y puede hacer. */
export interface AdminForm {
  readonly fullName: FieldProps;
  readonly nationalId: FieldProps;
  readonly phone: FieldProps;
  readonly contactEmail: FieldProps;
  readonly submitting: boolean;
  readonly formError: string | null;
  readonly submit: () => void;
  readonly invited: Invited | null;
  readonly sharePassword: () => void;
}

/**
 * Lógica de "Invitar administrador" (`POST /memberships` con rol LENDER). Al terminar se pasa a la vista con la
 * contraseña temporal, que el API entrega una sola vez: por eso se muestra en pantalla y se puede compartir de
 * inmediato. Se refresca la lista de colaboradores.
 */
export function useAdminForm(): AdminForm {
  const queryClient = useQueryClient();
  const { control, handleSubmit } = useForm<AdminFormValues>({
    resolver: zodResolver(AdminFormSchema),
    mode: 'onTouched',
    defaultValues: { fullName: '', nationalId: '', phone: '', contactEmail: '' },
  });
  const name = useController({ control, name: 'fullName' });
  const nationalId = useController({ control, name: 'nationalId' });
  const phone = useController({ control, name: 'phone' });
  const email = useController({ control, name: 'contactEmail' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [invited, setInvited] = useState<Invited | null>(null);

  const bind = (controller: typeof name | typeof nationalId | typeof phone | typeof email, format?: (text: string) => string): FieldProps => ({
    value: controller.field.value,
    error: controller.fieldState.error?.message ?? null,
    onChangeText: (text) => {
      setFormError(null);
      controller.field.onChange(format ? format(text) : text);
    },
    onBlur: controller.field.onBlur,
  });

  const onValid = async (values: AdminFormValues) => {
    setSubmitting(true);
    setFormError(null);
    const result = await inviteAdmin(values);
    setSubmitting(false);
    if (!result.ok) {
      signOutIfSessionExpired(result.failure);
      setFormError(adminFailureMessage(result.failure));
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ['members'] });
    setInvited({ name: values.fullName, phone: values.phone, tempPassword: result.value.tempPassword });
  };

  return {
    fullName: bind(name),
    nationalId: bind(nationalId),
    phone: bind(phone, formatPhoneInput),
    contactEmail: bind(email),
    submitting,
    formError,
    submit: () => {
      void handleSubmit(onValid)();
    },
    invited,
    sharePassword: () => {
      if (invited?.tempPassword) void shareText(ADMINS_COPY.invited.shareMessage(invited.name, invited.phone, invited.tempPassword));
    },
  };
}
