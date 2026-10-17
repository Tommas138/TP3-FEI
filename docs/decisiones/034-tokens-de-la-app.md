# 034 — Los tokens de la app son una copia de los de la web

**Estado:** aceptada — 17 de octubre de 2026

## Contexto

Los colores, las fuentes y los radios del sistema visual están en [design.md](../design.md) §3 a §5. La web los tiene como variables de Tailwind 4 en `apps/web/src/index.css` (`@theme`), que es CSS. La app (`apps/mobile`) necesita los mismos valores como un objeto de JavaScript para usarlos en los estilos de React Native.

Había que decidir si los dos lados leen de un mismo archivo o si cada uno tiene el suyo.

## Opciones consideradas

1. **Una copia en `apps/mobile/src/lib/tokens.ts`**, con los mismos valores que `index.css`.
   - En contra: un color se cambia en dos lugares, y nada avisa si quedan distintos.
2. **Un objeto de TypeScript en `packages/shared`** que importe la app y que la web lea con `@config` de Tailwind o con un script que genere el `@theme`.
   - En contra: toca la web en un cambio de la app. `@config` es el modo de compatibilidad de Tailwind 4, que trabaja con CSS. Y `packages/shared` deja de ser solo el contrato de la API.
3. **Un `tokens.json`** del que se generen el `@theme` de la web y el objeto de la app.
   - En contra: un paso de generación más y un archivo generado que hay que poder explicar.

## Decisión

Opción 1. `apps/mobile/src/lib/tokens.ts` tiene `colores`, `fuentes` (el nombre de familia de cada peso), `radios`, `medidas` y `tabular`. Su encabezado remite a design.md y a `index.css`.

## Por qué

- **La fuente de verdad ya existe y es design.md.** Los dos archivos la implementan, cada uno en el idioma de su plataforma: variables CSS en la web, un objeto en la app.
- **Son valores que casi no cambian:** 18 colores, 4 radios y dos familias. Sincronizar a mano cuesta menos que mantener un generador.
- **La app no obliga a tocar la web.** El PR de la base de la app no cambia nada de `apps/web`.

## Qué se resigna

- **Pueden quedar distintos.** Si alguien cambia un color en `index.css` y no en `tokens.ts`, nada lo detecta. La regla es la de siempre: si cambia design.md, cambian los dos en el mismo commit.
- **La app tiene tokens que la web no tiene** (`medidas`: el alto de toque de 56 y el margen de 16), porque son de la escala móvil.
