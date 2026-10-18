# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

Sitio web + panel de administración de Cattleya (Palmira): catálogo de plantas/orquídeas y carta de brunch, gestionados por Ángeles sin tocar código. HTML/CSS/JS vanilla, **sin build step, sin tests, sin linter**. Documentación en español; el detalle completo (modelo de datos, reglas, estado del proyecto) está en `docs/ARCHITECTURE.md`.

## Comandos

- Desarrollo local: `npx serve .` (o abrir los HTML directo con doble clic — funciona por diseño, ver abajo).
- Seed / scripts de Firestore: `cd seed && npm install`, luego `node <script>.js`. Requieren `seed/serviceAccountKey.json` (gitignored). `npm run seed` carga `seed-data.js` completo (sobrescribe el catálogo).
- Deploy:
  - `cd deploy && npm run push` (`deploy-github.js`): add/commit/push; GitHub Pages publica. `npm run push:dry` solo lista cambios. Hace cache-busting de css/js (ver cabecera del script).
  - `npm run deploy` / `deploy:dry` (`deploy.js`): FTP a Hostinger, requiere `deploy/.env` (aún sin hosting real).

## Arquitectura

- **Firebase compat SDK, no modular**: scripts normales, sin `import`/`export` ni `type="module"`, para que funcione desde `file://`. Todo el código usa los globales `window.CATTLEYA_DB` / `window.CATTLEYA_AUTH` (de `js/firebase-init.js`) y la API compat (`snap.exists` es propiedad). No introducir módulos ES.
- **Modelo "documento único"**: cada catálogo es un solo doc (`catalog/brunch`, `catalog/plantas`) con `sections[].items[]` anidados. El sitio hace un `get()` por página y filtra `active` / ordena por `order` en JS. Por eso `firestore.indexes.json` está vacío a propósito: no usar queries `where`+`orderBy` compuestas. Toda edición del admin reescribe el documento completo (`admin/js/catalog-store.js`).
- `settings/site` guarda número de WhatsApp, dirección, horarios; `admins/{uid}` define quién puede escribir (reglas en `firebase/firestore.rules`). No hay carrito ni backend: pedidos y reservas (`js/whatsapp.js`, `js/reservas.js`) arman links `wa.me` con mensaje prellenado.
- Frontend público: `index.html`, `plantas.html`, `brunch.html` + `js/catalog-*.js`. Admin: `admin/` (login + dashboard con `products.js`, `categories.js`, `auth.js`).
- CSS con tokens en `css/variables.css` (paleta crema/magenta/vino, Playfair Display / Dancing Script / Poppins).

## Contenido e imágenes

- Los datos reales viven en Firestore; `seed/seed-data.js` es la fuente inicial, y los scripts puntuales de `seed/` (`set-item-image.js`, `set-item-images.js`, `apply-*.js`, `reorder-subgroups.js`, `set-section-text.js`, `check-section.js`) modifican solo ítems/secciones específicos en vez de re-sembrar. Seguir ese patrón para cambios de contenido.
- Imágenes del sitio: `assets/img/brunch/` (originales) y `assets/img/brunch/web/` (optimizadas, las que se referencian); íconos en `assets/img/brunch/icons/`. Los `.psd`, `IMG/`, `Productos/`, `Menú/` y `Claude outputs/` son material fuente/referencia en la raíz, no parte del sitio.
- Ítems de bebidas usan `subgroup` para agrupar sin ser categorías propias.

## Flujo con Git y cliente

- Todo cambio va en una rama o en un commit pequeño y enfocado; no mezclar cambios de contenido, código e imágenes en un mismo commit.
- Antes de publicar, correr siempre `cd deploy && npm run push:dry` para listar qué se va a subir, y revisar la lista.
- Nunca subir `seed/serviceAccountKey.json` ni `deploy/.env` (están en `.gitignore`; confirmar que no aparezcan en el dry-run).

## Accesibilidad (sitio público)

Convenciones que salieron de la auditoría de 2026-10-18; mantenerlas al tocar HTML/CSS/JS público, sin alterar colores ni tipografías de marca:

- Texto de Firestore (nombres, descripciones, etiquetas) que entre a `innerHTML` o a un atributo pasa por `escapeHTML()` (definida en `js/main.js`).
- Fotos dentro de tarjetas o miniaturas con el nombre ya en el título llevan `alt=""`.
- Objetivos táctiles de al menos 44px (botones, chips, enlaces de menú). El foco visible es el `:focus-visible` global de `css/base.css`.
- Magenta (`--color-magenta`) no sirve para texto pequeño sobre crema (4.43:1); usar `--color-magenta-dark`. Botones de WhatsApp: fondo `--color-whatsapp` (#128040) con texto blanco (5:1); no usar el #25D366 con blanco (1.98:1).
- Orden de encabezados en la carta: h2 sección > h3 subgrupo > h4 ítem.
- Pendiente por decidir: `--color-text-muted` (#8A8371) da 3.6:1 en las descripciones.
- `npm run push` hace `git add -A`: si hay archivos sueltos (`.psd`, cambios de `seed/`), hacer commit selectivo y `git push` a mano, y actualizar los `?v=` de los HTML a mano.
