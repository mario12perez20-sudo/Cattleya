/**
 * Cattleya — Asignar una imagen a UN solo ítem puntual (por id), sin tocar
 * el resto de la sección ni del documento.
 *
 * Complementa a set-item-images.js (que aplica la MISMA imagen a todos los
 * ítems de una sección). Este es para cuando cada ítem tiene su propia foto
 * distinta (ej. los íconos de "Adiciones": cada uno con su propio PNG).
 *
 * Usa el mismo seed/serviceAccountKey.json que seed.js.
 *
 * Uso:
 *   node set-item-image.js <brunch|plantas> <sectionId> <itemId> <urlImagen>
 *
 * Ejemplo:
 *   node set-item-image.js brunch brunch-adiciones add-panceta assets/img/brunch/icons/panceta.png
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

const [, , catalogId, sectionId, itemId, imageUrl] = process.argv;

if (!catalogId || !sectionId || !itemId || !imageUrl) {
  console.error("\nUso: node set-item-image.js <brunch|plantas> <sectionId> <itemId> <urlImagen>\n");
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

  const item = (section.items || []).find((i) => i.id === itemId);
  if (!item) {
    console.error(`\n❌ No existe el ítem "${itemId}" en la sección "${sectionId}"`);
    console.error("   Ítems disponibles:", (section.items || []).map((i) => i.id).join(", "), "\n");
    process.exit(1);
  }

  console.log(`\n${item.name}: images ${JSON.stringify(item.images)} → ["${imageUrl}"]`);
  item.images = [imageUrl];

  await ref.set({ ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  console.log(`✅ Listo — imagen actualizada para "${itemId}".\n`);
}

run().catch((err) => {
  console.error("\n❌ Error:", err.message, "\n");
  process.exit(1);
});
