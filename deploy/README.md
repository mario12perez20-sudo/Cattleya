# Deploy de Cattleya a Hostinger

Script FTP simple, sin build step (el sitio es HTML/CSS/JS vanilla).
**Independiente del deploy de Beer Garden**: otro dominio, otra carpeta
remota, otras credenciales propias.

## Primer uso

```bash
cd deploy
npm install
cp .env.example .env
# completa FTP_HOST, FTP_USER, FTP_PASSWORD, FTP_REMOTE_DIR con los datos
# de hPanel → Sitios web → Cattleya → Archivos → Detalles de FTP
```

## Comandos

```bash
npm run deploy:dry   # lista qué archivos se subirían, sin tocar el servidor
npm run deploy        # sube el sitio de verdad
```

## Qué se sube y qué no

Se sube todo el contenido de la raíz del proyecto (`index.html`,
`plantas.html`, `brunch.html`, `css/`, `js/`, `admin/`, `assets/`)
**excepto**: `deploy/`, `seed/`, `firebase/`, `docs/`, `.git`,
`node_modules`, y las carpetas originales `Menú/` y `Productos/` (ya están
copiadas y optimizadas dentro de `assets/img/`).

Antes de cada deploy real, corre `npm run deploy:dry` para confirmar que la
lista de archivos es la esperada.
