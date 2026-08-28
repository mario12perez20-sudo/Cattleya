/**
 * Cattleya — Cambiar el nombre (h2) y/o subtítulo (eyebrow) de una sección
 * puntual, sin tocar el resto del documento.
 *
 * Usa el mismo seed/serviceAccountKey.json que seed.js y set-item-images.js.
 * No sobreescribe todo el documento: lee lo que hay HOY en Firestore, solo
 * toca `name`/`subtitle` de la sección indicada, y guarda de vuelta. Todo lo
 * demás (otras secciones, ítems, ediciones hechas desde el admin) queda intacto.
 *
 * Uso:
 *   node set-section-text.js <brunch|plantas> <sectionId> "<nuevoName>" "<nuevoSubtitle>"
 *
 * Ejemplo:
 *   node set-section-text.js brunch brunch-sal "de un brunch que enamora" "De sal, para deleitarte sin apuro"
 */

const admin = require("firebase-admin");
const path = require("path");

const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");
let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
} catch {
  console.error("\n❌ No se encontró seed/serviceAccountKey.json (el mismo que usa seed.js).\n");
  process.exit(1);
}

const [, , catalogId, sectionId, newName, newSubtitle] = process.argv;

if (!catalogId || !sectionId || !newName) {
  console.error('\nUso: node set-section-text.js <brunch|plantas> <sectionId> "<nuevoName>" "<nuevoSubtitle>"\n');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function run() {
  const ref = db.collection("catalog").doc(catalogId);
  const snap = await ref.get();
  if (!snap.exists) {
    console.error(`\n❌ No existe catalog/${catalogId}\n`);
    process.exit(1);
  }

  const data = snap.data();
  const section = (data.sections || []).find((s) => s.id === sectionId);
  if (!section) {
    console.error(`\n❌ No existe la sección "${sectionId}" en catalog/${catalogId}`);
    console.error("   Secciones disponibles:", (data.sections || []).map((s) => s.id).join(", "), "\n");
    process.exit(1);
  }

  console.log(`\nAntes:   name="${section.name}"  subtitle="${section.subtitle}"`);
  section.name = newName;
  if (typeof newSubtitle !== "undefined") section.subtitle = newSubtitle;
  console.log(`Después: name="${section.name}"  subtitle="${section.subtitle}"`);

  await ref.set({ ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  console.log(`\n✅ Listo — sección "${sectionId}" actualizada en catalog/${catalogId}.\n`);
}

run().catch((err) => {
  console.error("\n❌ Error:", err.message, "\n");
  process.exit(1);
});
