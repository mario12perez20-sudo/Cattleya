# Cattleya — Arquitectura

Sitio web + administrador de productos para Cattleya (Palmira). Vitrina de
plantas/orquídeas y carta de brunch, con panel de administración para que
Ángeles gestione todo sin tocar código.

Stack: HTML/CSS/JS vanilla (sin build step), Firebase Firestore como base de
datos, Firebase Auth para el panel de admin, deploy a Hostinger vía script
propio (`deploy/deploy.js`). Mismo enfoque que Beer Garden, incluyendo el
**mismo patrón de datos** (ver "Modelo de datos" más abajo) y el **mismo
SDK de Firebase** (versión "compat", scripts normales sin módulos — ver
más abajo) — pero proyecto de Firebase y credenciales de hosting
**completamente independientes**.

## Firebase SDK: "compat", no modular

El sitio carga Firebase con los scripts **compat** (namespace global
`firebase`, sin `type="module"`), igual que Beer Garden:

```html
<script src="js/firebase-config.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
<script src="js/firebase-init.js"></script>
```

`js/firebase-init.js` expone `window.CATTLEYA_DB` y `window.CATTLEYA_AUTH`.
Todo el resto del código (catalog-brunch.js, catalog-plantas.js, y en el
admin catalog-store.js/categories.js/products.js/auth.js) son scripts
normales — sin `import`/`export` — que usan esos objetos globales y la
API de Firestore en su forma "compat" (`.collection(x).doc(y).get()`,
`snap.exists` como propiedad en vez de método, etc.).

**Por qué compat y no la versión modular (v9+):** con módulos de
JavaScript (`type="module"`), los navegadores bloquean la carga del
script cuando el HTML se abre directo desde el disco (`file:///...`) —
obligaría a levantar siempre un servidor local para probar. La versión
compat, al ser scripts normales, sí funciona abriendo el archivo
directo con doble clic, igual que Beer Garden. (Beer Garden además
vendoriza los archivos compat localmente en su propia carpeta `js/` en
vez de usar el CDN de Google — acá se dejaron apuntando al CDN por
simplicidad; se puede vendorizar después si se quiere evitar la
dependencia de red incluso para cargar el propio SDK.)

## Estructura de carpetas

```
Cattleya/
├── index.html              Home
├── plantas.html             Catálogo de plantas / orquídeas
├── brunch.html               Carta de brunch (sal, dulce, bebidas)
├── css/
│   ├── variables.css         Paleta, tipografías, spacing (design tokens)
│   ├── base.css               Reset + tipografía + botones + utilidades
│   └── components.css         Header, footer, cards, filtros, hero, etc.
├── js/
│   ├── firebase-config.js     Claves reales del proyecto Firebase (cattleya-b8c02)
│   ├── firebase-init.js       Inicializa Firebase App + Firestore + Auth
│   ├── catalog-plantas.js     Lee catalog/plantas (un solo getDoc) y renderiza
│   ├── catalog-brunch.js      Lee catalog/brunch (un solo getDoc) y renderiza
│   ├── whatsapp.js            Arma links wa.me con mensaje prellenado
│   └── main.js                Nav móvil, utilidades compartidas
├── admin/
│   ├── index.html              Login (Firebase Auth)
│   ├── dashboard.html           Panel: selector de catálogo, productos, categorías
│   ├── css/admin.css
│   └── js/
│       ├── auth.js              Login/logout, protección de rutas
│       ├── catalog-store.js      Fetch/save compartido de catalog/{brunch|plantas}
│       ├── products.js           CRUD de productos (activar, duplicar, stock, promo)
│       └── categories.js          CRUD de categorías (secciones dentro del catálogo)
├── firebase/
│   ├── firestore.rules          Reglas de seguridad
│   └── firestore.indexes.json   Vacío a propósito (ver más abajo, no hacen falta)
├── seed/
│   ├── seed-data.js             Datos iniciales (brunch real + plantas placeholder)
│   └── seed.js                  Script Node (firebase-admin) para cargar el seed
├── deploy/
│   ├── deploy.js                Sube el sitio a Hostinger
│   ├── .env.example
│   └── README.md
├── assets/
│   ├── logo/                    Ícono de orquídea placeholder + favicon
│   └── img/
│       ├── brunch/               Fotos de platos (originales + /web optimizadas)
│       ├── menu/                  Las 3 fotos del menú actual, como referencia
│       └── plantas/                Vacío: fotos reales de plantas van aquí
└── docs/
    └── ARCHITECTURE.md          Este documento
```

## Identidad visual (muestreada del menú real)

| Uso | Color | Hex |
|---|---|---|
| Fondo / papel | Crema | `#FEF9E6` |
| Acento principal (títulos, precios, CTA) | Magenta/orquídea | `#D1347B` |
| Texto fuerte / ilustración de línea | Vino | `#5C132D` |
| Texto de párrafo | Taupe oscuro | `#4A4638` |

Tipografías: `Playfair Display` (títulos elegantes tipo "Menú"/"Bebidas"),
`Dancing Script` (nombres de plato y acentos, aproximando el script cursivo
ya usado), `Poppins` (texto de cuerpo/UI). Ver `css/variables.css`.

El logo actual solo existe incrustado en las fotos del menú (ícono de
orquídea de línea + wordmark "Cattleya"). Se creó un ícono placeholder en
`assets/logo/cattleya-orchid-icon.svg` que sigue el mismo espíritu — debe
reemplazarse por el archivo oficial cuando Ángeles lo entregue.

## Modelo de datos (Firestore) — patrón "documento único"

Igual que Beer Garden (`menu/data`): cada catálogo vive en **un solo
documento**, con las categorías ("secciones") y productos ("items")
anidados adentro como arreglos. El sitio hace un único `getDoc()` por
página y arma todo en JavaScript (filtra `active`, ordena por `order`).
**Nunca hace falta crear índices compuestos en Firestore** con este
esquema — por eso `firestore.indexes.json` está vacío a propósito.

(La primera versión de este proyecto usaba colecciones `categories` /
`products` con consultas `where` + `orderBy`, que sí piden índices
compuestos. Se migró a este esquema para quedar consistente con Beer
Garden y evitar esa fricción.)

### `catalog/brunch` y `catalog/plantas` (dos documentos)

```
{
  sections: [
    {
      id: string,                // slug, ej. "orquideas", "brunch-sal"
      name: string,               // "Orquídeas", "Para el hambre"...
      subtitle: string | null,     // ej. "de sal para deleitarse"
      order: number,
      active: boolean,
      items: [
        {
          id: string,             // slug único dentro del catálogo
          name: string,
          description: string,
          price: number,           // COP, sin puntos ni símbolo
          images: string[],         // URLs
          active: boolean,          // activar/desactivar visibilidad
          stock: "disponible" | "agotado",  // solo relevante en plantas
          featured: boolean,
          order: number,
          subgroup: string,          // opcional, solo bebidas (agrupa sin ser categoría propia)
          promo: {
            active: boolean,
            label: string,           // "2x1", "-20%"
            discountType: "percent" | "fixed",
            discountValue: number
          }
        },
        ...
      ]
    },
    ...
  ],
  updatedAt: timestamp
}
```

Duplicar un producto = tomar el item, cambiarle el `id` y el `name`
(sufijo "copia"), agregarlo al arreglo `items` de su misma sección,
marcado `active: false` para revisarlo antes de publicarlo. Se
implementa en `admin/js/products.js`; toda edición (crear, editar,
duplicar, eliminar, activar/desactivar) termina reescribiendo el
documento **completo** del catálogo vía `setDoc` (ver
`admin/js/catalog-store.js`) — normal y seguro para este tamaño de
catálogo con un solo admin editando a la vez.

### `settings/site` (documento único)

```
{
  whatsappNumber: string,       // formato internacional, ej. "573001234567"
  address: string,
  hours: string,
  instagram: string,
  heroTitlePlantas: string,
  heroTitleBrunch: string
}
```

### `admins`

```
admins/{uid}: {
  email: string,
  role: "owner" | "staff",     // owner = todo, staff = rol limitado (a futuro)
  createdAt: timestamp
}
```

Hoy solo existe Ángeles como "owner" (UID `AHyU7ncSlNdt63S3X52mjEfGPss2`,
usuario de Firebase Auth con email `cattleyaweb123@gmail.com`). El campo
`role` ya deja espacio para agregar administradores con permisos limitados
más adelante sin migrar el esquema.

## Reglas de seguridad (resumen)

- Lectura pública de `catalog/{brunch|plantas}` y `settings/site`.
- Escritura en `catalog/*` y `settings/*` solo si `request.auth.uid` existe
  en `admins/{uid}`.
- `admins` no es legible ni escribible desde el cliente (se gestiona desde
  la consola de Firebase o un script admin con la Admin SDK).

Ver `firebase/firestore.rules` para la implementación.

## Roadmap ya contemplado (no implementado aún)

- Carrito de compra para plantas (hoy es vitrina + botón "Pedir por
  WhatsApp" con mensaje prellenado). El modelo de datos ya soporta esto sin
  cambios de esquema.
- Roles de administrador adicionales a Ángeles (campo `role` ya existe).
- Fotos reales de plantas/orquídeas — el seed actual usa placeholders.

## Estado de la conexión a Firebase

Ya está todo creado y conectado (proyecto `cattleya-b8c02`, cuenta
`cattleyaweb123@gmail.com`): Firestore (Standard, región `nam5`),
Authentication (Email/Password), usuario admin, y `js/firebase-config.js`
con las claves reales. El seed ya se corrió una vez con el esquema viejo
(colecciones) — **hay que volver a correr `seed/seed.js` con el nuevo
esquema de documento único** para que `catalog/brunch` y `catalog/plantas`
queden poblados; las colecciones viejas `categories`/`products` en
Firestore quedan huérfanas y se pueden borrar manualmente desde la consola
cuando se confirme que todo funciona con el esquema nuevo.

Pendiente:
1. Volver a correr `seed/seed.js` (esquema nuevo).
2. Completar `deploy/.env` con las credenciales de Hostinger de Cattleya
   (aún no se ha comprado dominio/hosting) y correr `deploy/deploy.js`.
3. Conseguir fotos y datos reales del catálogo de plantas/orquídeas.
