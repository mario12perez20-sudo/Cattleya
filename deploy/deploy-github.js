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
 */

const { execSync } = require("child_process");
const path = require("path");

const ROOT_DIR = path.join(__dirname, ".."); // raíz del proyecto Cattleya
const PAGES_URL = "https://mario12perez20-sudo.github.io/Cattleya/";

function run(cmd) {
  return execSync(cmd, { cwd: ROOT_DIR, encoding: "utf8", stdio: "inherit" });
}

function runSilent(cmd) {
  return execSync(cmd, { cwd: ROOT_DIR, encoding: "utf8", stdio: "pipe" });
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

  let status;
  try {
    status = runSilent("git status --porcelain");
  } catch (err) {
    console.error("\n❌ Esta carpeta no es un repositorio git válido, o hubo un error:");
    console.error("  ", err.message);
    process.exit(1);
  }

  if (!status.trim()) {
    console.log("\n✅ Todo al día — no hay cambios que subir.\n");
    return;
  }

  console.log("\n📦 Cambios detectados:\n");
  console.log(status);

  if (isDry) {
    console.log("— Dry run: nada se subió. Sacá --dry para subir de verdad. —\n");
    return;
  }

  try {
    console.log("→ Agregando cambios…");
    run("git add -A");

    console.log(`→ Commit: "${message}"`);
    run(`git commit -m "${message.replace(/"/g, '\\"')}"`);

    console.log("→ Subiendo a GitHub…");
    run("git push");

    console.log(`\n✅ Deploy completo. GitHub Pages tarda ~1 min en actualizar:`);
    console.log(`   ${PAGES_URL}\n`);
  } catch (err) {
    console.error("\n❌ Algo falló durante el commit/push. Revisá el mensaje de arriba.");
    console.error("   Causas típicas: no configuraste tu usuario de git, o falta login/token de GitHub.\n");
    process.exit(1);
  }
}

main();
