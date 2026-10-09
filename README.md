# Fiaro — Mobile

App móvil para los Collectors de Fiaro: registro en campo de visitas de cobro (`PAID`, `PARTIAL`, `NOT_FOUND`, `REFUSED`, `RESCHEDULED`) contra la cartera gestionada en la [API de Fiaro](https://github.com/fiaro-app/api).

Repo privado. Software propietario — ver [LICENSE](./LICENSE).

Documento de dominio y producto (entidades, multi-tenancy, suscripciones, roadmap): [api/PRODUCT.md](https://github.com/fiaro-app/api/blob/dev/PRODUCT.md).

## Stack

Expo (React Native, managed workflow) · TypeScript · Expo Router · Uniwind (Tailwind 4) · Zustand · TanStack Query · better-auth · pnpm

Arquitectura, decisiones y notas de diseño móvil: [ARCHITECTURE.md](./ARCHITECTURE.md).

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
pnpm start        # `i` simulador de iPhone, `a` emulador de Android, `w` vista web (solo desarrollo)
```

La app necesita el API: en el repo `api`, `pnpm docker:dev` lo deja en `http://localhost:3040` y `pnpm docker:seed`
crea los usuarios de prueba. En un teléfono físico copia `.env.example` a `.env.local` y pon la IP de tu máquina.
Para la vista web, el API debe tener `http://localhost:8081` en `CORS_ORIGINS`. En el emulador de Android hay que
hacer `adb reverse tcp:3040 tcp:3040` y `adb reverse tcp:8081 tcp:8081` (ver [ARCHITECTURE.md §8](./ARCHITECTURE.md)).

| Comando | Qué hace |
|---|---|
| `pnpm start` | Servidor de desarrollo de Expo |
| `pnpm android` / `pnpm ios` / `pnpm web` | Arranca en esa plataforma |
| `pnpm lint` | `expo lint` (incluye alias `@/`, máx. 200 líneas y la frontera diseño/lógica) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` / `pnpm test:cov` | Tests (Jest + `jest-expo`); el segundo con cobertura |
| `pnpm build` | Comprueba que la app compila (`expo export` de Android) |
| `pnpm docs` | Genera documentación (TypeDoc) de `src/lib` y `src/features` en `docs/` |

El pipeline de CI (`.github/workflows/ci.yml`) corre lint → typecheck → tests con cobertura → bundle check → docs → análisis de Sonar en cada PR y en cada push a `dev`.

## Estructura

```
src/
  app/          # Rutas (Expo Router): delgadas, solo unen un hook con un componente
  components/   # Diseño puro (atoms / molecules / organisms / templates), sin lógica
  features/     # Lógica por dominio (auth, system): api, hooks, store, lib, schemas
  providers/    # AppShell (qué se ve según el estado) y TanStack Query
  lib/          # Utilidades sin dominio, testeadas con Jest
```

`ios/` y `android/` no existen todavía — si aparecen, son generados (Continuous Native Generation) y no se editan a mano; el comportamiento nativo se configura en `app.json`.

## Ramas y flujo de trabajo

- `dev` es la rama de integración y la rama por defecto — todo PR apunta aquí.
- `main` es producción — se actualiza vía PR desde `dev` cuando está estable.
- **PR de funcionalidad** (rama → `dev`): merge por **squash**, un commit por PR.
- **PR de release** (`dev` → `main`): **merge commit**. Así `main` y `dev` comparten historia y el siguiente release no tiene conflictos; con squash, `main` quedaría con un commit que `dev` no tiene.
- La rama de origen se borra automáticamente al mergear (`dev` nunca, porque es la rama por defecto).
- Sin protección de rama activa (equipo de una persona por ahora).

## Repos relacionados

| Repo | Contenido |
|---|---|
| [fiaro-app/api](https://github.com/fiaro-app/api) | Backend (NestJS) |
| [fiaro-app/web](https://github.com/fiaro-app/web) | Panel de Owner/Lender (Next.js) |
| [fiaro-app/contracts](https://github.com/fiaro-app/contracts) | Schemas de Zod compartidos (`@fiaro-app/contracts`) |
