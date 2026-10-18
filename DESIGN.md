# DESIGN.md — Cattleya

Reglas visuales del sitio público. Los tokens viven en `css/variables.css`; esa es la fuente de verdad.

## Identidad de marca (NO se modifica)

La paleta y las tipografías salen de las piezas reales del menú de Cattleya. **No proponer ni aplicar cambios a colores de marca ni a tipografías**, aunque un detector de "diseño genérico" los marque. Cualquier cambio lo decide Ángeles / Mario.

| Uso | Token | Hex |
|---|---|---|
| Fondo / papel | `--color-cream` | `#FEF9E6` |
| Fondo alterno / tarjetas | `--color-cream-soft` | `#FBF3DC` |
| Acento principal (títulos script, CTA) | `--color-magenta` | `#D1347B` |
| Acento oscuro (texto pequeño, hover) | `--color-magenta-dark` | `#B22868` |
| Texto fuerte / wordmark / footer | `--color-wine` | `#5C132D` |
| Texto de párrafo | `--color-text` | `#4A4638` |

Tipografías: `Playfair Display` (títulos), `Dancing Script` (nombres de plato y acentos), `Poppins` (cuerpo y UI).

El logo (`assets/logo/`) es el oficial; no redibujarlo.

## Accesibilidad (obligatorio)

- Contraste mínimo 4.5:1 para texto normal y 3:1 para texto grande y elementos de interfaz.
- `--color-magenta` sobre crema da 4.43:1: no usarlo para texto pequeño; usar `--color-magenta-dark`.
- Botones de WhatsApp: fondo `--color-whatsapp` (`#128040`) con texto blanco (5:1). El `#25D366` original no admite texto blanco (1.98:1).
- Objetivos táctiles de al menos 44px; foco visible con el `:focus-visible` global (`css/base.css`).
- Fotos dentro de tarjetas con el nombre en el título: `alt=""`.
- Texto de Firestore que entre al HTML pasa por `escapeHTML()` (`js/main.js`).
- Respetar `prefers-reduced-motion`.
- Pendiente de decisión: `--color-text-muted` (`#8A8371`) da 3.6:1 en descripciones.

## Estructura y estilo

- Móvil primero: el sitio se usa sobre todo desde el celular (clientes por WhatsApp/Instagram). Probar a 320–400px.
- Tarjetas con bordes redondeados (`--radius-md`/`--radius-lg`) y sombras suaves en tono vino (`--shadow-card`).
- Tono visual cálido, orgánico y artesanal; fotos reales de platos y plantas por encima de ilustraciones.
- Sin framework ni build step: CSS plano con variables, JS vanilla. No introducir dependencias de interfaz.
