# Fiaro — Mobile

App móvil para los Collectors de Fiaro: registro en campo de visitas de cobro (`PAID`, `PARTIAL`, `NOT_FOUND`, `REFUSED`, `RESCHEDULED`) contra la cartera gestionada en la [API de Fiaro](https://github.com/fiaro-app/api).

Repo privado. Software propietario — ver [LICENSE](./LICENSE).

Documento de dominio y producto (entidades, multi-tenancy, suscripciones, roadmap): [api/PRODUCT.md](https://github.com/fiaro-app/api/blob/dev/PRODUCT.md).

## Stack

Expo (React Native, managed workflow) · TypeScript · Expo Router · pnpm

> Expo cambia cada release. Antes de tocar cualquier API de Expo/EAS/React Native, revisar la versión del SDK en `package.json` y la documentación versionada correspondiente — ver `AGENTS.md`.

## Distribución

Sin Google Play ni App Store por ahora:

- **Distribución directa del APK** (Android). iOS queda pendiente de confirmar — requeriría cuenta Apple Developer (99 USD/año).
- **EAS Update (OTA)** para la mayoría de cambios (lógica, UI, textos), sin que el cobrador tenga que reinstalar nada.
- **Firebase App Distribution** para los cambios que requieren build nativa nueva (SDK de Expo, permisos nuevos).
- **Version-gate obligatorio**: la app consulta `GET /mobile/version` antes de mostrar cualquier pantalla; si está por debajo de la mínima soportada, bloquea con pantalla de actualización.

## Requisitos

- Node 24
- pnpm 11 (`corepack enable` si no lo tienes activado)
- Expo Go (para probar rápido) o un build de desarrollo si el proyecto ya usa módulos nativos

## Empezar

```bash
pnpm install
pnpm start
```

Desde ahí, abre la app en un [build de desarrollo](https://docs.expo.dev/develop/development-builds/introduction/), [emulador Android](https://docs.expo.dev/workflow/android-studio-emulator/), [simulador iOS](https://docs.expo.dev/workflow/ios-simulator/) o [Expo Go](https://expo.dev/go).

## Scripts

| Comando | Qué hace |
|---|---|
| `pnpm start` | Servidor de desarrollo de Expo |
| `pnpm android` / `pnpm ios` / `pnpm web` | Arranca en esa plataforma |
| `pnpm lint` | `expo lint` |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Tests (Jest + `jest-expo`) |
| `pnpm docs` | Genera documentación (TypeDoc) de `src/lib` en `docs/` |

El pipeline de CI (`.github/workflows/ci.yml`) corre lint → typecheck → test → docs → análisis de Sonar en cada PR y en cada push a `dev`. No hay `build` en CI porque una app Expo no compila un binario sin EAS.

## Estructura

```
src/
  app/          # Rutas (Expo Router) — cada archivo es una pantalla
  components/    # Componentes reutilizables, fuera de app/
  hooks/         # Hooks compartidos
  constants/     # Theme, constantes de la app
  lib/            # Utilidades puras, testeadas con Jest
```

`ios/` y `android/` no existen todavía — si aparecen, son generados (Continuous Native Generation) y no se editan a mano; el comportamiento nativo se configura en `app.json`.

## Ramas y flujo de trabajo

- `dev` es la rama de integración y la rama por defecto — todo PR apunta aquí.
- `main` es producción — se actualiza vía PR desde `dev` cuando está estable.
- Merge siempre por squash; la rama de origen se borra automáticamente al mergear.
- Sin protección de rama activa (equipo de una persona por ahora).

## Repos relacionados

| Repo | Contenido |
|---|---|
| [fiaro-app/api](https://github.com/fiaro-app/api) | Backend (NestJS) |
| [fiaro-app/web](https://github.com/fiaro-app/web) | Panel de Owner/Lender (Next.js) |
| [fiaro-app/contracts](https://github.com/fiaro-app/contracts) | Schemas de Zod compartidos (`@fiaro-app/contracts`) |
