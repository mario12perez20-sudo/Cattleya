/**
 * Cattleya — Deploy a GitHub (push)
 *
 * Mientras no haya hosting propio en Hostinger, "hacer deploy" de Cattleya
 * es subir los cambios a GitHub: GitHub Pages los publica solo en ~1 min.
 * Este script corre `git add` + `git commit` + `git push` sobre la raíz
 * del proyecto, para no tener que abrir GitHub Desktop cada vez.
 *
 * Cuando exista el hosting/dominio de Hostinger, el deploy real pasa a
 * ser deploy/deploy.js (FTP) — este script sigue sirviendo igual para
 * mandar los cambios a GitHub, son dos cosas independientes.
 *
 * IMPORTANTE: este script tiene que correr en TU consola de Node, en tu
 * PC — nunca lo va a correr Claude. La carpeta conectada al sandbox de
 * Claude no permite que git escriba ahí (limitación del tipo de conexión),
 * pero en tu PC es un disco normal y no hay problema.
 *
 * Requisito: tener `git` disponible en la consola. Probalo primero con:
 *   git --version
 * Si da error "no se reconoce como un comando", instalá Git para Windows
 * (https://git-scm.com/download/win) — el git que trae GitHub Desktop no
 * queda disponible en la consola normal, hace falta este instalador aparte.
 *
 * Uso:
 *   node deploy-github.js "mensaje del commit"
 *   node deploy-github.js --dry      → solo muestra qué archivos cambiaron, no sube nada
 *   node deploy-github.js            → sube con un mensaje automático (fecha/hora)
 *
 * --- Cache-busting (por qué los cambios tardan en verse) ---
 * El navegador cachea css/js por su nombre de archivo. Si "admin.css"
 * siempre se llama "admin.css", el navegador puede seguir usando la
 * copia vieja después de un deploy hasta que el caché expire por su
 * cuenta (a veces tarda bastante, sobre todo en celular). La solución,
 * igual a la que ya usa Beer Garden en su propio deploy.js: agregar
 * "?v=<hash del contenido>" a cada <link>/<script> local. Si el archivo
 * no cambió, el hash es el mismo de siempre y el navegador sigue usando
 * el caché (rápido). Si cambió, el hash cambia, la URL es "nueva" para
 * el navegador, y lo baja de nuevo sin que haga falta refresco duro.
 * Este script hace ese cache-busting automático en cada deploy real,
 * reescribiendo los HTML del proyecto antes de subirlos.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT_DIR = path.join(__dirname, ".."); // raíz del proyecto Cattleya
const PAGES_URL = "https://mario12perez20-sudo.github.io/Cattleya/";

// HTML del proyecto donde vive el cache-busting (rutas relativas a ROOT_DIR).
const HTML_FILES = [
  "index.html",
  "plantas.html",
  "brunch.html",
  "admin/index.html",
  "admin/dashboard.html",
];

function run(cmd) {
  return execSync(cmd, { cwd: ROOT_DIR, encoding: "utf8", stdio: "inherit" });
}

function runSilent(cmd) {
  return execSync(cmd, { cwd: ROOT_DIR, encoding: "utf8", stdio: "pipe" });
}

function fileHash(absPath) {
  return crypto.createHash("md5").update(fs.readFileSync(absPath)).digest("hex").slice(0, 8);
}

/**
 * Reescribe href="...css" / src="...js" locales de un HTML con
 * "?v=<hash>". Devuelve true si algo cambió. Solo escribe el archivo
 * si write=true (en --dry se calcula pero no se toca nada).
 */
function bustCacheInFile(htmlAbsPath, write) {
  const dir = path.dirname(htmlAbsPath);
  const original = fs.readFileSync(htmlAbsPath, "utf8");
  let changed = false;

  const updated = original.replace(
    /(href|src)="([^"]+\.(?:css|js))(\?v=[0-9a-f]+)?"/g,
    (match, attr, file) => {
      if (/^https?:\/\//i.test(file) || file.startsWith("//")) return match; // CDN externo, no tocar
      const localPath = path.join(dir, file);
      if (!fs.existsSync(localPath)) return match; // referencia rota, no tocar
      const hash = fileHash(localPath);
      const newTag = `${attr}="${file}?v=${hash}"`;
      if (newTag !== match) changed = true;
      return newTag;
    }
  );

  if (changed && write) {
    fs.writeFileSync(htmlAbsPath, updated, "utf8");
  }
  return changed;
}

function bustCache(write) {
  let any = false;
  for (const rel of HTML_FILES) {
    const abs = path.join(ROOT_DIR, rel);
    if (!fs.existsSync(abs)) continue;
    if (bustCacheInFile(abs, write)) any = true;
  }
  return any;
}

function main() {
  const args = process.argv.slice(2);
  const isDry = args.includes("--dry");
  const message =
    args.find((a) => a !== "--dry") ||
    `Actualización ${new Date().toLocaleString("es-CO")}`;

  // ¿Hay git disponible en esta consola?
  try {
    runSilent("git --version");
  } catch {
    console.error("\n❌ No se encontró 'git' en esta consola.");
    console.error("   Instalá Git para Windows: https://git-scm.com/download/win");
    console.error("   (el git que trae GitHub Desktop no queda disponible acá).\n");
    process.exit(1);
  }

  // Cache-busting: en dry run solo se calcula (no se escribe nada); en
  // deploy real se reescriben los HTML antes de mirar qué cambió, así
  // esos cambios quedan incluidos en el commit.
  const wouldBust = bustCache(!isDry);

  let status;
  try {
    status = runSilent("git status --porcelain");
  } catch (err) {
    console.error("\n❌ Esta carpeta no es un repositorio git válido, o hubo un error:");
    console.error("  ", err.message);
    process.exit(1);
  }

  const hasLocalChanges = !!status.trim();

  // Además de cambios sin commitear, puede haber commits ya hechos (por
  // ejemplo si una corrida anterior falló justo al pushear) que todavía
  // no llegaron a GitHub. Sin esto, si el working tree está limpio el
  // script decía "todo al día" y nunca reintentaba el push.
  let ahead = 0;
  try {
    ahead = parseInt(runSilent("git rev-list --count @{u}..HEAD").trim(), 10) || 0;
  } catch {
    // Puede fallar si la rama no tiene upstream configurado todavía —
    // en ese caso simplemente seguimos e intentamos el push igual.
  }

  if (!hasLocalChanges && ahead === 0 && !wouldBust) {
    console.log("\n✅ Todo al día — no hay cambios que subir.\n");
    return;
  }

  if (hasLocalChanges) {
    console.log("\n📦 Cambios detectados:\n");
    console.log(status);
  }
  if (ahead > 0) {
    console.log(`📤 Hay ${ahead} commit(s) local(es) todavía sin subir a GitHub.\n`);
  }
  if (isDry && wouldBust) {
    console.log("🔄 Además, el cache-busting va a actualizar querystrings de CSS/JS al hacer el deploy real (no se simula en --dry).\n");
  }

  if (isDry) {
    console.log("— Dry run: nada se subió. Sacá --dry para subir de verdad. —\n");
    return;
  }

  try {
    if (hasLocalChanges) {
      console.log("→ Agregando cambios…");
      run("git add -A");

      console.log(`→ Commit: "${message}"`);
      run(`git commit -m "${message.replace(/"/g, '\\"')}"`);
    }

    console.log("→ Subiendo a GitHub…");
    run("git push");

    console.log(`\n✅ Deploy completo. GitHub Pages tarda ~1 min en actualizar:`);
    console.log(`   ${PAGES_URL}\n`);
  } catch (err) {
    console.error("\n❌ Algo falló durante el commit/push. Revisá el mensaje de arriba.");
    console.error("   Causas típicas: no configuraste tu usuario de git, o falta login/token de GitHub.");
    console.error("   Si ya se hizo el commit y solo falló el push, la próxima corrida (o `git push` solo) va a reintentarlo.\n");
    process.exit(1);
  }
}

main();
