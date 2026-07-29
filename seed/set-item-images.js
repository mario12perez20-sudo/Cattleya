/**
 * Cattleya — Asignar una imagen a todos los ítems de una sección
 * (o solo a los que todavía no tengan una).
 *
 * Usa el mismo seed/serviceAccountKey.json que ya tenés para seed.js.
 * A diferencia de seed.js, este script NO sobreescribe todo el
 * documento desde cero — lee lo que hay HOY en Firestore, solo toca el
 * campo `images` de los ítems de la sección indicada, y guarda de
 * vuelta. Todo lo demás (otras secciones, ediciones hechas desde el
 * admin) queda intacto.
 *
 * Uso:
 *   node set-item-images.js <brunch|plantas> <sectionId> <urlImagen> [--all]
 *
 *   Sin --all: solo rellena los ítems que TODAVÍA no tienen imagen.
 *   Con --all: pisa la imagen de TODOS los ítems de la sección (por si
 *              ya tenían algo puesto y querés reemplazarlo a todos).
 *
 * Ejemplo (sección "Adiciones" del brunch, id real "brunch-adiciones"):
 *   node set-item-images.js brunch brunch-adiciones https://mario12perez20-sudo.github.io/Cattleya/assets/icons/adicion.svg
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

const [, , catalogId, sectionId, imageUrl] = process.argv;
const overwriteAll = process.argv.includes("--all");

if (!catalogId || !sectionId || !imageUrl) {
  console.error("\nUso: node set-item-images.js <brunch|plantas> <sectionId> <urlImagen> [--all]\n");
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

  let touched = 0;
  (section.items || []).forEach((item) => {
    const hasImage = item.images && item.images.length;
    if (overwriteAll || !hasImage) {
      item.images = [imageUrl];
      touched++;
    }
  });

  if (touched === 0) {
    console.log("\n✅ No había nada que tocar — todos los ítems ya tenían imagen. Agregá --all para forzar el reemplazo.\n");
    return;
  }

  await ref.set({ ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  console.log(`\n✅ Listo — se asignó la imagen a ${touched} ítem(s) de "${sectionId}" en catalog/${catalogId}.\n`);
}

run().catch((err) => {
  console.error("\n❌ Error:", err.message, "\n");
  process.exit(1);
});
