#!/usr/bin/env bash
# Abre la app en el emulador de Android Studio: arranca el emulador si no hay ninguno, espera a que
# termine de iniciar y reenvía el puerto del API (3040) para que `localhost` del teléfono llegue a
# este computador; también el de Metro (8081), donde está el código de la app.
set -euo pipefail

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
API_PORT="${API_PORT:-3040}"

# adb a veces se queda colgado al arrancar su servicio: mejor fallar con un mensaje que esperar sin fin.
if ! perl -e 'alarm 20; exec @ARGV' adb start-server >/dev/null 2>&1; then
  echo "adb no arrancó en 20 s. Prueba 'adb kill-server' o reinicia Android Studio, y vuelve a correr pnpm android." >&2
  exit 1
fi

if ! adb devices | grep -qE '\bdevice$'; then
  AVD="${AVD:-$(emulator -list-avds | head -n 1)}"
  if [ -z "$AVD" ]; then
    echo "No hay emuladores. Crea uno en Android Studio (Device Manager)." >&2
    exit 1
  fi
  echo "Arrancando el emulador $AVD..."
  nohup emulator -avd "$AVD" >/dev/null 2>&1 &
  adb wait-for-device
  until [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do sleep 2; done
fi

adb reverse "tcp:$API_PORT" "tcp:$API_PORT"
adb reverse tcp:8081 tcp:8081
exec npx expo start --android "$@"
