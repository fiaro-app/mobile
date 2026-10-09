import { useRouter } from 'expo-router';
import { StatusCard } from '@/components/molecules/StatusCard';
import { CenteredTemplate } from '@/components/templates/CenteredTemplate';

/**
 * Ruta `/forgot-password`. Por ahora informativa: el cobrador recibe su contraseña temporal del
 * Lender, así que quien se la puede restablecer es su administrador. La recuperación por código
 * (`POST /auth/request-password-reset`) exige un correo de contacto que un cobrador puede no
 * tener; se agrega cuando producto decida el flujo (ver ARCHITECTURE.md, M-12).
 */
export default function ForgotPasswordScreen() {
  const router = useRouter();
  return (
    <CenteredTemplate>
      <StatusCard
        icon="help-circle-outline"
        tone="primary"
        title="¿Olvidaste tu contraseña?"
        message="Habla con tu administrador: él puede darte una contraseña temporal para que vuelvas a entrar."
        actionLabel="Volver"
        onAction={() => {
          router.back();
        }}
      />
    </CenteredTemplate>
  );
}
