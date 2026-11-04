/**
 * Backup manual de los catálogos de Cattleya a JSON fechados.
 * Uso: node backup.js
 * Genera: seed/backups/YYYY-MM-DDTHH-MM_brunch.json y ...plantas.json
 * Requiere: seed/serviceAccountKey.json (gitignoreado)
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function main() {
  const stamp = new Date().toISOString().slice(0, 16).replace(":", "-");
  const dir = path.join(__dirname, "backups");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  for (const catalogId of ["brunch", "plantas"]) {
    const snap = await db.collection("catalog").doc(catalogId).get();
    if (!snap.exists) {
      console.log(`⚠  catalog/${catalogId} no existe, omitiendo.`);
      continue;
    }
    const file = path.join(dir, `${stamp}_${catalogId}.json`);
    fs.writeFileSync(file, JSON.stringify(snap.data(), null, 2), "utf8");
    console.log(`✓  ${file}`);
  }

  await admin.app().delete();
  console.log("Backup completado.");
}

main().catch((err) => {
  console.error("Error en backup:", err);
  process.exit(1);
});
