/**
 * Cattleya — Deploy a Hostinger (FTP)
 *
 * Sube el sitio estático a Hostinger. Independiente del deploy de Beer
 * Garden: usa sus propias credenciales (deploy/.env) y su propio
 * dominio/carpeta remota. El mecanismo es el mismo tipo (FTP simple,
 * sin build step), pero nada se comparte entre los dos proyectos.
 *
 * Uso:
 *   1. cd deploy && npm install
 *   2. cp .env.example .env   y completa tus credenciales de Hostinger
 *   3. node deploy.js          → sube todo
 *      node deploy.js --dry    → solo lista qué subiría, sin tocar el servidor
 */

require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const ftp = require("basic-ftp");
const path = require("path");
const fs = require("fs");

const ROOT_DIR = path.join(__dirname, ".."); // raíz del proyecto Cattleya

const REQUIRED_ENV = ["FTP_HOST", "FTP_USER", "FTP_PASSWORD", "FTP_REMOTE_DIR"];

// Carpetas/archivos que NUNCA deben subirse al hosting.
const EXCLUDE = [
  "deploy",
  "seed",
  "firebase",
  "docs",
  ".git",
  ".gitignore",
  "node_modules",
  "Menú",
  "Productos",
  ".DS_Store",
];

function checkEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error(`❌ Faltan variables de entorno en deploy/.env: ${missing.join(", ")}`);
    console.error("   Copia deploy/.env.example a deploy/.env y complétalo.");
    process.exit(1);
  }
}

function listLocalEntries(dir) {
  return fs.readdirSync(dir).filter((name) => !EXCLUDE.includes(name));
}

async function uploadDir(client, localDir, remoteDir) {
  await client.ensureDir(remoteDir);
  await client.clearWorkingDir();

  const entries = fs.readdirSync(localDir, { withFileTypes: true });
  for (const entry of entries) {
    if (EXCLUDE.includes(entry.name)) continue;
    const localPath = path.join(localDir, entry.name);

    if (entry.isDirectory()) {
      await client.ensureDir(entry.name);
      await uploadDir(client, localPath, path.posix.join(remoteDir, entry.name));
      await client.cdup();
    } else {
      await client.uploadFrom(localPath, entry.name);
      console.log(`  ↑ ${path.relative(ROOT_DIR, localPath)}`);
    }
  }
}

async function main() {
  const isDryRun = process.argv.includes("--dry");

  checkEnv();

  if (isDryRun) {
    console.log("— Dry run: esto es lo que se subiría —\n");
    const walk = (dir, prefix = "") => {
      for (const name of listLocalEntries(dir)) {
        const full = path.join(dir, name);
        const stat = fs.statSync(full);
        console.log(`${prefix}${name}${stat.isDirectory() ? "/" : ""}`);
        if (stat.isDirectory()) walk(full, prefix + "  ");
      }
    };
    walk(ROOT_DIR);
    return;
  }

  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    console.log(`→ Conectando a ${process.env.FTP_HOST}…`);
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure: process.env.FTP_SECURE === "true",
    });

    console.log(`→ Subiendo a ${process.env.FTP_REMOTE_DIR} …`);
    await client.ensureDir(process.env.FTP_REMOTE_DIR);
    await uploadDir(client, ROOT_DIR, process.env.FTP_REMOTE_DIR);

    console.log("\n✅ Deploy completo.");
  } catch (err) {
    console.error("❌ Error durante el deploy:", err);
    process.exitCode = 1;
  } finally {
    client.close();
  }
}

main();
