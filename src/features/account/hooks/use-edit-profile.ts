import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useController, useForm } from 'react-hook-form';
import { updateProfile } from '@/features/account/api/account-api';
import { ACCOUNT_COPY, accountFailureMessage } from '@/features/account/content/messages';
import { ProfileFormSchema, toProfileChanges, type ProfileFormValues } from '@/features/account/lib/profile-schemas';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { useSessionStore } from '@/features/auth/store/session-store';
import type { FieldProps } from '@/lib/forms/field-props';

/** Lo que el formulario "Editar perfil" necesita. */
export interface EditProfile {
  readonly fullName: FieldProps;
  readonly contactEmail: FieldProps;
  readonly submitting: boolean;
  readonly formError: string | null;
  readonly notice: string | null;
  readonly submit: () => void;
}

/**
 * Lógica de "Editar perfil": nombre y correo de contacto. Solo envía lo que cambió; si no cambió nada lo dice
 * sin llamar al API. Al guardar actualiza la sesión local (nombre, correo y si está verificado: cambiar el correo
 * reinicia su verificación) para que Perfil y el resto de la app lo muestren al instante.
 */
export function useEditProfile(): EditProfile {
  const user = useSessionStore((state) => state.user);
  const userUpdated = useSessionStore((state) => state.userUpdated);
  const current = { fullName: user?.fullName ?? '', contactEmail: user?.contactEmail ?? null };
  const { control, handleSubmit } = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
    mode: 'onTouched',
    defaultValues: { fullName: current.fullName, contactEmail: current.contactEmail ?? '' },
  });
  const name = useController({ control, name: 'fullName' });
  const email = useController({ control, name: 'contactEmail' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const bind = (controller: typeof name | typeof email): FieldProps => ({
    value: controller.field.value,
    error: controller.fieldState.error?.message ?? null,
    onChangeText: (text) => {
      setFormError(null);
      setNotice(null);
      controller.field.onChange(text);
    },
    onBlur: controller.field.onBlur,
  });

  const onValid = async (values: ProfileFormValues) => {
    const changes = toProfileChanges(values, current);
    if (!changes) {
      setNotice(ACCOUNT_COPY.nothingToSave);
      return;
    }
    setSubmitting(true);
    const result = await updateProfile(changes);
    setSubmitting(false);
    if (!result.ok) {
      signOutIfSessionExpired(result.failure);
      setFormError(accountFailureMessage(result.failure));
      return;
    }
    if (user) userUpdated({ ...user, fullName: result.value.fullName, contactEmail: result.value.contactEmail, contactEmailVerified: result.value.contactEmailVerified });
    setNotice(ACCOUNT_COPY.saved);
  };

  return {
    fullName: bind(name),
    contactEmail: bind(email),
    submitting,
    formError,
    notice,
    submit: () => {
      void handleSubmit(onValid)();
    },
  };
}
