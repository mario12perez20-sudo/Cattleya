# Deploy de Cattleya

Dos mecanismos de deploy, independientes entre sí:

1. **`deploy-github.js`** — push a GitHub (así se publica el sitio hoy,
   vía GitHub Pages). Este es el que usás ahora.
2. **`deploy.js`** — FTP a Hostinger. Este se activa recién cuando
   Mario compre el dominio y hosting; hasta entonces no hace falta
   configurarlo.

## Deploy a GitHub (actual)

Sube los cambios a GitHub con `git add` + `commit` + `push`, para no
tener que abrir GitHub Desktop cada vez. GitHub Pages publica los
cambios solo, en ~1 minuto.

**Tiene que correr en tu consola de Node, en tu PC** — no funciona desde
Claude (la carpeta conectada al sandbox no deja que git escriba ahí).

Primer uso: probá que tenés `git` disponible en la consola:

```bash
git --version
```

Si da error de "comando no reconocido", instalá Git para Windows
(https://git-scm.com/download/win) — el git que trae GitHub Desktop no
queda disponible en la consola normal.

Comandos (desde la carpeta `deploy`):

```bash
node deploy-github.js "mensaje del commit"   # sube los cambios
node deploy-github.js --dry                   # solo muestra qué cambió, no sube nada
node deploy-github.js                         # sube con un mensaje automático (fecha/hora)
```

O con npm (mismo resultado):

```bash
npm run push:dry
npm run push
```

No necesita `npm install` — no tiene dependencias.

## Deploy a Hostinger por FTP (para cuando haya hosting)

Script FTP simple, sin build step (el sitio es HTML/CSS/JS vanilla).
**Independiente del deploy de Beer Garden**: otro dominio, otra carpeta
remota, otras credenciales propias.

### Primer uso

```bash
cd deploy
npm install
cp .env.example .env
# completa FTP_HOST, FTP_USER, FTP_PASSWORD, FTP_REMOTE_DIR con los datos
# de hPanel → Sitios web → Cattleya → Archivos → Detalles de FTP
```

### Comandos

```bash
npm run deploy:dry   # lista qué archivos se subirían, sin tocar el servidor
npm run deploy        # sube el sitio de verdad
```

### Qué se sube y qué no

Se sube todo el contenido de la raíz del proyecto (`index.html`,
`plantas.html`, `brunch.html`, `css/`, `js/`, `admin/`, `assets/`)
**excepto**: `deploy/`, `seed/`, `firebase/`, `docs/`, `.git`,
`node_modules`, y las carpetas originales `Menú/` y `Productos/` (ya están
copiadas y optimizadas dentro de `assets/img/`).

Antes de cada deploy real, corre `npm run deploy:dry` para confirmar que la
lista de archivos es la esperada.
