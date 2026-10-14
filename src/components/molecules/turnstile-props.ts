/** Props comunes del widget de Cloudflare Turnstile en nativo (`TurnstileWidget.tsx`) y en web (`TurnstileWidget.web.tsx`). */
export interface TurnstileWidgetProps {
  /** Acción que el API compara con la respuesta de Siteverify (`register`). */
  readonly action: string;
  /** Al cambiar, se pide un desafío nuevo: cada token sirve una sola vez. */
  readonly resetKey: number;
  /** Token listo, o `null` cuando venció o falló. */
  readonly onToken: (token: string | null) => void;
  /** El widget no pudo cargar o el desafío falló. */
  readonly onError: () => void;
}

/** Script oficial de Turnstile, con render explícito: lo dibujamos nosotros cuando carga. */
export const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
