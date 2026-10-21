# Arquitectura de la app móvil

Documento técnico de `fiaro-app/mobile`. Explica **por qué** está hecha así y las cosas de móvil que no son
obvias. Las decisiones llevan un código `M-xx` para poder referirse a ellas desde el código y los PR (igual que
las `D-xx` del API). El dominio y el producto están en [`api/PRODUCT.md`](https://github.com/fiaro-app/api/blob/dev/PRODUCT.md).

## 1. Stack y por qué

| Pieza | Elección | Por qué (y qué se descartó) |
|---|---|---|
| Framework | Expo SDK 57 (React Native 0.86, React 19, React Compiler) | Distribución por APK + OTA sin tiendas (ver README). El compilador de React evita escribir `useMemo`/`useCallback` a mano. |
| Rutas | Expo Router (`src/app/`) | Cada archivo es una pantalla; `Stack.Protected` esconde pantallas según el estado de acceso (M-05). |
| Estilos | **Uniwind** + Tailwind 4 | Misma sintaxis de clases y mismos nombres de token que la web. Se descartó NativeWind: su v5 (la que usa Tailwind 4) sigue en release candidate; Uniwind es estable y más rápido (M-01). |
| Estado de cliente | Zustand | Qué pantalla toca, si está desbloqueada. Ligero y testeable sin React. Igual que la web. |
| Estado de servidor | TanStack Query | Lo que viene del API y se puede volver a pedir (versión mínima, restaurar sesión): carga, error y reintento sin escribirlos a mano. |
| Formularios | react-hook-form + zod | Validación declarativa y "mientras se escribe" sin re-renderizar todo el formulario. |
| Autenticación | `better-auth` + `@better-auth/expo` | Es el mismo motor del API: el cliente ya sabe guardar la cookie de sesión y mandar `expo-origin` (M-06). |
| Secretos | `expo-secure-store` | Keychain (iOS) / Keystore (Android). Nunca `AsyncStorage` para cookies o PIN. |
| Huella / rostro | `expo-local-authentication` | API nativa del sistema; no se guarda ningún dato biométrico. |
| Fuentes | `@expo-google-fonts/*` | Fraunces (marca), IBM Plex Sans (cuerpo) e IBM Plex Mono, las del diseño. |

Versiones: se usa la última **estable**, no la más nueva (criterio del proyecto). `uniwind` está fijada en 1.12.1.

## 2. Estructura y reglas de dependencia (M-02, M-03)

```
src/
  app/          Rutas. Cada archivo es DELGADO: llama a un hook de lógica y pinta un organismo.
  components/   Diseño puro (Atomic Design): atoms → molecules → organisms → templates.
  features/     Lógica por dominio: auth/ y system/ (api, hooks, store, lib, schemas, content).
  providers/    AppShell (decide qué se ve) y el cliente de TanStack Query.
  lib/          Utilidades sin dominio: http, storage, tema, resultado, formularios.
  global.css    Tokens de diseño (colores, radios, tipografía).
```

La regla que más importa: **la lógica y el diseño no se mezclan**.

- `components/` solo recibe datos y callbacks por props. ESLint prohíbe que importe de `features/`, `providers/`
  o `app/`. Por eso un componente se puede cambiar de aspecto (o rehacer cuando cambie el diseño de Penpot) sin
  tocar nada de lógica, y se puede reutilizar en otra pantalla.
- `features/*/hooks` contiene toda la lógica de una pantalla y devuelve un objeto con exactamente lo que el
  diseño necesita (`FieldProps`, `PinEntry`...). No importan componentes.
- `src/app/*.tsx` es el único sitio donde se unen: `const form = useLoginForm(); return <LoginForm {...form} />`.
- Imports siempre con el alias `@/` (nunca `./` ni `../`) y archivos de máximo 200 líneas: ambos los
  hace cumplir ESLint (`eslint.config.js`).
- Los servicios devuelven `Result<T, Fallo>` (`lib/result.ts`) en vez de lanzar excepciones: el compilador
  obliga a decidir qué hacer con cada fallo y las pantallas no necesitan `try/catch`.

## 3. Cómo está hecho el diseño (lo que no es obvio si vienes de web)

- **No existe el hover.** Un dedo no "pasa por encima". El estado equivalente es *presionado* (`active:`), que aquí
  baja la opacidad. El foco de teclado casi no se usa; sí el foco del campo de texto (borde de marca).
- **Zonas seguras (`safe area`).** Los teléfonos tienen muescas y barras de gestos. Las plantillas
  (`AuthTemplate`, `CenteredTemplate`, `PinTemplate`) suman `useSafeAreaInsets()` al relleno. Si dibujas una
  pantalla nueva sin plantilla, el contenido quedará debajo de la muesca.
- **El teclado tapa la pantalla.** `AuthTemplate` usa `KeyboardAvoidingView` + `ScrollView` con
  `keyboardShouldPersistTaps="handled"`: sin ese último ajuste, el primer toque sobre un botón con el teclado
  abierto solo cierra el teclado y el cobrador tendría que tocar dos veces.
- **Tamaño táctil.** Mínimo ~44 px (iOS) / 48 dp (Android). Los botones miden 48 px; los enlaces de texto
  amplían su zona con `hitSlop` sin cambiar cómo se ven; las teclas del PIN miden 72 px porque se usan con una mano
  y de pie en la calle.
- **Fuentes: una por peso.** En React Native `font-bold` no sirve con fuentes propias: cada peso es una fuente
  distinta registrada con su nombre (`Fraunces_700Bold`...). Por eso hay clases `font-display`,
  `font-sans-medium`, etc. (`global.css`) y el único componente de texto es `AppText` con `variant`. Los nombres
  de `global.css` deben coincidir con `lib/theme/fonts.ts`.
- **Tokens.** Los colores, radios y tamaños de `global.css` salen de Penpot › "1 · Fundamentos" y tienen los
  mismos nombres que la web (`bg-primary`, `text-destructive`, `rounded-md`...). No se escriben colores sueltos
  en clases. Excepción: los íconos de `@expo/vector-icons` no aceptan clases y llevan el hex (documentado en
  `IconBadge`).
- **Color de marca por Lender.** `applyBrandColor(hex)` cambia `--color-primary` en ejecución con
  `Uniwind.updateCSSVariables` (por eso las variables viven en `@theme` y no en `@variant`). Todavía no hay campo
  en el API que lo alimente (D-102 del backend); el mecanismo ya existe y está probado.
- **Solo tema claro**, igual que el diseño (`userInterfaceStyle: "light"`).
- **Accesibilidad.** Cada control lleva `accessibilityRole`/`Label`; los errores `accessibilityRole="alert"` con
  `liveRegion` para que TalkBack/VoiceOver los lean al aparecer; los campos se unen a su etiqueta con
  `accessibilityLabelledBy` (`FormField`).

## 4. Acceso, sesión y PIN (M-05 a M-08)

### Estados de acceso

`features/auth/lib/access.ts` es una función pura que, a partir de `{ready, user, pinEnabled, unlocked,
pinOfferPending}`, devuelve **un** estado, y `AppShell` muestra solo las pantallas de ese estado:

```
booting ──► signed-out ──login──► (cambio de contraseña) ──► (oferta de PIN) ──► signed-in
   │              ▲                       must-change-password      offer-pin
   └─► locked ────┘  (PIN agotado / "usar contraseña")
```

Ninguna pantalla navega "a mano" tras entrar o salir: cambia el estado y `Stack.Protected` redirige. Así
es imposible llegar a una pantalla protegida con la URL (en web) o con un enlace profundo.
Orden de prioridad: con PIN y sin desbloquear **siempre** gana `locked`; la oferta de PIN va después del cambio de
contraseña temporal para no pedir dos cosas a la vez.

### Cookie de sesión (M-06)

El API usa cookies de better-auth (no tokens en el cuerpo). React Native no tiene "jar" de cookies, así que
`expoClient` guarda la cookie en SecureStore y la reenvía en cada petición. Dos detalles que rompen si se
cambian:

- `cookiePrefix: 'fiaro'` debe ser igual a `SESSION_COOKIE_PREFIX` del API; con otro, el cliente no reconoce la
  cookie y nunca la guarda.
- El API valida el origen: la app manda `expo-origin: mobile://` (el `scheme` de `app.json`) y debe estar en
  `MOBILE_APP_SCHEMES` del API (por defecto `mobile`). Cambiar el `scheme` exige cambiar esa variable.
- La sesión dura 30 días y el API la renueva sola con el uso; al cerrar sesión se borra la cookie local **aunque
  no haya red** (`signOut` en `auth-api.ts`).

### PIN y huella (M-07)

El API **no tiene** concepto de PIN: es un bloqueo local de la app que protege la sesión ya guardada.

- Se guarda el hash (SHA-256 con sal aleatoria) en SecureStore, nunca el PIN. Aun así, 4 dígitos son 10.000
  combinaciones: la defensa real es el **contador de intentos** (5; al agotarlo se borra el PIN y se pide
  celular y contraseña) y que el hash viva en el Keychain/Keystore.
- La huella desbloquea sin PIN pero **no** reemplaza la sesión: si la sesión venció en el servidor, al arrancar se
  borra el PIN y se vuelve al login (`bootSession`).
- "Ahora no" al crear el PIN se recuerda para no insistir; cerrar sesión borra PIN y esa decisión (otra persona
  puede usar el teléfono).

### Puerta de versión y estados de bloqueo (M-08)

Al abrir la app, antes de cualquier pantalla: `GET /mobile/version` → si la versión instalada es menor que
`minimumSupportedVersion` se muestra "Actualiza la app" (el README ya lo exigía). Sin red o con el API en
mantenimiento (503 `MAINTENANCE`) se muestra su tarjeta con "Reintentar". La puerta va primero a propósito: con
una versión sin soporte ni se intenta leer la sesión.

## 5. Contrato con el API y qué se copió

`@fiaro-app/contracts` es privado (GitHub Packages) y **todavía no está instalado aquí**. Mientras tanto hay
copias mínimas, cada una con TSDoc que lo dice: `toMobileE164` (`features/auth/lib/phone.ts`), `MobileVersionSchema`
y `compareVersions` (`features/system/lib/version.ts`) y los códigos de error que la app reconoce
(`auth-failure.ts`). **Pendiente (M-11):** instalar el paquete (`NODE_AUTH_TOKEN=$(gh auth token) pnpm add
@fiaro-app/contracts`) y reemplazar las copias por imports; el CI ya necesita el mismo paso que la web
(`registry-url` + `packages: read`).

La app reacciona al **`code`** estable del error, nunca al texto del mensaje (el API lo traduce y puede cambiarlo).

## 5b. Ruta del día y Mis clientes (M-13, M-14)

La ruta sale de `QUERY /collectors/me/route` (D-88): un préstamo por fila con `balance`, `overdueAmount`,
`overdueDays` y `nextDueDate`. Cosas que no son obvias:

- **Método `QUERY`.** El API usa este método HTTP (búsqueda con cuerpo, sin efectos secundarios) en varias
  rutas. `authedRequest` (`lib/http/authed-request.ts`) lo soporta y manda la cookie a mano
  (`authClient.getCookie()`) más `expo-origin`; en web lo hace el navegador. **No hace falta axios**: se leyó el código nativo
  de React Native 0.86 y ningún camino bloquea el método. iOS (`RCTNetworking.mm`) asigna `request.HTTPMethod` tal cual
  (en mayúsculas); Android (`NetworkingModule.kt`) solo descarta el cuerpo para `GET` y `HEAD` y pasa el resto a
  `OkHttp Request.Builder.method(...)`, que acepta `QUERY` con cuerpo; el `fetch` de RN (whatwg-fetch) no toca un método
  que no conoce; y axios usa el mismo `XMLHttpRequest` nativo, así que no cambia nada. Además está probado con el API real
  y en Jest, y **verificado de punta a punta en los dos sistemas** (2026-10-09): en el simulador de iOS el `fetch` nativo
  (CFNetwork) llegó al API como `QUERY` con cuerpo JSON, y en el emulador de Android (OkHttp 4.12) la ruta del día cargó
  con 200 tras iniciar sesión (los logs del API muestran el método y el agente de cada plataforma). No se ha corrido en
  un teléfono físico: si algo fallara allí, llegaría como "sin conexión".
- **Estado conservado.** `useRoute` lanza un error cuando el servicio falla, a propósito: así TanStack Query
  conserva la última ruta buena en `data` y un refresco sin red NO borra la lista. Un 401 cierra la sesión local.
- **M-13: ATRASO vs MORA (regla compartida con la web).** El API solo da días (`overdueDays`). Regla confirmada por
  producto el 2026-10-09 y **idéntica en web y móvil**: saldo `0` = PAGADO (`paid`); `0` días = AL DÍA (`current`, aunque
  haya una cuota que vence hoy); `1-7` días = ATRASO (`late`); `>7` = MORA (`delinquent`). Los nombres de estado son los
  del `StatusChip` de la web. La fuente única es `overdueStatus` / `LATE_MAX_DAYS` en `@fiaro-app/contracts` (PR
  en ese repo); mientras el paquete no esté instalado aquí hay una copia en `features/route/lib/entry-status.ts`,
  marcada con TSDoc. La frontera de 7 días coincide con el primer rango del dashboard (0-7, 8-15, 16-30, 30+, D-100).
- **M-14: "Mis clientes" es un filtro local.** El API no tiene un listado de clientes del cobrador (solo su
  ruta); la búsqueda, las pastillas y el rango se aplican en el teléfono sobre la misma lista
  (`lib/client-filter.ts`). Los filtros son estado de pantalla (`useState`), no Zustand.
- La lista usa `FlatList` (dibuja solo lo visible) con jalar-para-actualizar y esqueleto de carga. El selector de
  rango es una hoja superpuesta (`OptionSheet`), no el `Modal` de React Native, que lanza una advertencia en la vista
  web de desarrollo.
- **Pruebas con datos.** Para ver la ruta con filas se crearon en la base de desarrollo cuatro clientes de prueba
  asignados a Ana (Marta, Carlos, Yolanda, Diego) por la API, igual que hace Postman. Un préstamo pagado sale de la ruta
  (solo entran los `ACTIVE`), por eso Diego ya no aparece.

## 5c. Detalle de cliente (M-15)

Pantalla `client/[loanId]?clientId=...`, a la que se llega tocando una fila de la ruta o de Mis clientes. Junta cuatro
consultas del API en paralelo (`GET /clients/:id`, `/loans/:id`, `/loans/:id/balance` y `/loans/:id/collection-visits`)
y arma el modelo en `features/client-detail/lib/detail-view-model.ts` (función pura con tests). Lo no obvio:

- **Cuatro consultas independientes, no una.** Cada una conserva su último dato bueno si un refresco falla (mismo patrón
  que la ruta: `unwrapOrThrow` lanza un `ApiFailureError`). El saldo y el historial cambian con cada visita, por eso su
  `staleTime` es de 15 s.
- **"Próxima visita".** El API devuelve la cuota impaga más antigua cuando hay mora (`nextDueDate`, p. ej. 22 sep); el
  diseño dice "Hoy" porque esa cobranza está pendiente ahora. Regla: fecha esperada ≤ hoy (en hora de Colombia) →
  `Hoy`; si no, la fecha corta.
- **Etiqueta de la cuota.** El diseño dice "Cuota diaria", pero la frecuencia del préstamo puede ser semanal, quincenal o
  mensual: la etiqueta sale de `loan.frequency`.
- **Pago anulado.** Si el administrador revirtió un pago (`payment.reversal`), la fila muestra `Anulado` por `$0`: ya no cuenta.
- **Fechas.** `businessDateOf` convierte a hora de Colombia (`America/Bogota`); un cobro de las 8 p. m. ya es "mañana" en
  UTC. Los meses se escriben a mano (`12 sep 2026`) para que se vean igual en Android, iOS y web.
- **Llamar** abre el marcador del teléfono con `tel:` (no llama sola) y no falla si el dispositivo no puede llamar.
- **"Registrar visita"** solo se ofrece con el préstamo `ACTIVE`.
- El chip y la regla ATRASO/MORA salen de `lib/loan-status.ts`, compartidos con la ruta (M-13).

## 5d. Registrar visita y cola sin conexión (M-16)

Pantalla `visit/[loanId]?clientId=...` y confirmación `visit-done`. Es el corazón del cobro, así que el criterio es
**una visita registrada nunca se pierde y nunca se duplica**:

- **Idempotencia.** El API guarda una visita por su `id` (`POST /loans/:loanId/collection-visits`, D-29): reenviar la misma
  devuelve la ya guardada. El `id` se genera UNA vez al abrir el formulario (`newVisitId`) y se conserva para reintentar; se
  renueva solo si el API rechaza la visita (no quedó guardada).
- **Hora real.** `occurredAt` es la hora de la visita según el teléfono, no la del envío: una visita hecha sin señal llega
  horas después y el API valida la asignación del día en que ocurrió (D-89).
- **Cola local** (`features/visit/queue`, `@react-native-async-storage/async-storage`). `submitVisit` intenta enviar; si
  falla por algo **pasajero** (sin red, mantenimiento, 5xx, 408, 429) la guarda con `userId`, `loanId` y la petición; si el
  API la rechaza de forma **definitiva** (4xx salvo 401/408/429) NO la guarda y avisa; con un 401 no guarda nada (la sesión
  murió). `flushVisitQueue` envía en orden, se detiene en el primer fallo pasajero (seguir mandaría el resto fuera de
  orden) y marca como `rejected` las que el API rechaza, para no reintentarlas para siempre.
- **Por usuario.** Cada elemento lleva el `userId` de quien visitó y solo se envía con la sesión de esa persona: si otra
  inicia sesión en el mismo teléfono, sus visitas no se mandan como si fueran de la otra.
- **Cuándo se reintenta** (`useVisitQueueSync`, montado en `AppShell`): al abrir, cuando vuelve la conexión
  (`expo-network`), cuando la app vuelve al primer plano y cada 30 s mientras haya pendientes (la red puede estar bien y el
  servidor caído: ningún evento del sistema lo avisaría).
- **Aviso.** La ruta muestra "N visitas pendientes de sincronizar" (y las rechazadas) desde `useSyncStore`.
- **Deslizador de confirmación.** `ConfirmSlider` (Reanimated + Gesture Handler, en el hilo de UI) exige arrastrar más del
  85 % para evitar un cobro por un toque accidental; a lectores de pantalla les expone la acción `activate`. Requiere
  `GestureHandlerRootView` en la raíz.
- **Pago completo o parcial.** El API solo conoce `PAID`, `NOT_FOUND`, `REFUSED` y `RESCHEDULED`; un pago parcial es un
  `PAID` de menor monto. El texto de confirmación dice "completo" o "parcial" según el monto frente a la cuota, y el monto no
  puede superar el saldo.
- **Reprogramar** exige fecha (el API la pide con `RESCHEDULED`); se elige de los próximos 14 días en hora de Colombia.
- Tras guardar se invalidan la ruta y el detalle para mostrar el nuevo saldo.
- Verificado en el emulador de Android con el API real, incluido el modo sin conexión (API apagado → "¡Visita guardada!" y
  aviso de pendiente).

## 5e. Cuadre del día (M-17)

Pantalla `settlement` (se abre desde el Perfil). El cobrador declara lo cobrado y lo envía a su prestamista:

- **Datos.** `QUERY /collectors/me/daily-summary` da lo esperado (calculado por el motor de calendario) y lo ya cobrado por
  medio de pago; el formulario nace precargado con eso, así que normalmente solo se confirma. `expectedAmount` se envía tal
  cual lo calculó el API (el cobrador no lo edita).
- **Nota obligatoria si no cuadra.** Si lo cobrado difiere de lo esperado, el API exige `collectorNote`; la app lo valida antes
  de enviar (`buildSubmission`) para no gastar una petición.
- **Sin cola sin conexión.** A diferencia de las visitas, el cuadre cierra el día y debe quedar recibido: enviar necesita
  internet y, si falla, el formulario conserva lo escrito y avisa.
- **Estado del cuadre ya enviado.** El API no ofrece "mi cuadre de hoy" a un cobrador (`QUERY /daily-settlements` es del
  prestamista y, sin filtro, listaría los de todos), así que el `id` que devuelve el envío se guarda por persona y día
  (`settlement-memory`) y se consulta con `GET /daily-settlements/:id`. Limitación: si se borra la app o se cambia de teléfono,
  el cuadre de ese día se verá como "sin enviar" (reenviarlo es seguro: vuelve a `PENDING`). Lo ideal es que el API sume el
  cuadre del día a `daily-summary`.
- **Estados.** `PENDING` (enviado) y `APPROVED` dejan la pantalla de solo lectura; `REJECTED` muestra el comentario del
  prestamista y permite corregir y reenviar.

## 5f. Estadísticas (M-18)

Pantalla `stats` (desde el Perfil): `QUERY /collectors/me/stats` con un `dateRange`. El API solo entrega totales de UN
período, así que lo demás se arma en la app:

- **Períodos.** Semana (desde el lunes, como en Colombia), mes (desde el día 1) y año (desde el 1 de enero), siempre
  **hasta hoy** y con la fecha de negocio de Bogotá (`businessDateOf`), no la de UTC (`period-range.ts`).
- **Comparativo parejo.** Se pide también el período anterior con la MISMA duración transcurrida (a mitad de mes se compara
  contra la primera mitad del mes pasado; contra el mes completo siempre perdería). El día se recorta si el mes anterior es
  más corto (31 de marzo → 28 de febrero). Si solo falla ese segundo pedido, las cifras se muestran sin comparativo.
- **Efectividad** = cobrado / esperado, ya calculada por el API (`null` si no había nada esperado: se muestra `—`).
- **Cartera vencida** es una foto de HOY, no del período; por eso va aparte y en rojo.
- Cada rango tiene su clave de caché, así cambiar de período no mezcla datos y volver a uno ya visto es instantáneo.

## 5g. Notificaciones y push (M-19)

Bandeja `notifications` (campana con globo de sin leer en la Ruta) y registro del token push.

- **Bandeja.** `QUERY /notifications` (50 más recientes), `GET /notifications/unread-count` (se refresca cada minuto),
  `POST /notifications/:id/read` y `/read-all`. Tocar una la marca como leída. Solo las de `DAILY_SETTLEMENT` llevan a una
  pantalla (el cuadre): un préstamo necesitaría también el `clientId` (la ruta de detalle lo exige) y el aviso solo trae el id
  del préstamo; lo de membresías y suscripción es del prestamista.
- **Respuestas 204.** `POST /push-tokens` no devuelve cuerpo; `authedRequest` no lee JSON cuando el estado es 204 (si no, lo
  habría tomado como respuesta inválida).
- **Token push** (`push/`). Se registra una vez por sesión iniciada (`usePushRegistration` en `AppShell`) y se recuerda para
  desvincularlo al cerrar sesión (`completeSignOut` llama `releasePushToken` ANTES de cerrar en el servidor, porque necesita la
  cookie): así quien use el teléfono después no recibe los avisos de otra persona.
- **Cuándo NO hay token (y no es un error).** Web; **Expo Go en Android** (desde el SDK 53 no soporta push remoto: hace falta
  una *development build*); proyecto sin `projectId` de EAS; o permiso negado. En esos casos la app funciona igual, solo sin
  push. `expo-notifications` se carga con `require` dentro de la función para que Expo Go/web ni la carguen.
- **Para que llegue push de verdad** (acción tuya, no de código): `eas init` (crea el `projectId` en `app.json`), credenciales
  FCM de Firebase para Android y APNs para iOS (`eas credentials`), y una development build (`eas build --profile development`).

## 5h. Perfil y cuenta (M-20)

`profile` es ahora un menú (editar perfil, cuadre, estadísticas, notificaciones, cerrar sesión) y `profile-edit` edita la cuenta:

- **`PATCH /account/profile`** cambia nombre y/o correo de contacto. Se envía SOLO lo que cambió (`toProfileChanges`); sin cambios no se
  llama al API (el PATCH exige al menos un campo). Cambiar el correo reinicia su verificación, y la respuesta trae el nuevo estado,
  con el que se actualiza la sesión local.
- **El correo vive en la sesión de better-auth.** El API no tiene `GET /account/profile`: `contactEmail` y `contactEmailVerified`
  vienen en el `user` que devuelve better-auth y por eso `SessionUser` los lleva (opcionales, normalizados a `null`/`false`).
- **Verificar el correo:** `POST /account/contact-email/request-verification` manda un código de 6 dígitos y
  `/verify` lo confirma. La sección solo aparece con correo sin verificar. Los fallos se traducen por el `code` estable del API.

## 5i. Modo administrador (M-21)

La app sirve a dos caras con las mismas reglas que la web: **cobrador** (ruta del día) y **administrador** (Owner/Lender: resumen,
cobradores, clientes, préstamos, cuadres, estadísticas, configuración). Lo que se hace en la web se puede hacer en el celular y al revés.

- **Cómo se sabe el rol.** El API no tiene "mis roles": se lista `QUERY /memberships` (solo lo puede quien administra) y se busca la
  propia membresía; un **403 significa cobrador** (igual que en la web). Sin conexión se usan los últimos roles guardados por persona
  (`fiaro.roles.<userId>`) y, si nunca hubo, **cobrador**: es el rol con menos permisos, así equivocarse hacia ese lado no expone nada.
- **Modo.** `workspace-store` guarda `roles` y `mode`. Quien administra entra en modo administrador aunque también cobre; desde el
  menú/Perfil cambia a "modo Cobrador" y viceversa (solo aparece si tiene ambos roles). El modo no se persiste: se reinicia al iniciar sesión.
- **Rutas.** `AppShell` tiene tres grupos `Stack.Protected`: administrador (`admin/*`), cobrador y compartido (perfil, edición de perfil,
  notificaciones). Mientras se averiguan los roles se muestra `LoadingScreen`. La seguridad real está en el API (cada ruta valida el rol);
  esto solo decide qué se ve.
- **Menú lateral** (`AdminDrawer`, capa dentro de la pantalla, no `Modal`). Las secciones se abren con `replace`, no `push`: son destinos del
  mismo nivel y apilarlas haría que "atrás" recorriera todas las visitadas. `ADMIN_NAV` (`workspace/lib/admin-nav.ts`) es la lista de secciones.
- **Color de marca.** Tras conocer los roles se pide `GET /lender` y se aplica `brandColor` (mejor esfuerzo) en ambos modos.
- **Resumen** (`GET /lenders/me/dashboard`): indicadores, alertas y cuadres por revisar; los nombres salen de la lista de colaboradores
  (`features/team`); si esa no carga, se muestra "Cobrador sin nombre" en vez de bloquear la pantalla. Umbrales de efectividad iguales a la web
  (≥ 90 % verde, ≥ 70 % ámbar, menos rojo).

## 5j. Cobradores del administrador (M-22)

`admin/collectors` (lista), `admin/collectors/new` (registrar) y `admin/collectors/[id]` (gestionar). Piezas reutilizables para las demás
listas del administrador: `EntityRow` / `EntityList` / `ListHeader` / `Fab` / `Badge` (cobradores, clientes, préstamos, cuadres comparten forma).

- **Un solo listado de colaboradores.** `QUERY /memberships` (hasta 100, sin paginar en la app) alimenta la lista de cobradores, el nombre de
  cada cuadre del Resumen y la pantalla de gestión (se busca la membresía por `id` en esa misma caché, sin pedir `GET /memberships/:id`). Un
  prestamista con más de 100 colaboradores necesitaría paginar: hoy no es un caso real del producto.
- **Búsqueda sin tildes ni mayúsculas** (`fold`), por nombre o por dígitos del celular. Orden: activos primero, luego por nombre.
- **Registrar** = `POST /memberships` con rol `COLLECTOR` y cartera (por defecto la `isDefault`). El API devuelve la **contraseña temporal una sola
  vez**, así que la pantalla de éxito la muestra y ofrece compartirla (hoja del sistema, `Share`); si la persona ya tenía cuenta no hay contraseña
  y se avisa que usará la suya. Cédula y celular se normalizan igual que en el API (`normalizeNationalId`, `toMobileE164`).
- **Gestionar:** desempeño del mes (`GET /collectors/:id/stats?from&to`, mismo esquema que las estadísticas del cobrador; la ficha pinta rojo la
  efectividad < 60 %, distinto del Resumen, igual que la web), cambiar cartera (`PATCH /memberships/:id/roles` exige reenviar los roles),
  restablecer contraseña (otra contraseña temporal de una sola vez) y desactivar (quita el acceso y conserva el historial).
- **Peligro en rojo:** `Button` ganó las variantes `danger` y `danger-outline`, y `ConfirmDialog` el prop `destructive`.

## 5k. Clientes del administrador (M-23)

`admin/clients` (lista), `admin/clients/new`, `admin/clients/[id]` (ficha) y `admin/clients/[id]/edit`.

- **Lista paginada de verdad.** `QUERY /clients` devuelve páginas con saldo y mora; la app usa `useInfiniteQuery` (30 por página, la siguiente al llegar al
  final de la lista: `EntityList.onEndReached`). La **búsqueda por nombre o cédula la hace el API** (con 350 ms de espera tras la última letra:
  `useDebouncedValue`), no un filtro local.
- **Filtro "Al día / En mora" es local.** El API no filtra por situación de pago, así que se aplica a lo ya cargado: con un filtro activo puede verse
  menos de lo que existe hasta cargar más páginas. Es un compromiso consciente (pedir todo para filtrar no escala).
- **Estado del cliente** con la misma regla de mora de todo el sistema (`classifyEntry`: 0 días al día, 1–7 atraso, más de 7 mora); sin préstamos activos
  se muestra "SIN DEUDA". En la ficha manda el **peor préstamo vigente** (más días de mora).
- **Un solo formulario para registrar y editar** (`useClientForm`). Al editar solo se envía lo que cambió (`PATCH`), sin cambios no se llama al API, y la
  cédula repetida (`CLIENT_NATIONAL_ID_TAKEN`) se explica en el formulario. Cédula y celular se normalizan igual que en el API.
- **Ficha:** datos, llamar (`tel:`; avisa si el dispositivo no puede), editar y los préstamos del cliente (`QUERY /loans` con `clientId`).
  Las formas de préstamo (`features/loans/lib`) las comparten Clientes y Préstamos.

## 5l. Préstamos del administrador (M-24)

`admin/loans` (lista), `admin/loans/new`, `admin/loans/[id]` (detalle), `[id]/calendar` y `[id]/history`.

- **Lista:** el estado (Activos / Pagados / Anulados) lo filtra el API; **"En mora" y la búsqueda por cliente son locales** sobre lo cargado. La lista de
  préstamos solo trae `clientId`, así que el nombre sale de `useClientNames` (una consulta por cliente distinto, con la misma caché que la ficha:
  lo ya visto no se repite).
- **Detalle:** saldo, mora y progreso vienen de `GET /loans/:id/balance` (el motor de calendario del API: la app NUNCA recalcula mora). El progreso en
  cuotas (`paidInstallments`) es aproximado (pagado ÷ valor de cuota); el estado real de cada cuota está en el calendario. El cobrador vigente sale de
  `currentAssignment` (abierta primero, luego la más reciente). Acciones: asignar cobrador (desde hoy) y anular (solo vigente).
- **Historial de cobros y reversión:** `POST /payments/:id/reversals` exige motivo; un pago ya revertido se muestra "REVERTIDO" con su motivo y no ofrece
  la acción. Al revertir sube el saldo: se refrescan saldo, calendario, listas y Resumen.
- **Nuevo préstamo:** el **total a pagar se sugiere** (cuotas × valor) hasta que se edita a mano (con intereses el total es otro). El cliente se elige
  buscando en el API (`ClientPickerSheet`); la fecha de inicio, de 7 días atrás a 14 adelante (sin calendario nativo). Si el préstamo se crea pero la
  asignación del cobrador falla, se avisa, se bloquea crear otro igual y se asigna después desde el detalle (igual que la web).
- `useApiQuery` (`lib/hooks`) concentra el patrón "lanzar el error, cerrar sesión en 401, `staleTime` 30 s" para no repetirlo en cada consulta.

## 5m. Cuadres y Cobros del día del administrador (M-25)

- **Cuadres** (`admin/settlements`, `[id]`): lista por estado (el API filtra; **Pendientes primero**) con nombre del cobrador, y detalle con el desglose por
  medio de pago, la nota del cobrador y los botones Aprobar / Rechazar (solo `PENDING`). El comentario es opcional pero el cobrador lo lee al rechazar
  (§5e). Un `CONFLICT` significa que otra persona ya lo revisó. Al decidir se actualizan el detalle, la lista y el Resumen. Tocar un cuadre del Resumen
  abre este mismo detalle.
- **Cobros del día** (`admin/payments`): `QUERY /collection-visits` de UN día (hoy; se puede elegir cualquiera de los últimos 14). "Pagos" filtra en el API
  y "Sin pago" en la app. El total cobrado suma lo **cargado** (sin pagos revertidos): si hay más páginas el resumen dice "(hasta ahora)" y crece al
  bajar. Tocar una visita abre su préstamo.
- Corrección de paso: `FlatList` recibe `ListHeaderComponent`/`ListEmptyComponent` como `View` (con un `Fragment` React avisa por `onLayout` en web).

## 5n. Estadísticas del administrador (M-26)

`admin/stats`: `QUERY /lenders/me/stats` con `includePrevious` (el API trae también el período anterior y de ahí salen las **tendencias**: ↑/↓ en % para montos y
en puntos para proporciones). El color de una tendencia depende de la **polaridad**: subir el cobrado es bueno (verde) pero subir la mora es malo (rojo)
(`trend.ts`). Umbrales iguales a la web: % en mora ≥ 10 % ámbar, ≥ 20 % rojo; efectividad ≥ 90 % verde, ≥ 70 % ámbar. Filtros: período (semana, mes, año hasta hoy) y un
cobrador. La mora por antigüedad se dibuja con barras rojas (`ProgressBar tone="destructive"`: verde significaría "pagado").
**Exportar a PDF:** `QUERY /lenders/me/stats/export` con los mismos filtros; `authedDownload` (hermana de `authedRequest` para respuestas que no son JSON) trae los bytes y el nombre
(`Content-Disposition`), se guardan en la caché (`expo-file-system`) y se abre la hoja de compartir del sistema (`expo-sharing`: guardar en Archivos, WhatsApp, correo).

## 5o. Configuración, plan, contraseña y sesiones (M-27)

- **Configuración** (`admin/settings`): cada sección guarda POR SEPARADO (`useSaveAction`: ocupado, error y aviso propios, así un fallo de "Días sin cobro" no aparece
  bajo "Carteras"). Nombre y color de marca van a `PATCH /lender`; el color se **aplica al instante** en la app (`applyBrandColor`) y solo se ofrece la paleta
  de la web, cuyos colores ya pasan el contraste WCAG AA con texto blanco (4.5; `contrastWithWhite`). **Días sin cobro**: el calendario del API mueve las cuotas de esos días al
  siguiente día de cobro, así que guardar cambia saldos y mora de TODOS los préstamos: se invalidan préstamos, Resumen y la ruta del cobrador.
  **Carteras:** crear, renombrar y borrar (la por defecto no se borra; una con cobradores activos tampoco, ambos `CONFLICT` con su propio mensaje).
- **Plan** (`GET /subscription`): bloque "Tu plan" (plan, estado, vencimiento, carteras y préstamos activos "sin tope" si el plan no los limita) con una barra de uso por
  cada tope (cobradores, administradores y préstamos activos) y un **aviso en el Resumen** (por vencer ≤ 7 días, en gracia o solo lectura). El aviso distingue la prueba de un
  plan de pago ("Tu plan vence/venció…"). El tope de carteras sale del plan, ya no es fijo. Si el plan no carga simplemente no se muestra. El schema es propio (no usa
  `@fiaro-app/contracts`, M-11): sigue la forma de contracts 0.12.0. **`PLAN_LIMIT_REACHED`** se explica según `errorCode` (`planLimitMessage`: `M003A` cobradores, `M007A`
  administradores, `L004A` préstamos, `B007A` carteras) en cobradores, administradores, préstamos, solicitudes y configuración. En solo lectura el API deja registrar cobros y cuadres.
  **Renovar:** el aviso del plan (Resumen y Configuración) y el bloque «Tu plan» ofrecen «Renovar en la web», que abre `${SITE_URL}/plan` («Plan y pagos» de la web, api D-149) en el navegador. **La app no vende ni cobra nada**: pagar se hace en la web con Wompi, así no hay compras dentro de la app ni condiciones de tiendas, y la dueña ve la misma pantalla que en el computador (si no tiene sesión en el navegador, la web se la pide y la devuelve ahí).
- **Cambiar contraseña** (`account-password`): igual que el cambio obligatorio pero voluntario (sin "Cerrar sesión" como salida) y al terminar vuelve al Perfil.
- **Sesiones abiertas** (`account-sessions`): `GET /account/sessions`; cerrar una (`DELETE`) o todas las demás (`POST /auth/revoke-other-sessions`). La de este
  teléfono no se puede cerrar aquí (el API da 409): para salir está "Cerrar sesión".
- **Logo:** se elige de la galería (`expo-image-picker`, PNG o JPG de hasta 2 MB, igual que la web), se pide `POST /lender/logo-upload-url`, se sube la imagen con `PUT` directo al
  almacenamiento (SIN la sesión de Fiaro: la firma ya autoriza) y se guarda la dirección pública con `PATCH /lender`. Un fallo del almacenamiento no es un error del API y tiene su mensaje.

## 5p. Recuperar contraseña y registro (M-12 resuelto)

Antes "¿Olvidaste tu contraseña?" solo mandaba a hablar con el administrador. Ahora hay recuperación por código, igual que la web:

- **Recuperar** (`forgot-password`): `POST /auth/request-password-reset` manda un código de 6 dígitos al **correo de contacto** de la cuenta y responde IGUAL exista o no
  la cuenta (no revela quién tiene cuenta), por eso el segundo paso se muestra siempre; `POST /auth/reset-password` lo canjea por una contraseña nueva y el API cierra
  todas las sesiones de la persona. Un cobrador sin correo de contacto no puede usarlo: la pantalla le dice que pida una contraseña temporal a su administrador
  (`resetPassword` de §5j).
- **Registro** (`register`, enlace "Crear cuenta" en el login): dos pasos (cuenta y empresa) y `POST /register`, que NO abre sesión: al terminar se invita a iniciarla. Si el API
  rechaza algo del paso 1 (celular ya registrado, contraseña débil), se vuelve a ese paso con el mensaje.
- Ambas llaman rutas públicas con `apiPost` (sin cookie). Las validaciones son funciones puras (`access-forms.ts`) y las mismas reglas del API (cédula 3–10 dígitos sin cero
  inicial, contraseña 8–128).

## 5q. Identidad (ícono y splash) y bloqueo por inactividad

**Ícono y splash propios:** una "F" de Fraunces (la fuente de los títulos) sobre el anil de Fiaro, diseñada en Penpot (página "3 · Mobile · Cobrador", boards `Icon / ...`) y exportada a `assets/images/`:
`icon.png` (1024, sin transparencia: iOS la rechaza), `android-icon-{foreground,background,monochrome}.png` (el primer plano va dentro de la zona segura central, que Android recorta en círculo
o "squircle"), `splash-icon.png` (la F en anil sobre transparente; el fondo del splash es el color de la app) y `favicon.png`. Rediseñarlos = editar los boards y volver a exportar.

**Bloqueo por inactividad:**

El PIN ya no protege solo el arranque en frío: `useInactivityLock` (en `AppShell`) anota cuándo la app pasa a segundo plano y, si al volver ya pasó más de **1 minuto**
(`LOCK_AFTER_MS`), llama `lock()` del store de sesión y `resolveAccess` devuelve `locked` (pantalla de PIN). Solo actúa con sesión lista y **PIN activado** (`lock` no hace nada sin PIN).
Un minuto deja contestar un mensaje sin fricción y es poco para un teléfono perdido o prestado.

## 5r. Verificación contra robots en el registro y la recuperación (Cloudflare Turnstile)

`POST /register` y `POST /auth/request-password-reset` (cada pedido manda un correo) exigen un token de Cloudflare Turnstile cuando el API tiene `CLOUDFLARE_TURNSTILE_SECRET_KEY` (obligatoria en producción). La web y la app usan
el **mismo widget** (misma site key), en modo gestionado: casi siempre pasa solo y a veces pide marcar una casilla.

- **Nativo (`TurnstileWidget.tsx`):** Cloudflare no tiene SDK para React Native, así que el widget corre en un `react-native-webview` con una página mínima que
  devuelve el token con `postMessage`. La página se carga con `baseUrl = EXPO_PUBLIC_TURNSTILE_ORIGIN`: Cloudflare solo emite tokens para los dominios
  autorizados del widget y el API compara el `hostname` del token con `CLOUDFLARE_TURNSTILE_HOSTNAMES`. En producción ese origen es el dominio de la web.
- **Web (`TurnstileWidget.web.tsx`):** sin WebView; el script se carga una vez y el widget se dibuja en la página.
- **Lógica (`useRegisterForm`):** guarda el token, no deja enviar sin él (si hay site key) y, si el API rechaza el registro, pide un desafío nuevo
  (`turnstileResetKey`): cada token sirve una sola vez. `RegisterView` solo recibe el widget por la prop `verification` (los componentes no importan `features/`).
- **Sin `EXPO_PUBLIC_TURNSTILE_SITE_KEY`** no se muestra nada ni se exige token (desarrollo con el API sin llave secreta). Llaves de prueba en `.env.example`.
- `react-native-webview` viene en Expo Go; en un development build hay que recompilar (`npx expo run:ios|android`) porque es código nativo.

## 6. Diferencias deliberadas entre el diseño (Penpot) y el API

Cuando chocan, manda el API y el mock se corrige (instrucción del equipo). Estado de cada caso:

| Mock original | Realidad del API | Decisión |
|---|---|---|
| Login valida contraseña "mínimo 8 caracteres" | El API solo exige no vacía al iniciar sesión (no revela la política) | Login: "Ingresa tu contraseña." El mínimo 8 solo se valida al **crear** una contraseña. |
| "Crea tu contraseña" pide nueva + confirmar | `change-password` exige la contraseña actual (la temporal) | Se agregó el campo "Contraseña temporal" y el error `PASSWORD_TOO_WEAK`. |
| "En mantenimiento" muestra "Tiempo estimado: 15 minutos" | El API no entrega ese dato | Se quita esa línea. |
| Sin pantalla de bloqueo por intentos | `SIGN_IN_LOCKED` (429 + `Retry-After`, 15 min tras 5 fallos) | Mensaje con la espera en minutos. |
| Sin cuenta desactivada | `ACCOUNT_DEACTIVATED` (403) | Mensaje sobre el formulario. |
| Sin actualización obligatoria | `GET /mobile/version` | Tarjeta "Actualiza la app". |
| Sin crear PIN | El Login PIN lo presupone | Pantalla "Crea tu PIN" + "Confirma tu PIN". |
| "¿Olvidaste tu contraseña?" pendiente | `request-password-reset` envía un código **por correo** y un cobrador puede no tener correo | Por ahora pantalla informativa ("habla con tu administrador"). Pendiente de decisión de producto (M-12). |
| "Mis clientes" con select "Cobrador" | Es el filtro del Lender (web); el cobrador solo ve lo suyo | Se quita el select. |
| Fila "PAGADO" en la ruta | Un préstamo pagado sale de la ruta (solo entran los `ACTIVE`) | El chip existe pero la ruta no lo muestra hoy; se conserva por si "Mis clientes" gana otra fuente. |
| Franja "N visitas pendientes de sincronizar" | Depende de la cola de visitas sin conexión (idempotente por `id`, D-29) | Componente listo (`SyncBanner`), sin uso hasta "Registrar visita". |
| ☰ superpuesto al título de "Ruta de hoy" | El mapa de navegación pide ícono de buscar → Mis clientes y avatar → Perfil | Se usa lupa + avatar a la derecha (mock corregido). |
| Detalle: "No encontrado" en verde | El resultado fallido de una visita no es un éxito | Rojo (destructive); "Pagado" verde y "Reprogramada" atenuado. |
| Detalle: "Cuota diaria" fija | El préstamo puede ser semanal, quincenal o mensual | La etiqueta sale de `loan.frequency`. |
| Reprogramar: "Fecha de compromiso (opcional)" | `RESCHEDULED` exige `promisedDate` | Fecha obligatoria (preseleccionada: mañana); texto de ayuda corregido. |
| "Pago completo" siempre en la confirmación | Un pago parcial es un `PAID` de menor monto | El texto cambia a "parcial" cuando el monto es menor que la cuota. |

## 7. Pruebas, calidad y CI

- **Qué se prueba:** toda la lógica (`src/lib`, `src/features`): reglas puras, servicios con el cliente simulado,
  hooks con `@testing-library/react-native` y el store. Cobertura ≥ 90 %.
- **Qué no se mide:** `components/`, `app/` y `providers/` (presentación) se excluyen de la cobertura de Sonar
  (`sonar.coverage.exclusions`) porque no tienen lógica; esa es justo la razón de separarla. Se verifican a mano en
  el navegador/dispositivo y en revisión de diseño.
- **CI** (`.github/workflows/ci.yml`): lint → typecheck → tests con cobertura → *bundle check*
  (`expo export` de Android, atrapa errores de Metro/Uniwind que los tests no ven) → typedoc → Sonar.
- Mocks de Jest: las variables que usa una fábrica de `jest.mock` deben llamarse `mock*` o crearse dentro de la
  fábrica (babel-jest las eleva sobre los imports; si no, falla con "out-of-scope variables").

## 8. Cómo ejecutar y verificar

```bash
pnpm install
pnpm start        # Expo; `i` abre el simulador de iPhone, `a` el emulador de Android, `w` la vista web
```

- API local: `pnpm docker:dev` en el repo `api` (puerto 3040). Los usuarios de prueba salen de `pnpm docker:seed`.
- **¿iPhone o Android?** Los cobradores usarán el APK de Android (README), así que Android es el que importa para
  producción; el simulador de iPhone es el más rápido de abrir y sirve para casi todo el diseño. Ambos funcionan.
- **Simulador de iPhone (Xcode).** Basta con tener Xcode instalado; `pnpm ios` instala Expo Go solo. `localhost` del
  simulador es tu Mac, así que el API se ve sin configurar nada.
- **Emulador de Android (Android Studio).** Hace falta un dispositivo virtual (Device Manager) y que `adb`
  exista (Device Manager). **`localhost` dentro del emulador es el propio emulador**, no tu Mac: hay que reenviar los
  puertos del API y de Metro con `adb reverse`. `pnpm android` (`scripts/run-android.sh`) lo hace todo: usa
  `$HOME/Library/Android/sdk` si no hay `ANDROID_HOME`, arranca el primer emulador (o el de `AVD=<nombre>`) si no hay
  uno abierto, espera a que inicie, hace `adb reverse tcp:3040` y `tcp:8081` y abre la app.
- En un teléfono físico copia `.env.example` a `.env.local` y pon la IP de tu máquina.
- **Expo Go vs build de desarrollo.** Expo Go (lo que usan `pnpm ios/android`) ya trae `expo-secure-store` y
  `expo-local-authentication`. Si se agrega una librería con código nativo propio hará falta `expo run:android|ios` o
  un build de EAS. El botón azul con engranaje que se ve sobre la app en Expo Go es su menú de desarrollo, no es de Fiaro.
- **Vista web (solo desarrollo).** Sirve para ver y probar la interfaz sin emulador, pero no es la app real: allí
  `expo-secure-store` se reemplaza por `localStorage` (inseguro, ver `secure-storage.ts`), la cookie la maneja el
  navegador y no hay huella. El API necesita `http://localhost:8081` en su `CORS_ORIGINS`.
- **Pruebas automatizadas con una herramienta (no a mano).** La herramienta que escribe en el simulador de iPhone
  convierte el guion `-` en `'`, así que una contraseña con guiones no se puede teclear con ella; se escribe a mano en
  el panel. No es un fallo de la app.
- Un cambio en `src/global.css` o en las rutas puede necesitar `r` (recargar) en la terminal de Expo; los tipos de
  rutas (`.expo/types`) se regeneran al reiniciar el servidor.

## 9. Pendiente conocido

Todo lo que se hace en la web se puede hacer en la app (cobrador y administrador), salvo lo que sigue:

- **Revisar en Penpot** las pantallas hechas sin mock cerrado (los mocks nuevos están en la página "3 · Mobile · Cobrador", a partir de y = 18000) y ajustar diferencias.
- **M-11:** instalar `@fiaro-app/contracts` (paquete privado: necesita el token del usuario) para dejar de copiar esquemas (`*-schemas.ts`) y consumir `overdueStatus`.
- **Push de verdad** (§5g): `eas init`, credenciales FCM/APNs y una development build.
- **Fecha de inicio de un préstamo** fuera de −7/+14 días y la **paginación de colaboradores** (> 100) no están en la app todavía.
- **Verificación en dispositivo:** el administrador se verificó en la vista web contra el API de desarrollo; falta repasar cada pantalla nueva en Android/iOS.
