import { View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { TURNSTILE_SCRIPT, type TurnstileWidgetProps } from '@/components/molecules/turnstile-props';
import { TURNSTILE_ORIGIN, TURNSTILE_SITE_KEY } from '@/lib/config';

/** Página mínima que dibuja el widget y devuelve el resultado a la app con `postMessage`. */
function widgetPage(siteKey: string, action: string): string {
  const options = JSON.stringify({ sitekey: siteKey, action });
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<script src="${TURNSTILE_SCRIPT}&onload=draw" async defer></script></head>
<body style="margin:0;display:flex;justify-content:center;background:transparent"><div id="w"></div><script>
function send(type, value) { window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, value: value })); }
function draw() {
  var options = ${options};
  options.callback = function (token) { send('token', token); };
  options['expired-callback'] = function () { send('expired'); };
  options['error-callback'] = function (code) { send('error', String(code)); return true; };
  turnstile.render('#w', options);
}
</script></body></html>`;
}

/**
 * Widget de Cloudflare Turnstile en iOS y Android. Cloudflare no tiene SDK nativo: se carga en un WebView con
 * `baseUrl` = `TURNSTILE_ORIGIN`, así el token sale a nombre de un dominio autorizado. Sin site key no dibuja nada.
 */
export function TurnstileWidget({ action, resetKey, onToken, onError }: Readonly<TurnstileWidgetProps>) {
  if (!TURNSTILE_SITE_KEY) return null;
  const onMessage = (event: WebViewMessageEvent) => {
    const message = JSON.parse(event.nativeEvent.data) as { type: string; value?: string };
    if (message.type === 'token' && message.value) {
      onToken(message.value);
      return;
    }
    onToken(null);
    if (message.type === 'error') onError();
  };
  return (
    <View className="h-[70px] w-full" accessibilityLabel="Verificación de seguridad">
      <WebView
        key={resetKey}
        source={{ html: widgetPage(TURNSTILE_SITE_KEY, action), baseUrl: TURNSTILE_ORIGIN }}
        originWhitelist={['*']}
        onMessage={onMessage}
        onError={() => {
          onToken(null);
          onError();
        }}
        scrollEnabled={false}
        style={{ backgroundColor: 'transparent' }}
      />
    </View>
  );
}
