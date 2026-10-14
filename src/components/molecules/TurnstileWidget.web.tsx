import { useEffect, useRef } from 'react';
import { TURNSTILE_SCRIPT, type TurnstileWidgetProps } from '@/components/molecules/turnstile-props';
import { TURNSTILE_SITE_KEY } from '@/lib/config';

interface TurnstileApi {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  remove(widgetId: string): void;
}

/** Carga el script una sola vez por página, aunque haya varios widgets. */
let scriptLoad: Promise<TurnstileApi> | null = null;
function loadTurnstile(): Promise<TurnstileApi> {
  scriptLoad ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = TURNSTILE_SCRIPT;
    script.async = true;
    script.onload = () => {
      resolve((globalThis as unknown as { turnstile: TurnstileApi }).turnstile);
    };
    script.onerror = () => {
      scriptLoad = null;
      reject(new Error('turnstile script'));
    };
    document.head.append(script);
  });
  return scriptLoad;
}

/** Widget de Cloudflare Turnstile en la versión web de la app: se dibuja directo en la página, sin WebView. */
export function TurnstileWidget({ action, resetKey, onToken, onError }: Readonly<TurnstileWidgetProps>) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    let widgetId: string | null = null;
    let api: TurnstileApi | null = null;
    let cancelled = false;
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !container.current) return;
        api = turnstile;
        widgetId = turnstile.render(container.current, {
          sitekey: TURNSTILE_SITE_KEY,
          action,
          callback: (token: string) => {
            onToken(token);
          },
          'expired-callback': () => {
            onToken(null);
          },
          'error-callback': () => {
            onToken(null);
            onError();
            return true;
          },
        });
      })
      .catch(() => {
        onToken(null);
        onError();
      });
    return () => {
      cancelled = true;
      if (api && widgetId) api.remove(widgetId);
    };
  }, [action, resetKey, onToken, onError]);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={container} aria-label="Verificación de seguridad" style={{ minHeight: 65 }} />;
}
